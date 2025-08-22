"""
Real Flight API Service Integration
Flight Availability Search using TravelNext API
"""

import httpx
import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime, date
from ..config import settings
import logging

logger = logging.getLogger(__name__)

class FlightAPIService:
    """
    Service for integrating with TravelNext Flight API
    """
    
    def __init__(self):
        # Updated to use FlightsLogic API endpoint
        self.base_url = "https://travelnext.works/api/aeroVE5"
        self.user_id = settings.FLIGHT_API_USER_ID
        self.user_password = settings.FLIGHT_API_PASSWORD
        self.access = settings.FLIGHT_API_ACCESS  # "Test" or "Production"
        self.ip_address = settings.FLIGHT_API_IP_ADDRESS
        
    async def search_flights(
        self,
        origin: str,
        destination: str,
        departure_date: str,
        return_date: Optional[str] = None,
        journey_type: str = "OneWay",
        adults: int = 1,
        children: int = 0,
        infants: int = 0,
        class_type: str = "Economy",
        currency: str = "USD",
        airline_code: Optional[str] = None,
        direct_flight: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Search for flight availability
        
        Args:
            origin: Airport origin code (e.g., "DEL")
            destination: Airport destination code (e.g., "BOM")
            departure_date: Departure date in YYYY-MM-DD format
            return_date: Return date for round trip (optional)
            journey_type: "OneWay", "Return", or "Circle"
            adults: Number of adults (required)
            children: Number of children
            infants: Number of infants
            class_type: "Economy", "Business", "First", "PremiumEconomy"
            currency: 3-character ISO currency code
            airline_code: Optional 2-letter airline code
            direct_flight: 0 for all flights, 1 for direct only
        """
        
        # Build request payload
        payload = {
            "user_id": self.user_id,
            "user_password": self.user_password,
            "access": self.access,
            "ip_address": self.ip_address,
            "requiredCurrency": currency,
            "journeyType": journey_type,
            "OriginDestinationInfo": [],
            "class": class_type,
            "adults": adults,
            "childs": children,
            "infants": infants
        }
        
        # Add optional parameters
        if airline_code:
            payload["airlineCode"] = airline_code
        if direct_flight is not None:
            payload["directFlight"] = direct_flight
            
        # Build origin destination info based on journey type
        if journey_type == "OneWay":
            payload["OriginDestinationInfo"] = [{
                "departureDate": departure_date,
                "airportOriginCode": origin,
                "airportDestinationCode": destination
            }]
        elif journey_type == "Return":
            if not return_date:
                raise ValueError("Return date is required for round trip")
            payload["OriginDestinationInfo"] = [{
                "departureDate": departure_date,
                "returnDate": return_date,
                "airportOriginCode": origin,
                "airportDestinationCode": destination
            }]
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/availability",
                    json=payload,
                    headers={
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    }
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return self._process_flight_response(result)
                else:
                    logger.error(f"Flight API error: {response.status_code} - {response.text}")
                    return {
                        "success": False,
                        "error": f"API request failed with status {response.status_code}",
                        "flights": []
                    }
                    
        except httpx.TimeoutException:
            logger.error("Flight API request timeout")
            return {
                "success": False,
                "error": "Request timeout",
                "flights": []
            }
        except Exception as e:
            logger.error(f"Flight API error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "flights": []
            }
    
    def _process_flight_response(self, api_response: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process and normalize the TravelNext flight API response
        Enhanced error handling and response structure support
        """
        try:
            # Check for error response first
            if "Errors" in api_response:
                error_info = api_response["Errors"]
                return {
                    "success": False,
                    "error": f"API Error: {error_info.get('ErrorMessage', 'Unknown error')}",
                    "error_code": error_info.get("ErrorCode", "UNKNOWN"),
                    "flights": []
                }
            
            # Check if the API response contains the expected structure
            air_search_response = api_response.get("AirSearchResponse", {})
            
            if not air_search_response:
                return {
                    "success": False,
                    "error": "No flight data in response",
                    "flights": []
                }
            
            # Extract session ID, supplier and search results
            session_id = air_search_response.get("session_id")
            supplier = air_search_response.get("supplier", "")
            air_search_result = air_search_response.get("AirSearchResult", {})
            
            # Handle both outbound and inbound results (for round trips)
            fare_itineraries = air_search_result.get("FareItineraries", [])
            
            # Check for round trip inbound results
            inbound_results = air_search_response.get("AirSearchResultInbound", {})
            if inbound_results:
                inbound_itineraries = inbound_results.get("FareItineraries", [])
                # For round trips, we might need to combine outbound and inbound
                # For now, we'll include them as separate results
                fare_itineraries.extend(inbound_itineraries)
            
            # Extract flight data from response
            flights = []
            for fare_itinerary_wrapper in fare_itineraries:
                fare_itinerary = fare_itinerary_wrapper.get("FareItinerary", {})
                flight_data = self._normalize_flight_data(fare_itinerary)
                if flight_data:
                    flights.append(flight_data)
            
            return {
                "success": True,
                "flights": flights,
                "total_results": len(flights),
                "currency": "USD",  # Default currency from API
                "search_id": session_id,
                "search_key": session_id,
                "supplier": supplier,
                "has_inbound_results": bool(inbound_results)
            }
            
        except Exception as e:
            logger.error(f"Error processing flight response: {str(e)}")
            return {
                "success": False,
                "error": "Error processing flight data",
                "flights": []
            }
    
    def _normalize_flight_data(self, fare_itinerary: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Normalize TravelNext flight data to match our application structure
        Enhanced to handle complete Flight Availability Response parameters
        """
        try:
            # Extract fare information
            fare_info = fare_itinerary.get("AirItineraryFareInfo", {})
            total_fares = fare_info.get("ItinTotalFares", {})
            
            # Extract flight segments
            origin_dest_options = fare_itinerary.get("OriginDestinationOptions", [])
            if not origin_dest_options:
                return None
                
            # Get the first route (for now, handling single route)
            first_route = origin_dest_options[0]
            segments = first_route.get("OriginDestinationOption", [])
            
            if not segments:
                return None
            
            first_segment = segments[0].get("FlightSegment", {})
            last_segment = segments[-1].get("FlightSegment", {})
            
            # Calculate duration and stops
            total_duration = self._parse_duration(first_segment.get("JourneyDuration", "0"))
            stops = first_route.get("TotalStops", 0)
            
            # Extract detailed fare breakdown with passenger types and penalty details
            fare_breakdown = fare_info.get("FareBreakdown", [])
            passenger_fares = self._extract_passenger_fares(fare_breakdown)
            baggage_info = self._extract_detailed_baggage_info(fare_breakdown)
            
            # Generate unique ID from fare source code
            fare_source = fare_info.get("FareSourceCode", "")
            result_index = fare_info.get("ResultIndex", "")
            
            # Enhanced seat availability info
            first_segment_info = segments[0] if segments else {}
            seats_remaining = first_segment_info.get("SeatsRemaining", {})
            
            normalized_flight = {
                # Frontend-expected fields (matching FlightOption interface)
                "fare_source_code": fare_source,
                "airline_code": first_segment.get("MarketingAirlineCode", ""),
                "airline_name": first_segment.get("MarketingAirlineName", ""),
                "total_duration": total_duration,
                "total_stops": stops,
                "departure_time": first_segment.get("DepartureDateTime", ""),
                "arrival_time": last_segment.get("ArrivalDateTime", ""),
                "segments": self._normalize_frontend_segments(segments),
                "passenger_fares": passenger_fares,
                "total_amount": float(total_fares.get("TotalFare", {}).get("Amount", 0)),
                "currency": total_fares.get("TotalFare", {}).get("CurrencyCode", "USD"),
                "is_refundable": fare_info.get("IsRefundable", "Yes") == "Yes",
                "fare_type": fare_info.get("FareType", "Public"),
                "booking_class": first_segment_info.get("ResBookDesigCode", ""),
                "baggage_info": baggage_info,
                
                # Additional useful fields
                "id": result_index or fare_source[:20],
                "flight_number": first_segment.get("FlightNumber", ""),
                "from": first_segment.get("DepartureAirportLocationCode", ""),
                "to": last_segment.get("ArrivalAirportLocationCode", ""),
                "base_price": float(total_fares.get("BaseFare", {}).get("Amount", 0)),
                "taxes": float(total_fares.get("TotalTax", {}).get("Amount", 0)),
                "service_tax": float(total_fares.get("ServiceTax", {}).get("Amount", 0)),
                "aircraft_type": first_segment.get("OperatingAirline", {}).get("Equipment", ""),
                "cabin_class": first_segment.get("CabinClassCode", "Y"),
                "search_key": fare_source,
                "result_id": result_index,
                "validating_airline": fare_itinerary.get("ValidatingAirlineCode", ""),
                "ticket_type": fare_itinerary.get("TicketType", "eTicket"),
                "is_passport_mandatory": fare_itinerary.get("IsPassportMandatory", False),
                "seats_remaining": {
                    "number": seats_remaining.get("Number", 0),
                    "below_minimum": seats_remaining.get("BelowMinimum", False)
                }
            }
            
            return normalized_flight
            
        except Exception as e:
            logger.error(f"Error normalizing TravelNext flight data: {str(e)}")
            return None
    
    def _parse_duration(self, duration_minutes: str) -> str:
        """
        Convert duration from minutes to hours and minutes format
        """
        try:
            total_minutes = int(duration_minutes)
            hours = total_minutes // 60
            minutes = total_minutes % 60
            return f"{hours}h {minutes}m"
        except (ValueError, TypeError):
            return "N/A"
    
    def _get_city_from_code(self, airport_code: str) -> str:
        """
        Get city name from airport code (simplified mapping)
        In production, this should use a proper airport database
        """
        airport_cities = {
            "DEL": "New Delhi",
            "BOM": "Mumbai", 
            "BLR": "Bangalore",
            "MAA": "Chennai",
            "CCU": "Kolkata",
            "HYD": "Hyderabad",
            "GOI": "Goa",
            "COK": "Kochi",
            "AMD": "Ahmedabad",
            "PNQ": "Pune",
            "JAI": "Jaipur",
            "LKO": "Lucknow",
            "VNS": "Varanasi",
            "IXC": "Chandigarh",
            "SXR": "Srinagar"
        }
        return airport_cities.get(airport_code, airport_code)
    
    def _normalize_travelnext_segments(self, segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Normalize TravelNext flight segments
        """
        normalized_segments = []
        for segment_wrapper in segments:
            segment = segment_wrapper.get("FlightSegment", {})
            operating_airline = segment.get("OperatingAirline", {})
            
            normalized_segment = {
                "airline": segment.get("MarketingAirlineName", ""),
                "airline_code": segment.get("MarketingAirlineCode", ""),
                "flight_number": segment.get("FlightNumber", ""),
                "from": segment.get("DepartureAirportLocationCode", ""),
                "to": segment.get("ArrivalAirportLocationCode", ""),
                "from_city": self._get_city_from_code(segment.get("DepartureAirportLocationCode", "")),
                "to_city": self._get_city_from_code(segment.get("ArrivalAirportLocationCode", "")),
                "departure_time": segment.get("DepartureDateTime", ""),
                "arrival_time": segment.get("ArrivalDateTime", ""),
                "duration": self._parse_duration(segment.get("JourneyDuration", "0")),
                "aircraft_type": operating_airline.get("Equipment", ""),
                "booking_class": segment.get("CabinClassCode", ""),
                "cabin_class": segment.get("CabinClassText", ""),
                "operating_airline": {
                    "code": operating_airline.get("Code", ""),
                    "name": operating_airline.get("Name", "")
                },
                "stops": segment_wrapper.get("StopQuantity", 0)
            }
            normalized_segments.append(normalized_segment)
        
        return normalized_segments
    
    def _extract_passenger_fares(self, fare_breakdown: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Extract passenger fare information to match frontend PassengerFare interface
        """
        passenger_fares = []
        
        for breakdown in fare_breakdown:
            passenger_type = breakdown.get("PassengerTypeQuantity", {})
            passenger_fare = breakdown.get("PassengerFare", {})
            
            # Map passenger type codes
            type_map = {"ADT": "Adult", "CHD": "Child", "INF": "Infant"}
            passenger_type_code = passenger_type.get("Code", "ADT")
            
            passenger_fare_info = {
                "passenger_type": type_map.get(passenger_type_code, "Adult"),
                "base_fare": float(passenger_fare.get("BaseFare", {}).get("Amount", 0)),
                "taxes": float(passenger_fare.get("ServiceTax", {}).get("Amount", 0)),
                "total_fare": float(passenger_fare.get("TotalFare", {}).get("Amount", 0)),
                "passenger_count": passenger_type.get("Quantity", 1)
            }
            
            passenger_fares.append(passenger_fare_info)
        
        return passenger_fares
    
    def _extract_detailed_baggage_info(self, fare_breakdown: List[Dict[str, Any]]) -> List[str]:
        """
        Extract baggage information to match frontend baggage_info?: string[] format
        """
        if not fare_breakdown:
            return ["No baggage info available"]
        
        # Get baggage info from adult passenger (usually first in breakdown)
        adult_baggage = fare_breakdown[0]
        baggage_allowance = adult_baggage.get("Baggage", [])
        cabin_baggage = adult_baggage.get("CabinBaggage", [])
        
        baggage_info = []
        if baggage_allowance and baggage_allowance[0]:
            baggage_info.append(f"Checked: {baggage_allowance[0]}")
        if cabin_baggage and cabin_baggage[0]:
            baggage_info.append(f"Cabin: {cabin_baggage[0]}")
        
        return baggage_info if baggage_info else ["Standard baggage allowance"]
    
    def _normalize_frontend_segments(self, segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Normalize flight segments to match frontend FlightSegment interface
        """
        normalized_segments = []
        for segment_wrapper in segments:
            segment = segment_wrapper.get("FlightSegment", {})
            operating_airline = segment.get("OperatingAirline", {})
            
            normalized_segment = {
                "departure_airport": segment.get("DepartureAirportLocationCode", ""),
                "arrival_airport": segment.get("ArrivalAirportLocationCode", ""),
                "departure_time": segment.get("DepartureDateTime", ""),
                "arrival_time": segment.get("ArrivalDateTime", ""),
                "flight_number": segment.get("FlightNumber", ""),
                "airline_code": segment.get("MarketingAirlineCode", ""),
                "airline_name": segment.get("MarketingAirlineName", ""),
                "aircraft_type": operating_airline.get("Equipment", ""),
                "duration": self._parse_duration(str(segment.get("JourneyDuration", "0"))),
                "stops": segment_wrapper.get("StopQuantity", 0),
                "cabin_class": segment.get("CabinClassCode", "Y"),
                "fare_basis": "",
                "baggage_info": ""
            }
            normalized_segments.append(normalized_segment)
        
        return normalized_segments

    def _normalize_enhanced_segments(self, segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Normalize TravelNext flight segments with enhanced details
        """
        normalized_segments = []
        for segment_wrapper in segments:
            segment = segment_wrapper.get("FlightSegment", {})
            operating_airline = segment.get("OperatingAirline", {})
            seats_remaining = segment_wrapper.get("SeatsRemaining", {})
            stop_info = segment_wrapper.get("StopQuantityInfo", {})
            
            normalized_segment = {
                "airline": segment.get("MarketingAirlineName", ""),
                "airline_code": segment.get("MarketingAirlineCode", ""),
                "flight_number": segment.get("FlightNumber", ""),
                "from": segment.get("DepartureAirportLocationCode", ""),
                "to": segment.get("ArrivalAirportLocationCode", ""),
                "from_city": self._get_city_from_code(segment.get("DepartureAirportLocationCode", "")),
                "to_city": self._get_city_from_code(segment.get("ArrivalAirportLocationCode", "")),
                "departure_time": segment.get("DepartureDateTime", ""),
                "arrival_time": segment.get("ArrivalDateTime", ""),
                "duration": self._parse_duration(str(segment.get("JourneyDuration", "0"))),
                "aircraft_type": operating_airline.get("Equipment", ""),
                "booking_class": segment_wrapper.get("ResBookDesigCode", ""),
                "booking_class_text": segment_wrapper.get("ResBookDesigText", ""),
                "cabin_class": segment.get("CabinClassCode", ""),
                "cabin_class_text": segment.get("CabinClassText", ""),
                "operating_airline": {
                    "code": operating_airline.get("Code", ""),
                    "name": operating_airline.get("Name", ""),
                    "flight_number": operating_airline.get("FlightNumber", "")
                },
                "stops": segment_wrapper.get("StopQuantity", 0),
                "stop_info": {
                    "arrival_time": stop_info.get("ArrivalDateTime", ""),
                    "departure_time": stop_info.get("DepartureDateTime", ""),
                    "duration": stop_info.get("Duration", ""),
                    "location_code": stop_info.get("LocationCode", "")
                },
                "seats_remaining": {
                    "number": seats_remaining.get("Number", 0),
                    "below_minimum": seats_remaining.get("BelowMinimum", False)
                },
                "eticket_eligible": segment.get("Eticket", True),
                "marriage_group": segment.get("MarriageGroup", ""),
                "meal_code": segment.get("MealCode", "")
            }
            normalized_segments.append(normalized_segment)
        
        return normalized_segments
    
    def _calculate_total_duration(self, segments: List[Dict[str, Any]]) -> str:
        """
        Calculate total flight duration from segments
        """
        try:
            total_minutes = 0
            for segment in segments:
                duration_str = segment.get("duration", "0H 0M")
                # Parse duration like "2H 30M"
                hours = 0
                minutes = 0
                
                if "H" in duration_str:
                    hours_part = duration_str.split("H")[0].strip()
                    hours = int(hours_part) if hours_part.isdigit() else 0
                
                if "M" in duration_str:
                    minutes_part = duration_str.split("H")[-1].replace("M", "").strip()
                    minutes = int(minutes_part) if minutes_part.isdigit() else 0
                
                total_minutes += (hours * 60) + minutes
            
            # Convert back to hours and minutes
            hours = total_minutes // 60
            minutes = total_minutes % 60
            return f"{hours}h {minutes}m"
            
        except Exception:
            return "N/A"
    
    def _extract_baggage_info(self, flight_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract baggage information
        """
        baggage_info = flight_result.get("baggageInfo", {})
        return {
            "checked": baggage_info.get("checkedBaggage", "N/A"),
            "carry_on": baggage_info.get("carryOnBaggage", "N/A"),
            "personal": baggage_info.get("personalItem", "N/A")
        }
    
    def _normalize_segments(self, segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Normalize flight segments
        """
        normalized_segments = []
        for segment in segments:
            normalized_segment = {
                "airline": segment.get("airline", {}).get("name", ""),
                "airline_code": segment.get("airline", {}).get("code", ""),
                "flight_number": segment.get("flightNumber", ""),
                "from": segment.get("origin", {}).get("code", ""),
                "to": segment.get("destination", {}).get("code", ""),
                "from_city": segment.get("origin", {}).get("city", ""),
                "to_city": segment.get("destination", {}).get("city", ""),
                "departure_time": segment.get("departureTime", ""),
                "arrival_time": segment.get("arrivalTime", ""),
                "duration": segment.get("duration", ""),
                "aircraft_type": segment.get("aircraftType", ""),
                "booking_class": segment.get("bookingClass", ""),
                "terminal": {
                    "departure": segment.get("origin", {}).get("terminal", ""),
                    "arrival": segment.get("destination", {}).get("terminal", "")
                }
            }
            normalized_segments.append(normalized_segment)
        
        return normalized_segments

    async def search_multicity_flights(
        self,
        segments: List[Dict[str, str]],
        adults: int = 1,
        children: int = 0,
        infants: int = 0,
        class_type: str = "Economy",
        currency: str = "USD",
        airline_code: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Search for multi-city flights
        
        Args:
            segments: List of flight segments with origin, destination, and departure_date
            Example: [
                {"origin": "DEL", "destination": "BOM", "departure_date": "2023-02-19"},
                {"origin": "BOM", "destination": "DXB", "departure_date": "2023-02-23"}
            ]
        """
        payload = {
            "user_id": self.user_id,
            "user_password": self.user_password,
            "access": self.access,
            "ip_address": self.ip_address,
            "requiredCurrency": currency,
            "journeyType": "Circle",
            "OriginDestinationInfo": [],
            "class": class_type,
            "adults": adults,
            "childs": children,
            "infants": infants
        }
        
        # Add optional airline code
        if airline_code:
            payload["airlineCode"] = airline_code
        
        # Build origin destination info for multi-city
        for segment in segments:
            origin_dest_info = {
                "departureDate": segment["departure_date"],
                "airportOriginCode": segment["origin"],
                "airportDestinationCode": segment["destination"]
            }
            payload["OriginDestinationInfo"].append(origin_dest_info)
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/availability",
                    json=payload,
                    headers={
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    }
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return self._process_flight_response(result)
                else:
                    logger.error(f"Multi-city flight API error: {response.status_code}")
                    return {
                        "success": False,
                        "error": f"API request failed with status {response.status_code}",
                        "flights": []
                    }
                    
        except Exception as e:
            logger.error(f"Multi-city flight API error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "flights": []
            }

    async def validate_fare(
        self,
        session_id: str,
        fare_source_code: str,
        fare_source_code_inbound: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Validate fare method to re-price and confirm availability of selected flight
        
        Args:
            session_id: Session ID from flight search response
            fare_source_code: Unique fare/flight option identification code
            fare_source_code_inbound: Optional inbound fare code for round trips
        """
        
        # Build request payload
        payload = {
            "session_id": session_id,
            "fare_source_code": fare_source_code
        }
        
        # Add inbound fare code if provided (for round trips)
        if fare_source_code_inbound:
            payload["fare_source_code_inbound"] = fare_source_code_inbound
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/revalidate",
                    json=payload,
                    headers={
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    }
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return self._process_fare_validation_response(result)
                else:
                    logger.error(f"Fare validation API error: {response.status_code} - {response.text}")
                    return {
                        "success": False,
                        "is_valid": False,
                        "error": f"API request failed with status {response.status_code}",
                        "fare_details": None,
                        "extra_services": []
                    }
                    
        except httpx.TimeoutException:
            logger.error("Fare validation API request timeout")
            return {
                "success": False,
                "is_valid": False,
                "error": "Request timeout",
                "fare_details": None,
                "extra_services": []
            }
        except Exception as e:
            logger.error(f"Fare validation API error: {str(e)}")
            return {
                "success": False,
                "is_valid": False,
                "error": str(e),
                "fare_details": None,
                "extra_services": []
            }
    
    def _process_fare_validation_response(self, api_response: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process and normalize the fare validation API response
        """
        try:
            # Check for error response first
            if "Errors" in api_response:
                error_info = api_response["Errors"]
                return {
                    "success": False,
                    "is_valid": False,
                    "error": f"API Error: {error_info.get('ErrorMessage', 'Unknown error')}",
                    "error_code": error_info.get("ErrorCode", "UNKNOWN"),
                    "fare_details": None,
                    "extra_services": []
                }
            
            # Extract validation response
            revalidate_response = api_response.get("AirRevalidateResponse", {})
            if not revalidate_response:
                return {
                    "success": False,
                    "is_valid": False,
                    "error": "No validation data in response",
                    "fare_details": None,
                    "extra_services": []
                }
            
            revalidate_result = revalidate_response.get("AirRevalidateResult", {})
            
            # Check if fare is valid
            is_valid = revalidate_result.get("IsValid", False)
            
            if not is_valid:
                return {
                    "success": True,
                    "is_valid": False,
                    "error": "Fare is no longer valid or available",
                    "fare_details": None,
                    "extra_services": []
                }
            
            # Extract fare itinerary details
            fare_itineraries = revalidate_result.get("FareItineraries", {})
            fare_details = None
            
            if fare_itineraries:
                fare_itinerary = fare_itineraries.get("FareItinerary", {})
                if fare_itinerary:
                    fare_details = self._normalize_validated_fare_data(fare_itinerary)
            
            # Extract extra services
            extra_services = self._extract_extra_services(revalidate_result.get("ExtraServices", {}))
            
            # Check for inbound results (round trip)
            inbound_result = revalidate_response.get("AirRevalidateResultInbound", {})
            inbound_fare_details = None
            if inbound_result and inbound_result.get("IsValid", False):
                inbound_itineraries = inbound_result.get("FareItineraries", {})
                if inbound_itineraries:
                    inbound_itinerary = inbound_itineraries.get("FareItinerary", {})
                    if inbound_itinerary:
                        inbound_fare_details = self._normalize_validated_fare_data(inbound_itinerary)
            
            return {
                "success": True,
                "is_valid": True,
                "fare_details": fare_details,
                "inbound_fare_details": inbound_fare_details,
                "extra_services": extra_services,
                "validation_metadata": {
                    "session_id": api_response.get("session_id"),
                    "has_inbound": bool(inbound_result),
                    "inbound_valid": inbound_result.get("IsValid", False) if inbound_result else False
                }
            }
            
        except Exception as e:
            logger.error(f"Error processing fare validation response: {str(e)}")
            return {
                "success": False,
                "is_valid": False,
                "error": "Error processing validation data",
                "fare_details": None,
                "extra_services": []
            }
    
    def _normalize_validated_fare_data(self, fare_itinerary: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize validated fare data from revalidate response
        """
        try:
            # Extract fare information
            fare_info = fare_itinerary.get("AirItineraryFareInfo", {})
            total_fares = fare_info.get("ItinTotalFares", {})
            
            # Extract flight segments
            origin_dest_options = fare_itinerary.get("OriginDestinationOptions", [])
            
            # Process segments
            normalized_segments = []
            for route in origin_dest_options:
                segments = route.get("OriginDestinationOption", [])
                for segment_wrapper in segments:
                    segment = segment_wrapper.get("FlightSegment", {})
                    normalized_segment = {
                        "airline": segment.get("MarketingAirlineName", ""),
                        "airline_code": segment.get("MarketingAirlineCode", ""),
                        "flight_number": segment.get("FlightNumber", ""),
                        "from": segment.get("DepartureAirportLocationCode", ""),
                        "to": segment.get("ArrivalAirportLocationCode", ""),
                        "departure_time": segment.get("DepartureDateTime", ""),
                        "arrival_time": segment.get("ArrivalDateTime", ""),
                        "duration": self._parse_duration(str(segment.get("JourneyDuration", "0"))),
                        "cabin_class": segment.get("CabinClassCode", ""),
                        "cabin_class_text": segment.get("CabinClassText", ""),
                        "eticket_eligible": segment.get("Eticket", True),
                        "operating_airline": segment.get("OperatingAirline", {}),
                        "booking_class": segment_wrapper.get("ResBookDesigCode", ""),
                        "booking_class_text": segment_wrapper.get("ResBookDesigText", ""),
                        "seats_remaining": segment_wrapper.get("SeatsRemaining", {}),
                        "stops": segment_wrapper.get("StopQuantity", 0)
                    }
                    normalized_segments.append(normalized_segment)
            
            # Extract passenger fares with detailed breakdown
            fare_breakdown = fare_info.get("FareBreakdown", [])
            passenger_fares = self._extract_passenger_fares(fare_breakdown)
            
            validated_fare = {
                "fare_source_code": fare_info.get("FareSourceCode", ""),
                "fare_type": fare_info.get("FareType", ""),
                "is_refundable": fare_info.get("IsRefundable", False),
                "divide_in_party": fare_info.get("DivideInPartyIndicator", False),
                "total_fares": {
                    "base_fare": float(total_fares.get("BaseFare", {}).get("Amount", 0)),
                    "equiv_fare": float(total_fares.get("EquivFare", {}).get("Amount", 0)),
                    "service_tax": float(total_fares.get("ServiceTax", {}).get("Amount", 0)),
                    "total_tax": float(total_fares.get("TotalTax", {}).get("Amount", 0)),
                    "total_fare": float(total_fares.get("TotalFare", {}).get("Amount", 0)),
                    "currency": total_fares.get("TotalFare", {}).get("CurrencyCode", "USD")
                },
                "passenger_fares": passenger_fares,
                "segments": normalized_segments,
                "direction_indicator": fare_itinerary.get("DirectionInd", "OneWay"),
                "is_passport_mandatory": fare_itinerary.get("IsPassportMandatory", False),
                "is_passport_full_details_mandatory": fare_itinerary.get("IsPassportFullDetailsMandatory", False),
                "required_fields_to_book": fare_itinerary.get("RequiredFieldsToBook", []),
                "sequence_number": fare_itinerary.get("SequenceNumber", ""),
                "ticket_type": fare_itinerary.get("TicketType", "eTicket"),
                "validating_airline": fare_itinerary.get("ValidatingAirlineCode", ""),
                "character_limits": {
                    "first_name": fare_itinerary.get("FirstNameCharacterLimit", 58),
                    "last_name": fare_itinerary.get("LastNameCharacterLimit", 58),
                    "pax_name": fare_itinerary.get("PaxNameCharacterLimit", 60)
                }
            }
            
            return validated_fare
            
        except Exception as e:
            logger.error(f"Error normalizing validated fare data: {str(e)}")
            return {}
    
    def _extract_extra_services(self, extra_services_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Extract and normalize extra services (baggage, meals, etc.)
        """
        services = []
        
        try:
            services_list = extra_services_data.get("Services", [])
            
            for service_wrapper in services_list:
                service = service_wrapper.get("Service", {})
                service_cost = service.get("ServiceCost", {})
                
                normalized_service = {
                    "service_id": service.get("ServiceId", ""),
                    "type": service.get("Type", ""),
                    "description": service.get("Description", ""),
                    "is_mandatory": service.get("IsMandatory", False),
                    "behavior": service.get("Behavior", ""),
                    "check_in_type": service.get("CheckInType", ""),
                    "relation": service.get("Relation", ""),
                    "flight_designator": service.get("FlightDesignator", ""),
                    "cost": {
                        "amount": float(service_cost.get("Amount", 0)),
                        "currency": service_cost.get("CurrencyCode", "USD"),
                        "decimal_places": service_cost.get("DecimalPlaces", 2)
                    }
                }
                
                services.append(normalized_service)
                
        except Exception as e:
            logger.error(f"Error extracting extra services: {str(e)}")
        
        return services
    
    async def book_flight(
        self,
        flight_booking_info: Dict[str, Any],
        passenger_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Book a flight using the TravelNext Flight API
        
        Args:
            flight_booking_info: Flight booking details (session_id, fare_source_code, etc.)
            passenger_info: Passenger details and contact information
            
        Returns:
            Dict containing booking result with confirmation details
        """
        try:
            # Build the booking request payload
            payload = {
                "flightBookingInfo": flight_booking_info,
                "paxInfo": passenger_info
            }
            
            logger.info(f"Booking flight with payload: {payload}")
            
            # Make the API call
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/booking",
                    json=payload,
                    headers=self.headers
                )
                
                logger.info(f"Booking API response status: {response.status_code}")
                logger.info(f"Booking API response: {response.text}")
                
                if response.status_code != 200:
                    return {
                        "success": False,
                        "booking_confirmed": False,
                        "error": f"API request failed with status {response.status_code}",
                        "booking_reference": None
                    }
                
                api_response = response.json()
                return self._process_booking_response(api_response)
                
        except httpx.TimeoutException:
            logger.error("Flight booking API timeout")
            return {
                "success": False,
                "booking_confirmed": False,
                "error": "Request timeout",
                "booking_reference": None
            }
        except Exception as e:
            logger.error(f"Flight booking API error: {str(e)}")
            return {
                "success": False,
                "booking_confirmed": False,
                "error": str(e),
                "booking_reference": None
            }
    
    def _process_booking_response(self, api_response: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process and normalize the booking API response
        """
        try:
            # Check for direct error response
            if "Errors" in api_response:
                error_info = api_response["Errors"]
                return {
                    "success": False,
                    "booking_confirmed": False,
                    "error": f"API Error: {error_info.get('ErrorMessage', 'Unknown error')}",
                    "error_code": error_info.get("ErrorCode", "UNKNOWN"),
                    "booking_reference": None
                }
            
            # Extract booking response
            book_flight_response = api_response.get("BookFlightResponse", {})
            if not book_flight_response:
                return {
                    "success": False,
                    "booking_confirmed": False,
                    "error": "No booking response data",
                    "booking_reference": None
                }
            
            book_flight_result = book_flight_response.get("BookFlightResult", {})
            
            # Check for errors in the result
            errors = book_flight_result.get("Errors")
            if errors:
                # Handle array of errors
                if isinstance(errors, list) and len(errors) > 0:
                    error_detail = errors[0].get("Errors", {})
                    error_message = error_detail.get("ErrorMessage", "Booking failed")
                    error_code = error_detail.get("ErrorCode", "UNKNOWN")
                else:
                    error_message = "Booking failed with unknown error"
                    error_code = "UNKNOWN"
                
                return {
                    "success": False,
                    "booking_confirmed": False,
                    "error": error_message,
                    "error_code": error_code,
                    "booking_reference": None
                }
            
            # Extract booking details
            success = book_flight_result.get("Success", False)
            status = book_flight_result.get("Status", "")
            unique_id = book_flight_result.get("UniqueID", "")
            ticket_time_limit = book_flight_result.get("TktTimeLimit", "")
            target = book_flight_result.get("Target", "")
            
            # Determine if booking is confirmed
            booking_confirmed = success and status.upper() in ["CONFIRMED", "PENDING"]
            
            result = {
                "success": success,
                "booking_confirmed": booking_confirmed,
                "booking_reference": unique_id if unique_id else None,
                "status": status,
                "ticket_time_limit": ticket_time_limit,
                "target_environment": target,
                "booking_details": {
                    "confirmation_number": unique_id,
                    "booking_status": status,
                    "payment_deadline": ticket_time_limit,
                    "is_confirmed": status.upper() == "CONFIRMED",
                    "is_pending": status.upper() == "PENDING"
                }
            }
            
            # Add error field if booking was not successful
            if not success or not booking_confirmed:
                result["error"] = f"Booking failed with status: {status}"
            
            return result
            
        except Exception as e:
            logger.error(f"Error processing booking response: {str(e)}")
            return {
                "success": False,
                "booking_confirmed": False,
                "error": f"Response processing error: {str(e)}",
                "booking_reference": None
            }
    
    def _validate_booking_payload(
        self,
        flight_booking_info: Dict[str, Any],
        passenger_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Validate the booking payload before sending to API
        """
        errors = []
        
        # Validate flight booking info
        required_flight_fields = [
            "flight_session_id", "fare_source_code", "IsPassportMandatory",
            "fareType", "areaCode"
        ]
        
        for field in required_flight_fields:
            if field not in flight_booking_info:
                errors.append(f"Missing required field in flight booking info: {field}")
        
        # Validate passenger info
        required_pax_fields = ["customerEmail", "customerPhone", "paxDetails"]
        
        for field in required_pax_fields:
            if field not in passenger_info:
                errors.append(f"Missing required field in passenger info: {field}")
        
        # Validate passenger details structure
        if "paxDetails" in passenger_info:
            pax_details = passenger_info["paxDetails"]
            if not isinstance(pax_details, list) or len(pax_details) == 0:
                errors.append("paxDetails must be a non-empty array")
            else:
                pax_detail = pax_details[0]
                
                # Check for at least one passenger type
                if not any(key in pax_detail for key in ["adult", "child", "infant"]):
                    errors.append("At least one passenger type (adult, child, infant) is required")
                
                # Validate adult passenger details if present
                if "adult" in pax_detail:
                    adult_required_fields = ["title", "firstName", "lastName", "dob", "nationality"]
                    for field in adult_required_fields:
                        if field not in pax_detail["adult"]:
                            errors.append(f"Missing required field in adult passenger details: {field}")
        
        if errors:
            return {
                "valid": False,
                "errors": errors
            }
        
        return {
            "valid": True,
            "errors": []
        }
    
    async def get_extra_services(
        self,
        session_id: str,
        fare_source_code: str
    ) -> Dict[str, Any]:
        """
        Get available extra services (baggage, meals, seats) for a flight
        
        Args:
            session_id: Session ID from flight search
            fare_source_code: Fare source code for the selected flight
            
        Returns:
            Dict containing extra services data
        """
        try:
            # Build the request payload
            payload = {
                "session_id": session_id,
                "fare_source_code": fare_source_code
            }
            
            logger.info(f"Getting extra services with payload: {payload}")
            
            # Make the API call
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/extra_services",
                    json=payload,
                    headers=self.headers
                )
                
                logger.info(f"Extra services API response status: {response.status_code}")
                logger.info(f"Extra services API response: {response.text}")
                
                if response.status_code != 200:
                    return {
                        "success": False,
                        "error": f"API request failed with status {response.status_code}",
                        "extra_services_data": None
                    }
                
                api_response = response.json()
                return self._process_extra_services_response(api_response)
                
        except httpx.TimeoutException:
            logger.error("Extra services API timeout")
            return {
                "success": False,
                "error": "Request timeout",
                "extra_services_data": None
            }
        except Exception as e:
            logger.error(f"Extra services API error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "extra_services_data": None
            }
    
    def _process_extra_services_response(self, api_response: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process and normalize the extra services API response
        """
        try:
            # Check for direct error response
            if "Errors" in api_response:
                error_info = api_response["Errors"]
                return {
                    "success": False,
                    "error": f"API Error: {error_info.get('ErrorMessage', 'Unknown error')}",
                    "error_code": error_info.get("ErrorCode", "UNKNOWN"),
                    "extra_services_data": None
                }
            
            # Extract extra services response
            extra_services_response = api_response.get("ExtraServicesResponse", {})
            if not extra_services_response:
                return {
                    "success": False,
                    "error": "No extra services response data",
                    "extra_services_data": None
                }
            
            extra_services_result = extra_services_response.get("ExtraServicesResult", {})
            
            # Check if the request was successful
            success = extra_services_result.get("success", False)
            if not success:
                return {
                    "success": False,
                    "error": "Extra services request failed",
                    "extra_services_data": None
                }
            
            # Extract and normalize extra services data
            extra_services_data = extra_services_result.get("ExtraServicesData", {})
            normalized_data = self._normalize_extra_services_data(extra_services_data)
            
            return {
                "success": True,
                "extra_services_data": normalized_data,
                "metadata": {
                    "session_id": None,  # Can be added if needed
                    "fare_source_code": None,  # Can be added if needed
                    "total_baggage_options": len(normalized_data.get("baggage", [])),
                    "total_meal_options": len(normalized_data.get("meals", [])),
                    "total_seat_options": len(normalized_data.get("seats", []))
                }
            }
            
        except Exception as e:
            logger.error(f"Error processing extra services response: {str(e)}")
            return {
                "success": False,
                "error": f"Response processing error: {str(e)}",
                "extra_services_data": None
            }
    
    def _normalize_extra_services_data(self, services_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize and structure extra services data into categories
        """
        normalized = {
            "baggage": [],
            "meals": [],
            "seats": []
        }
        
        try:
            # Process Dynamic Baggage
            dynamic_baggage = services_data.get("DynamicBaggage", [])
            for baggage_group in dynamic_baggage:
                baggage_item = {
                    "behavior": baggage_group.get("Behavior", ""),
                    "is_multi_select": baggage_group.get("IsMultiSelect", False),
                    "direction": self._get_direction_from_behavior(baggage_group.get("Behavior", "")),
                    "services": []
                }
                
                services = baggage_group.get("Services", [])
                for service_list in services:
                    segment_services = []
                    for service in service_list:
                        service_cost = service.get("ServiceCost", {})
                        normalized_service = {
                            "service_id": service.get("ServiceId", ""),
                            "type": "baggage",
                            "check_in_type": service.get("CheckInType", ""),
                            "description": service.get("Description", ""),
                            "fare_description": service.get("FareDescription", ""),
                            "is_mandatory": service.get("IsMandatory", False),
                            "minimum_quantity": service.get("MinimumQuantity", 0),
                            "maximum_quantity": service.get("MaximumQuantity", 1),
                            "cost": {
                                "amount": float(service_cost.get("Amount", 0)),
                                "currency": service_cost.get("CurrencyCode", "USD"),
                                "decimal_places": int(service_cost.get("DecimalPlaces", 2))
                            }
                        }
                        segment_services.append(normalized_service)
                    baggage_item["services"].append(segment_services)
                
                normalized["baggage"].append(baggage_item)
            
            # Process Dynamic Meals
            dynamic_meals = services_data.get("DynamicMeal", [])
            for meal_group in dynamic_meals:
                meal_item = {
                    "behavior": meal_group.get("Behavior", ""),
                    "is_multi_select": meal_group.get("IsMultiSelect", False),
                    "direction": self._get_direction_from_behavior(meal_group.get("Behavior", "")),
                    "services": []
                }
                
                services = meal_group.get("Services", [])
                for service_list in services:
                    segment_services = []
                    for service in service_list:
                        service_cost = service.get("ServiceCost", {})
                        normalized_service = {
                            "service_id": service.get("ServiceId", ""),
                            "type": "meal",
                            "check_in_type": service.get("CheckInType", ""),
                            "description": service.get("Description", ""),
                            "fare_description": service.get("FareDescription", ""),
                            "is_mandatory": service.get("IsMandatory", False),
                            "minimum_quantity": service.get("MinimumQuantity", 0),
                            "maximum_quantity": service.get("MaximumQuantity", 1),
                            "cost": {
                                "amount": float(service_cost.get("Amount", 0)),
                                "currency": service_cost.get("CurrencyCode", "USD"),
                                "decimal_places": int(service_cost.get("DecimalPlaces", 2))
                            }
                        }
                        segment_services.append(normalized_service)
                    meal_item["services"].append(segment_services)
                
                normalized["meals"].append(meal_item)
            
            # Process Dynamic Seats
            dynamic_seats = services_data.get("DynamicSeat", [])
            for seat_sector in dynamic_seats:
                for deck_group in seat_sector:
                    deck_seats = deck_group.get("DeckSeats", [])
                    for deck in deck_seats:
                        deck_info = {
                            "deck_number": deck.get("DeckNo", 0),
                            "rows": []
                        }
                        
                        row_seats = deck.get("RowSeats", [])
                        for row in row_seats:
                            row_info = {
                                "row_number": row.get("RowNo", ""),
                                "seats": []
                            }
                            
                            seats = row.get("Seats", [])
                            for seat in seats:
                                availability_type = seat.get("AvailablityType", {})
                                description = seat.get("Description", {})
                                compartment = seat.get("Compartment", {})
                                seat_type = seat.get("SeatType", {})
                                seat_way_type = seat.get("SeatWayType", {})
                                fare = seat.get("Fare", {})
                                
                                normalized_seat = {
                                    "service_id": seat.get("ServiceId", ""),
                                    "type": "seat",
                                    "airline_code": seat.get("AirlineCode", ""),
                                    "flight_number": seat.get("FlightNumber", ""),
                                    "equipment_code": seat.get("EquipmentCode", ""),
                                    "departure_airport": seat.get("DepartureAirportLocationCode", ""),
                                    "arrival_airport": seat.get("ArrivalAirportLocationCode", ""),
                                    "deck_number": seat.get("DeckNo", 0),
                                    "row_number": seat.get("RowNo", ""),
                                    "seat_number": seat.get("SeatNo", ""),
                                    "seat_code": seat.get("SeatCode", ""),
                                    "availability": {
                                        "code": availability_type.get("Code", 0),
                                        "text": availability_type.get("Text", ""),
                                        "is_available": availability_type.get("Code", 0) == 1
                                    },
                                    "description": {
                                        "code": description.get("Code", 0),
                                        "text": description.get("Text", "")
                                    },
                                    "compartment": {
                                        "code": compartment.get("Code", 0),
                                        "text": compartment.get("Text", "")
                                    },
                                    "seat_type": {
                                        "code": seat_type.get("Code", 0),
                                        "text": seat_type.get("Text", ""),
                                        "category": self._get_seat_category(seat_type.get("Text", ""))
                                    },
                                    "seat_way_type": {
                                        "code": seat_way_type.get("Code", 0),
                                        "text": seat_way_type.get("Text", "")
                                    },
                                    "cost": {
                                        "amount": float(fare.get("Amount", 0)),
                                        "currency": fare.get("CurrencyCode", "USD"),
                                        "decimal_places": int(fare.get("DecimalPlaces", 2))
                                    }
                                }
                                
                                row_info["seats"].append(normalized_seat)
                            
                            deck_info["rows"].append(row_info)
                        
                        normalized["seats"].append(deck_info)
            
        except Exception as e:
            logger.error(f"Error normalizing extra services data: {str(e)}")
        
        return normalized
    
    def _get_direction_from_behavior(self, behavior: str) -> str:
        """
        Extract direction information from behavior string
        """
        behavior_upper = behavior.upper()
        if "OUTBOUND" in behavior_upper:
            return "outbound"
        elif "INBOUND" in behavior_upper:
            return "inbound"
        else:
            return "both"
    
    def _get_seat_category(self, seat_type_text: str) -> str:
        """
        Categorize seat type for easier frontend handling
        """
        seat_type_lower = seat_type_text.lower()
        if "window" in seat_type_lower:
            return "window"
        elif "aisle" in seat_type_lower:
            return "aisle"
        elif "middle" in seat_type_lower:
            return "middle"
        else:
            return "unspecified"
    
    async def get_fare_rules(
        self,
        session_id: str,
        fare_source_code: str,
        fare_source_code_inbound: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get fare rules and conditions for a selected flight fare
        
        Args:
            session_id: Session ID from flight search
            fare_source_code: Fare source code for the selected flight
            fare_source_code_inbound: Optional inbound fare source code for round trips
            
        Returns:
            Dict containing fare rules and baggage information
        """
        try:
            # Build the request payload
            payload = {
                "session_id": session_id,
                "fare_source_code": fare_source_code
            }
            
            # Add inbound fare source code if provided (for round trips)
            if fare_source_code_inbound:
                payload["fare_source_code_inbound"] = fare_source_code_inbound
            
            logger.info(f"Getting fare rules with payload: {payload}")
            
            # Make the API call
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/fare_rules",
                    json=payload,
                    headers=self.headers
                )
                
                logger.info(f"Fare rules API response status: {response.status_code}")
                logger.info(f"Fare rules API response: {response.text}")
                
                if response.status_code != 200:
                    return {
                        "success": False,
                        "error": f"API request failed with status {response.status_code}",
                        "fare_rules_data": None
                    }
                
                api_response = response.json()
                return self._process_fare_rules_response(api_response)
                
        except httpx.TimeoutException:
            logger.error("Fare rules API timeout")
            return {
                "success": False,
                "error": "Request timeout",
                "fare_rules_data": None
            }
        except Exception as e:
            logger.error(f"Fare rules API error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "fare_rules_data": None
            }
    
    def _process_fare_rules_response(self, api_response: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process and normalize the fare rules API response
        """
        try:
            # Check for direct error response
            if "Errors" in api_response:
                error_info = api_response["Errors"]
                return {
                    "success": False,
                    "error": f"API Error: {error_info.get('ErrorMessage', 'Unknown error')}",
                    "error_code": error_info.get("ErrorCode", "UNKNOWN"),
                    "fare_rules_data": None
                }
            
            # Extract fare rules response
            fare_rules_response = api_response.get("FareRules1_1Response", {})
            if not fare_rules_response:
                return {
                    "success": False,
                    "error": "No fare rules response data",
                    "fare_rules_data": None
                }
            
            # Process outbound fare rules
            outbound_result = fare_rules_response.get("FareRules1_1Result", {})
            outbound_data = self._normalize_fare_rules_data(outbound_result, "outbound")
            
            # Process inbound fare rules if available (for round trips)
            inbound_result = fare_rules_response.get("FareRules1_1ResultInbound", {})
            inbound_data = None
            if inbound_result:
                inbound_data = self._normalize_fare_rules_data(inbound_result, "inbound")
            
            # Combine the results
            fare_rules_data = {
                "outbound": outbound_data,
                "inbound": inbound_data,
                "is_round_trip": inbound_data is not None
            }
            
            return {
                "success": True,
                "fare_rules_data": fare_rules_data,
                "summary": self._generate_fare_rules_summary(fare_rules_data)
            }
            
        except Exception as e:
            logger.error(f"Error processing fare rules response: {str(e)}")
            return {
                "success": False,
                "error": f"Response processing error: {str(e)}",
                "fare_rules_data": None
            }
    
    def _normalize_fare_rules_data(self, rules_result: Dict[str, Any], direction: str) -> Dict[str, Any]:
        """
        Normalize fare rules data for a specific direction (outbound/inbound)
        """
        try:
            normalized = {
                "direction": direction,
                "baggage_info": [],
                "fare_rules": []
            }
            
            # Process Baggage Information
            baggage_infos = rules_result.get("BaggageInfos", [])
            for baggage_wrapper in baggage_infos:
                baggage_info = baggage_wrapper.get("BaggageInfo", {})
                normalized_baggage = {
                    "departure_airport": baggage_info.get("Departure", ""),
                    "arrival_airport": baggage_info.get("Arrival", ""),
                    "flight_number": baggage_info.get("FlightNo", ""),
                    "baggage_allowance": baggage_info.get("Baggage", ""),
                    "baggage_description": self._parse_baggage_allowance(baggage_info.get("Baggage", ""))
                }
                normalized["baggage_info"].append(normalized_baggage)
            
            # Process Fare Rules
            fare_rules = rules_result.get("FareRules", [])
            for rule_wrapper in fare_rules:
                fare_rule = rule_wrapper.get("FareRule", {})
                normalized_rule = {
                    "airline_code": fare_rule.get("Airline", ""),
                    "city_pair": fare_rule.get("CityPair", ""),
                    "category": fare_rule.get("Category", ""),
                    "rules_text": fare_rule.get("Rules", ""),
                    "rules_summary": self._extract_rule_summary(fare_rule.get("Rules", "")),
                    "category_type": self._categorize_fare_rule(fare_rule.get("Category", ""))
                }
                normalized["fare_rules"].append(normalized_rule)
            
            return normalized
            
        except Exception as e:
            logger.error(f"Error normalizing fare rules data: {str(e)}")
            return {
                "direction": direction,
                "baggage_info": [],
                "fare_rules": []
            }
    
    def _parse_baggage_allowance(self, baggage_code: str) -> Dict[str, Any]:
        """
        Parse baggage allowance code into readable format
        """
        baggage_code = baggage_code.strip().upper()
        
        if baggage_code == "SB":
            return {
                "type": "standard",
                "description": "Standard Baggage Allowance",
                "details": "As per airline standard baggage policy"
            }
        elif baggage_code.endswith("P"):
            # Piece concept (e.g., "1P", "2P")
            pieces = baggage_code.replace("P", "")
            return {
                "type": "piece",
                "description": f"{pieces} Piece(s)",
                "details": f"Maximum {pieces} piece(s) of baggage allowed",
                "pieces": int(pieces) if pieces.isdigit() else 1
            }
        elif baggage_code.endswith("K"):
            # Weight concept (e.g., "20K", "30K")
            weight = baggage_code.replace("K", "")
            return {
                "type": "weight",
                "description": f"{weight} Kg",
                "details": f"Maximum {weight} kilograms of baggage allowed",
                "weight_kg": int(weight) if weight.isdigit() else 0
            }
        else:
            return {
                "type": "other",
                "description": baggage_code,
                "details": f"Baggage allowance: {baggage_code}"
            }
    
    def _extract_rule_summary(self, rules_text: str) -> List[str]:
        """
        Extract key points from rules text for easier consumption
        """
        if not rules_text:
            return []
        
        summary_points = []
        
        # Common patterns to extract
        patterns = [
            ("no day/time restrictions", "No day/time travel restrictions"),
            ("no eligibility requirements", "No special eligibility requirements"),
            ("capacity limitations", "Subject to seat availability"),
            ("fares are subject to change", "Fares subject to change without notice"),
            ("refund", "Refund conditions apply"),
            ("change", "Change conditions apply"),
            ("cancellation", "Cancellation conditions apply"),
            ("advance purchase", "Advance purchase requirements"),
            ("minimum stay", "Minimum stay requirements"),
            ("maximum stay", "Maximum stay requirements")
        ]
        
        rules_lower = rules_text.lower()
        for pattern, summary in patterns:
            if pattern in rules_lower:
                summary_points.append(summary)
        
        # If no patterns matched, take first sentence as summary
        if not summary_points and rules_text:
            first_sentence = rules_text.split('.')[0][:100]
            if first_sentence:
                summary_points.append(first_sentence.strip())
        
        return summary_points[:5]  # Limit to 5 key points
    
    def _categorize_fare_rule(self, category: str) -> str:
        """
        Categorize fare rule types for better organization
        """
        if not category:
            return "general"
        
        category_lower = category.lower()
        
        if any(word in category_lower for word in ["eligibility", "passenger"]):
            return "eligibility"
        elif any(word in category_lower for word in ["day", "time", "seasonal"]):
            return "travel_dates"
        elif any(word in category_lower for word in ["advance", "purchase", "payment"]):
            return "booking_requirements"
        elif any(word in category_lower for word in ["stay", "duration", "minimum", "maximum"]):
            return "stay_requirements"
        elif any(word in category_lower for word in ["change", "modification", "reissue"]):
            return "changes"
        elif any(word in category_lower for word in ["refund", "cancel", "void"]):
            return "cancellation"
        elif any(word in category_lower for word in ["baggage", "luggage"]):
            return "baggage"
        elif any(word in category_lower for word in ["penalty", "fee", "charge"]):
            return "penalties"
        else:
            return "general"
    
    def _generate_fare_rules_summary(self, fare_rules_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a summary of fare rules for quick overview
        """
        summary = {
            "has_outbound_rules": False,
            "has_inbound_rules": False,
            "total_baggage_segments": 0,
            "total_rule_categories": 0,
            "rule_categories": set(),
            "key_restrictions": []
        }
        
        try:
            # Process outbound data
            outbound = fare_rules_data.get("outbound", {})
            if outbound:
                summary["has_outbound_rules"] = True
                summary["total_baggage_segments"] += len(outbound.get("baggage_info", []))
                summary["total_rule_categories"] += len(outbound.get("fare_rules", []))
                
                for rule in outbound.get("fare_rules", []):
                    category_type = rule.get("category_type", "")
                    if category_type:
                        summary["rule_categories"].add(category_type)
                    
                    # Collect key restrictions
                    rule_summary = rule.get("rules_summary", [])
                    summary["key_restrictions"].extend(rule_summary)
            
            # Process inbound data
            inbound = fare_rules_data.get("inbound", {})
            if inbound:
                summary["has_inbound_rules"] = True
                summary["total_baggage_segments"] += len(inbound.get("baggage_info", []))
                summary["total_rule_categories"] += len(inbound.get("fare_rules", []))
                
                for rule in inbound.get("fare_rules", []):
                    category_type = rule.get("category_type", "")
                    if category_type:
                        summary["rule_categories"].add(category_type)
                    
                    # Collect key restrictions
                    rule_summary = rule.get("rules_summary", [])
                    summary["key_restrictions"].extend(rule_summary)
            
            # Convert set to list and limit key restrictions
            summary["rule_categories"] = list(summary["rule_categories"])
            summary["key_restrictions"] = list(set(summary["key_restrictions"]))[:10]
            
        except Exception as e:
            logger.error(f"Error generating fare rules summary: {str(e)}")
        
        return summary
    
    async def get_trip_details(
        self,
        unique_id: str
    ) -> Dict[str, Any]:
        """
        Get detailed trip information for a booking reference number
        
        Args:
            unique_id: Booking reference unique ID from successful booking
            
        Returns:
            Dict containing complete trip details including passengers, itinerary, and pricing
        """
        try:
            # Build the request payload with authentication credentials
            payload = {
                "user_id": self.user_id,
                "user_password": self.user_password,
                "access": self.access,
                "ip_address": self.ip_address,
                "UniqueID": unique_id
            }
            
            logger.info(f"Getting trip details for booking: {unique_id}")
            
            # Make the API call
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/trip_details",
                    json=payload,
                    headers=self.headers
                )
                
                logger.info(f"Trip details API response status: {response.status_code}")
                logger.info(f"Trip details API response: {response.text}")
                
                if response.status_code != 200:
                    return {
                        "success": False,
                        "error": f"API request failed with status {response.status_code}",
                        "trip_details": None
                    }
                
                api_response = response.json()
                return self._process_trip_details_response(api_response)
                
        except httpx.TimeoutException:
            logger.error("Trip details API timeout")
            return {
                "success": False,
                "error": "Request timeout",
                "trip_details": None
            }
        except Exception as e:
            logger.error(f"Trip details API error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "trip_details": None
            }
    
    def _process_trip_details_response(self, api_response: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process and normalize the trip details API response
        """
        try:
            # Check for direct error response
            if "Errors" in api_response:
                error_info = api_response["Errors"]
                return {
                    "success": False,
                    "error": f"API Error: {error_info.get('ErrorMessage', 'Unknown error')}",
                    "error_code": error_info.get("ErrorCode", "UNKNOWN"),
                    "trip_details": None
                }
            
            # Extract trip details response
            trip_details_response = api_response.get("TripDetailsResponse", {})
            if not trip_details_response:
                return {
                    "success": False,
                    "error": "No trip details response data",
                    "trip_details": None
                }
            
            # Process outbound trip details
            outbound_result = trip_details_response.get("TripDetailsResult", {})
            if not outbound_result.get("Success", False):
                return {
                    "success": False,
                    "error": "Trip details request failed",
                    "trip_details": None
                }
            
            outbound_data = self._normalize_trip_details_data(outbound_result, "outbound")
            
            # Process inbound trip details if available (for round trips)
            inbound_result = trip_details_response.get("TripDetailsResultInbound", {})
            inbound_data = None
            if inbound_result and inbound_result.get("Success", False):
                inbound_data = self._normalize_trip_details_data(inbound_result, "inbound")
            
            # Combine the results
            trip_details = {
                "outbound": outbound_data,
                "inbound": inbound_data,
                "is_round_trip": inbound_data is not None,
                "target_environment": outbound_result.get("Target", "")
            }
            
            return {
                "success": True,
                "trip_details": trip_details,
                "summary": self._generate_trip_summary(trip_details)
            }
            
        except Exception as e:
            logger.error(f"Error processing trip details response: {str(e)}")
            return {
                "success": False,
                "error": f"Response processing error: {str(e)}",
                "trip_details": None
            }
    
    def _normalize_trip_details_data(self, trip_result: Dict[str, Any], direction: str) -> Dict[str, Any]:
        """
        Normalize trip details data for a specific direction (outbound/inbound)
        """
        try:
            travel_itinerary = trip_result.get("TravelItinerary", {})
            itinerary_info = travel_itinerary.get("ItineraryInfo", {})
            
            normalized = {
                "direction": direction,
                "booking_info": self._extract_booking_info(travel_itinerary),
                "passengers": self._extract_passenger_info(itinerary_info.get("CustomerInfos", [])),
                "flight_segments": self._extract_flight_segments(itinerary_info.get("ReservationItems", [])),
                "pricing": self._extract_pricing_info(itinerary_info.get("ItineraryPricing", {})),
                "fare_breakdown": self._extract_fare_breakdown(itinerary_info.get("TripDetailsPTC_FareBreakdowns", [])),
                "extra_services": self._extract_booked_extra_services(itinerary_info.get("ExtraServices", {})),
                "booking_notes": self._extract_booking_notes(itinerary_info.get("BookingNotes", []))
            }
            
            return normalized
            
        except Exception as e:
            logger.error(f"Error normalizing trip details data: {str(e)}")
            return {
                "direction": direction,
                "booking_info": {},
                "passengers": [],
                "flight_segments": [],
                "pricing": {},
                "fare_breakdown": [],
                "extra_services": [],
                "booking_notes": []
            }
    
    def _extract_booking_info(self, travel_itinerary: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract basic booking information
        """
        return {
            "unique_id": travel_itinerary.get("UniqueID", ""),
            "reissue_unique_id": travel_itinerary.get("ReissueUniqueID", ""),
            "booking_status": travel_itinerary.get("BookingStatus", ""),
            "ticket_status": travel_itinerary.get("TicketStatus", ""),
            "origin": travel_itinerary.get("Origin", ""),
            "destination": travel_itinerary.get("Destination", ""),
            "fare_type": travel_itinerary.get("FareType", ""),
            "is_commissionable": travel_itinerary.get("IsCommissionable", False),
            "is_mo_fare": travel_itinerary.get("IsMOFare", False),
            "cross_border_indicator": travel_itinerary.get("CrossBorderIndicator", False)
        }
    
    def _extract_passenger_info(self, customer_infos: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Extract passenger information
        """
        passengers = []
        
        for customer_wrapper in customer_infos:
            customer_info = customer_wrapper.get("CustomerInfo", {})
            
            passenger = {
                "item_rph": customer_info.get("ItemRPH", 0),
                "passenger_type": customer_info.get("PassengerType", ""),
                "title": customer_info.get("PassengerTitle", ""),
                "first_name": customer_info.get("PassengerFirstName", ""),
                "last_name": customer_info.get("PassengerLastName", ""),
                "full_name": f"{customer_info.get('PassengerTitle', '')} {customer_info.get('PassengerFirstName', '')} {customer_info.get('PassengerLastName', '')}".strip(),
                "date_of_birth": customer_info.get("DateOfBirth", ""),
                "gender": customer_info.get("Gender", ""),
                "nationality": customer_info.get("PassengerNationality", ""),
                "passport_number": customer_info.get("PassportNumber", ""),
                "email_address": customer_info.get("EmailAddress", ""),
                "phone_number": customer_info.get("PhoneNumber", ""),
                "post_code": customer_info.get("PostCode", ""),
                "e_ticket_number": customer_info.get("eTicketNumber", ""),
                "passenger_category": self._get_passenger_category(customer_info.get("PassengerType", ""))
            }
            
            passengers.append(passenger)
        
        return passengers
    
    def _extract_flight_segments(self, reservation_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Extract flight segment information
        """
        segments = []
        
        for item_wrapper in reservation_items:
            reservation_item = item_wrapper.get("ReservationItem", {})
            
            segment = {
                "item_rph": reservation_item.get("ItemRPH", 0),
                "flight_number": reservation_item.get("FlightNumber", ""),
                "operating_airline": reservation_item.get("OperatingAirlineCode", ""),
                "marketing_airline": reservation_item.get("MarketingAirlineCode", ""),
                "departure_airport": reservation_item.get("DepartureAirportLocationCode", ""),
                "arrival_airport": reservation_item.get("ArrivalAirportLocationCode", ""),
                "departure_datetime": reservation_item.get("DepartureDateTime", ""),
                "arrival_datetime": reservation_item.get("ArrivalDateTime", ""),
                "departure_terminal": reservation_item.get("DepartureTerminal", ""),
                "arrival_terminal": reservation_item.get("ArrivalTerminal", ""),
                "journey_duration": reservation_item.get("JourneyDuration", 0),
                "stop_quantity": reservation_item.get("StopQuantity", 0),
                "aircraft_type": reservation_item.get("AirEquipmentType", ""),
                "booking_class": reservation_item.get("ResBookDesigCode", ""),
                "cabin_class": reservation_item.get("CabinClassText", ""),
                "airline_pnr": reservation_item.get("AirlinePNR", ""),
                "number_in_party": reservation_item.get("NumberInParty", 0),
                "baggage_allowance": reservation_item.get("Baggage", ""),
                "segment_type": "direct" if reservation_item.get("StopQuantity", 0) == 0 else "connecting"
            }
            
            segments.append(segment)
        
        return segments
    
    def _extract_pricing_info(self, itinerary_pricing: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract overall pricing information
        """
        pricing = {}
        
        # Extract fare components
        for component in ["EquiFare", "Tax", "ServiceTax", "TotalFare"]:
            if component in itinerary_pricing:
                fare_info = itinerary_pricing[component]
                pricing[component.lower()] = {
                    "amount": float(fare_info.get("Amount", 0)),
                    "currency": fare_info.get("CurrencyCode", "USD"),
                    "decimal_places": fare_info.get("DecimalPlaces", 2)
                }
        
        return pricing
    
    def _extract_fare_breakdown(self, fare_breakdowns: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Extract passenger-wise fare breakdown
        """
        breakdown = []
        
        for breakdown_wrapper in fare_breakdowns:
            fare_breakdown = breakdown_wrapper.get("TripDetailsPTC_FareBreakdown", {})
            passenger_type_qty = fare_breakdown.get("PassengerTypeQuantity", {})
            passenger_fare = fare_breakdown.get("TripDetailsPassengerFare", {})
            
            breakdown_item = {
                "passenger_type": passenger_type_qty.get("Code", ""),
                "passenger_category": self._get_passenger_category(passenger_type_qty.get("Code", "")),
                "quantity": passenger_type_qty.get("Quantity", 0),
                "fare_details": {}
            }
            
            # Extract fare components for this passenger type
            for component in ["EquiFare", "Tax", "ServiceTax", "TotalFare"]:
                if component in passenger_fare:
                    fare_info = passenger_fare[component]
                    breakdown_item["fare_details"][component.lower()] = {
                        "amount": float(fare_info.get("Amount", 0)),
                        "currency": fare_info.get("CurrencyCode", "USD"),
                        "decimal_places": fare_info.get("DecimalPlaces", 2)
                    }
            
            breakdown.append(breakdown_item)
        
        return breakdown
    
    def _extract_booked_extra_services(self, extra_services: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Extract booked extra services information
        """
        services = []
        
        services_list = extra_services.get("Services", [])
        for service_wrapper in services_list:
            service = service_wrapper.get("Service", {})
            service_cost = service.get("ServiceCost", {})
            
            service_item = {
                "passenger_number": service.get("NameNumber", 0),
                "service_id": service.get("ServiceId", ""),
                "service_type": service.get("Type", ""),
                "description": service.get("Description", ""),
                "behavior": service.get("Behavior", ""),
                "check_in_type": service.get("CheckInType", ""),
                "is_mandatory": service.get("IsMandatory", False),
                "cost": {
                    "amount": float(service_cost.get("Amount", 0)),
                    "currency": service_cost.get("CurrencyCode", "USD"),
                    "decimal_places": service_cost.get("DecimalPlaces", 2)
                },
                "service_category": self._categorize_service_type(service.get("Type", "")),
                "direction": self._get_direction_from_behavior(service.get("Behavior", ""))
            }
            
            services.append(service_item)
        
        return services
    
    def _extract_booking_notes(self, booking_notes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Extract booking notes
        """
        notes = []
        
        for note in booking_notes:
            note_item = {
                "note_details": note.get("NoteDetails", ""),
                "created_on": note.get("CreatedOn", ""),
                "note_type": self._categorize_booking_note(note.get("NoteDetails", ""))
            }
            notes.append(note_item)
        
        return notes
    
    def _get_passenger_category(self, passenger_type: str) -> str:
        """
        Get readable passenger category
        """
        categories = {
            "ADT": "Adult",
            "CHD": "Child", 
            "INF": "Infant"
        }
        return categories.get(passenger_type, passenger_type)
    
    def _categorize_service_type(self, service_type: str) -> str:
        """
        Categorize service type for better organization
        """
        if service_type.upper() == "BAGGAGE":
            return "baggage"
        elif service_type.upper() in ["MEAL", "OTHERS"]:
            return "meal"
        else:
            return "other"
    
    def _categorize_booking_note(self, note_details: str) -> str:
        """
        Categorize booking note type
        """
        note_lower = note_details.lower()
        
        if any(word in note_lower for word in ["wheelchair", "mobility", "assistance"]):
            return "special_assistance"
        elif any(word in note_lower for word in ["meal", "dietary", "vegetarian"]):
            return "meal_preference"
        elif any(word in note_lower for word in ["seat", "window", "aisle"]):
            return "seat_preference"
        else:
            return "general"
    
    def _generate_trip_summary(self, trip_details: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a summary of the trip details
        """
        summary = {
            "is_round_trip": trip_details.get("is_round_trip", False),
            "total_passengers": 0,
            "passenger_types": {},
            "total_segments": 0,
            "total_extra_services": 0,
            "booking_status": "",
            "ticket_status": "",
            "total_amount": 0.0,
            "currency": "USD"
        }
        
        try:
            # Process outbound data
            outbound = trip_details.get("outbound", {})
            if outbound:
                summary["booking_status"] = outbound.get("booking_info", {}).get("booking_status", "")
                summary["ticket_status"] = outbound.get("booking_info", {}).get("ticket_status", "")
                summary["total_passengers"] = len(outbound.get("passengers", []))
                summary["total_segments"] += len(outbound.get("flight_segments", []))
                summary["total_extra_services"] += len(outbound.get("extra_services", []))
                
                # Count passenger types
                for passenger in outbound.get("passengers", []):
                    pax_type = passenger.get("passenger_category", "Unknown")
                    summary["passenger_types"][pax_type] = summary["passenger_types"].get(pax_type, 0) + 1
                
                # Extract total amount and currency
                pricing = outbound.get("pricing", {})
                if "totalfare" in pricing:
                    summary["total_amount"] = pricing["totalfare"].get("amount", 0.0)
                    summary["currency"] = pricing["totalfare"].get("currency", "USD")
            
            # Add inbound data if available
            inbound = trip_details.get("inbound", {})
            if inbound:
                summary["total_segments"] += len(inbound.get("flight_segments", []))
                summary["total_extra_services"] += len(inbound.get("extra_services", []))
                
        except Exception as e:
            logger.error(f"Error generating trip summary: {str(e)}")
        
        return summary
    
    async def order_ticket(
        self,
        unique_id: str
    ) -> Dict[str, Any]:
        """
        Order ticket for a confirmed booking (Non-LCC airlines only)
        
        This method generates tickets for Non-LCC airlines with Public and Private fare types.
        For LCC airlines, tickets are issued automatically during the booking process.
        
        Args:
            unique_id: Booking reference unique ID from successful booking
            
        Returns:
            Dict containing ticket order result
        """
        try:
            # Build the request payload with authentication credentials
            payload = {
                "user_id": self.user_id,
                "user_password": self.user_password,
                "access": self.access,
                "ip_address": self.ip_address,
                "UniqueID": unique_id
            }
            
            logger.info(f"Ordering ticket for booking: {unique_id}")
            
            # Make the API call
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/ticket_order",
                    json=payload,
                    headers=self.headers
                )
                
                logger.info(f"Ticket order API response status: {response.status_code}")
                logger.info(f"Ticket order API response: {response.text}")
                
                if response.status_code != 200:
                    return {
                        "success": False,
                        "error": f"API request failed with status {response.status_code}",
                        "ticket_order_result": None
                    }
                
                api_response = response.json()
                return self._process_ticket_order_response(api_response)
                
        except httpx.TimeoutException:
            logger.error("Ticket order API timeout")
            return {
                "success": False,
                "error": "Request timeout",
                "ticket_order_result": None
            }
        except Exception as e:
            logger.error(f"Ticket order API error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "ticket_order_result": None
            }
    
    def _process_ticket_order_response(self, api_response: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process and normalize the ticket order API response
        """
        try:
            # Check for direct error response
            if "Errors" in api_response:
                error_info = api_response["Errors"]
                return {
                    "success": False,
                    "error": f"API Error: {error_info.get('ErrorMessage', 'Unknown error')}",
                    "error_code": error_info.get("ErrorCode", "UNKNOWN"),
                    "ticket_order_result": None
                }
            
            # Extract ticket order response
            air_order_ticket_rs = api_response.get("AirOrderTicketRS", {})
            if not air_order_ticket_rs:
                return {
                    "success": False,
                    "error": "No ticket order response data",
                    "ticket_order_result": None
                }
            
            ticket_order_result = air_order_ticket_rs.get("TicketOrderResult", {})
            
            # Check for errors in the result
            errors = ticket_order_result.get("Errors")
            if errors:
                error_detail = errors.get("Error", {})
                error_message = error_detail.get("ErrorMessage", "Ticket order failed")
                error_code = error_detail.get("ErrorCode", "UNKNOWN")
                
                return {
                    "success": False,
                    "error": error_message,
                    "error_code": error_code,
                    "ticket_order_result": None
                }
            
            # Extract ticket order details
            success = ticket_order_result.get("Success", "false").lower() == "true"
            unique_id = ticket_order_result.get("UniqueID", "")
            target = ticket_order_result.get("Target", "")
            
            result = {
                "success": success,
                "unique_id": unique_id,
                "target_environment": target,
                "ticket_status": "ordered" if success else "failed",
                "message": "Ticket ordered successfully" if success else "Ticket order failed"
            }
            
            return {
                "success": success,
                "ticket_order_result": result
            }
            
        except Exception as e:
            logger.error(f"Error processing ticket order response: {str(e)}")
            return {
                "success": False,
                "error": f"Response processing error: {str(e)}",
                "ticket_order_result": None
            }
    
    async def cancel_booking(
        self,
        unique_id: str
    ) -> Dict[str, Any]:
        """
        Cancel a booking identified by the unique ID
        
        Args:
            unique_id: Booking reference unique ID to cancel
            
        Returns:
            Dict containing cancellation result
        """
        try:
            # Build the request payload with authentication credentials
            payload = {
                "user_id": self.user_id,
                "user_password": self.user_password,
                "access": self.access,
                "ip_address": self.ip_address,
                "UniqueID": unique_id
            }
            
            logger.info(f"Cancelling booking: {unique_id}")
            
            # Make the API call
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/cancel",
                    json=payload,
                    headers=self.headers
                )
                
                logger.info(f"Cancel booking API response status: {response.status_code}")
                logger.info(f"Cancel booking API response: {response.text}")
                
                if response.status_code != 200:
                    return {
                        "success": False,
                        "error": f"API request failed with status {response.status_code}",
                        "cancellation_result": None
                    }
                
                api_response = response.json()
                return self._process_cancel_booking_response(api_response)
                
        except httpx.TimeoutException:
            logger.error("Cancel booking API timeout")
            return {
                "success": False,
                "error": "Request timeout",
                "cancellation_result": None
            }
        except Exception as e:
            logger.error(f"Cancel booking API error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "cancellation_result": None
            }
    
    def _process_cancel_booking_response(self, api_response: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process and normalize the cancel booking API response
        """
        try:
            # Extract cancel booking response
            cancel_booking_response = api_response.get("CancelBookingResponse", {})
            if not cancel_booking_response:
                return {
                    "success": False,
                    "error": "No cancel booking response data",
                    "cancellation_result": None
                }
            
            cancel_booking_result = cancel_booking_response.get("CancelBookingResult", {})
            
            # Check for errors in the result
            errors = cancel_booking_result.get("Errors")
            if errors:
                error_message = errors.get("ErrorMessage", "Booking cancellation failed")
                error_code = errors.get("ErrorCode", "UNKNOWN")
                
                return {
                    "success": False,
                    "error": error_message,
                    "error_code": error_code,
                    "cancellation_result": None
                }
            
            # Extract cancellation details
            success = cancel_booking_result.get("Success", "false").lower() == "true"
            unique_id = cancel_booking_result.get("UniqueID", "")
            target = cancel_booking_result.get("Target", "")
            
            result = {
                "success": success,
                "unique_id": unique_id,
                "target_environment": target,
                "booking_status": "cancelled" if success else "active",
                "message": "Booking cancelled successfully" if success else "Booking cancellation failed",
                "cancellation_confirmed": success
            }
            
            return {
                "success": success,
                "cancellation_result": result
            }
            
        except Exception as e:
            logger.error(f"Error processing cancel booking response: {str(e)}")
            return {
                "success": False,
                "error": f"Response processing error: {str(e)}",
                "cancellation_result": None
            }
    
    async def get_airport_list(self) -> Dict[str, Any]:
        """
        Get list of airports supported by the API
        
        Returns:
            Dict containing list of airports with codes, names, cities, and countries
        """
        try:
            # Build the request payload with authentication credentials
            payload = {
                "user_id": self.user_id,
                "user_password": self.user_password,
                "access": self.access,
                "ip_address": self.ip_address
            }
            
            logger.info("Getting airport list from API")
            
            # Make the API call
            async with httpx.AsyncClient(timeout=60.0) as client:  # Longer timeout for reference data
                response = await client.post(
                    f"{self.base_url}/airport_list",
                    json=payload,
                    headers=self.headers
                )
                
                logger.info(f"Airport list API response status: {response.status_code}")
                
                if response.status_code != 200:
                    return {
                        "success": False,
                        "error": f"API request failed with status {response.status_code}",
                        "airports": []
                    }
                
                api_response = response.json()
                return self._process_airport_list_response(api_response)
                
        except httpx.TimeoutException:
            logger.error("Airport list API timeout")
            return {
                "success": False,
                "error": "Request timeout",
                "airports": []
            }
        except Exception as e:
            logger.error(f"Airport list API error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "airports": []
            }
    
    def _process_airport_list_response(self, api_response: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process and normalize the airport list API response
        """
        try:
            # Check for error response
            if "Errors" in api_response:
                error_info = api_response["Errors"]
                return {
                    "success": False,
                    "error": f"API Error: {error_info.get('ErrorMessage', 'Unknown error')}",
                    "error_code": error_info.get("ErrorCode", "UNKNOWN"),
                    "airports": []
                }
            
            # The response should be a direct array of airports
            if isinstance(api_response, list):
                airports = []
                
                for airport_data in api_response:
                    normalized_airport = {
                        "airport_code": airport_data.get("AirportCode", ""),
                        "airport_name": airport_data.get("AirportName", ""),
                        "city": airport_data.get("City", ""),
                        "country": airport_data.get("Country", ""),
                        "display_name": f"{airport_data.get('AirportName', '')} ({airport_data.get('AirportCode', '')})",
                        "search_text": f"{airport_data.get('AirportCode', '')} {airport_data.get('AirportName', '')} {airport_data.get('City', '')} {airport_data.get('Country', '')}"
                    }
                    airports.append(normalized_airport)
                
                return {
                    "success": True,
                    "airports": airports,
                    "total_airports": len(airports)
                }
            else:
                return {
                    "success": False,
                    "error": "Invalid response format",
                    "airports": []
                }
            
        except Exception as e:
            logger.error(f"Error processing airport list response: {str(e)}")
            return {
                "success": False,
                "error": f"Response processing error: {str(e)}",
                "airports": []
            }
    
    async def get_airline_list(self) -> Dict[str, Any]:
        """
        Get list of airlines supported by the API
        
        Returns:
            Dict containing list of airlines with codes, names, and logos
        """
        try:
            # Build the request payload with authentication credentials
            payload = {
                "user_id": self.user_id,
                "user_password": self.user_password,
                "access": self.access,
                "ip_address": self.ip_address
            }
            
            logger.info("Getting airline list from API")
            
            # Make the API call
            async with httpx.AsyncClient(timeout=60.0) as client:  # Longer timeout for reference data
                response = await client.post(
                    f"{self.base_url}/airline_list",
                    json=payload,
                    headers=self.headers
                )
                
                logger.info(f"Airline list API response status: {response.status_code}")
                
                if response.status_code != 200:
                    return {
                        "success": False,
                        "error": f"API request failed with status {response.status_code}",
                        "airlines": []
                    }
                
                api_response = response.json()
                return self._process_airline_list_response(api_response)
                
        except httpx.TimeoutException:
            logger.error("Airline list API timeout")
            return {
                "success": False,
                "error": "Request timeout",
                "airlines": []
            }
        except Exception as e:
            logger.error(f"Airline list API error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "airlines": []
            }
    
    def _process_airline_list_response(self, api_response: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process and normalize the airline list API response
        """
        try:
            # Check for error response
            if "Errors" in api_response:
                error_info = api_response["Errors"]
                return {
                    "success": False,
                    "error": f"API Error: {error_info.get('ErrorMessage', 'Unknown error')}",
                    "error_code": error_info.get("ErrorCode", "UNKNOWN"),
                    "airlines": []
                }
            
            # The response should be a direct array of airlines
            if isinstance(api_response, list):
                airlines = []
                
                for airline_data in api_response:
                    normalized_airline = {
                        "airline_code": airline_data.get("AirLineCode", ""),
                        "airline_name": airline_data.get("AirLineName", ""),
                        "logo_url": airline_data.get("Logo", ""),
                        "display_name": f"{airline_data.get('AirLineName', '')} ({airline_data.get('AirLineCode', '')})",
                        "search_text": f"{airline_data.get('AirLineCode', '')} {airline_data.get('AirLineName', '')}",
                        "has_logo": bool(airline_data.get("Logo", ""))
                    }
                    airlines.append(normalized_airline)
                
                # Sort airlines by name for better usability
                airlines.sort(key=lambda x: x.get("airline_name", ""))
                
                return {
                    "success": True,
                    "airlines": airlines,
                    "total_airlines": len(airlines)
                }
            else:
                return {
                    "success": False,
                    "error": "Invalid response format",
                    "airlines": []
                }
            
        except Exception as e:
            logger.error(f"Error processing airline list response: {str(e)}")
            return {
                "success": False,
                "error": f"Response processing error: {str(e)}",
                "airlines": []
            }

# Initialize the flight API service
flight_api_service = FlightAPIService()