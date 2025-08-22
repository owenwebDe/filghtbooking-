from fastapi import APIRouter, HTTPException, status, Depends, Query, Body
from typing import List, Optional, Dict, Any
from ..models import HotelCreate, HotelUpdate, HotelResponse, HotelSearch
from ..auth import get_current_user, require_admin
from ..mongodb_database import db_service
from ..services.hotel_api import hotel_api_service

router = APIRouter(prefix="/hotels", tags=["hotels"])

@router.get("/search")
async def search_hotels(
    check_in_date: str = Query(..., description="Check-in date (YYYY-MM-DD)"),
    check_out_date: str = Query(..., description="Check-out date (YYYY-MM-DD)"),
    adults: int = Query(1, description="Number of adults"),
    children: int = Query(0, description="Number of children"),
    nationality: str = Query("IN", description="Guest nationality (ISO country code)"),
    currency: str = Query("USD", description="Preferred currency code"),
    language: str = Query("en", description="Language preference"),
    city_name: Optional[str] = Query(None, description="City name for search"),
    country_name: Optional[str] = Query(None, description="Country name for search"),
    latitude: Optional[float] = Query(None, description="Latitude for geo-location search"),
    longitude: Optional[float] = Query(None, description="Longitude for geo-location search"),
    hotel_codes: Optional[str] = Query(None, description="Comma-separated hotel codes"),
    radius: int = Query(20, description="Search radius in KM"),
    max_result: int = Query(25, description="Maximum number of results"),
    results_per_page: Optional[int] = Query(None, description="Results per page for pagination"),
    child_ages: Optional[str] = Query(None, description="Comma-separated child ages (if children > 0)")
):
    """
    Search for hotel availability using TravelNext Hotel API v6
    
    Supports multiple search methods:
    - City-wise search: Provide city_name and country_name
    - Geo-location search: Provide latitude and longitude
    - Hotel-specific search: Provide hotel_codes
    """
    try:
        # Parse child ages if provided
        parsed_child_ages = []
        if child_ages and children > 0:
            try:
                parsed_child_ages = [int(age.strip()) for age in child_ages.split(",")]
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid child_ages format. Use comma-separated integers."
                )
        elif children > 0:
            # Default child ages if not provided
            parsed_child_ages = [5] * children
        
        # Build room configuration
        rooms = [
            {
                "adults": adults,
                "children": children,
                "child_ages": parsed_child_ages
            }
        ]
        
        # Parse hotel codes if provided
        parsed_hotel_codes = None
        if hotel_codes:
            parsed_hotel_codes = [code.strip() for code in hotel_codes.split(",")]
        
        # Validate search parameters
        search_methods = sum([
            bool(city_name and country_name),
            bool(latitude is not None and longitude is not None),
            bool(parsed_hotel_codes)
        ])
        
        if search_methods == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one search method required: city_name+country_name, latitude+longitude, or hotel_codes"
            )
        
        result = await hotel_api_service.search_hotels(
            check_in_date=check_in_date,
            check_out_date=check_out_date,
            rooms=rooms,
            nationality=nationality,
            currency=currency,
            language=language,
            city_name=city_name,
            country_name=country_name,
            latitude=latitude,
            longitude=longitude,
            hotel_codes=parsed_hotel_codes,
            radius=radius,
            max_result=max_result,
            results_per_page=results_per_page
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Hotel search failed")
            )
        
        return {
            "success": True,
            "hotels": result["hotels"],
            "search_metadata": result.get("search_metadata", {}),
            "total_results": len(result["hotels"]),
            "search_parameters": {
                "check_in": check_in_date,
                "check_out": check_out_date,
                "guests": {
                    "adults": adults,
                    "children": children,
                    "child_ages": parsed_child_ages,
                    "total_rooms": 1
                },
                "search_criteria": {
                    "city_name": city_name,
                    "country_name": country_name,
                    "latitude": latitude,
                    "longitude": longitude,
                    "hotel_codes": parsed_hotel_codes,
                    "radius": radius
                },
                "preferences": {
                    "nationality": nationality,
                    "currency": currency,
                    "language": language,
                    "max_result": max_result,
                    "results_per_page": results_per_page
                }
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Hotel search error: {str(e)}"
        )

@router.get("/more-results")
async def get_more_hotel_results(
    session_id: str = Query(..., description="Session ID from previous hotel search"),
    next_token: str = Query(..., description="Next token from previous search response"),
    max_result: int = Query(20, description="Maximum number of additional results")
):
    """
    Get more hotel search results using session ID and next token
    
    Use this endpoint when the initial search response indicates moreResults = true.
    This allows pagination through large result sets and retrieval of additional
    hotels that may have timed out in the initial search.
    """
    try:
        result = await hotel_api_service.get_more_hotel_results(
            session_id=session_id,
            next_token=next_token,
            max_result=max_result
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Failed to get more hotel results")
            )
        
        return {
            "success": True,
            "hotels": result["hotels"],
            "search_metadata": result.get("search_metadata", {}),
            "total_results": len(result["hotels"]),
            "pagination_info": {
                "session_id": session_id,
                "current_token": next_token,
                "next_token": result.get("search_metadata", {}).get("next_token"),
                "more_results_available": result.get("search_metadata", {}).get("more_results", False),
                "max_result": max_result
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"More hotel results error: {str(e)}"
        )

@router.get("/more-results-pagination")
async def get_more_hotel_results_pagination(
    session_id: str = Query(..., description="Session ID from previous hotel search"),
    next_token: str = Query(..., description="Next token from previous search response")
):
    """
    Get more hotel search results using pagination without maxResult limitation
    
    This endpoint retrieves the next page of hotel results using only session ID
    and next token. Unlike the regular more-results endpoint, this doesn't limit
    the number of results returned per page - it returns the full next page as
    determined by the API's internal pagination logic.
    
    Use this when you want to retrieve all available results for the next page
    without specifying a specific result count limit.
    """
    try:
        result = await hotel_api_service.get_more_hotel_results_pagination(
            session_id=session_id,
            next_token=next_token
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Failed to get more hotel results (pagination)")
            )
        
        return {
            "success": True,
            "hotels": result["hotels"],
            "search_metadata": result.get("search_metadata", {}),
            "total_results": len(result["hotels"]),
            "pagination_info": {
                "session_id": session_id,
                "current_token": next_token,
                "next_token": result.get("search_metadata", {}).get("next_token"),
                "more_results_available": result.get("search_metadata", {}).get("more_results", False),
                "pagination_type": "full_page",
                "note": "Returns full page without result count limitation"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Hotel pagination error: {str(e)}"
        )

@router.get("/filter")
async def filter_hotel_results(
    session_id: str = Query(..., description="Session ID from previous hotel search"),
    max_result: int = Query(20, description="Maximum number of filtered results"),
    price_min: Optional[float] = Query(None, description="Minimum price filter"),
    price_max: Optional[float] = Query(None, description="Maximum price filter"),
    rating: Optional[str] = Query(None, description="Hotel ratings (0-5), comma-separated (e.g. '3,4,5')"),
    tripadvisor_rating: Optional[str] = Query(None, description="TripAdvisor ratings, comma-separated (e.g. '3.5,4,4.5,5')"),
    hotel_name: Optional[str] = Query(None, description="Filter by hotel name (partial match)"),
    fare_type: Optional[str] = Query(None, description="Filter by fare type (Refundable/Non-Refundable)"),
    property_type: Optional[str] = Query(None, description="Filter by property type (HOTELS,RESORTS,APARTMENTS)"),
    facility: Optional[str] = Query(None, description="Filter by facilities, comma-separated"),
    sorting: Optional[str] = Query(None, description="Sort results: price-low-high, price-high-low, rating-low-high, rating-high-low, alpha-A-Z, alpha-Z-A, distance-low-high, distance-high-low"),
    locality: Optional[str] = Query(None, description="Filter by locality/region, comma-separated")
):
    """
    Filter hotel search results based on various criteria
    
    Apply filters to previously searched hotel results to narrow down options
    based on price range, ratings, property type, facilities, and other criteria.
    
    Filter Options:
    - Price Range: Set minimum and maximum price limits
    - Hotel Rating: Filter by star ratings (0-5)
    - TripAdvisor Rating: Filter by TripAdvisor scores (0-5, supports decimals)
    - Property Type: HOTELS, RESORTS, APARTMENTS
    - Facilities: Wi-Fi, Pool, Gym, Restaurant, etc.
    - Fare Type: Refundable vs Non-Refundable
    - Locality: Specific areas/regions within the destination
    - Hotel Name: Search by partial hotel name
    - Sorting: Multiple sort options for price, rating, distance, alphabetical
    """
    try:
        result = await hotel_api_service.filter_hotel_results(
            session_id=session_id,
            max_result=max_result,
            price_min=price_min,
            price_max=price_max,
            rating=rating,
            tripadvisor_rating=tripadvisor_rating,
            hotel_name=hotel_name,
            fare_type=fare_type,
            property_type=property_type,
            facility=facility,
            sorting=sorting,
            locality=locality
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Failed to filter hotel results")
            )
        
        return {
            "success": True,
            "hotels": result["hotels"],
            "filter_metadata": result.get("filter_metadata", {}),
            "total_filtered_results": len(result["hotels"]),
            "applied_filters": {
                "price_range": {
                    "min": price_min,
                    "max": price_max
                } if price_min is not None or price_max is not None else None,
                "rating": rating,
                "tripadvisor_rating": tripadvisor_rating,
                "hotel_name": hotel_name,
                "fare_type": fare_type,
                "property_type": property_type,
                "facilities": facility.split(",") if facility else None,
                "localities": locality.split(",") if locality else None,
                "sorting": sorting
            },
            "filter_options": {
                "available_sorts": [
                    "price-low-high", "price-high-low",
                    "rating-low-high", "rating-high-low", 
                    "alpha-A-Z", "alpha-Z-A",
                    "distance-low-high", "distance-high-low"
                ],
                "rating_values": "0,1,2,3,4,5",
                "tripadvisor_rating_values": "0,1,1.5,2,2.5,3,3.5,4,4.5,5",
                "fare_types": ["Refundable", "Non-Refundable"],
                "property_types": ["HOTELS", "RESORTS", "APARTMENTS"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Hotel filter error: {str(e)}"
        )

@router.get("/more-filter-results")
async def get_more_filter_results(
    session_id: str = Query(..., description="Session ID from previous hotel search"),
    next_token: str = Query(..., description="Next token from previous filter response"),
    filter_key: str = Query(..., description="Filter key from previous filter response")
):
    """
    Get more hotel filter results using session ID, next token, and filter key
    
    Use this endpoint when the filter response indicates moreResults = true.
    This allows pagination through large filtered result sets while maintaining
    the same filter criteria that were applied in the original filter request.
    
    The filter_key ensures that the same filters (price, rating, facilities, etc.)
    are maintained across paginated requests.
    """
    try:
        result = await hotel_api_service.get_more_filter_results(
            session_id=session_id,
            next_token=next_token,
            filter_key=filter_key
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Failed to get more filter results")
            )
        
        return {
            "success": True,
            "hotels": result["hotels"],
            "filter_metadata": result.get("filter_metadata", {}),
            "total_results": len(result["hotels"]),
            "pagination_info": {
                "session_id": session_id,
                "current_token": next_token,
                "filter_key": filter_key,
                "next_token": result.get("filter_metadata", {}).get("next_token"),
                "more_results_available": result.get("filter_metadata", {}).get("more_results", False),
                "pagination_type": "filtered_results",
                "note": "Maintains same filter criteria from original filter request"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"More filter results error: {str(e)}"
        )

@router.get("/more-filter-results-pagination")
async def get_more_filter_results_pagination(
    session_id: str = Query(..., description="Session ID from previous hotel search"),
    next_token: str = Query(..., description="Next token from previous filter response"),
    filter_key: str = Query(..., description="Filter key from previous filter response")
):
    """
    Get more hotel filter results using pagination without result count limitation
    
    This endpoint retrieves the next page of filtered hotel results using session ID,
    next token, and filter key. Unlike the regular more-filter-results endpoint,
    this doesn't limit the number of results returned per page - it returns the
    full next page as determined by the API's internal pagination logic.
    
    The filter_key ensures that the same filter criteria (price, rating, facilities,
    etc.) are maintained across all paginated requests, providing consistent
    filtered results throughout the pagination flow.
    
    Use this when you want to retrieve all available filtered results for the
    next page without specifying a specific result count limit.
    """
    try:
        result = await hotel_api_service.get_more_filter_results_pagination(
            session_id=session_id,
            next_token=next_token,
            filter_key=filter_key
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Failed to get more filter results (pagination)")
            )
        
        return {
            "success": True,
            "hotels": result["hotels"],
            "filter_metadata": result.get("filter_metadata", {}),
            "total_results": len(result["hotels"]),
            "pagination_info": {
                "session_id": session_id,
                "current_token": next_token,
                "filter_key": filter_key,
                "next_token": result.get("filter_metadata", {}).get("next_token"),
                "more_results_available": result.get("filter_metadata", {}).get("more_results", False),
                "pagination_type": "filtered_full_page",
                "note": "Returns full page of filtered results without count limitation"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Filter pagination error: {str(e)}"
        )

@router.get("/details")
async def get_hotel_details(
    session_id: str = Query(..., description="Session ID from hotel search"),
    hotel_id: str = Query(..., description="Hotel ID from search results"),
    product_id: str = Query(..., description="Product ID from search results"),
    token_id: str = Query(..., description="Token ID from search results")
):
    """
    Get detailed hotel content including description, images, and facilities
    
    Retrieves comprehensive hotel information including:
    - Full hotel description and overview
    - Complete image gallery with captions
    - Detailed facilities list with categorization
    - Location and contact information
    - Rating and review information
    
    This endpoint provides rich content for hotel detail pages, allowing
    users to view extensive information before making booking decisions.
    
    Required parameters come from the hotel search results and ensure
    the content is retrieved from the correct supplier and context.
    """
    try:
        result = await hotel_api_service.get_hotel_details(
            session_id=session_id,
            hotel_id=hotel_id,
            product_id=product_id,
            token_id=token_id
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Failed to get hotel details")
            )
        
        hotel_details = result["hotel_details"]
        
        return {
            "success": True,
            "hotel_details": hotel_details,
            "content_summary": {
                "has_description": hotel_details["description"]["has_description"],
                "description_length": len(hotel_details["description"]["content"]),
                "total_images": hotel_details["images"]["image_count"],
                "total_facilities": hotel_details["amenities_info"]["total_amenities"],
                "facility_categories": list(hotel_details["amenities_info"]["categories"].keys()),
                "image_categories": hotel_details["images"]["image_categories"]
            },
            "request_metadata": {
                "session_id": session_id,
                "hotel_id": hotel_id,
                "product_id": product_id,
                "token_id": token_id
            },
            "usage_guide": {
                "description": "Use for hotel detail pages and booking confirmation",
                "images": "Display in gallery format with captions",
                "facilities": "Group by categories for better UX",
                "coordinates": "Use for map integration and location display"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Hotel details error: {str(e)}"
        )

@router.get("/room-rates")
async def get_room_rates(
    hotel_code: str = Query(..., description="Hotel identifier code"),
    session_id: str = Query(..., description="Search session ID"),
    check_in_date: str = Query(..., description="Check-in date (YYYY-MM-DD)"),
    check_out_date: str = Query(..., description="Check-out date (YYYY-MM-DD)"),
    adults: int = Query(1, description="Number of adults"),
    children: int = Query(0, description="Number of children")
):
    """
    Get detailed room rates for a specific hotel
    """
    try:
        rooms = [
            {
                "adults": adults,
                "children": children
            }
        ]
        
        result = await hotel_api_service.get_room_rates(
            hotel_code=hotel_code,
            session_id=session_id,
            check_in_date=check_in_date,
            check_out_date=check_out_date,
            rooms=rooms
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Failed to get room rates")
            )
        
        return {
            "success": True,
            "room_rates": result["room_rates"],
            "hotel_info": result.get("hotel_info", {}),
            "pricing_summary": result.get("pricing_summary", {}),
            "request_metadata": {
                "hotel_code": hotel_code,
                "session_id": session_id,
                "check_in": check_in_date,
                "check_out": check_out_date,
                "guests": {
                    "adults": adults,
                    "children": children
                }
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Room rates error: {str(e)}"
        )

@router.post("/book")
async def book_hotel(
    booking_data: Dict[str, Any] = Body(..., description="Hotel booking request data")
):
    """
    Book a hotel reservation using TravelNext Hotel API v6
    
    Request body should contain:
    - sessionId: Session ID from hotel search
    - productId: Product ID from search results  
    - tokenId: Token ID from search results
    - rateBasisId: Rate basis ID from check rate rules API
    - clientRef: Client-generated booking reference
    - customerEmail: Customer email address
    - customerPhone: Customer phone number
    - bookingNote: Booking note or remarks
    - paxDetails: Array of passenger details for each room
    
    Example request:
    {
        "sessionId": "TVRVNE1qSTJOelEzTVY4ME5UZGZNVEkxTGprNUxqSTBNUzR5TkE9PV8w",
        "productId": "trx101",
        "tokenId": "HTB0zd1QyPEeR3oIpmVn",
        "rateBasisId": "MTU3",
        "clientRef": "TDB85454",
        "customerEmail": "test@gmail.com",
        "customerPhone": "53453454334",
        "bookingNote": "Remark",
        "paxDetails": [
            {
                "room_no": 1,
                "adult": {
                    "title": ["Mr", "Mr"],
                    "firstName": ["John", "Jane"],
                    "lastName": ["Doe", "Doe"]
                }
            }
        ]
    }
    """
    try:
        # Validate required booking fields
        required_fields = [
            "sessionId", "productId", "tokenId", "rateBasisId", 
            "clientRef", "customerEmail", "customerPhone", "bookingNote", "paxDetails"
        ]
        missing_fields = [field for field in required_fields if field not in booking_data]
        
        if missing_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required fields: {', '.join(missing_fields)}"
            )
        
        # Validate paxDetails structure
        pax_details = booking_data.get("paxDetails", [])
        if not isinstance(pax_details, list) or len(pax_details) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="paxDetails must be a non-empty array"
            )
        
        # Validate each room's passenger details
        for i, room in enumerate(pax_details):
            if "room_no" not in room:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Missing room_no in paxDetails[{i}]"
                )
            
            if "adult" not in room:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Missing adult details in paxDetails[{i}]"
                )
            
            adult = room["adult"]
            required_adult_fields = ["title", "firstName", "lastName"]
            for field in required_adult_fields:
                if field not in adult or not isinstance(adult[field], list):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Missing or invalid {field} in paxDetails[{i}].adult"
                    )
        
        result = await hotel_api_service.book_hotel(
            session_id=booking_data["sessionId"],
            product_id=booking_data["productId"],
            token_id=booking_data["tokenId"],
            rate_basis_id=booking_data["rateBasisId"],
            client_ref=booking_data["clientRef"],
            customer_email=booking_data["customerEmail"],
            customer_phone=booking_data["customerPhone"],
            booking_note=booking_data["bookingNote"],
            pax_details=pax_details
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Hotel booking failed")
            )
        
        booking_result = result["booking_result"]
        
        return {
            "success": True,
            "booking_confirmed": booking_result.get("is_confirmed", False),
            "booking_status": booking_result.get("booking_status", ""),
            "confirmation_details": booking_result.get("confirmation_details", {}),
            "hotel_booking_details": booking_result.get("hotel_booking_details", {}),
            "rooms": booking_result.get("rooms", []),
            "pricing": booking_result.get("pricing", {}),
            "display": booking_result.get("display", {}),
            "next_steps": {
                "description": "Hotel booking processed",
                "recommendations": [
                    "Save booking confirmation number for check-in",
                    "Review cancellation policy and terms",
                    "Contact hotel directly for special requests",
                    "Check-in typically available after 3 PM"
                ]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Hotel booking error: {str(e)}"
        )

@router.get("/booking-details")
async def get_booking_details(
    supplier_confirmation_num: str = Query(..., description="Supplier confirmation number from booking response"),
    reference_num: str = Query(..., description="Reference number from booking response")
):
    """
    Get complete hotel booking details using confirmation and reference numbers
    
    Retrieves comprehensive booking information including:
    - Current booking status and timestamps
    - Complete hotel and room details
    - Guest information and contact details
    - Pricing and payment information
    - Cancellation policy and terms
    
    This endpoint allows you to check the latest status of a booking
    and retrieve all associated details using the confirmation numbers
    provided during the initial booking process.
    
    Required parameters come from the booking response and uniquely
    identify the reservation in the supplier's system.
    """
    try:
        result = await hotel_api_service.get_booking_details(
            supplier_confirmation_num=supplier_confirmation_num,
            reference_num=reference_num
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Failed to get booking details")
            )
        
        booking_details = result["booking_details"]
        
        return {
            "success": True,
            "booking_details": booking_details,
            "booking_summary": {
                "status": booking_details["booking_status"],
                "is_confirmed": booking_details["booking_status"].upper() == "CONFIRMED",
                "supplier_confirmation": booking_details["supplier_confirmation_number"],
                "reference_number": booking_details["reference_number"],
                "has_hotel_details": "hotel_details" in booking_details,
                "total_rooms": len(booking_details.get("rooms", [])),
                "total_amount": booking_details.get("pricing", {}).get("total_amount", 0)
            },
            "request_metadata": {
                "supplier_confirmation_num": supplier_confirmation_num,
                "reference_num": reference_num
            },
            "usage_guide": {
                "status_tracking": "Monitor booking status changes",
                "customer_service": "Use for customer inquiries and support",
                "modifications": "Check current details before making changes",
                "documentation": "Use for travel documentation and vouchers"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Booking details error: {str(e)}"
        )

@router.post("/cancel")
async def cancel_hotel_booking(
    cancellation_data: Dict[str, Any] = Body(..., description="Hotel cancellation request data")
):
    """
    Cancel a hotel booking using TravelNext Hotel API v6
    
    Request body should contain:
    - supplierConfirmationNum: Supplier confirmation number from booking response
    - referenceNum: Reference number from booking response
    
    Example request:
    {
        "supplierConfirmationNum": "HTL-ATE-205850",
        "referenceNum": "212"
    }
    
    This API allows you to cancel an existing booking. For multi-room bookings,
    you can cancel each room separately or cancel the entire booking altogether.
    The response includes cancellation status and refund details from the supplier.
    """
    try:
        # Validate required cancellation fields
        required_fields = ["supplierConfirmationNum", "referenceNum"]
        missing_fields = [field for field in required_fields if field not in cancellation_data]
        
        if missing_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required fields: {', '.join(missing_fields)}"
            )
        
        result = await hotel_api_service.cancel_hotel_booking(
            supplier_confirmation_num=cancellation_data["supplierConfirmationNum"],
            reference_num=cancellation_data["referenceNum"]
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Failed to cancel hotel booking")
            )
        
        cancellation_result = result["cancellation_result"]
        
        return {
            "success": True,
            "cancellation_confirmed": cancellation_result.get("is_cancelled", False),
            "cancellation_status": cancellation_result.get("cancellation_status", ""),
            "cancel_reference_number": cancellation_result.get("cancel_reference_number", ""),
            "cancellation_message": cancellation_result.get("cancellation_message", ""),
            "refund_details": cancellation_result.get("refund_details", {}),
            "display": cancellation_result.get("display", {}),
            "next_steps": {
                "description": "Hotel booking cancellation processed",
                "recommendations": [
                    "Save cancellation reference number for records",
                    "Check refund timeline and processing method",
                    "Contact customer service if refund is delayed",
                    "Review cancellation policy for future bookings"
                ]
            },
            "request_metadata": {
                "supplier_confirmation_num": cancellation_data["supplierConfirmationNum"],
                "reference_num": cancellation_data["referenceNum"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Hotel cancellation error: {str(e)}"
        )

@router.get("/static-content")
async def get_static_content(
    from_range: int = Query(1, description="Starting range of list (pagination)", alias="from"),
    to_range: int = Query(100, description="Ending range of list (pagination)", alias="to"),
    city_name: Optional[str] = Query(None, description="City name for filtering"),
    country_name: Optional[str] = Query(None, description="Country name for filtering")
):
    """
    Get static content of hotels in the given city using TravelNext Hotel API v6
    
    Returns comprehensive static hotel information including:
    - Hotel basic information (name, type, rating)
    - Complete location details (city, state, country, address)
    - Contact information (email, phone)
    - Coordinate data for mapping
    - Full description content
    - Complete image galleries
    - Pagination support for large datasets
    
    This endpoint provides reference hotel data that can be used for:
    - Building hotel databases and directories
    - Pre-populating hotel information for searches
    - Creating hotel comparison tools
    - Displaying comprehensive hotel catalogs
    
    Use pagination parameters to handle large datasets efficiently.
    Optional city and country filters help narrow down results.
    """
    try:
        # Validate pagination parameters
        if from_range < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="'from' parameter must be greater than 0"
            )
        
        if to_range <= from_range:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="'to' parameter must be greater than 'from' parameter"
            )
        
        # Limit maximum range to prevent excessive API calls
        max_range = 1000
        if (to_range - from_range) > max_range:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Maximum range allowed is {max_range} records per request"
            )
        
        result = await hotel_api_service.get_static_content(
            from_range=from_range,
            to_range=to_range,
            city_name=city_name,
            country_name=country_name
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Failed to get hotel static content")
            )
        
        pagination = result.get("pagination", {})
        hotels = result["hotels"]
        
        return {
            "success": True,
            "hotels": hotels,
            "pagination": pagination,
            "content_summary": {
                "total_hotels": pagination.get("total", 0),
                "current_range": f"{pagination.get('from', 1)}-{pagination.get('to', 0)}",
                "hotels_returned": len(hotels),
                "has_more_pages": pagination.get("has_more", False),
                "hotels_with_images": sum(1 for hotel in hotels if hotel.get("media", {}).get("has_images", False)),
                "hotels_with_descriptions": sum(1 for hotel in hotels if hotel.get("description", {}).get("has_description", False)),
                "unique_cities": len(set(hotel.get("location", {}).get("city", "") for hotel in hotels)),
                "unique_countries": len(set(hotel.get("location", {}).get("country", "") for hotel in hotels))
            },
            "filters_applied": {
                "city_name": city_name,
                "country_name": country_name,
                "has_filters": bool(city_name or country_name)
            },
            "usage_guide": {
                "pagination": "Use 'from' and 'to' parameters for efficient data loading",
                "filtering": "Apply city_name and country_name filters to narrow results",
                "images": "Use 'media.images' array for hotel photo galleries",
                "mapping": "Use 'coordinates' for map integration",
                "descriptions": "Use 'description.content' for detailed hotel information"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Static content error: {str(e)}"
        )

@router.get("/cities")
async def get_cities():
    """
    Get list of supported cities for hotel search
    """
    try:
        result = await hotel_api_service.get_cities()
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Failed to get cities list")
            )
        
        return {
            "success": True,
            "cities": result["cities"],
            "total_cities": result.get("total_cities", len(result["cities"]))
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Cities list error: {str(e)}"
        )

@router.get("/", response_model=List[HotelResponse])
async def get_all_hotels(limit: Optional[int] = Query(50)):
    hotels = await db_service.get_hotels(limit=limit)
    return hotels

@router.get("/{hotel_id}", response_model=HotelResponse)
async def get_hotel(hotel_id: str):
    hotel = await db_service.get_hotel(hotel_id)
    if not hotel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hotel not found"
        )
    return hotel

@router.post("/", response_model=dict)
async def create_hotel(
    hotel_data: HotelCreate,
    current_user = Depends(require_admin)
):
    try:
        hotel_id = await db_service.create_hotel(hotel_data.dict())
        hotel = await db_service.get_hotel(hotel_id)
        return {"message": "Hotel created successfully", "hotel": hotel}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create hotel: {str(e)}"
        )

@router.put("/{hotel_id}", response_model=dict)
async def update_hotel(
    hotel_id: str,
    hotel_data: HotelUpdate,
    current_user = Depends(require_admin)
):
    existing_hotel = await db_service.get_hotel(hotel_id)
    if not existing_hotel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hotel not found"
        )
    
    try:
        update_data = {k: v for k, v in hotel_data.dict().items() if v is not None}
        updated_hotel = await db_service.update_hotel(hotel_id, update_data)
        return {"message": "Hotel updated successfully", "hotel": updated_hotel}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update hotel: {str(e)}"
        )

@router.delete("/{hotel_id}", response_model=dict)
async def delete_hotel(
    hotel_id: str,
    current_user = Depends(require_admin)
):
    existing_hotel = await db_service.get_hotel(hotel_id)
    if not existing_hotel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hotel not found"
        )
    
    try:
        await db_service.delete_hotel(hotel_id)
        return {"message": "Hotel deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to delete hotel: {str(e)}"
        )