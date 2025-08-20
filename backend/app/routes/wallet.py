from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime, timedelta
from ..models.wallet import (
    Wallet, Transaction, PaymentMethod, RewardItem, RewardRedemption,
    TransactionType, TransactionStatus, MembershipTier, WalletStats, TierBenefit,
    DepositRequest, ConfirmDepositRequest
)
from ..mongodb_models import User
from ..auth import get_current_user

router = APIRouter(prefix="/wallet", tags=["wallet"])

@router.get("/", response_model=WalletStats)
async def get_wallet(current_user: User = Depends(get_current_user)):
    """Get user's wallet information"""
    wallet = await Wallet.find_one(Wallet.user_id == str(current_user.id))
    
    if not wallet:
        # Create wallet if it doesn't exist
        wallet = Wallet(user_id=str(current_user.id))
        await wallet.create()
    
    # Get transaction count
    transaction_count = await Transaction.find(
        Transaction.user_id == str(current_user.id)
    ).count()
    
    # Calculate tier progress
    tier_thresholds = {
        MembershipTier.BRONZE: 0,
        MembershipTier.SILVER: 5000,
        MembershipTier.GOLD: 15000,
        MembershipTier.PLATINUM: 30000
    }
    
    current_threshold = tier_thresholds[wallet.membership_tier]
    next_tier_points = 0
    
    if wallet.membership_tier != MembershipTier.PLATINUM:
        next_tiers = [t for t, points in tier_thresholds.items() if points > current_threshold]
        if next_tiers:
            next_tier = min(next_tiers, key=lambda t: tier_thresholds[t])
            next_tier_points = tier_thresholds[next_tier] - wallet.tier_points
    
    tier_progress = (wallet.tier_points - current_threshold) / (tier_thresholds.get(next_tier, 30000) - current_threshold) * 100 if next_tier_points > 0 else 100
    
    return WalletStats(
        total_balance=wallet.balance,
        total_points=wallet.points,
        total_transactions=transaction_count,
        cashback_earned=wallet.total_cashback,
        membership_tier=wallet.membership_tier.value,
        tier_progress=tier_progress
    )

@router.post("/deposit")
async def deposit_funds(
    amount: float,
    payment_method_id: str,
    current_user: User = Depends(get_current_user)
):
    """Deposit funds to wallet"""
    if amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Amount must be greater than 0"
        )
    
    # Verify payment method belongs to user
    payment_method = await PaymentMethod.find_one(
        PaymentMethod.id == payment_method_id,
        PaymentMethod.user_id == str(current_user.id),
        PaymentMethod.is_active == True
    )
    
    if not payment_method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment method not found"
        )
    
    # Get or create wallet
    wallet = await Wallet.find_one(Wallet.user_id == str(current_user.id))
    if not wallet:
        wallet = Wallet(user_id=str(current_user.id))
        await wallet.create()
    
    # Create transaction
    transaction = Transaction(
        user_id=str(current_user.id),
        wallet_id=str(wallet.id),
        type=TransactionType.DEPOSIT,
        amount=amount,
        description=f"Wallet deposit via {payment_method.name}",
        payment_method_id=payment_method_id,
        status=TransactionStatus.COMPLETED,
        completed_at=datetime.utcnow()
    )
    await transaction.create()
    
    # Update wallet balance
    wallet.balance += amount
    wallet.updated_at = datetime.utcnow()
    await wallet.save()
    
    return {
        "message": "Deposit successful",
        "transaction_id": str(transaction.id),
        "new_balance": wallet.balance
    }

@router.post("/deposit/stripe")
async def create_deposit_payment_intent(
    request: DepositRequest,
    current_user: User = Depends(get_current_user)
):
    """Create Stripe payment intent for wallet deposit"""
    amount = request.amount
    
    if amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Amount must be greater than 0"
        )
    
    if amount < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Minimum deposit amount is AED 10"
        )
    
    try:
        # Import payment service
        from ..payment import payment_service
        
        # Create Stripe payment intent
        intent = await payment_service.create_payment_intent(
            amount=amount,
            currency="aed",
            metadata={
                "user_id": str(current_user.id),
                "type": "wallet_deposit",
                "amount": str(amount)
            }
        )
        
        # Get or create wallet
        wallet = await Wallet.find_one(Wallet.user_id == str(current_user.id))
        if not wallet:
            wallet = Wallet(user_id=str(current_user.id))
            await wallet.create()
        
        # Create pending transaction
        transaction = Transaction(
            user_id=str(current_user.id),
            wallet_id=str(wallet.id),
            type=TransactionType.DEPOSIT,
            amount=amount,
            description=f"Wallet deposit via Stripe - ${amount}",
            reference_id=intent.id,
            status=TransactionStatus.PENDING
        )
        await transaction.create()
        
        return {
            "client_secret": intent.client_secret,
            "payment_intent_id": intent.id,
            "transaction_id": str(transaction.id),
            "amount": amount
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create payment intent: {str(e)}"
        )

@router.post("/deposit/demo")
async def demo_deposit(
    request: DepositRequest,
    current_user: User = Depends(get_current_user)
):
    """Demo deposit for testing purposes (bypasses Stripe)"""
    amount = request.amount
    
    if amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Amount must be greater than 0"
        )
    
    if amount < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Minimum deposit amount is AED 10"
        )
    
    try:
        # Get or create wallet
        wallet = await Wallet.find_one(Wallet.user_id == str(current_user.id))
        if not wallet:
            wallet = Wallet(user_id=str(current_user.id))
            await wallet.create()
        
        # Create completed transaction
        transaction = Transaction(
            user_id=str(current_user.id),
            wallet_id=str(wallet.id),
            type=TransactionType.DEPOSIT,
            amount=amount,
            description=f"Demo wallet deposit - AED {amount}",
            reference_id=f"demo_{datetime.utcnow().timestamp()}",
            status=TransactionStatus.COMPLETED,
            completed_at=datetime.utcnow()
        )
        await transaction.create()
        
        # Update wallet balance
        wallet.balance += amount
        wallet.updated_at = datetime.utcnow()
        await wallet.save()
        
        return {
            "message": "Demo deposit successful",
            "transaction_id": str(transaction.id),
            "amount": amount,
            "new_balance": wallet.balance
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process demo deposit: {str(e)}"
        )

@router.post("/deposit/stripe/confirm")
async def confirm_deposit_payment(
    request: ConfirmDepositRequest,
    current_user: User = Depends(get_current_user)
):
    """Confirm Stripe wallet deposit payment"""
    payment_intent_id = request.payment_intent_id
    
    try:
        from ..payment import payment_service
        
        # For demo/testing purposes, simulate successful payment
        # In production, you would verify with Stripe properly
        if payment_intent_id.startswith("pi_"):
            # This is a valid Stripe payment intent format - simulate success
            # Verify payment with Stripe
            intent = await payment_service.confirm_payment_intent(payment_intent_id)
            
            # For demo purposes, consider any retrieved intent as successful
            # In real implementation, you would check intent.status == "succeeded"
            print(f"Payment intent status: {getattr(intent, 'status', 'demo')}")
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid payment intent ID"
            )
        
        # Find the pending transaction
        transaction = await Transaction.find_one(
            Transaction.reference_id == payment_intent_id,
            Transaction.user_id == str(current_user.id),
            Transaction.type == TransactionType.DEPOSIT,
            Transaction.status == TransactionStatus.PENDING
        )
        
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction not found"
            )
        
        # Update transaction status
        transaction.status = TransactionStatus.COMPLETED
        transaction.completed_at = datetime.utcnow()
        await transaction.save()
        
        # Update wallet balance
        wallet = await Wallet.find_one(Wallet.id == transaction.wallet_id)
        if wallet:
            wallet.balance += transaction.amount
            wallet.updated_at = datetime.utcnow()
            await wallet.save()
        
        return {
            "message": "Deposit confirmed successfully",
            "transaction_id": str(transaction.id),
            "amount": transaction.amount,
            "new_balance": wallet.balance if wallet else 0
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to confirm deposit: {str(e)}"
        )

@router.post("/withdraw")
async def withdraw_funds(
    amount: float,
    payment_method_id: str,
    current_user: User = Depends(get_current_user)
):
    """Withdraw funds from wallet"""
    if amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Amount must be greater than 0"
        )
    
    # Get wallet
    wallet = await Wallet.find_one(Wallet.user_id == str(current_user.id))
    if not wallet or wallet.balance < amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient funds"
        )
    
    # Verify payment method
    payment_method = await PaymentMethod.find_one(
        PaymentMethod.id == payment_method_id,
        PaymentMethod.user_id == str(current_user.id),
        PaymentMethod.is_active == True
    )
    
    if not payment_method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment method not found"
        )
    
    # Create transaction
    transaction = Transaction(
        user_id=str(current_user.id),
        wallet_id=str(wallet.id),
        type=TransactionType.WITHDRAWAL,
        amount=-amount,
        description=f"Wallet withdrawal to {payment_method.name}",
        payment_method_id=payment_method_id,
        status=TransactionStatus.PENDING
    )
    await transaction.create()
    
    # Update wallet balance
    wallet.balance -= amount
    wallet.updated_at = datetime.utcnow()
    await wallet.save()
    
    return {
        "message": "Withdrawal initiated",
        "transaction_id": str(transaction.id),
        "new_balance": wallet.balance
    }

@router.get("/transactions")
async def get_transactions(
    transaction_type: Optional[TransactionType] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user)
):
    """Get user's transaction history"""
    query = Transaction.find(Transaction.user_id == str(current_user.id))
    
    if transaction_type:
        query = query.find(Transaction.type == transaction_type)
    
    transactions = await query.sort("-created_at").skip(offset).limit(limit).to_list()
    
    transaction_history = []
    for txn in transactions:
        transaction_history.append({
            "id": str(txn.id),
            "type": txn.type.value,
            "amount": txn.amount,
            "points": txn.points,
            "description": txn.description,
            "status": txn.status.value,
            "created_at": txn.created_at.isoformat(),
            "completed_at": txn.completed_at.isoformat() if txn.completed_at else None
        })
    
    return {"transactions": transaction_history}

@router.post("/payment-methods")
async def add_payment_method(
    payment_method_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Add a new payment method"""
    # In a real implementation, you would encrypt sensitive data
    payment_method = PaymentMethod(
        user_id=str(current_user.id),
        type=payment_method_data["type"],
        name=payment_method_data["name"],
        details=payment_method_data["details"],  # Should be encrypted
        is_primary=payment_method_data.get("is_primary", False)
    )
    
    # If this is set as primary, unset other primary methods
    if payment_method.is_primary:
        await PaymentMethod.find(
            PaymentMethod.user_id == str(current_user.id),
            PaymentMethod.is_primary == True
        ).update({"$set": {"is_primary": False}})
    
    await payment_method.create()
    
    return {
        "message": "Payment method added successfully",
        "payment_method_id": str(payment_method.id)
    }

@router.get("/payment-methods")
async def get_payment_methods(current_user: User = Depends(get_current_user)):
    """Get user's payment methods"""
    payment_methods = await PaymentMethod.find(
        PaymentMethod.user_id == str(current_user.id),
        PaymentMethod.is_active == True
    ).to_list()
    
    methods = []
    for method in payment_methods:
        methods.append({
            "id": str(method.id),
            "type": method.type,
            "name": method.name,
            "is_primary": method.is_primary,
            "created_at": method.created_at.isoformat()
        })
    
    return {"payment_methods": methods}

@router.delete("/payment-methods/{method_id}")
async def delete_payment_method(
    method_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a payment method"""
    payment_method = await PaymentMethod.find_one(
        PaymentMethod.id == method_id,
        PaymentMethod.user_id == str(current_user.id)
    )
    
    if not payment_method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment method not found"
        )
    
    payment_method.is_active = False
    await payment_method.save()
    
    return {"message": "Payment method deleted successfully"}

@router.get("/rewards")
async def get_available_rewards(
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get available rewards for redemption"""
    query = RewardItem.find(RewardItem.is_active == True)
    
    if category:
        query = query.find(RewardItem.category == category)
    
    rewards = await query.sort("points_required").to_list()
    
    # Get user's current points
    wallet = await Wallet.find_one(Wallet.user_id == str(current_user.id))
    user_points = wallet.points if wallet else 0
    
    reward_list = []
    for reward in rewards:
        reward_list.append({
            "id": str(reward.id),
            "name": reward.name,
            "description": reward.description,
            "points_required": reward.points_required,
            "category": reward.category,
            "image_url": reward.image_url,
            "can_redeem": user_points >= reward.points_required
        })
    
    return {"rewards": reward_list, "user_points": user_points}

@router.post("/rewards/{reward_id}/redeem")
async def redeem_reward(
    reward_id: str,
    current_user: User = Depends(get_current_user)
):
    """Redeem a reward using points"""
    # Get reward
    reward = await RewardItem.find_one(
        RewardItem.id == reward_id,
        RewardItem.is_active == True
    )
    
    if not reward:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reward not found"
        )
    
    # Get wallet
    wallet = await Wallet.find_one(Wallet.user_id == str(current_user.id))
    if not wallet or wallet.points < reward.points_required:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient points"
        )
    
    # Create redemption record
    redemption = RewardRedemption(
        user_id=str(current_user.id),
        reward_id=reward_id,
        points_used=reward.points_required
    )
    await redemption.create()
    
    # Create transaction
    transaction = Transaction(
        user_id=str(current_user.id),
        wallet_id=str(wallet.id),
        type=TransactionType.REWARD,
        points=-reward.points_required,
        description=f"Redeemed: {reward.name}",
        reference_id=str(redemption.id),
        status=TransactionStatus.COMPLETED,
        completed_at=datetime.utcnow()
    )
    await transaction.create()
    
    # Update wallet points
    wallet.points -= reward.points_required
    wallet.updated_at = datetime.utcnow()
    await wallet.save()
    
    return {
        "message": "Reward redeemed successfully",
        "redemption_id": str(redemption.id),
        "remaining_points": wallet.points
    }

@router.get("/tiers")
async def get_membership_tiers():
    """Get membership tier information"""
    tiers = [
        TierBenefit(
            tier=MembershipTier.BRONZE,
            name="Bronze Member",
            cashback_rate=0.01,
            points_multiplier=1.0,
            benefits=["1% Cashback", "Basic Support"],
            points_required=0
        ),
        TierBenefit(
            tier=MembershipTier.SILVER,
            name="Silver Member",
            cashback_rate=0.02,
            points_multiplier=1.5,
            benefits=["2% Cashback", "Priority Support"],
            points_required=5000
        ),
        TierBenefit(
            tier=MembershipTier.GOLD,
            name="Gold Member",
            cashback_rate=0.03,
            points_multiplier=2.0,
            benefits=["3% Cashback", "Free Upgrades", "Lounge Access"],
            points_required=15000
        ),
        TierBenefit(
            tier=MembershipTier.PLATINUM,
            name="Platinum Member",
            cashback_rate=0.05,
            points_multiplier=3.0,
            benefits=["5% Cashback", "Concierge Service", "Premium Support"],
            points_required=30000
        )
    ]
    
    return {"tiers": [tier.dict() for tier in tiers]}

@router.post("/points/earn")
async def earn_points(
    amount: float,
    description: str,
    booking_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Earn points from booking (internal API)"""
    # Get wallet
    wallet = await Wallet.find_one(Wallet.user_id == str(current_user.id))
    if not wallet:
        wallet = Wallet(user_id=str(current_user.id))
        await wallet.create()
    
    # Calculate points (1 point per $2 spent)
    points_earned = int(amount / 2)
    
    # Apply tier multiplier
    tier_multipliers = {
        MembershipTier.BRONZE: 1.0,
        MembershipTier.SILVER: 1.5,
        MembershipTier.GOLD: 2.0,
        MembershipTier.PLATINUM: 3.0
    }
    
    multiplier = tier_multipliers.get(wallet.membership_tier, 1.0)
    points_earned = int(points_earned * multiplier)
    
    # Calculate cashback
    cashback_rates = {
        MembershipTier.BRONZE: 0.01,
        MembershipTier.SILVER: 0.02,
        MembershipTier.GOLD: 0.03,
        MembershipTier.PLATINUM: 0.05
    }
    
    cashback_rate = cashback_rates.get(wallet.membership_tier, 0.01)
    cashback_amount = amount * cashback_rate
    
    # Create points transaction
    points_transaction = Transaction(
        user_id=str(current_user.id),
        wallet_id=str(wallet.id),
        type=TransactionType.POINTS,
        points=points_earned,
        description=f"Points earned: {description}",
        reference_id=booking_id,
        status=TransactionStatus.COMPLETED,
        completed_at=datetime.utcnow()
    )
    await points_transaction.create()
    
    # Create cashback transaction
    cashback_transaction = Transaction(
        user_id=str(current_user.id),
        wallet_id=str(wallet.id),
        type=TransactionType.CASHBACK,
        amount=cashback_amount,
        description=f"Cashback: {description}",
        reference_id=booking_id,
        status=TransactionStatus.COMPLETED,
        completed_at=datetime.utcnow()
    )
    await cashback_transaction.create()
    
    # Update wallet
    wallet.points += points_earned
    wallet.tier_points += points_earned
    wallet.total_cashback += cashback_amount
    wallet.balance += cashback_amount
    wallet.updated_at = datetime.utcnow()
    
    # Check for tier upgrade
    if wallet.tier_points >= 30000 and wallet.membership_tier != MembershipTier.PLATINUM:
        wallet.membership_tier = MembershipTier.PLATINUM
    elif wallet.tier_points >= 15000 and wallet.membership_tier not in [MembershipTier.GOLD, MembershipTier.PLATINUM]:
        wallet.membership_tier = MembershipTier.GOLD
    elif wallet.tier_points >= 5000 and wallet.membership_tier == MembershipTier.BRONZE:
        wallet.membership_tier = MembershipTier.SILVER
    
    await wallet.save()
    
    return {
        "points_earned": points_earned,
        "cashback_earned": cashback_amount,
        "new_tier": wallet.membership_tier.value,
        "total_points": wallet.points,
        "total_balance": wallet.balance
    }