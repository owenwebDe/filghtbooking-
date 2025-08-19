from beanie import Document
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class ReferralStatus(str, Enum):
    PENDING = "pending"
    REGISTERED = "registered"
    BOOKED = "booked"
    EXPIRED = "expired"

class ReferralTier(str, Enum):
    BRONZE = "bronze"
    SILVER = "silver"
    GOLD = "gold"
    PLATINUM = "platinum"

class ReferralCode(Document):
    user_id: str
    code: str = Field(unique=True)
    uses_count: int = 0
    max_uses: Optional[int] = None
    expiry_date: Optional[datetime] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "referral_codes"

class Referral(Document):
    referrer_id: str  # User who referred
    referred_id: Optional[str] = None  # User who was referred (after registration)
    referral_code: str
    referred_email: str
    status: ReferralStatus = ReferralStatus.PENDING
    registration_reward: float = 50.0
    booking_reward: float = 150.0
    registration_date: Optional[datetime] = None
    first_booking_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "referrals"

class ReferralEarning(Document):
    user_id: str
    referral_id: str
    amount: float
    type: str  # registration, booking, bonus
    status: str = "pending"  # pending, paid, cancelled
    payment_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "referral_earnings"

class UserReferralStats(Document):
    user_id: str = Field(unique=True)
    total_referrals: int = 0
    successful_bookings: int = 0
    total_earnings: float = 0.0
    pending_rewards: float = 0.0
    current_tier: ReferralTier = ReferralTier.BRONZE
    tier_points: int = 0
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "user_referral_stats"

class ReferralReward(BaseModel):
    tier: ReferralTier
    registration_bonus: float
    booking_bonus: float
    referrals_required: int
    benefits: List[str]