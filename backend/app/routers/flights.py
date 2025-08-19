from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from ..models import FlightCreate, FlightUpdate, FlightResponse, FlightSearch
from ..auth import get_current_user, require_admin
from ..mongodb_database import db_service

router = APIRouter(prefix="/flights", tags=["flights"])

@router.get("/search", response_model=List[FlightResponse])
async def search_flights(
    departure_airport: Optional[str] = Query(None),
    arrival_airport: Optional[str] = Query(None),
    departure_date: Optional[str] = Query(None),
    passengers: Optional[int] = Query(1),
    limit: Optional[int] = Query(50)
):
    filters = {}
    if departure_airport:
        filters["departure_airport"] = departure_airport
    if arrival_airport:
        filters["arrival_airport"] = arrival_airport
    if departure_date:
        filters["departure_date"] = departure_date
    
    flights = await db_service.get_flights(filters=filters, limit=limit)
    return flights

@router.get("/", response_model=List[FlightResponse])
async def get_all_flights(limit: Optional[int] = Query(50)):
    flights = await db_service.get_flights(limit=limit)
    return flights

@router.get("/{flight_id}", response_model=FlightResponse)
async def get_flight(flight_id: str):
    flight = await db_service.get_flight(flight_id)
    if not flight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flight not found"
        )
    return flight

@router.post("/", response_model=dict)
async def create_flight(
    flight_data: FlightCreate,
    current_user = Depends(require_admin)
):
    try:
        flight_id = await db_service.create_flight(flight_data.dict())
        flight = await db_service.get_flight(flight_id)
        return {"message": "Flight created successfully", "flight": flight}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create flight: {str(e)}"
        )

@router.put("/{flight_id}", response_model=dict)
async def update_flight(
    flight_id: str,
    flight_data: FlightUpdate,
    current_user = Depends(require_admin)
):
    existing_flight = await db_service.get_flight(flight_id)
    if not existing_flight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flight not found"
        )
    
    try:
        update_data = {k: v for k, v in flight_data.dict().items() if v is not None}
        updated_flight = await db_service.update_flight(flight_id, update_data)
        return {"message": "Flight updated successfully", "flight": updated_flight}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update flight: {str(e)}"
        )

@router.delete("/{flight_id}", response_model=dict)
async def delete_flight(
    flight_id: str,
    current_user = Depends(require_admin)
):
    existing_flight = await db_service.get_flight(flight_id)
    if not existing_flight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flight not found"
        )
    
    try:
        await db_service.delete_flight(flight_id)
        return {"message": "Flight deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to delete flight: {str(e)}"
        )