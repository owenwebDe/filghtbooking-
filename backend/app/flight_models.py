from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any, Union
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

# Flight API Models - TravelNext Integration

# Flight Search Request Models
class OriginDestinationInfo(BaseModel):
    departure_date: str = Field(..., description="Departure date in YYYY-MM-DD format")
    airport_origin_code: str = Field(..., alias="airportOriginCode", description="Origin airport IATA code")
    airport_destination_code: str = Field(..., alias="airportDestinationCode", description="Destination airport IATA code")

class FlightSearchRequest(BaseModel):
    user_id: str
    user_password: str
    access: str = "Test"
    ip_address: str = "127.0.0.1"
    required_currency: str = Field("USD", alias="requiredCurrency")
    journey_type: str = Field("OneWay", alias="journeyType", description="OneWay, Return, or Circle")
    origin_destination_info: List[OriginDestinationInfo] = Field(..., alias="OriginDestinationInfo")
    class_type: str = Field("Economy", alias="class", description="Economy, Business, First, PremiumEconomy")
    adults: int = 1
    childs: int = 0
    infants: int = 0
    airline_code: Optional[str] = Field(None, alias="airlineCode")
    direct_flight: Optional[int] = Field(None, alias="directFlight")

# Flight Segment Models
class FlightSegment(BaseModel):
    departure_airport: str = Field(..., description="Departure airport code")
    arrival_airport: str = Field(..., description="Arrival airport code")
    departure_time: str = Field(..., description="Departure time in ISO format")
    arrival_time: str = Field(..., description="Arrival time in ISO format")
    flight_number: str = Field(..., description="Flight number")
    airline_code: str = Field(..., description="Airline IATA code")
    airline_name: str = Field(..., description="Airline full name")
    aircraft_type: Optional[str] = Field(None, description="Aircraft type")
    duration: str = Field(..., description="Flight duration")
    stops: int = Field(0, description="Number of stops")
    cabin_class: str = Field(..., description="Cabin class")
    fare_basis: Optional[str] = Field(None, description="Fare basis code")
    baggage_info: Optional[str] = Field(None, description="Baggage allowance")

# Flight Option Models
class PassengerFare(BaseModel):
    passenger_type: str = Field(..., description="Adult, Child, or Infant")
    base_fare: float = Field(..., description="Base fare amount")
    taxes: float = Field(..., description="Tax amount")
    total_fare: float = Field(..., description="Total fare for this passenger type")
    passenger_count: int = Field(..., description="Number of passengers of this type")

class FlightOption(BaseModel):
    fare_source_code: str = Field(..., description="Unique identifier for this fare option")
    airline_code: str = Field(..., description="Primary airline code")
    airline_name: str = Field(..., description="Primary airline name")
    total_duration: str = Field(..., description="Total journey duration")
    total_stops: int = Field(..., description="Total number of stops")
    departure_time: str = Field(..., description="First departure time")
    arrival_time: str = Field(..., description="Final arrival time")
    segments: List[FlightSegment] = Field(..., description="Flight segments")
    passenger_fares: List[PassengerFare] = Field(..., description="Fare breakdown by passenger type")
    total_amount: float = Field(..., description="Total amount for all passengers")
    currency: str = Field(..., description="Currency code")
    is_refundable: bool = Field(False, description="Whether the fare is refundable")
    fare_type: str = Field(..., description="Fare type (e.g., Private, Public)")
    booking_class: str = Field(..., description="Booking class code")
    last_ticket_date: Optional[str] = Field(None, description="Last ticketing date")
    baggage_info: Optional[List[str]] = Field(None, description="Baggage allowance details")

# Flight Search Response Models
class FlightSearchResponse(BaseModel):
    success: bool = True
    flights: List[FlightOption] = Field(..., description="Available flight options")
    total_results: int = Field(..., description="Total number of results")
    currency: str = Field(..., description="Response currency")
    search_id: Optional[str] = Field(None, description="Search session ID")
    search_key: Optional[str] = Field(None, description="Search key for reference")
    error: Optional[str] = Field(None, description="Error message if any")

# Fare Validation Models
class FareValidationRequest(BaseModel):
    session_id: str = Field(..., description="Session ID from flight search")
    fare_source_code: str = Field(..., description="Fare source code to validate")
    fare_source_code_inbound: Optional[str] = Field(None, description="Inbound fare source code for round trip")

class FareValidationResponse(BaseModel):
    success: bool = True
    validation_result: Dict[str, Any] = Field(..., description="Validation result details")
    fare_details: Optional[Dict[str, Any]] = Field(None, description="Updated fare details")
    extra_services: List[Dict[str, Any]] = Field(default_factory=list, description="Available extra services")
    total_amount: Optional[float] = Field(None, description="Total validated amount")
    currency: Optional[str] = Field(None, description="Currency code")
    expires_at: Optional[str] = Field(None, description="Fare expiration time")
    error: Optional[str] = Field(None, description="Error message if any")

# Passenger Information Models
class PassengerDetails(BaseModel):
    title: List[str] = Field(..., description="Passenger title (Mr, Mrs, Ms, etc.)")
    first_name: List[str] = Field(..., alias="firstName", description="First name")
    last_name: List[str] = Field(..., alias="lastName", description="Last name")
    dob: List[str] = Field(..., description="Date of birth in YYYY-MM-DD format")
    nationality: List[str] = Field(..., description="Nationality code")
    passport_number: Optional[List[str]] = Field(None, alias="passportNumber", description="Passport number")
    passport_expiry: Optional[List[str]] = Field(None, alias="passportExpiry", description="Passport expiry date")
    passport_country: Optional[List[str]] = Field(None, alias="passportCountry", description="Passport issuing country")

class PassengerInfo(BaseModel):
    adult: Optional[PassengerDetails] = Field(None, description="Adult passenger details")
    child: Optional[PassengerDetails] = Field(None, description="Child passenger details")
    infant: Optional[PassengerDetails] = Field(None, description="Infant passenger details")

class ContactInfo(BaseModel):
    customer_email: str = Field(..., alias="customerEmail", description="Contact email")
    customer_phone: str = Field(..., alias="customerPhone", description="Contact phone number")
    pax_details: List[PassengerInfo] = Field(..., alias="paxDetails", description="Passenger details list")

# Flight Booking Models
class FlightBookingInfo(BaseModel):
    flight_session_id: str = Field(..., alias="flight_session_id", description="Session ID from search")
    fare_source_code: str = Field(..., alias="fare_source_code", description="Selected fare source code")
    fare_source_code_inbound: Optional[str] = Field(None, alias="fare_source_code_inbound", description="Inbound fare for round trip")
    is_passport_mandatory: str = Field("false", alias="IsPassportMandatory", description="Whether passport is required")
    fare_type: str = Field("Private", alias="fareType", description="Fare type")
    area_code: Optional[str] = Field(None, alias="areaCode", description="Area code")
    country_code: Optional[str] = Field(None, alias="countryCode", description="Country code")

class FlightBookingRequest(BaseModel):
    flight_booking_info: FlightBookingInfo = Field(..., alias="flightBookingInfo")
    pax_info: ContactInfo = Field(..., alias="paxInfo")

class FlightBookingResponse(BaseModel):
    success: bool = True
    booking_confirmed: bool = Field(..., description="Whether booking is confirmed")
    booking_reference: Optional[str] = Field(None, description="Booking reference number")
    status: str = Field(..., description="Booking status")
    booking_details: Dict[str, Any] = Field(default_factory=dict, description="Detailed booking information")
    ticket_time_limit: Optional[str] = Field(None, description="Ticket time limit")
    target_environment: Optional[str] = Field(None, description="Target environment")
    error: Optional[str] = Field(None, description="Error message if any")

# Extra Services Models
class ServiceOption(BaseModel):
    service_id: str = Field(..., description="Service identifier")
    service_name: str = Field(..., description="Service name")
    service_type: str = Field(..., description="Service type (baggage, meal, seat)")
    price: float = Field(..., description="Service price")
    currency: str = Field(..., description="Currency code")
    description: str = Field(..., description="Service description")
    behavior: Optional[str] = Field(None, description="Service behavior (GROUP_PAX, PER_PAX, etc.)")
    segment_applicable: Optional[List[str]] = Field(None, description="Applicable segments")

class ExtraServicesResponse(BaseModel):
    success: bool = True
    extra_services_data: Dict[str, List[ServiceOption]] = Field(..., description="Extra services by category")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Service metadata")
    error: Optional[str] = Field(None, description="Error message if any")

# Fare Rules Models
class FareRuleCategory(BaseModel):
    category_name: str = Field(..., description="Rule category name")
    category_description: str = Field(..., description="Rule description")
    rule_text: str = Field(..., description="Detailed rule text")

class BaggageRule(BaseModel):
    segment_id: str = Field(..., description="Flight segment identifier")
    baggage_allowance: str = Field(..., description="Baggage allowance code")
    description: str = Field(..., description="Baggage description")

class FareRulesResponse(BaseModel):
    success: bool = True
    fare_rules_data: Dict[str, Any] = Field(..., description="Fare rules data")
    summary: Dict[str, Any] = Field(default_factory=dict, description="Rules summary")
    error: Optional[str] = Field(None, description="Error message if any")

# Trip Details Models
class TripDetailsResponse(BaseModel):
    success: bool = True
    trip_details: Dict[str, Any] = Field(..., description="Complete trip details")
    summary: Dict[str, Any] = Field(default_factory=dict, description="Trip summary")
    error: Optional[str] = Field(None, description="Error message if any")

# Ticket Order Models
class TicketOrderResponse(BaseModel):
    success: bool = True
    ticket_order_result: Dict[str, Any] = Field(..., description="Ticket order result")
    error: Optional[str] = Field(None, description="Error message if any")

# Cancellation Models
class CancellationResponse(BaseModel):
    success: bool = True
    cancellation_result: Dict[str, Any] = Field(..., description="Cancellation result")
    error: Optional[str] = Field(None, description="Error message if any")

# Airport and Airline Models
class Airport(BaseModel):
    airport_code: str = Field(..., description="IATA airport code")
    airport_name: str = Field(..., description="Airport name")
    city: str = Field(..., description="City name")
    country: str = Field(..., description="Country name")
    display_name: str = Field(..., description="Formatted display name")
    search_text: str = Field(..., description="Search text for autocomplete")

class Airline(BaseModel):
    airline_code: str = Field(..., description="IATA airline code")
    airline_name: str = Field(..., description="Airline name")
    logo_url: Optional[str] = Field(None, description="Airline logo URL")
    display_name: str = Field(..., description="Formatted display name")
    search_text: str = Field(..., description="Search text for autocomplete")
    has_logo: bool = Field(False, description="Whether logo is available")

class AirportListResponse(BaseModel):
    success: bool = True
    airports: List[Airport] = Field(..., description="List of airports")
    total_airports: int = Field(..., description="Total number of airports")
    error: Optional[str] = Field(None, description="Error message if any")

class AirlineListResponse(BaseModel):
    success: bool = True
    airlines: List[Airline] = Field(..., description="List of airlines")
    total_airlines: int = Field(..., description="Total number of airlines")
    error: Optional[str] = Field(None, description="Error message if any")

# Legacy Flight Models (for backward compatibility)
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