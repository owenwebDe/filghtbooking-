from fastapi import APIRouter, HTTPException, status, Depends, Request
from typing import List
from ..models import PaymentCreate, PaymentResponse, TokenData
from ..auth import get_current_user, require_admin
from ..mongodb_database import db_service
from ..payment import payment_service
import json

router = APIRouter(prefix="/payments", tags=["payments"])

@router.post("/create-payment-intent", response_model=dict)
async def create_payment_intent(
    booking_id: str,
    current_user: TokenData = Depends(get_current_user)
):
    try:
        # Verify booking belongs to user
        booking = await db_service.get_booking(booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        if booking["user_id"] != current_user.uid:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Create payment
        payment = await payment_service.process_booking_payment(booking_id)
        
        return {
            "payment_id": payment["id"],
            "client_secret": payment.get("stripe_payment_intent_id"),
            "amount": payment["amount"]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create payment intent: {str(e)}"
        )

@router.post("/confirm-payment", response_model=dict)
async def confirm_payment(
    payment_data: dict,
    current_user: TokenData = Depends(get_current_user)
):
    try:
        payment_intent_id = payment_data.get("payment_intent_id")
        if not payment_intent_id:
            raise HTTPException(status_code=400, detail="Payment intent ID required")
        
        # Confirm payment with Stripe
        intent = await payment_service.confirm_payment_intent(payment_intent_id)
        
        if intent.status == "succeeded":
            # Update payment and booking status
            payment = await payment_service.handle_payment_success(payment_intent_id)
            return {"message": "Payment confirmed successfully", "payment": payment}
        else:
            # Handle payment failure
            await payment_service.handle_payment_failure(payment_intent_id)
            raise HTTPException(status_code=400, detail="Payment failed")
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to confirm payment: {str(e)}"
        )

@router.post("/webhook")
async def stripe_webhook(request: Request):
    try:
        payload = await request.body()
        event = json.loads(payload)
        
        # Handle Stripe webhook events
        if event["type"] == "payment_intent.succeeded":
            payment_intent = event["data"]["object"]
            await payment_service.handle_payment_success(payment_intent["id"])
        
        elif event["type"] == "payment_intent.payment_failed":
            payment_intent = event["data"]["object"]
            await payment_service.handle_payment_failure(payment_intent["id"])
        
        return {"status": "success"}
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Webhook error: {str(e)}"
        )

@router.get("/my-payments", response_model=List[PaymentResponse])
async def get_my_payments(current_user: TokenData = Depends(get_current_user)):
    try:
        # Get user's bookings first
        bookings = await db_service.get_user_bookings(current_user.uid)
        
        payments = []
        for booking in bookings:
            booking_payments = await db_service.get_payments_by_booking(booking["id"])
            payments.extend(booking_payments)
        
        return payments
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch payments: {str(e)}"
        )

@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: str,
    current_user: TokenData = Depends(get_current_user)
):
    payment = await db_service.get_payment(payment_id)
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    # Check if user owns this payment or is admin
    if current_user.role != "admin":
        booking = await db_service.get_booking(payment["booking_id"])
        if not booking or booking["user_id"] != current_user.uid:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    
    return payment

@router.get("/", response_model=List[PaymentResponse])
async def get_all_payments(current_user = Depends(require_admin)):
    try:
        payments = await db_service.get_all_payments()
        return payments
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch payments: {str(e)}"
        )

@router.post("/{payment_id}/refund", response_model=dict)
async def refund_payment(
    payment_id: str,
    refund_data: dict,
    current_user = Depends(require_admin)
):
    try:
        amount = refund_data.get("amount")
        refund = await payment_service.refund_payment(payment_id, amount)
        return {"message": "Refund processed successfully", "refund": refund}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to process refund: {str(e)}"
        )