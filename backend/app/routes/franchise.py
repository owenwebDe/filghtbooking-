from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime, timedelta
from ..models.franchise import (
    FranchisePartner, FranchiseBooking, FranchiseCommission, 
    FranchiseStats, FranchiseStatus
)
from ..mongodb_models import User
from ..auth import get_current_user

router = APIRouter(prefix="/franchise", tags=["franchise"])

@router.get("/stats", response_model=FranchiseStats)
async def get_franchise_stats(current_user: User = Depends(get_current_user)):
    """Get overall franchise statistics"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    total_partners = await FranchisePartner.count()
    active_partners = await FranchisePartner.find(
        FranchisePartner.status == FranchiseStatus.ACTIVE
    ).count()
    
    # Get total bookings and revenue
    bookings = await FranchiseBooking.find_all().to_list()
    total_bookings = len(bookings)
    total_revenue = sum(booking.amount for booking in bookings)
    
    # Calculate monthly growth
    current_month = datetime.utcnow().replace(day=1)
    last_month = (current_month - timedelta(days=1)).replace(day=1)
    
    current_month_bookings = await FranchiseBooking.find(
        FranchiseBooking.booking_date >= current_month
    ).to_list()
    last_month_bookings = await FranchiseBooking.find(
        FranchiseBooking.booking_date >= last_month,
        FranchiseBooking.booking_date < current_month
    ).to_list()
    
    current_revenue = sum(b.amount for b in current_month_bookings)
    last_revenue = sum(b.amount for b in last_month_bookings)
    monthly_growth = ((current_revenue - last_revenue) / last_revenue * 100) if last_revenue > 0 else 0
    
    # Get top destinations
    destinations = {}
    for booking in bookings:
        destinations[booking.destination] = destinations.get(booking.destination, 0) + 1
    
    top_destinations = [
        {"destination": dest, "bookings": count}
        for dest, count in sorted(destinations.items(), key=lambda x: x[1], reverse=True)[:5]
    ]
    
    # Get recent bookings
    recent_bookings = await FranchiseBooking.find().sort("-booking_date").limit(5).to_list()
    recent_bookings_data = [
        {
            "id": str(booking.id),
            "destination": booking.destination,
            "amount": booking.amount,
            "booking_date": booking.booking_date.isoformat(),
            "status": booking.status
        }
        for booking in recent_bookings
    ]
    
    return FranchiseStats(
        total_partners=total_partners,
        active_partners=active_partners,
        total_bookings=total_bookings,
        total_revenue=total_revenue,
        monthly_growth=monthly_growth,
        top_destinations=top_destinations,
        recent_bookings=recent_bookings_data
    )

@router.get("/partners", response_model=List[FranchisePartner])
async def get_franchise_partners(
    status: Optional[FranchiseStatus] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user)
):
    """Get franchise partners with optional filtering"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    query = FranchisePartner.find()
    if status:
        query = query.find(FranchisePartner.status == status)
    
    partners = await query.skip(offset).limit(limit).to_list()
    return partners

@router.post("/partners", response_model=FranchisePartner)
async def create_franchise_partner(
    partner_data: FranchisePartner,
    current_user: User = Depends(get_current_user)
):
    """Create a new franchise partner"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    partner = await partner_data.create()
    return partner

@router.get("/partners/{partner_id}", response_model=FranchisePartner)
async def get_franchise_partner(
    partner_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific franchise partner"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    partner = await FranchisePartner.get(partner_id)
    if not partner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Franchise partner not found"
        )
    
    return partner

@router.put("/partners/{partner_id}", response_model=FranchisePartner)
async def update_franchise_partner(
    partner_id: str,
    partner_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Update a franchise partner"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    partner = await FranchisePartner.get(partner_id)
    if not partner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Franchise partner not found"
        )
    
    await partner.set(partner_data)
    return partner

@router.get("/bookings", response_model=List[FranchiseBooking])
async def get_franchise_bookings(
    partner_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user)
):
    """Get franchise bookings with optional filtering"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    query = FranchiseBooking.find()
    
    if partner_id:
        query = query.find(FranchiseBooking.partner_id == partner_id)
    if status:
        query = query.find(FranchiseBooking.status == status)
    
    bookings = await query.sort("-booking_date").skip(offset).limit(limit).to_list()
    return bookings

@router.get("/commissions", response_model=List[FranchiseCommission])
async def get_franchise_commissions(
    partner_id: Optional[str] = None,
    payment_status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user)
):
    """Get franchise commissions with optional filtering"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    query = FranchiseCommission.find()
    
    if partner_id:
        query = query.find(FranchiseCommission.partner_id == partner_id)
    if payment_status:
        query = query.find(FranchiseCommission.payment_status == payment_status)
    
    commissions = await query.sort("-created_at").skip(offset).limit(limit).to_list()
    return commissions

@router.post("/commissions/{commission_id}/pay")
async def pay_commission(
    commission_id: str,
    current_user: User = Depends(get_current_user)
):
    """Mark a commission as paid"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    commission = await FranchiseCommission.get(commission_id)
    if not commission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Commission not found"
        )
    
    commission.payment_status = "paid"
    commission.payment_date = datetime.utcnow()
    await commission.save()
    
    return {"message": "Commission marked as paid"}

@router.get("/analytics/revenue")
async def get_revenue_analytics(
    partner_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_user)
):
    """Get revenue analytics"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    query = FranchiseBooking.find()
    
    if partner_id:
        query = query.find(FranchiseBooking.partner_id == partner_id)
    if start_date:
        query = query.find(FranchiseBooking.booking_date >= start_date)
    if end_date:
        query = query.find(FranchiseBooking.booking_date <= end_date)
    
    bookings = await query.to_list()
    
    # Group by month
    monthly_data = {}
    for booking in bookings:
        month_key = booking.booking_date.strftime("%Y-%m")
        if month_key not in monthly_data:
            monthly_data[month_key] = {"revenue": 0, "bookings": 0}
        monthly_data[month_key]["revenue"] += booking.amount
        monthly_data[month_key]["bookings"] += 1
    
    return {
        "monthly_data": monthly_data,
        "total_revenue": sum(booking.amount for booking in bookings),
        "total_bookings": len(bookings),
        "average_booking_value": sum(booking.amount for booking in bookings) / len(bookings) if bookings else 0
    }