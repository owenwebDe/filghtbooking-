from datetime import datetime
from typing import List, Optional, Dict, Any
from beanie import PydanticObjectId
from .mongodb_models import User, Flight, Hotel, VacationPackage, Booking, Payment, UserRole, BookingStatus, PaymentStatus

class MongoDBService:
    
    # User Operations
    async def create_user_profile(self, uid: str, email: str, full_name: str, phone: str = None, role: str = "user"):
        user = User(
            uid=uid,
            email=email,
            full_name=full_name,
            phone=phone,
            role=UserRole(role)
        )
        await user.insert()
        return user.dict()
    
    async def get_user_profile(self, uid: str):
        user = await User.find_one(User.uid == uid)
        return user.dict() if user else None
    
    async def get_user_by_email(self, email: str):
        user = await User.find_one(User.email == email)
        return user.dict() if user else None
    
    async def update_user_profile(self, uid: str, update_data: dict):
        user = await User.find_one(User.uid == uid)
        if user:
            for key, value in update_data.items():
                if hasattr(user, key):
                    setattr(user, key, value)
            await user.save()
            return user.dict()
        return None
    
    # Flight Operations
    async def create_flight(self, flight_data: dict) -> str:
        flight = Flight(**flight_data)
        await flight.insert()
        return str(flight.id)
    
    async def get_flight(self, flight_id: str):
        flight = await Flight.get(flight_id)
        if flight:
            result = flight.dict()
            result["id"] = str(flight.id)
            return result
        return None
    
    async def get_flights(self, filters: dict = None, limit: int = 50):
        query = Flight.find()
        
        if filters:
            if filters.get("departure_airport"):
                query = query.find(Flight.departure_airport == filters["departure_airport"])
            if filters.get("arrival_airport"):
                query = query.find(Flight.arrival_airport == filters["arrival_airport"])
            if filters.get("departure_date"):
                start_date = datetime.fromisoformat(filters["departure_date"])
                end_date = start_date.replace(hour=23, minute=59, second=59)
                query = query.find(Flight.departure_time >= start_date, Flight.departure_time <= end_date)
        
        flights = await query.limit(limit).to_list()
        result = []
        for flight in flights:
            flight_dict = flight.dict()
            flight_dict["id"] = str(flight.id)
            result.append(flight_dict)
        return result
    
    async def update_flight(self, flight_id: str, update_data: dict):
        flight = await Flight.get(flight_id)
        if flight:
            for key, value in update_data.items():
                if hasattr(flight, key):
                    setattr(flight, key, value)
            await flight.save()
            result = flight.dict()
            result["id"] = str(flight.id)
            return result
        return None
    
    async def delete_flight(self, flight_id: str):
        flight = await Flight.get(flight_id)
        if flight:
            await flight.delete()
    
    # Hotel Operations
    async def create_hotel(self, hotel_data: dict) -> str:
        hotel = Hotel(**hotel_data)
        await hotel.insert()
        return str(hotel.id)
    
    async def get_hotel(self, hotel_id: str):
        hotel = await Hotel.get(hotel_id)
        if hotel:
            result = hotel.dict()
            result["id"] = str(hotel.id)
            return result
        return None
    
    async def get_hotels(self, filters: dict = None, limit: int = 50):
        query = Hotel.find()
        
        if filters and filters.get("location"):
            query = query.find(Hotel.location == filters["location"])
        
        hotels = await query.limit(limit).to_list()
        result = []
        for hotel in hotels:
            hotel_dict = hotel.dict()
            hotel_dict["id"] = str(hotel.id)
            result.append(hotel_dict)
        return result
    
    async def update_hotel(self, hotel_id: str, update_data: dict):
        hotel = await Hotel.get(hotel_id)
        if hotel:
            for key, value in update_data.items():
                if hasattr(hotel, key):
                    setattr(hotel, key, value)
            await hotel.save()
            result = hotel.dict()
            result["id"] = str(hotel.id)
            return result
        return None
    
    async def delete_hotel(self, hotel_id: str):
        hotel = await Hotel.get(hotel_id)
        if hotel:
            await hotel.delete()
    
    # Vacation Package Operations
    async def create_vacation_package(self, package_data: dict) -> str:
        package = VacationPackage(**package_data)
        await package.insert()
        return str(package.id)
    
    async def get_vacation_package(self, package_id: str):
        package = await VacationPackage.get(package_id)
        if package:
            result = package.dict()
            result["id"] = str(package.id)
            return result
        return None
    
    async def get_vacation_packages(self, filters: dict = None, limit: int = 50):
        query = VacationPackage.find()
        
        if filters and filters.get("destination"):
            query = query.find(VacationPackage.destination == filters["destination"])
        
        packages = await query.limit(limit).to_list()
        result = []
        for package in packages:
            package_dict = package.dict()
            package_dict["id"] = str(package.id)
            result.append(package_dict)
        return result
    
    async def update_vacation_package(self, package_id: str, update_data: dict):
        package = await VacationPackage.get(package_id)
        if package:
            for key, value in update_data.items():
                if hasattr(package, key):
                    setattr(package, key, value)
            await package.save()
            result = package.dict()
            result["id"] = str(package.id)
            return result
        return None
    
    async def delete_vacation_package(self, package_id: str):
        package = await VacationPackage.get(package_id)
        if package:
            await package.delete()
    
    # Booking Operations
    async def create_booking(self, booking_data: dict) -> str:
        booking = Booking(**booking_data)
        await booking.insert()
        return str(booking.id)
    
    async def get_booking(self, booking_id: str):
        booking = await Booking.get(booking_id)
        if booking:
            result = booking.dict()
            result["id"] = str(booking.id)
            return result
        return None
    
    async def get_user_bookings(self, user_id: str):
        bookings = await Booking.find(Booking.user_id == user_id).to_list()
        result = []
        for booking in bookings:
            booking_dict = booking.dict()
            booking_dict["id"] = str(booking.id)
            result.append(booking_dict)
        return result
    
    async def get_all_bookings(self, limit: int = 100):
        bookings = await Booking.find().limit(limit).to_list()
        result = []
        for booking in bookings:
            booking_dict = booking.dict()
            booking_dict["id"] = str(booking.id)
            result.append(booking_dict)
        return result
    
    async def update_booking(self, booking_id: str, update_data: dict):
        booking = await Booking.get(booking_id)
        if booking:
            for key, value in update_data.items():
                if hasattr(booking, key):
                    if key == "status":
                        setattr(booking, key, BookingStatus(value))
                    else:
                        setattr(booking, key, value)
            await booking.save()
            result = booking.dict()
            result["id"] = str(booking.id)
            return result
        return None
    
    # Payment Operations
    async def create_payment(self, payment_data: dict) -> str:
        payment = Payment(**payment_data)
        await payment.insert()
        return str(payment.id)
    
    async def get_payment(self, payment_id: str):
        payment = await Payment.get(payment_id)
        if payment:
            result = payment.dict()
            result["id"] = str(payment.id)
            return result
        return None
    
    async def get_payments_by_booking(self, booking_id: str):
        payments = await Payment.find(Payment.booking_id == booking_id).to_list()
        result = []
        for payment in payments:
            payment_dict = payment.dict()
            payment_dict["id"] = str(payment.id)
            result.append(payment_dict)
        return result
    
    async def update_payment(self, payment_id: str, update_data: dict):
        payment = await Payment.get(payment_id)
        if payment:
            for key, value in update_data.items():
                if hasattr(payment, key):
                    if key == "status":
                        setattr(payment, key, PaymentStatus(value))
                    else:
                        setattr(payment, key, value)
            await payment.save()
            result = payment.dict()
            result["id"] = str(payment.id)
            return result
        return None
    
    async def get_all_payments(self, limit: int = 100):
        payments = await Payment.find().limit(limit).to_list()
        result = []
        for payment in payments:
            payment_dict = payment.dict()
            payment_dict["id"] = str(payment.id)
            result.append(payment_dict)
        return result

db_service = MongoDBService()