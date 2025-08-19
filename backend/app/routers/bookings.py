from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from ..models import BookingCreate, BookingResponse, TokenData
from ..auth import get_current_user, require_admin
from ..mongodb_database import db_service

router = APIRouter(prefix="/bookings", tags=["bookings"])

@router.post("/", response_model=dict)
async def create_booking(
    booking_data: BookingCreate,
    current_user: TokenData = Depends(get_current_user)
):
    try:
        # Get item details and calculate total amount
        total_amount = 0
        item_details = None
        
        if booking_data.booking_type == "flight":
            flight = await db_service.get_flight(booking_data.item_id)
            if not flight:
                raise HTTPException(status_code=404, detail="Flight not found")
            total_amount = flight["price"] * booking_data.passengers
            item_details = flight
        
        elif booking_data.booking_type == "hotel":
            hotel = await db_service.get_hotel(booking_data.item_id)
            if not hotel:
                raise HTTPException(status_code=404, detail="Hotel not found")
            # Calculate nights (simplified calculation)
            total_amount = hotel["price_per_night"] * 1  # Default 1 night
            item_details = hotel
        
        elif booking_data.booking_type == "package":
            package = await db_service.get_vacation_package(booking_data.item_id)
            if not package:
                raise HTTPException(status_code=404, detail="Vacation package not found")
            total_amount = package["price"] * booking_data.passengers
            item_details = package
        
        else:
            raise HTTPException(status_code=400, detail="Invalid booking type")
        
        # Create booking
        booking_dict = booking_data.dict()
        booking_dict.update({
            "user_id": current_user.uid,
            "total_amount": total_amount
        })
        
        booking_id = await db_service.create_booking(booking_dict)
        booking = await db_service.get_booking(booking_id)
        booking["item_details"] = item_details
        
        return {"message": "Booking created successfully", "booking": booking}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create booking: {str(e)}"
        )

@router.get("/my-bookings", response_model=List[BookingResponse])
async def get_my_bookings(current_user: TokenData = Depends(get_current_user)):
    try:
        bookings = await db_service.get_user_bookings(current_user.uid)
        
        # Add item details to each booking
        for booking in bookings:
            if booking["booking_type"] == "flight":
                flight = await db_service.get_flight(booking["item_id"])
                booking["item_details"] = flight
            elif booking["booking_type"] == "hotel":
                hotel = await db_service.get_hotel(booking["item_id"])
                booking["item_details"] = hotel
            elif booking["booking_type"] == "package":
                package = await db_service.get_vacation_package(booking["item_id"])
                booking["item_details"] = package
        
        return bookings
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch bookings: {str(e)}"
        )

@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking(
    booking_id: str,
    current_user: TokenData = Depends(get_current_user)
):
    booking = await db_service.get_booking(booking_id)
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Check if user owns this booking or is admin
    if booking["user_id"] != current_user.uid and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Add item details
    if booking["booking_type"] == "flight":
        flight = await db_service.get_flight(booking["item_id"])
        booking["item_details"] = flight
    elif booking["booking_type"] == "hotel":
        hotel = await db_service.get_hotel(booking["item_id"])
        booking["item_details"] = hotel
    elif booking["booking_type"] == "package":
        package = await db_service.get_vacation_package(booking["item_id"])
        booking["item_details"] = package
    
    return booking

@router.get("/", response_model=List[BookingResponse])
async def get_all_bookings(current_user = Depends(require_admin)):
    try:
        bookings = await db_service.get_all_bookings()
        
        # Add item details to each booking
        for booking in bookings:
            if booking["booking_type"] == "flight":
                flight = await db_service.get_flight(booking["item_id"])
                booking["item_details"] = flight
            elif booking["booking_type"] == "hotel":
                hotel = await db_service.get_hotel(booking["item_id"])
                booking["item_details"] = hotel
            elif booking["booking_type"] == "package":
                package = await db_service.get_vacation_package(booking["item_id"])
                booking["item_details"] = package
        
        return bookings
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch bookings: {str(e)}"
        )

@router.put("/{booking_id}/status", response_model=dict)
async def update_booking_status(
    booking_id: str,
    status_data: dict,
    current_user = Depends(require_admin)
):
    booking = await db_service.get_booking(booking_id)
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    try:
        updated_booking = await db_service.update_booking(booking_id, status_data)
        return {"message": "Booking status updated successfully", "booking": updated_booking}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update booking status: {str(e)}"
        )