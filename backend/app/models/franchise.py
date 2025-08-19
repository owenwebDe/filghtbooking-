from beanie import Document
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class FranchiseStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"
    SUSPENDED = "suspended"

class FranchisePartner(Document):
    name: str
    email: str
    phone: str
    location: str
    address: str
    contact_person: str
    status: FranchiseStatus = FranchiseStatus.PENDING
    registration_date: datetime = Field(default_factory=datetime.utcnow)
    total_bookings: int = 0
    total_revenue: float = 0.0
    commission_rate: float = 0.15  # 15% commission
    rating: float = 0.0
    documents: List[str] = []  # Document URLs
    
    class Settings:
        name = "franchise_partners"

class FranchiseBooking(Document):
    partner_id: str
    user_id: str
    booking_type: str  # flight, hotel, package
    booking_reference: str
    destination: str
    amount: float
    commission_amount: float
    booking_date: datetime = Field(default_factory=datetime.utcnow)
    travel_date: Optional[datetime] = None
    status: str = "confirmed"
    
    class Settings:
        name = "franchise_bookings"

class FranchiseCommission(Document):
    partner_id: str
    booking_id: str
    amount: float
    commission_rate: float
    payment_status: str = "pending"  # pending, paid, cancelled
    payment_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "franchise_commissions"

class FranchiseStats(BaseModel):
    total_partners: int
    active_partners: int
    total_bookings: int
    total_revenue: float
    monthly_growth: float
    top_destinations: List[dict]
    recent_bookings: List[dict]