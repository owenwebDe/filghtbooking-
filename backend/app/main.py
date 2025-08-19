from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from .routers import auth_mongo, flights, hotels, packages, bookings, payments
from .routes import franchise, referral, wallet
from .config import settings
from .mongodb_models import User, Flight, Hotel, VacationPackage, Booking, Payment
from .models.franchise import FranchisePartner, FranchiseBooking, FranchiseCommission
from .models.referral import ReferralCode, Referral, ReferralEarning, UserReferralStats
from .models.wallet import Wallet, Transaction, PaymentMethod, RewardItem, RewardRedemption

app = FastAPI(
    title="Flight Booking API",
    description="Professional flight booking platform API",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, settings.ADMIN_URL, "http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    # Initialize MongoDB
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    database = client[settings.MONGODB_DATABASE]
    
    # Initialize Beanie with the document models
    await init_beanie(
        database=database,
        document_models=[
            User, Flight, Hotel, VacationPackage, Booking, Payment,
            FranchisePartner, FranchiseBooking, FranchiseCommission,
            ReferralCode, Referral, ReferralEarning, UserReferralStats,
            Wallet, Transaction, PaymentMethod, RewardItem, RewardRedemption
        ]
    )

# Include routers
app.include_router(auth_mongo.router)
app.include_router(flights.router)
app.include_router(hotels.router)
app.include_router(packages.router)
app.include_router(bookings.router)
app.include_router(payments.router)
app.include_router(franchise.router)
app.include_router(referral.router)
app.include_router(wallet.router)

@app.get("/")
async def root():
    return {"message": "Flight Booking API is running with MongoDB"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "database": "MongoDB"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)