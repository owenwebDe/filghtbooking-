from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime, timedelta
import secrets
import string
from ..models.referral import (
    ReferralCode, Referral, ReferralEarning, UserReferralStats,
    ReferralStatus, ReferralTier, ReferralReward
)
from ..mongodb_models import User
from ..auth import get_current_user

router = APIRouter(prefix="/referral", tags=["referral"])

def generate_referral_code(length: int = 12) -> str:
    """Generate a unique referral code"""
    characters = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(characters) for _ in range(length))

@router.get("/code")
async def get_or_create_referral_code(current_user: User = Depends(get_current_user)):
    """Get user's referral code or create one if it doesn't exist"""
    existing_code = await ReferralCode.find_one(ReferralCode.user_id == str(current_user.id))
    
    if existing_code:
        return {"code": existing_code.code, "uses_count": existing_code.uses_count}
    
    # Create new referral code
    code = generate_referral_code()
    
    # Ensure code is unique
    while await ReferralCode.find_one(ReferralCode.code == code):
        code = generate_referral_code()
    
    referral_code = ReferralCode(
        user_id=str(current_user.id),
        code=code
    )
    await referral_code.create()
    
    return {"code": code, "uses_count": 0}

@router.get("/stats")
async def get_referral_stats(current_user: User = Depends(get_current_user)):
    """Get user's referral statistics"""
    stats = await UserReferralStats.find_one(UserReferralStats.user_id == str(current_user.id))
    
    if not stats:
        # Create initial stats
        stats = UserReferralStats(user_id=str(current_user.id))
        await stats.create()
    
    # Get referral code
    referral_code = await ReferralCode.find_one(ReferralCode.user_id == str(current_user.id))
    
    # Get recent referrals
    recent_referrals = await Referral.find(
        Referral.referrer_id == str(current_user.id)
    ).sort("-created_at").limit(10).to_list()
    
    referral_history = []
    for ref in recent_referrals:
        referral_history.append({
            "id": str(ref.id),
            "email": ref.referred_email,
            "status": ref.status.value,
            "reward": ref.booking_reward if ref.status == ReferralStatus.BOOKED else ref.registration_reward,
            "date": ref.created_at.isoformat(),
            "registration_date": ref.registration_date.isoformat() if ref.registration_date else None,
            "booking_date": ref.first_booking_date.isoformat() if ref.first_booking_date else None
        })
    
    return {
        "total_referrals": stats.total_referrals,
        "successful_bookings": stats.successful_bookings,
        "total_earnings": stats.total_earnings,
        "pending_rewards": stats.pending_rewards,
        "current_tier": stats.current_tier.value,
        "tier_points": stats.tier_points,
        "referral_code": referral_code.code if referral_code else None,
        "referral_history": referral_history
    }

@router.post("/refer")
async def create_referral(
    email: str,
    current_user: User = Depends(get_current_user)
):
    """Create a new referral"""
    # Get user's referral code
    referral_code = await ReferralCode.find_one(ReferralCode.user_id == str(current_user.id))
    
    if not referral_code:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Referral code not found. Please generate one first."
        )
    
    # Check if email is already referred by this user
    existing_referral = await Referral.find_one(
        Referral.referrer_id == str(current_user.id),
        Referral.referred_email == email
    )
    
    if existing_referral:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email has already been referred by you"
        )
    
    # Create referral
    referral = Referral(
        referrer_id=str(current_user.id),
        referral_code=referral_code.code,
        referred_email=email
    )
    await referral.create()
    
    # Update referral code usage
    referral_code.uses_count += 1
    await referral_code.save()
    
    # Update user stats
    stats = await UserReferralStats.find_one(UserReferralStats.user_id == str(current_user.id))
    if not stats:
        stats = UserReferralStats(user_id=str(current_user.id))
    
    stats.total_referrals += 1
    stats.last_updated = datetime.utcnow()
    await stats.save()
    
    return {"message": "Referral created successfully", "referral_id": str(referral.id)}

@router.post("/register/{referral_code}")
async def register_with_referral(referral_code: str, user_id: str):
    """Process referral when referred user registers"""
    # Find the referral
    referral = await Referral.find_one(
        Referral.referral_code == referral_code,
        Referral.status == ReferralStatus.PENDING
    )
    
    if not referral:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid or expired referral code"
        )
    
    # Update referral
    referral.referred_id = user_id
    referral.status = ReferralStatus.REGISTERED
    referral.registration_date = datetime.utcnow()
    await referral.save()
    
    # Create registration earning
    earning = ReferralEarning(
        user_id=referral.referrer_id,
        referral_id=str(referral.id),
        amount=referral.registration_reward,
        type="registration"
    )
    await earning.create()
    
    # Update referrer stats
    stats = await UserReferralStats.find_one(UserReferralStats.user_id == referral.referrer_id)
    if stats:
        stats.pending_rewards += referral.registration_reward
        stats.tier_points += 1
        stats.last_updated = datetime.utcnow()
        
        # Check for tier upgrade
        if stats.tier_points >= 50 and stats.current_tier != ReferralTier.PLATINUM:
            stats.current_tier = ReferralTier.PLATINUM
        elif stats.tier_points >= 25 and stats.current_tier not in [ReferralTier.GOLD, ReferralTier.PLATINUM]:
            stats.current_tier = ReferralTier.GOLD
        elif stats.tier_points >= 10 and stats.current_tier == ReferralTier.BRONZE:
            stats.current_tier = ReferralTier.SILVER
        
        await stats.save()
    
    return {"message": "Referral registration processed"}

@router.post("/booking/{user_id}")
async def process_referral_booking(user_id: str, booking_amount: float):
    """Process referral when referred user makes first booking"""
    # Find referral for this user
    referral = await Referral.find_one(
        Referral.referred_id == user_id,
        Referral.status == ReferralStatus.REGISTERED
    )
    
    if not referral:
        return {"message": "No active referral found for this user"}
    
    # Update referral
    referral.status = ReferralStatus.BOOKED
    referral.first_booking_date = datetime.utcnow()
    await referral.save()
    
    # Create booking earning
    earning = ReferralEarning(
        user_id=referral.referrer_id,
        referral_id=str(referral.id),
        amount=referral.booking_reward,
        type="booking"
    )
    await earning.create()
    
    # Update referrer stats
    stats = await UserReferralStats.find_one(UserReferralStats.user_id == referral.referrer_id)
    if stats:
        stats.successful_bookings += 1
        stats.pending_rewards += referral.booking_reward
        stats.tier_points += 5  # More points for successful bookings
        stats.last_updated = datetime.utcnow()
        await stats.save()
    
    return {"message": "Referral booking processed", "reward": referral.booking_reward}

@router.get("/earnings")
async def get_referral_earnings(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get user's referral earnings"""
    query = ReferralEarning.find(ReferralEarning.user_id == str(current_user.id))
    
    if status:
        query = query.find(ReferralEarning.status == status)
    
    earnings = await query.sort("-created_at").to_list()
    
    total_earned = sum(e.amount for e in earnings if e.status == "paid")
    pending_amount = sum(e.amount for e in earnings if e.status == "pending")
    
    earning_history = []
    for earning in earnings:
        # Get referral details
        referral = await Referral.get(earning.referral_id)
        earning_history.append({
            "id": str(earning.id),
            "amount": earning.amount,
            "type": earning.type,
            "status": earning.status,
            "date": earning.created_at.isoformat(),
            "payment_date": earning.payment_date.isoformat() if earning.payment_date else None,
            "referred_email": referral.referred_email if referral else "Unknown"
        })
    
    return {
        "total_earned": total_earned,
        "pending_amount": pending_amount,
        "earnings_history": earning_history
    }

@router.get("/tiers")
async def get_referral_tiers():
    """Get referral tier information"""
    tiers = [
        ReferralReward(
            tier=ReferralTier.BRONZE,
            registration_bonus=50.0,
            booking_bonus=100.0,
            referrals_required=0,
            benefits=["1% Cashback", "Basic Support"]
        ),
        ReferralReward(
            tier=ReferralTier.SILVER,
            registration_bonus=75.0,
            booking_bonus=125.0,
            referrals_required=10,
            benefits=["2% Cashback", "Priority Support"]
        ),
        ReferralReward(
            tier=ReferralTier.GOLD,
            registration_bonus=100.0,
            booking_bonus=150.0,
            referrals_required=25,
            benefits=["3% Cashback", "Free Upgrades", "Lounge Access"]
        ),
        ReferralReward(
            tier=ReferralTier.PLATINUM,
            registration_bonus=150.0,
            booking_bonus=200.0,
            referrals_required=50,
            benefits=["5% Cashback", "Concierge Service", "Premium Support"]
        )
    ]
    
    return {"tiers": [tier.dict() for tier in tiers]}

@router.post("/withdraw")
async def withdraw_earnings(
    amount: float,
    payment_method: str,
    current_user: User = Depends(get_current_user)
):
    """Withdraw referral earnings"""
    stats = await UserReferralStats.find_one(UserReferralStats.user_id == str(current_user.id))
    
    if not stats or stats.pending_rewards < amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient funds for withdrawal"
        )
    
    # Process withdrawal (integrate with payment system)
    # For now, just mark earnings as paid
    pending_earnings = await ReferralEarning.find(
        ReferralEarning.user_id == str(current_user.id),
        ReferralEarning.status == "pending"
    ).to_list()
    
    remaining_amount = amount
    for earning in pending_earnings:
        if remaining_amount <= 0:
            break
        
        if earning.amount <= remaining_amount:
            earning.status = "paid"
            earning.payment_date = datetime.utcnow()
            await earning.save()
            remaining_amount -= earning.amount
    
    # Update stats
    stats.pending_rewards -= amount
    stats.total_earnings += amount
    await stats.save()
    
    return {"message": f"Withdrawal of ${amount} processed successfully"}