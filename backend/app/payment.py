import stripe
from typing import Dict, Any
from .config import settings
from .mongodb_database import db_service
from .models import PaymentStatus

stripe.api_key = settings.STRIPE_SECRET_KEY

class PaymentService:
    def __init__(self):
        self.stripe = stripe
    
    async def create_payment_intent(self, amount: float, currency: str = "usd", metadata: Dict[str, Any] = None):
        try:
            intent = self.stripe.PaymentIntent.create(
                amount=int(amount * 100),  # Stripe expects amount in cents
                currency=currency,
                metadata=metadata or {}
            )
            return intent
        except stripe.error.StripeError as e:
            raise Exception(f"Stripe error: {str(e)}")
    
    async def confirm_payment_intent(self, payment_intent_id: str):
        try:
            intent = self.stripe.PaymentIntent.retrieve(payment_intent_id)
            return intent
        except stripe.error.StripeError as e:
            raise Exception(f"Stripe error: {str(e)}")
    
    async def process_booking_payment(self, booking_id: str, payment_method: str = "stripe"):
        # Get booking details
        booking = await db_service.get_booking(booking_id)
        if not booking:
            raise Exception("Booking not found")
        
        # Create payment record
        payment_data = {
            "booking_id": booking_id,
            "amount": booking["total_amount"],
            "payment_method": payment_method,
            "status": PaymentStatus.PENDING
        }
        
        if payment_method == "stripe":
            # Create Stripe payment intent
            intent = await self.create_payment_intent(
                amount=booking["total_amount"],
                metadata={"booking_id": booking_id}
            )
            payment_data["stripe_payment_intent_id"] = intent.id
        
        payment_id = await db_service.create_payment(payment_data)
        return await db_service.get_payment(payment_id)
    
    async def handle_payment_success(self, payment_intent_id: str):
        # Find payment by Stripe payment intent ID
        payments = await db_service.get_all_payments()
        payment = None
        for p in payments:
            if p.get("stripe_payment_intent_id") == payment_intent_id:
                payment = p
                break
        
        if not payment:
            raise Exception("Payment not found")
        
        # Update payment status
        await db_service.update_payment(payment["id"], {"status": PaymentStatus.COMPLETED})
        
        # Update booking status
        await db_service.update_booking(payment["booking_id"], {"status": "confirmed"})
        
        return payment
    
    async def handle_payment_failure(self, payment_intent_id: str):
        # Find payment by Stripe payment intent ID
        payments = await db_service.get_all_payments()
        payment = None
        for p in payments:
            if p.get("stripe_payment_intent_id") == payment_intent_id:
                payment = p
                break
        
        if not payment:
            raise Exception("Payment not found")
        
        # Update payment status
        await db_service.update_payment(payment["id"], {"status": PaymentStatus.FAILED})
        
        return payment
    
    async def refund_payment(self, payment_id: str, amount: float = None):
        payment = await db_service.get_payment(payment_id)
        if not payment:
            raise Exception("Payment not found")
        
        if payment["payment_method"] == "stripe" and payment.get("stripe_payment_intent_id"):
            try:
                refund = self.stripe.Refund.create(
                    payment_intent=payment["stripe_payment_intent_id"],
                    amount=int((amount or payment["amount"]) * 100)
                )
                
                if refund.status == "succeeded":
                    await db_service.update_payment(payment_id, {"status": PaymentStatus.REFUNDED})
                
                return refund
            except stripe.error.StripeError as e:
                raise Exception(f"Refund failed: {str(e)}")
        
        raise Exception("Refund not supported for this payment method")

payment_service = PaymentService()