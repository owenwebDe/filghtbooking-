from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from ..models import HotelCreate, HotelUpdate, HotelResponse, HotelSearch
from ..auth import get_current_user, require_admin
from ..mongodb_database import db_service

router = APIRouter(prefix="/hotels", tags=["hotels"])

@router.get("/search", response_model=List[HotelResponse])
async def search_hotels(
    location: Optional[str] = Query(None),
    check_in_date: Optional[str] = Query(None),
    check_out_date: Optional[str] = Query(None),
    guests: Optional[int] = Query(1),
    rooms: Optional[int] = Query(1),
    limit: Optional[int] = Query(50)
):
    filters = {}
    if location:
        filters["location"] = location
    
    hotels = await db_service.get_hotels(filters=filters, limit=limit)
    return hotels

@router.get("/", response_model=List[HotelResponse])
async def get_all_hotels(limit: Optional[int] = Query(50)):
    hotels = await db_service.get_hotels(limit=limit)
    return hotels

@router.get("/{hotel_id}", response_model=HotelResponse)
async def get_hotel(hotel_id: str):
    hotel = await db_service.get_hotel(hotel_id)
    if not hotel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hotel not found"
        )
    return hotel

@router.post("/", response_model=dict)
async def create_hotel(
    hotel_data: HotelCreate,
    current_user = Depends(require_admin)
):
    try:
        hotel_id = await db_service.create_hotel(hotel_data.dict())
        hotel = await db_service.get_hotel(hotel_id)
        return {"message": "Hotel created successfully", "hotel": hotel}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create hotel: {str(e)}"
        )

@router.put("/{hotel_id}", response_model=dict)
async def update_hotel(
    hotel_id: str,
    hotel_data: HotelUpdate,
    current_user = Depends(require_admin)
):
    existing_hotel = await db_service.get_hotel(hotel_id)
    if not existing_hotel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hotel not found"
        )
    
    try:
        update_data = {k: v for k, v in hotel_data.dict().items() if v is not None}
        updated_hotel = await db_service.update_hotel(hotel_id, update_data)
        return {"message": "Hotel updated successfully", "hotel": updated_hotel}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update hotel: {str(e)}"
        )

@router.delete("/{hotel_id}", response_model=dict)
async def delete_hotel(
    hotel_id: str,
    current_user = Depends(require_admin)
):
    existing_hotel = await db_service.get_hotel(hotel_id)
    if not existing_hotel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hotel not found"
        )
    
    try:
        await db_service.delete_hotel(hotel_id)
        return {"message": "Hotel deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to delete hotel: {str(e)}"
        )