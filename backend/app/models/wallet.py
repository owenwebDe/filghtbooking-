from beanie import Document
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class TransactionType(str, Enum):
    DEPOSIT = "deposit"
    WITHDRAWAL = "withdrawal"
    BOOKING = "booking"
    REFUND = "refund"
    CASHBACK = "cashback"
    POINTS = "points"
    REWARD = "reward"

class TransactionStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class MembershipTier(str, Enum):
    BRONZE = "bronze"
    SILVER = "silver"
    GOLD = "gold"
    PLATINUM = "platinum"

class PaymentMethod(Document):
    user_id: str
    type: str  # card, bank, paypal
    name: str
    details: dict  # Encrypted payment details
    is_primary: bool = False
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "payment_methods"

class Wallet(Document):
    user_id: str = Field(unique=True)
    balance: float = 0.0
    points: int = 0
    total_cashback: float = 0.0
    membership_tier: MembershipTier = MembershipTier.BRONZE
    tier_points: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "wallets"

class Transaction(Document):
    user_id: str
    wallet_id: str
    type: TransactionType
    amount: float = 0.0
    points: int = 0
    description: str
    reference_id: Optional[str] = None  # Booking ID, etc.
    status: TransactionStatus = TransactionStatus.PENDING
    payment_method_id: Optional[str] = None
    metadata: Optional[dict] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    
    class Settings:
        name = "transactions"

class RewardItem(Document):
    name: str
    description: str
    points_required: int
    category: str
    is_active: bool = True
    image_url: Optional[str] = None
    terms_conditions: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "reward_items"

class RewardRedemption(Document):
    user_id: str
    reward_id: str
    points_used: int
    status: str = "pending"  # pending, approved, delivered, cancelled
    redemption_date: datetime = Field(default_factory=datetime.utcnow)
    delivery_details: Optional[dict] = {}
    
    class Settings:
        name = "reward_redemptions"

class WalletStats(BaseModel):
    total_balance: float
    total_points: int
    total_transactions: int
    cashback_earned: float
    membership_tier: str
    tier_progress: float

class TierBenefit(BaseModel):
    tier: MembershipTier
    name: str
    cashback_rate: float
    points_multiplier: float
    benefits: List[str]
    points_required: int