from beanie import Document, PydanticObjectId
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"

class BookingStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"

# MongoDB Document Models
class User(Document):
    uid: str = Field(..., unique=True)
    email: str = Field(..., unique=True)
    full_name: str
    password_hash: Optional[str] = None  # For direct registration
    phone: Optional[str] = None
    role: UserRole = UserRole.USER
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "users"

class Flight(Document):
    airline: str
    flight_number: str
    departure_airport: str
    arrival_airport: str
    departure_time: datetime
    arrival_time: datetime
    price: float
    available_seats: int
    aircraft_type: str
    duration_minutes: int
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "flights"

class Hotel(Document):
    name: str
    location: str
    address: str
    description: str
    price_per_night: float
    available_rooms: int
    amenities: List[str]
    rating: float
    images: List[str]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "hotels"

class VacationPackage(Document):
    name: str
    destination: str
    description: str
    duration_days: int
    price: float
    includes: List[str]
    itinerary: List[str]
    images: List[str]
    max_participants: int
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "vacation_packages"

class Booking(Document):
    user_id: str
    booking_type: str  # "flight", "hotel", "package"
    item_id: str
    check_in_date: Optional[str] = None
    check_out_date: Optional[str] = None
    passengers: int = 1
    special_requests: Optional[str] = None
    status: BookingStatus = BookingStatus.PENDING
    total_amount: float
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "bookings"

class Payment(Document):
    booking_id: str
    amount: float
    payment_method: str  # "stripe", "paypal"
    status: PaymentStatus = PaymentStatus.PENDING
    stripe_payment_intent_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "payments"