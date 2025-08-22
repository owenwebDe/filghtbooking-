from fastapi import APIRouter, HTTPException, status, Depends, Query, Body
from typing import List, Optional, Dict, Any
from ..flight_models import FlightCreate, FlightUpdate, FlightResponse, FlightSearch
from ..auth import get_current_user, require_admin
from ..mongodb_database import db_service
from ..services.flight_api import flight_api_service

router = APIRouter(prefix="/flights", tags=["flights"])

@router.get("/search")
async def search_flights(
    origin: str = Query(..., description="Origin airport code (e.g., DEL)"),
    destination: str = Query(..., description="Destination airport code (e.g., BOM)"),
    departure_date: str = Query(..., description="Departure date (YYYY-MM-DD)"),
    return_date: Optional[str] = Query(None, description="Return date for round trip (YYYY-MM-DD)"),
    journey_type: str = Query("OneWay", description="Journey type: OneWay, Return, Circle"),
    adults: int = Query(1, description="Number of adults"),
    children: int = Query(0, description="Number of children"),
    infants: int = Query(0, description="Number of infants"),
    class_type: str = Query("Economy", description="Class: Economy, Business, First, PremiumEconomy"),
    currency: str = Query("USD", description="Currency code"),
    airline_code: Optional[str] = Query(None, description="Airline code (optional)"),
    direct_flight: Optional[int] = Query(None, description="0=all flights, 1=direct only")
):
    """
    Search for flights using the real flight API
    """
    try:
        # Call the real flight API service
        result = await flight_api_service.search_flights(
            origin=origin,
            destination=destination,
            departure_date=departure_date,
            return_date=return_date,
            journey_type=journey_type,
            adults=adults,
            children=children,
            infants=infants,
            class_type=class_type,
            currency=currency,
            airline_code=airline_code,
            direct_flight=direct_flight
        )
        
        if not result["success"]:
            # Return success=false instead of raising exception for client-side handling
            return {
                "success": False,
                "error": result.get("error", "Flight search failed"),
                "flights": [],
                "search_metadata": {}
            }
        
        return {
            "success": True,
            "flights": result["flights"],
            "total_results": result.get("total_results", len(result["flights"])),
            "currency": result.get("currency", currency),
            "search_metadata": {
                "search_id": result.get("search_id"),
                "search_key": result.get("search_key"),
                "origin": origin,
                "destination": destination,
                "departure_date": departure_date,
                "return_date": return_date,
                "journey_type": journey_type,
                "passengers": {
                    "adults": adults,
                    "children": children,
                    "infants": infants
                },
                "class": class_type
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Flight search error: {str(e)}"
        )

@router.post("/search/multicity")
async def search_multicity_flights(
    segments: List[dict],
    adults: int = 1,
    children: int = 0,
    infants: int = 0,
    class_type: str = "Economy",
    currency: str = "USD",
    airline_code: Optional[str] = None
):
    """
    Search for multi-city flights
    
    Request body example:
    {
        "segments": [
            {"origin": "DEL", "destination": "BOM", "departure_date": "2023-02-19"},
            {"origin": "BOM", "destination": "DXB", "departure_date": "2023-02-23"},
            {"origin": "DXB", "destination": "DEL", "departure_date": "2023-03-01"}
        ],
        "adults": 1,
        "children": 0,
        "infants": 0,
        "class_type": "Economy",
        "currency": "USD"
    }
    """
    try:
        if not segments or len(segments) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least 2 flight segments required for multi-city search"
            )
        
        # Validate segment structure
        for i, segment in enumerate(segments):
            required_fields = ["origin", "destination", "departure_date"]
            for field in required_fields:
                if field not in segment:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Missing {field} in segment {i+1}"
                    )
        
        result = await flight_api_service.search_multicity_flights(
            segments=segments,
            adults=adults,
            children=children,
            infants=infants,
            class_type=class_type,
            currency=currency,
            airline_code=airline_code
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Multi-city flight search failed")
            )
        
        return {
            "success": True,
            "flights": result["flights"],
            "total_results": result.get("total_results", len(result["flights"])),
            "currency": result.get("currency", currency),
            "search_metadata": {
                "search_id": result.get("search_id"),
                "search_key": result.get("search_key"),
                "journey_type": "Circle",
                "segments": segments,
                "passengers": {
                    "adults": adults,
                    "children": children,
                    "infants": infants
                },
                "class": class_type
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Multi-city flight search error: {str(e)}"
        )

@router.post("/validate-fare")
async def validate_fare(
    session_id: str = Query(..., description="Session ID from flight search"),
    fare_source_code: str = Query(..., description="Fare source code for the selected flight"),
    fare_source_code_inbound: Optional[str] = Query(None, description="Inbound fare source code for round trip")
):
    """
    Validate fare for a selected flight before booking.
    This ensures the fare is still available and gets the latest pricing.
    """
    try:
        result = await flight_api_service.validate_fare(
            session_id=session_id,
            fare_source_code=fare_source_code,
            fare_source_code_inbound=fare_source_code_inbound
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Fare validation failed")
            )
        
        return {
            "success": True,
            "validation_result": result["validation_result"],
            "fare_details": result.get("fare_details"),
            "extra_services": result.get("extra_services", []),
            "total_amount": result.get("total_amount"),
            "currency": result.get("currency"),
            "expires_at": result.get("expires_at"),
            "validation_metadata": {
                "session_id": session_id,
                "fare_source_code": fare_source_code,
                "fare_source_code_inbound": fare_source_code_inbound,
                "is_round_trip": fare_source_code_inbound is not None
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fare validation error: {str(e)}"
        )

@router.post("/book")
async def book_flight(
    booking_data: Dict[str, Any] = Body(..., description="Flight booking request data")
):
    """
    Book a flight with passenger details and extra services.
    
    Request body should contain:
    - flightBookingInfo: Flight booking details (session_id, fare_source_code, etc.)
    - paxInfo: Passenger information and contact details
    
    Example request:
    {
        "flightBookingInfo": {
            "flight_session_id": "MTY2ODE2Njg2Ml8yNjA5Mzk=",
            "fare_source_code": "Sk5BUjhNem5ZMTJJMkNqY0g5VUtONWwzVjBaMTl2YkNYNURIbXp0NEQ4RVpRbWx1NkJiazl1WFcra2ppSzhsVHlreWU0ZHlQV1M2dTVwdnFYaDZYaThRWmNJR3Y4NDhYRWo1U2IzT3lLcS9LVWFUOU4zNklhc0pBM01pK1c3dWRoeXpQUXBlVStrTFFuRXlCUXQyaW50c0s3aEV5K0NkdGhNTjIrU0RlcFh3PQ==",
            "IsPassportMandatory": "true",
            "fareType": "Private",
            "areaCode": "080",
            "countryCode": "91"
        },
        "paxInfo": {
            "customerEmail": "test@gmail.com",
            "customerPhone": "9847012345",
            "paxDetails": [
                {
                    "adult": {
                        "title": ["Mr"],
                        "firstName": ["John"],
                        "lastName": ["Doe"],
                        "dob": ["1991-12-11"],
                        "nationality": ["IN"]
                    }
                }
            ]
        }
    }
    """
    try:
        # Extract flight booking info and passenger info
        flight_booking_info = booking_data.get("flightBookingInfo", {})
        passenger_info = booking_data.get("paxInfo", {})
        
        if not flight_booking_info or not passenger_info:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Both flightBookingInfo and paxInfo are required"
            )
        
        # Validate required fields
        validation_result = flight_api_service._validate_booking_payload(
            flight_booking_info, passenger_info
        )
        
        if not validation_result["valid"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Validation errors: {', '.join(validation_result['errors'])}"
            )
        
        # Book the flight
        result = await flight_api_service.book_flight(
            flight_booking_info=flight_booking_info,
            passenger_info=passenger_info
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Flight booking failed")
            )
        
        return {
            "success": True,
            "booking_confirmed": result["booking_confirmed"],
            "booking_reference": result["booking_reference"],
            "status": result["status"],
            "booking_details": result.get("booking_details", {}),
            "ticket_time_limit": result.get("ticket_time_limit"),
            "target_environment": result.get("target_environment"),
            "message": "Flight booking successful" if result["booking_confirmed"] else "Booking initiated but not confirmed"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Flight booking error: {str(e)}"
        )

@router.get("/extra-services")
async def get_extra_services(
    session_id: str = Query(..., description="Session ID from flight search"),
    fare_source_code: str = Query(..., description="Fare source code for the selected flight")
):
    """
    Get available extra services (baggage, meals, seats) for a selected flight.
    
    Returns all available add-on services that can be purchased with the flight booking,
    including:
    - Dynamic Baggage: Additional baggage allowances with pricing
    - Dynamic Meals: In-flight meal options and special dietary requirements  
    - Dynamic Seats: Seat selection with seat map, availability, and pricing
    
    Each service includes behavior information (GROUP_PAX, PER_PAX, etc.) that determines
    how the service applies to passengers and journey segments.
    """
    try:
        result = await flight_api_service.get_extra_services(
            session_id=session_id,
            fare_source_code=fare_source_code
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Failed to get extra services")
            )
        
        extra_services_data = result["extra_services_data"]
        metadata = result.get("metadata", {})
        
        return {
            "success": True,
            "extra_services": extra_services_data,
            "summary": {
                "baggage_options_available": len(extra_services_data.get("baggage", [])) > 0,
                "meal_options_available": len(extra_services_data.get("meals", [])) > 0,
                "seat_selection_available": len(extra_services_data.get("seats", [])) > 0,
                "total_baggage_groups": metadata.get("total_baggage_options", 0),
                "total_meal_groups": metadata.get("total_meal_options", 0),
                "total_seat_decks": metadata.get("total_seat_options", 0)
            },
            "service_categories": {
                "baggage": {
                    "description": "Additional baggage allowances beyond standard fare inclusion",
                    "note": "Pricing and behavior varies by passenger type and journey direction"
                },
                "meals": {
                    "description": "Pre-ordered in-flight meals and special dietary options",
                    "note": "Available for selection during booking process"
                },
                "seats": {
                    "description": "Advance seat selection with seat map and pricing",
                    "note": "Seat availability and pricing varies by aircraft configuration"
                }
            },
            "request_metadata": {
                "session_id": session_id,
                "fare_source_code": fare_source_code
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Extra services error: {str(e)}"
        )

@router.get("/fare-rules")
async def get_fare_rules(
    session_id: str = Query(..., description="Session ID from flight search"),
    fare_source_code: str = Query(..., description="Fare source code for the selected flight"),
    fare_source_code_inbound: Optional[str] = Query(None, description="Inbound fare source code for round trip")
):
    """
    Get detailed fare rules and conditions for a selected flight fare.
    
    Returns comprehensive fare rules information including:
    - Baggage allowances for each flight segment
    - Fare conditions and restrictions by category
    - Change and cancellation policies
    - Advance purchase requirements
    - Stay requirements and travel restrictions
    
    For round-trip flights, both outbound and inbound fare rules are provided
    separately when available.
    
    Categories typically include:
    - RULE APPLICATION AND OTHER CONDITIONS
    - ELIGIBILITY  
    - DAY/TIME RESTRICTIONS
    - ADVANCE PURCHASE REQUIREMENTS
    - MINIMUM/MAXIMUM STAY REQUIREMENTS
    - CHANGES AND MODIFICATIONS
    - REFUNDS AND CANCELLATIONS
    - PENALTIES AND FEES
    """
    try:
        result = await flight_api_service.get_fare_rules(
            session_id=session_id,
            fare_source_code=fare_source_code,
            fare_source_code_inbound=fare_source_code_inbound
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Failed to get fare rules")
            )
        
        fare_rules_data = result["fare_rules_data"]
        summary = result.get("summary", {})
        
        return {
            "success": True,
            "fare_rules": fare_rules_data,
            "summary": {
                "is_round_trip": fare_rules_data.get("is_round_trip", False),
                "has_outbound_rules": summary.get("has_outbound_rules", False),
                "has_inbound_rules": summary.get("has_inbound_rules", False),
                "total_baggage_segments": summary.get("total_baggage_segments", 0),
                "total_rule_categories": summary.get("total_rule_categories", 0),
                "available_rule_types": summary.get("rule_categories", []),
                "key_restrictions": summary.get("key_restrictions", [])
            },
            "rule_categories_guide": {
                "eligibility": "Passenger eligibility requirements",
                "travel_dates": "Day/time and seasonal restrictions", 
                "booking_requirements": "Advance purchase and payment conditions",
                "stay_requirements": "Minimum/maximum stay requirements",
                "changes": "Change and modification policies",
                "cancellation": "Refund and cancellation policies",
                "baggage": "Baggage allowances and restrictions",
                "penalties": "Penalty fees and charges",
                "general": "General terms and conditions"
            },
            "baggage_guide": {
                "SB": "Standard Baggage - As per airline policy",
                "1P": "1 Piece - Maximum 1 piece of baggage",
                "20K": "20 Kg - Maximum 20 kilograms weight",
                "note": "Baggage codes: P=Pieces, K=Kilograms, SB=Standard"
            },
            "request_metadata": {
                "session_id": session_id,
                "fare_source_code": fare_source_code,
                "fare_source_code_inbound": fare_source_code_inbound
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fare rules error: {str(e)}"
        )

@router.get("/trip-details/{unique_id}")
async def get_trip_details(
    unique_id: str
):
    """
    Get comprehensive trip details for a confirmed booking.
    
    Retrieves complete booking information after ticket issuance, including:
    - Complete passenger manifest with personal details
    - Full flight itinerary with PNR and ticket numbers
    - Detailed pricing breakdown by passenger type
    - Booked extra services (baggage, meals, seats)
    - Booking notes and special requests
    - Ticket status and booking confirmation details
    
    This endpoint provides all information needed for:
    - Booking confirmations and e-tickets
    - Check-in and boarding passes
    - Customer service and modifications
    - Travel documentation
    
    Note: This endpoint requires a valid booking reference (UniqueID) 
    from a successfully completed booking transaction.
    """
    try:
        result = await flight_api_service.get_trip_details(unique_id=unique_id)
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Failed to get trip details")
            )
        
        trip_details = result["trip_details"]
        summary = result.get("summary", {})
        
        return {
            "success": True,
            "trip_details": trip_details,
            "summary": {
                "booking_reference": unique_id,
                "is_round_trip": summary.get("is_round_trip", False),
                "booking_status": summary.get("booking_status", ""),
                "ticket_status": summary.get("ticket_status", ""),
                "total_passengers": summary.get("total_passengers", 0),
                "passenger_breakdown": summary.get("passenger_types", {}),
                "total_flight_segments": summary.get("total_segments", 0),
                "total_extra_services": summary.get("total_extra_services", 0),
                "total_amount": summary.get("total_amount", 0.0),
                "currency": summary.get("currency", "USD")
            },
            "status_guide": {
                "booking_status": {
                    "Booked": "Reservation confirmed and secured",
                    "Pending": "Booking initiated but not yet confirmed",
                    "Cancelled": "Booking has been cancelled",
                    "Modified": "Booking has been modified after initial confirmation"
                },
                "ticket_status": {
                    "TktInProcess": "Ticket issuance in progress",
                    "Ticketed": "Ticket issued successfully",
                    "TicketFailed": "Ticket issuance failed",
                    "TktCancelled": "Ticket has been cancelled"
                }
            },
            "passenger_types": {
                "Adult": "Adult passenger (12+ years)",
                "Child": "Child passenger (2-11 years)",
                "Infant": "Infant passenger (0-2 years)"
            },
            "service_categories": {
                "baggage": "Additional baggage allowances",
                "meal": "Pre-ordered meals and dietary preferences",
                "other": "Other ancillary services"
            },
            "request_metadata": {
                "unique_id": unique_id,
                "target_environment": trip_details.get("target_environment", "")
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Trip details error: {str(e)}"
        )

@router.post("/order-ticket/{unique_id}")
async def order_ticket(
    unique_id: str
):
    """
    Order ticket for a confirmed booking (Non-LCC airlines only).
    
    This endpoint generates tickets for Non-LCC airlines with Public and Private fare types.
    For LCC (Low Cost Carrier) airlines, tickets are automatically issued during the 
    booking process and this step is not required.
    
    Use this endpoint after a successful booking for traditional airlines to:
    - Generate e-tickets for passengers
    - Complete the ticketing process
    - Enable check-in and boarding pass generation
    - Finalize the reservation
    
    Important Notes:
    - Only required for Non-LCC airlines
    - Must be called after successful booking confirmation
    - Cannot be called on already ticketed or cancelled bookings
    - Ticket issuance may take some time to complete
    
    Common Error Scenarios:
    - Booking already ticketed
    - Booking cancelled
    - LCC airline (tickets auto-issued)
    - Invalid booking reference
    """
    try:
        result = await flight_api_service.order_ticket(unique_id=unique_id)
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Failed to order ticket")
            )
        
        ticket_order_result = result["ticket_order_result"]
        
        return {
            "success": True,
            "ticket_order": ticket_order_result,
            "booking_reference": unique_id,
            "ticket_status": ticket_order_result.get("ticket_status", ""),
            "message": ticket_order_result.get("message", ""),
            "next_steps": {
                "description": "Ticket has been ordered successfully",
                "recommendations": [
                    "Check trip details for updated ticket status",
                    "Wait for ticket confirmation email",
                    "Proceed with check-in 24 hours before departure",
                    "Download or print e-tickets for travel"
                ]
            },
            "airline_types": {
                "non_lcc": "Requires manual ticket ordering after booking",
                "lcc": "Tickets issued automatically during booking process"
            },
            "request_metadata": {
                "unique_id": unique_id,
                "target_environment": ticket_order_result.get("target_environment", "")
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ticket order error: {str(e)}"
        )

@router.delete("/cancel/{unique_id}")
async def cancel_booking(
    unique_id: str
):
    """
    Cancel a confirmed booking identified by the unique booking reference.
    
    This endpoint cancels an existing booking and makes the reservation void.
    Cancellation policies and potential penalties depend on the airline's
    fare rules and timing of the cancellation request.
    
    Important Considerations:
    - Cancellation may incur fees based on fare rules
    - Some fares may be non-refundable
    - Cancellation policies vary by airline and fare type
    - Refund processing time varies by payment method
    
    Use this endpoint to:
    - Cancel unwanted bookings
    - Void reservations before ticketing
    - Process customer cancellation requests
    - Handle booking modifications requiring cancellation
    
    Post-Cancellation Process:
    - Booking status changes to "Cancelled"
    - Refund processing initiated (if applicable)
    - Seats released back to airline inventory
    - Notification sent to passenger
    
    Cannot Cancel If:
    - Already cancelled
    - Already flown segments exist
    - Within no-cancellation window
    - Special contract fares restrictions apply
    """
    try:
        result = await flight_api_service.cancel_booking(unique_id=unique_id)
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Failed to cancel booking")
            )
        
        cancellation_result = result["cancellation_result"]
        
        return {
            "success": True,
            "cancellation": cancellation_result,
            "booking_reference": unique_id,
            "booking_status": cancellation_result.get("booking_status", ""),
            "cancellation_confirmed": cancellation_result.get("cancellation_confirmed", False),
            "message": cancellation_result.get("message", ""),
            "next_steps": {
                "description": "Booking has been cancelled successfully",
                "recommendations": [
                    "Check for refund eligibility based on fare rules",
                    "Contact customer service for refund processing",
                    "Save cancellation confirmation for records",
                    "Review cancellation fees if applicable"
                ]
            },
            "important_notes": {
                "refunds": "Refund eligibility depends on fare rules and timing",
                "fees": "Cancellation fees may apply based on airline policy",
                "processing": "Refund processing time varies by payment method",
                "documentation": "Keep cancellation confirmation for future reference"
            },
            "request_metadata": {
                "unique_id": unique_id,
                "target_environment": cancellation_result.get("target_environment", "")
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Cancellation error: {str(e)}"
        )

@router.get("/airports")
async def get_airports():
    """
    Get comprehensive list of airports supported by the flight booking API.
    
    Returns all airports available for flight search and booking, including:
    - IATA airport codes (3-letter codes)
    - Full airport names
    - City locations
    - Country information
    - Formatted display names for UI
    - Searchable text for autocomplete functionality
    
    This endpoint provides reference data for:
    - Flight search origin/destination selection
    - Airport autocomplete features
    - Route planning and validation
    - Location-based filtering
    
    Response includes airports worldwide with standardized formatting
    suitable for dropdown menus, search autocomplete, and validation.
    
    Note: This is reference data that typically changes infrequently.
    Consider caching the response to improve performance.
    """
    try:
        result = await flight_api_service.get_airport_list()
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Failed to get airport list")
            )
        
        airports = result["airports"]
        total_airports = result.get("total_airports", len(airports))
        
        return {
            "success": True,
            "airports": airports,
            "summary": {
                "total_airports": total_airports,
                "countries_covered": len(set(airport["country"] for airport in airports)),
                "data_structure": {
                    "airport_code": "3-letter IATA code",
                    "airport_name": "Full airport name",
                    "city": "Airport city location",
                    "country": "Airport country",
                    "display_name": "Formatted name for UI display",
                    "search_text": "Combined text for search functionality"
                }
            },
            "usage_examples": {
                "search_by_code": "Filter airports by airport_code (e.g., 'DEL', 'BOM')",
                "search_by_city": "Filter airports by city (e.g., 'Delhi', 'Mumbai')", 
                "search_by_country": "Filter airports by country (e.g., 'India', 'USA')",
                "autocomplete": "Use search_text field for autocomplete functionality"
            },
            "popular_formats": {
                "domestic_india": "DEL (Delhi), BOM (Mumbai), BLR (Bangalore)",
                "international": "DXB (Dubai), LHR (London), JFK (New York)",
                "regional": "Regional airports across all continents included"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Airport list error: {str(e)}"
        )

@router.get("/airlines")
async def get_airlines():
    """
    Get comprehensive list of airlines supported by the flight booking API.
    
    Returns all airlines available for flight search and booking, including:
    - IATA airline codes (2-letter codes)
    - Full airline names
    - Airline logo URLs
    - Formatted display names for UI
    - Logo availability indicators
    
    This endpoint provides reference data for:
    - Flight search airline filtering
    - Airline preference selection
    - Branding and logo display
    - Airline-specific search options
    
    Response includes airlines worldwide with logo URLs for visual
    representation in user interfaces.
    
    Logos are provided as GIF format URLs that can be directly
    used in web applications for airline branding.
    
    Note: This is reference data that changes infrequently.
    Consider caching the response to improve performance.
    """
    try:
        result = await flight_api_service.get_airline_list()
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Failed to get airline list")
            )
        
        airlines = result["airlines"]
        total_airlines = result.get("total_airlines", len(airlines))
        airlines_with_logos = sum(1 for airline in airlines if airline.get("has_logo", False))
        
        return {
            "success": True,
            "airlines": airlines,
            "summary": {
                "total_airlines": total_airlines,
                "airlines_with_logos": airlines_with_logos,
                "logo_coverage": f"{(airlines_with_logos / total_airlines * 100):.1f}%" if total_airlines > 0 else "0%",
                "data_structure": {
                    "airline_code": "2-letter IATA code",
                    "airline_name": "Full airline name",
                    "logo_url": "Direct URL to airline logo (GIF format)",
                    "display_name": "Formatted name for UI display",
                    "search_text": "Combined text for search functionality",
                    "has_logo": "Boolean indicating logo availability"
                }
            },
            "usage_examples": {
                "search_by_code": "Filter airlines by airline_code (e.g., '6E', 'AI')",
                "search_by_name": "Filter airlines by airline_name (e.g., 'IndiGo', 'Air India')",
                "logo_display": "Use logo_url for airline branding in UI",
                "preference_filter": "Allow users to select preferred airlines"
            },
            "logo_information": {
                "format": "GIF format images",
                "usage": "Direct URL embedding in web applications",
                "fallback": "Use airline_name when has_logo is false",
                "caching": "Logos can be cached for better performance"
            },
            "popular_airlines": {
                "india_domestic": "6E (IndiGo), AI (Air India), UK (Vistara)",
                "international": "EK (Emirates), QR (Qatar Airways), LH (Lufthansa)",
                "low_cost": "Multiple LCC carriers included with instant ticketing"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Airline list error: {str(e)}"
        )

@router.get("/", response_model=List[FlightResponse])
async def get_all_flights(limit: Optional[int] = Query(50)):
    flights = await db_service.get_flights(limit=limit)
    return flights

@router.get("/{flight_id}", response_model=FlightResponse)
async def get_flight(flight_id: str):
    flight = await db_service.get_flight(flight_id)
    if not flight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flight not found"
        )
    return flight

@router.post("/", response_model=dict)
async def create_flight(
    flight_data: FlightCreate,
    current_user = Depends(require_admin)
):
    try:
        flight_id = await db_service.create_flight(flight_data.dict())
        flight = await db_service.get_flight(flight_id)
        return {"message": "Flight created successfully", "flight": flight}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create flight: {str(e)}"
        )

@router.put("/{flight_id}", response_model=dict)
async def update_flight(
    flight_id: str,
    flight_data: FlightUpdate,
    current_user = Depends(require_admin)
):
    existing_flight = await db_service.get_flight(flight_id)
    if not existing_flight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flight not found"
        )
    
    try:
        update_data = {k: v for k, v in flight_data.dict().items() if v is not None}
        updated_flight = await db_service.update_flight(flight_id, update_data)
        return {"message": "Flight updated successfully", "flight": updated_flight}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update flight: {str(e)}"
        )

@router.delete("/{flight_id}", response_model=dict)
async def delete_flight(
    flight_id: str,
    current_user = Depends(require_admin)
):
    existing_flight = await db_service.get_flight(flight_id)
    if not existing_flight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flight not found"
        )
    
    try:
        await db_service.delete_flight(flight_id)
        return {"message": "Flight deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to delete flight: {str(e)}"
        )