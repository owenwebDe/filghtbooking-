from datetime import datetime
from typing import List, Optional, Dict, Any
from .firebase_client import firebase_client
from .models import UserRole, BookingStatus, PaymentStatus

class DatabaseService:
    def __init__(self):
        self.db = firebase_client.db
    
    # User Operations
    async def create_user_profile(self, uid: str, email: str, full_name: str, phone: str = None, role: str = "user"):
        user_data = {
            "uid": uid,
            "email": email,
            "full_name": full_name,
            "phone": phone,
            "role": role,
            "created_at": datetime.utcnow()
        }
        self.db.collection("users").document(uid).set(user_data)
        return user_data
    
    async def get_user_profile(self, uid: str):
        doc = self.db.collection("users").document(uid).get()
        if doc.exists:
            return doc.to_dict()
        return None
    
    async def update_user_profile(self, uid: str, update_data: dict):
        self.db.collection("users").document(uid).update(update_data)
        return await self.get_user_profile(uid)
    
    # Flight Operations
    async def create_flight(self, flight_data: dict) -> str:
        flight_data["created_at"] = datetime.utcnow()
        doc_ref = self.db.collection("flights").add(flight_data)
        return doc_ref[1].id
    
    async def get_flight(self, flight_id: str):
        doc = self.db.collection("flights").document(flight_id).get()
        if doc.exists:
            data = doc.to_dict()
            data["id"] = doc.id
            return data
        return None
    
    async def get_flights(self, filters: dict = None, limit: int = 50):
        query = self.db.collection("flights")
        
        if filters:
            if filters.get("departure_airport"):
                query = query.where("departure_airport", "==", filters["departure_airport"])
            if filters.get("arrival_airport"):
                query = query.where("arrival_airport", "==", filters["arrival_airport"])
            if filters.get("departure_date"):
                start_date = datetime.fromisoformat(filters["departure_date"])
                end_date = start_date.replace(hour=23, minute=59, second=59)
                query = query.where("departure_time", ">=", start_date)
                query = query.where("departure_time", "<=", end_date)
        
        docs = query.limit(limit).stream()
        flights = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            flights.append(data)
        return flights
    
    async def update_flight(self, flight_id: str, update_data: dict):
        self.db.collection("flights").document(flight_id).update(update_data)
        return await self.get_flight(flight_id)
    
    async def delete_flight(self, flight_id: str):
        self.db.collection("flights").document(flight_id).delete()
    
    # Hotel Operations
    async def create_hotel(self, hotel_data: dict) -> str:
        hotel_data["created_at"] = datetime.utcnow()
        doc_ref = self.db.collection("hotels").add(hotel_data)
        return doc_ref[1].id
    
    async def get_hotel(self, hotel_id: str):
        doc = self.db.collection("hotels").document(hotel_id).get()
        if doc.exists:
            data = doc.to_dict()
            data["id"] = doc.id
            return data
        return None
    
    async def get_hotels(self, filters: dict = None, limit: int = 50):
        query = self.db.collection("hotels")
        
        if filters and filters.get("location"):
            query = query.where("location", "==", filters["location"])
        
        docs = query.limit(limit).stream()
        hotels = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            hotels.append(data)
        return hotels
    
    async def update_hotel(self, hotel_id: str, update_data: dict):
        self.db.collection("hotels").document(hotel_id).update(update_data)
        return await self.get_hotel(hotel_id)
    
    async def delete_hotel(self, hotel_id: str):
        self.db.collection("hotels").document(hotel_id).delete()
    
    # Vacation Package Operations
    async def create_vacation_package(self, package_data: dict) -> str:
        package_data["created_at"] = datetime.utcnow()
        doc_ref = self.db.collection("vacation_packages").add(package_data)
        return doc_ref[1].id
    
    async def get_vacation_package(self, package_id: str):
        doc = self.db.collection("vacation_packages").document(package_id).get()
        if doc.exists:
            data = doc.to_dict()
            data["id"] = doc.id
            return data
        return None
    
    async def get_vacation_packages(self, filters: dict = None, limit: int = 50):
        query = self.db.collection("vacation_packages")
        
        if filters and filters.get("destination"):
            query = query.where("destination", "==", filters["destination"])
        
        docs = query.limit(limit).stream()
        packages = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            packages.append(data)
        return packages
    
    async def update_vacation_package(self, package_id: str, update_data: dict):
        self.db.collection("vacation_packages").document(package_id).update(update_data)
        return await self.get_vacation_package(package_id)
    
    async def delete_vacation_package(self, package_id: str):
        self.db.collection("vacation_packages").document(package_id).delete()
    
    # Booking Operations
    async def create_booking(self, booking_data: dict) -> str:
        booking_data["created_at"] = datetime.utcnow()
        booking_data["status"] = BookingStatus.PENDING
        doc_ref = self.db.collection("bookings").add(booking_data)
        return doc_ref[1].id
    
    async def get_booking(self, booking_id: str):
        doc = self.db.collection("bookings").document(booking_id).get()
        if doc.exists:
            data = doc.to_dict()
            data["id"] = doc.id
            return data
        return None
    
    async def get_user_bookings(self, user_id: str):
        docs = self.db.collection("bookings").where("user_id", "==", user_id).stream()
        bookings = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            bookings.append(data)
        return bookings
    
    async def get_all_bookings(self, limit: int = 100):
        docs = self.db.collection("bookings").limit(limit).stream()
        bookings = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            bookings.append(data)
        return bookings
    
    async def update_booking(self, booking_id: str, update_data: dict):
        self.db.collection("bookings").document(booking_id).update(update_data)
        return await self.get_booking(booking_id)
    
    # Payment Operations
    async def create_payment(self, payment_data: dict) -> str:
        payment_data["created_at"] = datetime.utcnow()
        payment_data["status"] = PaymentStatus.PENDING
        doc_ref = self.db.collection("payments").add(payment_data)
        return doc_ref[1].id
    
    async def get_payment(self, payment_id: str):
        doc = self.db.collection("payments").document(payment_id).get()
        if doc.exists:
            data = doc.to_dict()
            data["id"] = doc.id
            return data
        return None
    
    async def get_payments_by_booking(self, booking_id: str):
        docs = self.db.collection("payments").where("booking_id", "==", booking_id).stream()
        payments = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            payments.append(data)
        return payments
    
    async def update_payment(self, payment_id: str, update_data: dict):
        self.db.collection("payments").document(payment_id).update(update_data)
        return await self.get_payment(payment_id)
    
    async def get_all_payments(self, limit: int = 100):
        docs = self.db.collection("payments").limit(limit).stream()
        payments = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            payments.append(data)
        return payments

db_service = DatabaseService()