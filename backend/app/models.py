from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
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

# User Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    uid: str
    email: str
    full_name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.USER
    created_at: datetime

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None

# Flight Models
class FlightCreate(BaseModel):
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

class FlightUpdate(BaseModel):
    airline: Optional[str] = None
    flight_number: Optional[str] = None
    departure_airport: Optional[str] = None
    arrival_airport: Optional[str] = None
    departure_time: Optional[datetime] = None
    arrival_time: Optional[datetime] = None
    price: Optional[float] = None
    available_seats: Optional[int] = None
    aircraft_type: Optional[str] = None
    duration_minutes: Optional[int] = None

class FlightResponse(BaseModel):
    id: str
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
    created_at: datetime

class FlightSearch(BaseModel):
    departure_airport: Optional[str] = None
    arrival_airport: Optional[str] = None
    departure_date: Optional[str] = None
    return_date: Optional[str] = None
    passengers: Optional[int] = 1
    class_type: Optional[str] = "economy"

# Hotel Models
class HotelCreate(BaseModel):
    name: str
    location: str
    address: str
    description: str
    price_per_night: float
    available_rooms: int
    amenities: List[str]
    rating: float
    images: List[str]

class HotelUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    address: Optional[str] = None
    description: Optional[str] = None
    price_per_night: Optional[float] = None
    available_rooms: Optional[int] = None
    amenities: Optional[List[str]] = None
    rating: Optional[float] = None
    images: Optional[List[str]] = None

class HotelResponse(BaseModel):
    id: str
    name: str
    location: str
    address: str
    description: str
    price_per_night: float
    available_rooms: int
    amenities: List[str]
    rating: float
    images: List[str]
    created_at: datetime

class HotelSearch(BaseModel):
    location: Optional[str] = None
    check_in_date: Optional[str] = None
    check_out_date: Optional[str] = None
    guests: Optional[int] = 1
    rooms: Optional[int] = 1

# Vacation Package Models
class VacationPackageCreate(BaseModel):
    name: str
    destination: str
    description: str
    duration_days: int
    price: float
    includes: List[str]
    itinerary: List[str]
    images: List[str]
    max_participants: int

class VacationPackageUpdate(BaseModel):
    name: Optional[str] = None
    destination: Optional[str] = None
    description: Optional[str] = None
    duration_days: Optional[int] = None
    price: Optional[float] = None
    includes: Optional[List[str]] = None
    itinerary: Optional[List[str]] = None
    images: Optional[List[str]] = None
    max_participants: Optional[int] = None

class VacationPackageResponse(BaseModel):
    id: str
    name: str
    destination: str
    description: str
    duration_days: int
    price: float
    includes: List[str]
    itinerary: List[str]
    images: List[str]
    max_participants: int
    created_at: datetime

# Booking Models
class BookingCreate(BaseModel):
    booking_type: str  # "flight", "hotel", "package"
    item_id: str
    check_in_date: Optional[str] = None
    check_out_date: Optional[str] = None
    passengers: Optional[int] = 1
    special_requests: Optional[str] = None

class BookingResponse(BaseModel):
    id: str
    user_id: str
    booking_type: str
    item_id: str
    check_in_date: Optional[str] = None
    check_out_date: Optional[str] = None
    passengers: int
    special_requests: Optional[str] = None
    status: BookingStatus
    total_amount: float
    created_at: datetime
    item_details: Optional[Dict[str, Any]] = None

# Payment Models
class PaymentCreate(BaseModel):
    booking_id: str
    amount: float
    payment_method: str  # "stripe", "paypal"

class PaymentResponse(BaseModel):
    id: str
    booking_id: str
    amount: float
    payment_method: str
    status: PaymentStatus
    stripe_payment_intent_id: Optional[str] = None
    created_at: datetime

# Token Models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    uid: Optional[str] = None
    role: Optional[str] = None