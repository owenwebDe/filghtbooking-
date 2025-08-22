import httpx
import logging
from typing import Dict, Any, List, Optional
from ..config import settings

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class HotelAPIService:
    """
    Service class for TravelNext Hotel API integration
    
    Provides comprehensive hotel booking functionality including:
    - Hotel availability search
    - Room rates and pricing
    - Hotel booking and cancellation
    - Static content and filters
    """
    
    def __init__(self):
        self.base_url = "https://travelnext.works/api/hotel-api-v6"
        self.user_id = settings.FLIGHT_API_USER_ID
        self.user_password = settings.FLIGHT_API_PASSWORD
        self.access = settings.FLIGHT_API_ACCESS
        self.ip_address = settings.FLIGHT_API_IP_ADDRESS
        self.headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
    
    async def search_hotels(
        self,
        destination_code: str = None,
        check_in_date: str = None,
        check_out_date: str = None,
        rooms: List[Dict[str, Any]] = None,
        nationality: str = "IN",
        currency: str = "USD",
        language: str = "en",
        city_name: str = None,
        country_name: str = None,
        latitude: float = None,
        longitude: float = None,
        hotel_codes: List[str] = None,
        radius: int = 20,
        max_result: int = 25,
        results_per_page: int = None
    ) -> Dict[str, Any]:
        """
        Search for hotel availability using TravelNext Hotel API v6
        
        Args:
            destination_code: Destination city/area code (optional if using other search methods)
            check_in_date: Check-in date (YYYY-MM-DD)
            check_out_date: Check-out date (YYYY-MM-DD)
            rooms: List of room configurations with adults/children
            nationality: Guest nationality (ISO country code)
            currency: Preferred currency code (INR, USD, etc.)
            language: Language preference
            city_name: Name of city for city-wise search
            country_name: Name of country for city-wise search
            latitude: Latitude for geo-location search
            longitude: Longitude for geo-location search
            hotel_codes: Array of hotel codes for hotel-specific search
            radius: Radius from center in KM
            max_result: Maximum number of results required
            results_per_page: Results per page for pagination
            
        Returns:
            Dict containing hotel search results
        """
        try:
            # Build occupancy array from rooms parameter
            occupancy = []
            if rooms:
                for idx, room in enumerate(rooms):
                    room_occupancy = {
                        "room_no": idx + 1,
                        "adult": room.get("adults", 1),
                        "child": room.get("children", 0),
                        "child_age": room.get("child_ages", [0] if room.get("children", 0) > 0 else [])
                    }
                    occupancy.append(room_occupancy)
            else:
                # Default to 1 room with 1 adult
                occupancy = [
                    {
                        "room_no": 1,
                        "adult": 1,
                        "child": 0,
                        "child_age": [0]
                    }
                ]
            
            # Build the request payload according to API specification
            payload = {
                "user_id": self.user_id,
                "user_password": self.user_password,
                "access": self.access,
                "ip_address": self.ip_address,
                "requiredCurrency": currency,
                "nationality": nationality,
                "checkin": check_in_date,
                "checkout": check_out_date,
                "maxResult": max_result,
                "radius": radius,
                "occupancy": occupancy
            }
            
            # Add optional parameters
            if results_per_page:
                payload["resultsPerPage"] = results_per_page
            if language:
                payload["requiredLanguage"] = language
            if city_name:
                payload["city_name"] = city_name
            if country_name:
                payload["country_name"] = country_name
            if latitude is not None:
                payload["latitude"] = latitude
            if longitude is not None:
                payload["longitude"] = longitude
            if hotel_codes:
                payload["hotelCodes"] = hotel_codes[:1000]  # Maximum 1000 hotel codes
            
            logger.info(f"Searching hotels with payload: {payload}")
            
            # Make the API call
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.base_url}/hotel_search",
                    json=payload,
                    headers=self.headers
                )
                
                logger.info(f"Hotel search API response status: {response.status_code}")
                logger.info(f"Hotel search API response: {response.text}")
                
                if response.status_code != 200:
                    return {
                        "success": False,
                        "error": f"API request failed with status {response.status_code}",
                        "hotels": []
                    }
                
                api_response = response.json()
                return self._process_hotel_search_response(api_response)
                
        except httpx.TimeoutException:
            logger.error("Hotel search API timeout")
            return {
                "success": False,
                "error": "Request timeout",
                "hotels": []
            }
        except Exception as e:
            logger.error(f"Hotel search API error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "hotels": []
            }
    
    def _process_hotel_search_response(self, api_response: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process and normalize the hotel search API response
        """
        try:
            # Check for error response
            if "Errors" in api_response:
                error_info = api_response["Errors"]
                return {
                    "success": False,
                    "error": f"API Error: {error_info.get('ErrorMessage', 'Unknown error')}",
                    "error_code": error_info.get("ErrorCode", "UNKNOWN"),
                    "hotels": []
                }
            
            # Extract status information
            status = api_response.get("status", {})
            session_id = status.get("sessionId", "")
            more_results = status.get("moreResults", False)
            next_token = status.get("nextToken", "")
            total_results = status.get("totalResults", 0)
            
            # Check for "No Results found" error
            if status.get("error") == "No Results found, Please try with different date":
                logger.info("No hotels found in API for current search parameters")
                return {
                    "success": False,
                    "error": "No hotels found for the selected dates and location. Please try different dates or destinations.",
                    "hotels": []
                }
            
            # Extract hotel itineraries
            itineraries = api_response.get("itineraries", [])
            
            # Process and normalize hotel data
            normalized_hotels = []
            for hotel_data in itineraries:
                normalized_hotel = self._normalize_hotel_data(hotel_data)
                normalized_hotels.append(normalized_hotel)
            
            return {
                "success": True,
                "hotels": normalized_hotels,
                "search_metadata": {
                    "session_id": session_id,
                    "more_results": more_results,
                    "next_token": next_token,
                    "total_results": total_results,
                    "current_results": len(normalized_hotels),
                    "paginator": api_response.get("paginator", "")
                }
            }
            
        except Exception as e:
            logger.error(f"Error processing hotel search response: {str(e)}")
            return {
                "success": False,
                "error": f"Response processing error: {str(e)}",
                "hotels": []
            }
    
    def _normalize_hotel_data(self, hotel_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize individual hotel data from API response
        """
        try:
            # Extract and normalize hotel information
            normalized_hotel = {
                "hotel_id": hotel_data.get("hotelId", ""),
                "twx_hotel_id": hotel_data.get("twxHotelId", ""),
                "product_id": hotel_data.get("productId", ""),
                "token_id": hotel_data.get("tokenId", ""),
                "hotel_name": hotel_data.get("hotelName", ""),
                "address": hotel_data.get("address", ""),
                "city": hotel_data.get("city", ""),
                "locality": hotel_data.get("locality", ""),
                "country": hotel_data.get("country", ""),
                "postal_code": hotel_data.get("postalCode"),
                "coordinates": {
                    "latitude": hotel_data.get("latitude"),
                    "longitude": hotel_data.get("longitude")
                },
                "contact": {
                    "phone": hotel_data.get("phone"),
                    "email": hotel_data.get("email")
                },
                "rating": {
                    "hotel_rating": hotel_data.get("hotelRating"),
                    "trip_advisor_rating": hotel_data.get("tripAdvisorRating"),
                    "trip_advisor_review_count": hotel_data.get("tripAdvisorReview")
                },
                "pricing": {
                    "total": hotel_data.get("total", 0),
                    "currency": hotel_data.get("currency", ""),
                    "fare_type": hotel_data.get("fareType", "")
                },
                "property_details": {
                    "property_type": hotel_data.get("propertyType", ""),
                    "distance_from_center": {
                        "value": hotel_data.get("distanceValue"),
                        "unit": hotel_data.get("distanceUnit", "KM")
                    }
                },
                "media": {
                    "thumbnail_url": hotel_data.get("thumbNailUrl"),
                    "image_count": 1 if hotel_data.get("thumbNailUrl") else 0
                },
                "facilities": hotel_data.get("facilities", []),
                "amenities_count": len(hotel_data.get("facilities", [])),
                "booking_info": {
                    "is_refundable": hotel_data.get("fareType", "").lower() == "refundable",
                    "cancellation_policy": "Free cancellation" if hotel_data.get("fareType", "").lower() == "refundable" else "Non-refundable"
                }
            }
            
            # Add display fields for frontend
            normalized_hotel["display"] = {
                "name_with_rating": f"{normalized_hotel['hotel_name']} ({normalized_hotel['rating']['hotel_rating']}★)" if normalized_hotel['rating']['hotel_rating'] else normalized_hotel['hotel_name'],
                "location_summary": f"{normalized_hotel['locality']}, {normalized_hotel['city']}" if normalized_hotel['locality'] else normalized_hotel['city'],
                "price_summary": f"{normalized_hotel['pricing']['currency']} {normalized_hotel['pricing']['total']:.2f}",
                "distance_summary": f"{normalized_hotel['property_details']['distance_from_center']['value']} {normalized_hotel['property_details']['distance_from_center']['unit']} from center" if normalized_hotel['property_details']['distance_from_center']['value'] else "",
                "amenities_summary": f"{normalized_hotel['amenities_count']} amenities available",
                "rating_summary": self._format_rating_summary(normalized_hotel['rating'])
            }
            
            return normalized_hotel
            
        except Exception as e:
            logger.error(f"Error normalizing hotel data: {str(e)}")
            # Return minimal hotel data if normalization fails
            return {
                "hotel_id": hotel_data.get("hotelId", ""),
                "hotel_name": hotel_data.get("hotelName", "Unknown Hotel"),
                "error": f"Normalization failed: {str(e)}"
            }
    
    def _format_rating_summary(self, rating_data: Dict[str, Any]) -> str:
        """
        Format rating information for display
        """
        try:
            parts = []
            
            if rating_data.get("hotel_rating"):
                parts.append(f"{rating_data['hotel_rating']}★ Hotel Rating")
            
            if rating_data.get("trip_advisor_rating") and rating_data.get("trip_advisor_review_count"):
                parts.append(f"{rating_data['trip_advisor_rating']}/5 TripAdvisor ({rating_data['trip_advisor_review_count']} reviews)")
            
            return " | ".join(parts) if parts else "No ratings available"
            
        except Exception:
            return "Rating information unavailable"
    
    async def get_more_hotel_results(
        self,
        session_id: str,
        next_token: str,
        max_result: int = 20
    ) -> Dict[str, Any]:
        """
        Get more hotel search results using session ID and next token
        
        Args:
            session_id: Session ID from previous hotel search
            next_token: Token for retrieving next set of results
            max_result: Maximum number of results to return
            
        Returns:
            Dict containing additional hotel search results
        """
        try:
            # Build query parameters
            params = {
                "sessionId": session_id,
                "nextToken": next_token,
                "maxResult": max_result
            }
            
            logger.info(f"Getting more hotel results with params: {params}")
            
            # Make the API call
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.get(
                    f"{self.base_url}/moreResults",
                    params=params,
                    headers=self.headers
                )
                
                logger.info(f"More hotel results API response status: {response.status_code}")
                logger.info(f"More hotel results API response: {response.text}")
                
                if response.status_code != 200:
                    return {
                        "success": False,
                        "error": f"API request failed with status {response.status_code}",
                        "hotels": []
                    }
                
                api_response = response.json()
                return self._process_hotel_search_response(api_response)
                
        except httpx.TimeoutException:
            logger.error("More hotel results API timeout")
            return {
                "success": False,
                "error": "Request timeout",
                "hotels": []
            }
        except Exception as e:
            logger.error(f"More hotel results API error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "hotels": []
            }
    
    async def get_more_hotel_results_pagination(
        self,
        session_id: str,
        next_token: str
    ) -> Dict[str, Any]:
        """
        Get more hotel search results using pagination (no maxResult limit)
        
        Args:
            session_id: Session ID from previous hotel search
            next_token: Token for retrieving next set of results
            
        Returns:
            Dict containing additional hotel search results with pagination
        """
        try:
            # Build query parameters
            params = {
                "sessionId": session_id,
                "nextToken": next_token
            }
            
            logger.info(f"Getting more hotel results (pagination) with params: {params}")
            
            # Make the API call
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.get(
                    f"{self.base_url}/moreResultsPagination",
                    params=params,
                    headers=self.headers
                )
                
                logger.info(f"More hotel results pagination API response status: {response.status_code}")
                logger.info(f"More hotel results pagination API response: {response.text}")
                
                if response.status_code != 200:
                    return {
                        "success": False,
                        "error": f"API request failed with status {response.status_code}",
                        "hotels": []
                    }
                
                api_response = response.json()
                return self._process_hotel_search_response(api_response)
                
        except httpx.TimeoutException:
            logger.error("More hotel results pagination API timeout")
            return {
                "success": False,
                "error": "Request timeout",
                "hotels": []
            }
        except Exception as e:
            logger.error(f"More hotel results pagination API error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "hotels": []
            }
    
    async def filter_hotel_results(
        self,
        session_id: str,
        max_result: int = 25,
        price_min: float = None,
        price_max: float = None,
        rating: str = None,
        tripadvisor_rating: str = None,
        hotel_name: str = None,
        fare_type: str = None,
        property_type: str = None,
        facility: str = None,
        sorting: str = None,
        locality: str = None
    ) -> Dict[str, Any]:
        """
        Filter hotel search results based on various criteria
        
        Args:
            session_id: Session ID from previous hotel search
            max_result: Maximum number of results to return
            price_min: Minimum price filter
            price_max: Maximum price filter
            rating: Hotel ratings (0-5), comma-separated
            tripadvisor_rating: TripAdvisor ratings (0-5), comma-separated
            hotel_name: Filter by hotel name (partial match)
            fare_type: Filter by fare type (Refundable/Non-Refundable)
            property_type: Filter by property type (HOTELS, RESORTS, APARTMENTS)
            facility: Filter by facilities, comma-separated
            sorting: Sort results (price-low-high, rating-high-low, etc.)
            locality: Filter by locality/region, comma-separated
            
        Returns:
            Dict containing filtered hotel search results
        """
        try:
            # Build filters object
            filters = {}
            
            # Price filter
            if price_min is not None or price_max is not None:
                price_filter = {}
                if price_min is not None:
                    price_filter["min"] = price_min
                if price_max is not None:
                    price_filter["max"] = price_max
                filters["price"] = price_filter
            
            # Rating filters
            if rating:
                filters["rating"] = rating
            if tripadvisor_rating:
                filters["tripadvisorRating"] = tripadvisor_rating
            
            # Text filters
            if hotel_name:
                filters["hotelName"] = hotel_name
            if fare_type:
                filters["faretype"] = fare_type
            if property_type:
                filters["propertyType"] = property_type
            if facility:
                filters["facility"] = facility
            if locality:
                filters["locality"] = locality
            
            # Sorting
            if sorting:
                filters["sorting"] = sorting
            
            # Build the request payload
            payload = {
                "sessionId": session_id,
                "maxResult": max_result,
                "filters": filters
            }
            
            logger.info(f"Filtering hotels with payload: {payload}")
            
            # Make the API call
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.get(
                    f"{self.base_url}/filterResults",
                    json=payload,
                    headers=self.headers
                )
                
                logger.info(f"Hotel filter API response status: {response.status_code}")
                logger.info(f"Hotel filter API response: {response.text}")
                
                if response.status_code != 200:
                    return {
                        "success": False,
                        "error": f"API request failed with status {response.status_code}",
                        "hotels": []
                    }
                
                api_response = response.json()
                return self._process_hotel_filter_response(api_response)
                
        except httpx.TimeoutException:
            logger.error("Hotel filter API timeout")
            return {
                "success": False,
                "error": "Request timeout",
                "hotels": []
            }
        except Exception as e:
            logger.error(f"Hotel filter API error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "hotels": []
            }
    
    def _process_hotel_filter_response(self, api_response: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process and normalize the hotel filter API response
        """
        try:
            # Check for error response
            if "Errors" in api_response:
                error_info = api_response["Errors"]
                return {
                    "success": False,
                    "error": f"API Error: {error_info.get('ErrorMessage', 'Unknown error')}",
                    "error_code": error_info.get("ErrorCode", "UNKNOWN"),
                    "hotels": []
                }
            
            # Extract status information
            status = api_response.get("status", {})
            session_id = status.get("sessionId", "")
            more_results = status.get("moreResults", False)
            next_token = status.get("nextToken", "")
            filter_key = status.get("filterKey", "")
            
            # Extract hotel itineraries
            itineraries = api_response.get("itineraries", [])
            
            # Process and normalize hotel data
            normalized_hotels = []
            for hotel_data in itineraries:
                normalized_hotel = self._normalize_hotel_data(hotel_data)
                normalized_hotels.append(normalized_hotel)
            
            return {
                "success": True,
                "hotels": normalized_hotels,
                "filter_metadata": {
                    "session_id": session_id,
                    "more_results": more_results,
                    "next_token": next_token,
                    "filter_key": filter_key,
                    "filtered_results": len(normalized_hotels)
                }
            }
            
        except Exception as e:
            logger.error(f"Error processing hotel filter response: {str(e)}")
            return {
                "success": False,
                "error": f"Response processing error: {str(e)}",
                "hotels": []
            }
    
    async def get_more_filter_results(
        self,
        session_id: str,
        next_token: str,
        filter_key: str
    ) -> Dict[str, Any]:
        """
        Get more hotel filter results using session ID, next token, and filter key
        
        Args:
            session_id: Session ID from previous hotel search
            next_token: Token for retrieving next set of filtered results
            filter_key: Filter key from previous filter response
            
        Returns:
            Dict containing additional filtered hotel search results
        """
        try:
            # Build query parameters
            params = {
                "sessionId": session_id,
                "nextToken": next_token,
                "filterKey": filter_key
            }
            
            logger.info(f"Getting more filter results with params: {params}")
            
            # Make the API call
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.get(
                    f"{self.base_url}/moreFiterResults",
                    params=params,
                    headers=self.headers
                )
                
                logger.info(f"More filter results API response status: {response.status_code}")
                logger.info(f"More filter results API response: {response.text}")
                
                if response.status_code != 200:
                    return {
                        "success": False,
                        "error": f"API request failed with status {response.status_code}",
                        "hotels": []
                    }
                
                api_response = response.json()
                return self._process_hotel_filter_response(api_response)
                
        except httpx.TimeoutException:
            logger.error("More filter results API timeout")
            return {
                "success": False,
                "error": "Request timeout",
                "hotels": []
            }
        except Exception as e:
            logger.error(f"More filter results API error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "hotels": []
            }
    
    async def get_more_filter_results_pagination(
        self,
        session_id: str,
        next_token: str,
        filter_key: str
    ) -> Dict[str, Any]:
        """
        Get more hotel filter results using pagination (no result limit)
        
        Args:
            session_id: Session ID from previous hotel search
            next_token: Token for retrieving next set of filtered results
            filter_key: Filter key from previous filter response
            
        Returns:
            Dict containing additional filtered hotel search results with full pagination
        """
        try:
            # Build query parameters
            params = {
                "sessionId": session_id,
                "nextToken": next_token,
                "filterKey": filter_key
            }
            
            logger.info(f"Getting more filter results (pagination) with params: {params}")
            
            # Make the API call
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.get(
                    f"{self.base_url}/filterResultsPagination",
                    params=params,
                    headers=self.headers
                )
                
                logger.info(f"More filter results pagination API response status: {response.status_code}")
                logger.info(f"More filter results pagination API response: {response.text}")
                
                if response.status_code != 200:
                    return {
                        "success": False,
                        "error": f"API request failed with status {response.status_code}",
                        "hotels": []
                    }
                
                api_response = response.json()
                return self._process_hotel_filter_response(api_response)
                
        except httpx.TimeoutException:
            logger.error("More filter results pagination API timeout")
            return {
                "success": False,
                "error": "Request timeout",
                "hotels": []
            }
        except Exception as e:
            logger.error(f"More filter results pagination API error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "hotels": []
            }
    
    async def get_hotel_details(
        self,
        session_id: str,
        hotel_id: str,
        product_id: str,
        token_id: str
    ) -> Dict[str, Any]:
        """
        Get detailed hotel content including description, images, and facilities
        
        Args:
            session_id: Session ID from hotel search
            hotel_id: Unique hotel ID from search results
            product_id: Product ID from search results
            token_id: Token ID from search results
            
        Returns:
            Dict containing detailed hotel content and media
        """
        try:
            # Build query parameters
            params = {
                "sessionId": session_id,
                "hotelId": hotel_id,
                "productId": product_id,
                "tokenId": token_id
            }
            
            logger.info(f"Getting hotel details with params: {params}")
            
            # Make the API call
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.get(
                    f"{self.base_url}/hotelDetails",
                    params=params,
                    headers=self.headers
                )
                
                logger.info(f"Hotel details API response status: {response.status_code}")
                logger.info(f"Hotel details API response: {response.text}")
                
                if response.status_code != 200:
                    return {
                        "success": False,
                        "error": f"API request failed with status {response.status_code}",
                        "hotel_details": None
                    }
                
                api_response = response.json()
                return self._process_hotel_details_response(api_response)
                
        except httpx.TimeoutException:
            logger.error("Hotel details API timeout")
            return {
                "success": False,
                "error": "Request timeout",
                "hotel_details": None
            }
        except Exception as e:
            logger.error(f"Hotel details API error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "hotel_details": None
            }
    
    def _process_hotel_details_response(self, api_response: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process and normalize the hotel details API response
        """
        try:
            # Check for error response
            if "Errors" in api_response:
                error_info = api_response["Errors"]
                return {
                    "success": False,
                    "error": f"API Error: {error_info.get('ErrorMessage', 'Unknown error')}",
                    "error_code": error_info.get("ErrorCode", "UNKNOWN"),
                    "hotel_details": None
                }
            
            # Process and normalize hotel details
            hotel_details = {
                "hotel_id": api_response.get("hotelId", ""),
                "name": api_response.get("name", ""),
                "address": api_response.get("address", ""),
                "city": api_response.get("city", ""),
                "postal_code": api_response.get("postalCode", ""),
                "coordinates": {
                    "latitude": api_response.get("latitude"),
                    "longitude": api_response.get("longitude")
                },
                "rating": {
                    "hotel_rating": api_response.get("hotelRating"),
                    "rating_display": f"{api_response.get('hotelRating', 'N/A')}★" if api_response.get('hotelRating') else "No rating"
                },
                "description": {
                    "content": api_response.get("description", {}).get("content", ""),
                    "has_description": bool(api_response.get("description", {}).get("content"))
                },
                "facilities": api_response.get("facilities", []),
                "amenities_info": {
                    "total_amenities": len(api_response.get("facilities", [])),
                    "categories": self._categorize_facilities(api_response.get("facilities", []))
                },
                "images": {
                    "hotel_images": api_response.get("hotelImages", []),
                    "image_count": len(api_response.get("hotelImages", [])),
                    "has_images": len(api_response.get("hotelImages", [])) > 0,
                    "image_categories": self._categorize_images(api_response.get("hotelImages", []))
                }
            }
            
            # Add display fields for frontend
            hotel_details["display"] = {
                "title": f"{hotel_details['name']} ({hotel_details['rating']['rating_display']})",
                "location": f"{hotel_details['city']}, {hotel_details['address']}" if hotel_details['city'] else hotel_details['address'],
                "amenities_summary": f"{hotel_details['amenities_info']['total_amenities']} amenities available",
                "images_summary": f"{hotel_details['images']['image_count']} photos available" if hotel_details['images']['has_images'] else "No photos available",
                "description_preview": self._get_description_preview(hotel_details['description']['content'])
            }
            
            return {
                "success": True,
                "hotel_details": hotel_details
            }
            
        except Exception as e:
            logger.error(f"Error processing hotel details response: {str(e)}")
            return {
                "success": False,
                "error": f"Response processing error: {str(e)}",
                "hotel_details": None
            }
    
    def _categorize_facilities(self, facilities: List[str]) -> Dict[str, List[str]]:
        """
        Categorize hotel facilities for better organization
        """
        try:
            categories = {
                "connectivity": [],
                "dining": [],
                "business": [],
                "leisure": [],
                "services": [],
                "transportation": [],
                "other": []
            }
            
            for facility in facilities:
                facility_lower = facility.lower()
                
                if any(keyword in facility_lower for keyword in ["wifi", "wlan", "internet", "wireless"]):
                    categories["connectivity"].append(facility)
                elif any(keyword in facility_lower for keyword in ["restaurant", "bar", "cafe", "dining", "breakfast", "room service"]):
                    categories["dining"].append(facility)
                elif any(keyword in facility_lower for keyword in ["conference", "meeting", "business", "boardroom"]):
                    categories["business"].append(facility)
                elif any(keyword in facility_lower for keyword in ["pool", "gym", "spa", "fitness", "casino", "games", "theatre", "nightclub"]):
                    categories["leisure"].append(facility)
                elif any(keyword in facility_lower for keyword in ["laundry", "concierge", "reception", "room service", "housekeeping", "medical"]):
                    categories["services"].append(facility)
                elif any(keyword in facility_lower for keyword in ["parking", "car park", "garage", "valet"]):
                    categories["transportation"].append(facility)
                else:
                    categories["other"].append(facility)
            
            # Remove empty categories
            return {k: v for k, v in categories.items() if v}
            
        except Exception:
            return {"other": facilities}
    
    def _categorize_images(self, images: List[Dict[str, Any]]) -> Dict[str, int]:
        """
        Categorize hotel images by type/caption
        """
        try:
            categories = {}
            for image in images:
                caption = image.get("caption", "GEN")
                categories[caption] = categories.get(caption, 0) + 1
            return categories
        except Exception:
            return {"GEN": len(images)}
    
    def _get_description_preview(self, description: str, max_length: int = 150) -> str:
        """
        Get a preview of hotel description for display
        """
        try:
            if not description:
                return "No description available"
            
            if len(description) <= max_length:
                return description
            
            # Find the last complete sentence within the limit
            preview = description[:max_length]
            last_period = preview.rfind('.')
            
            if last_period > max_length * 0.7:  # If we have a good sentence break
                return preview[:last_period + 1]
            else:
                return preview.rstrip() + "..."
                
        except Exception:
            return "Description unavailable"
    
    async def get_room_rates(
        self,
        hotel_code: str,
        session_id: str,
        check_in_date: str,
        check_out_date: str,
        rooms: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Get detailed room rates for a specific hotel
        
        Args:
            hotel_code: Hotel identifier code
            session_id: Search session ID
            check_in_date: Check-in date
            check_out_date: Check-out date
            rooms: Room configuration
            
        Returns:
            Dict containing detailed room rates and availability
        """
        try:
            payload = {
                "user_id": self.user_id,
                "user_password": self.user_password,
                "access": self.access,
                "ip_address": self.ip_address,
                "hotel_code": hotel_code,
                "session_id": session_id,
                "check_in_date": check_in_date,
                "check_out_date": check_out_date,
                "rooms": rooms
            }
            
            logger.info(f"Getting room rates for hotel: {hotel_code}")
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/room_rates",
                    json=payload,
                    headers=self.headers
                )
                
                logger.info(f"Room rates API response status: {response.status_code}")
                
                if response.status_code != 200:
                    return {
                        "success": False,
                        "error": f"API request failed with status {response.status_code}",
                        "room_rates": []
                    }
                
                api_response = response.json()
                return self._process_room_rates_response(api_response)
                
        except httpx.TimeoutException:
            logger.error("Room rates API timeout")
            return {
                "success": False,
                "error": "Request timeout",
                "room_rates": []
            }
        except Exception as e:
            logger.error(f"Room rates API error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "room_rates": []
            }
    
    def _process_room_rates_response(self, api_response: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process room rates API response
        """
        try:
            # Placeholder implementation
            return {
                "success": True,
                "room_rates": [],
                "hotel_info": {},
                "pricing_summary": {}
            }
        except Exception as e:
            logger.error(f"Error processing room rates response: {str(e)}")
            return {
                "success": False,
                "error": f"Response processing error: {str(e)}",
                "room_rates": []
            }
    
    async def book_hotel(
        self,
        session_id: str,
        product_id: str,
        token_id: str,
        rate_basis_id: str,
        client_ref: str,
        customer_email: str,
        customer_phone: str,
        booking_note: str,
        pax_details: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Book a hotel reservation using TravelNext Hotel API v6
        
        Args:
            session_id: Session ID from hotel search
            product_id: Product ID from search results
            token_id: Token ID from search results
            rate_basis_id: Rate basis ID from check rate rules API
            client_ref: Client-generated booking reference
            customer_email: Customer email address
            customer_phone: Customer phone number
            booking_note: Booking note or remarks
            pax_details: List of passenger details for each room
            
        Returns:
            Dict containing booking confirmation details
        """
        try:
            # Build the booking payload according to API specification
            payload = {
                "sessionId": session_id,
                "productId": product_id,
                "tokenId": token_id,
                "rateBasisId": rate_basis_id,
                "clientRef": client_ref,
                "customerEmail": customer_email,
                "customerPhone": customer_phone,
                "bookingNote": booking_note,
                "paxDetails": pax_details
            }
            
            logger.info(f"Booking hotel with payload: {payload}")
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.base_url}/hotel_book",
                    json=payload,
                    headers=self.headers
                )
                
                logger.info(f"Hotel booking API response status: {response.status_code}")
                logger.info(f"Hotel booking API response: {response.text}")
                
                if response.status_code != 200:
                    return {
                        "success": False,
                        "error": f"API request failed with status {response.status_code}",
                        "booking_result": None
                    }
                
                api_response = response.json()
                return self._process_hotel_booking_response(api_response)
                
        except httpx.TimeoutException:
            logger.error("Hotel booking API timeout")
            return {
                "success": False,
                "error": "Request timeout",
                "booking_result": None
            }
        except Exception as e:
            logger.error(f"Hotel booking API error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "booking_result": None
            }
    
    def _process_hotel_booking_response(self, api_response: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process hotel booking API response according to TravelNext specification
        """
        try:
            # Check for error response
            if "Errors" in api_response or api_response.get("error"):
                error_info = api_response.get("Errors", {})
                error_message = api_response.get("error", error_info.get("ErrorMessage", "Unknown booking error"))
                return {
                    "success": False,
                    "error": f"Booking Error: {error_message}",
                    "error_code": error_info.get("ErrorCode", "BOOKING_FAILED"),
                    "booking_result": None
                }
            
            # Extract booking information
            booking_status = api_response.get("status", "")
            supplier_confirmation = api_response.get("supplierConfirmationNum", "")
            reference_num = api_response.get("referenceNum", "")
            client_ref_num = api_response.get("clientRefNum", "")
            product_id = api_response.get("productId", "")
            
            # Extract room booking details
            room_book_details = api_response.get("roomBookDetails", {})
            
            # Process room details
            rooms_info = []
            rooms_data = room_book_details.get("rooms", [])
            for room in rooms_data:
                room_info = {
                    "room_name": room.get("name", ""),
                    "description": room.get("description", ""),
                    "board_type": room.get("boardType", ""),
                    "guest_names": room.get("paxDetails", {}).get("name", [])
                }
                rooms_info.append(room_info)
            
            # Build normalized booking result
            booking_result = {
                "booking_status": booking_status,
                "is_confirmed": booking_status.upper() == "CONFIRMED",
                "confirmation_details": {
                    "supplier_confirmation_number": supplier_confirmation,
                    "reference_number": reference_num,
                    "client_reference_number": client_ref_num,
                    "product_id": product_id
                },
                "hotel_booking_details": {
                    "hotel_id": room_book_details.get("hotelId", ""),
                    "check_in_date": room_book_details.get("checkIn", ""),
                    "check_out_date": room_book_details.get("checkOut", ""),
                    "number_of_days": room_book_details.get("days", 0),
                    "currency": room_book_details.get("currency", ""),
                    "net_price": room_book_details.get("NetPrice", "0"),
                    "fare_type": room_book_details.get("fareType", ""),
                    "cancellation_policy": room_book_details.get("cancellationPolicy", ""),
                    "customer_email": room_book_details.get("customerEmail", ""),
                    "customer_phone": room_book_details.get("customerPhone", "")
                },
                "rooms": rooms_info,
                "pricing": {
                    "total_amount": float(room_book_details.get("NetPrice", "0")),
                    "currency": room_book_details.get("currency", "USD"),
                    "fare_type": room_book_details.get("fareType", ""),
                    "is_refundable": room_book_details.get("fareType", "").lower() == "refundable"
                }
            }
            
            # Add display fields for frontend
            booking_result["display"] = {
                "status_message": self._format_booking_status_message(booking_status),
                "confirmation_summary": f"Booking {booking_status} - {supplier_confirmation}" if supplier_confirmation else f"Booking {booking_status}",
                "stay_summary": f"{room_book_details.get('checkIn', '')} to {room_book_details.get('checkOut', '')} ({room_book_details.get('days', 0)} nights)",
                "price_summary": f"{room_book_details.get('currency', '')} {room_book_details.get('NetPrice', '0')} ({room_book_details.get('fareType', '')})",
                "rooms_summary": f"{len(rooms_info)} room(s) booked",
                "cancellation_summary": self._format_cancellation_policy(room_book_details.get("cancellationPolicy", ""))
            }
            
            return {
                "success": True,
                "booking_result": booking_result
            }
            
        except Exception as e:
            logger.error(f"Error processing hotel booking response: {str(e)}")
            return {
                "success": False,
                "error": f"Response processing error: {str(e)}",
                "booking_result": None
            }
    
    def _format_booking_status_message(self, status: str) -> str:
        """
        Format booking status message for display
        """
        status_upper = status.upper()
        status_messages = {
            "CONFIRMED": "✅ Booking Confirmed Successfully",
            "PENDING": "⏳ Booking Pending Confirmation",
            "FAILED": "❌ Booking Failed",
            "CANCELLED": "🚫 Booking Cancelled"
        }
        return status_messages.get(status_upper, f"Booking Status: {status}")
    
    def _format_cancellation_policy(self, policy: str) -> str:
        """
        Format cancellation policy for display
        """
        try:
            if not policy:
                return "No cancellation policy available"
            
            # Split policy by |t| separator if present
            if "|t|" in policy:
                policies = policy.split("|t|")
                return f"{len(policies)} cancellation rule(s) apply"
            else:
                return "Cancellation policy applies"
        except Exception:
            return "Cancellation policy available"
    
    async def get_booking_details(
        self,
        supplier_confirmation_num: str,
        reference_num: str
    ) -> Dict[str, Any]:
        """
        Get complete hotel booking details using confirmation and reference numbers
        
        Args:
            supplier_confirmation_num: Supplier confirmation number from booking response
            reference_num: Reference number from booking response
            
        Returns:
            Dict containing complete booking details
        """
        try:
            # Build the request payload
            payload = {
                "user_id": self.user_id,
                "user_password": self.user_password,
                "access": self.access,
                "ip_address": self.ip_address,
                "supplierConfirmationNum": supplier_confirmation_num,
                "referenceNum": reference_num
            }
            
            logger.info(f"Getting booking details with payload: {payload}")
            
            # Make the API call
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.base_url}/bookingDetails",
                    json=payload,
                    headers=self.headers
                )
                
                logger.info(f"Booking details API response status: {response.status_code}")
                logger.info(f"Booking details API response: {response.text}")
                
                if response.status_code != 200:
                    return {
                        "success": False,
                        "error": f"API request failed with status {response.status_code}",
                        "booking_details": None
                    }
                
                api_response = response.json()
                return self._process_booking_details_response(api_response)
                
        except httpx.TimeoutException:
            logger.error("Booking details API timeout")
            return {
                "success": False,
                "error": "Request timeout",
                "booking_details": None
            }
        except Exception as e:
            logger.error(f"Booking details API error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "booking_details": None
            }
    
    def _process_booking_details_response(self, api_response: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process and normalize the booking details API response
        """
        try:
            # Check for error response
            if "Errors" in api_response or api_response.get("error"):
                error_info = api_response.get("Errors", {})
                error_message = api_response.get("error", error_info.get("ErrorMessage", "Unknown error"))
                return {
                    "success": False,
                    "error": f"Booking Details Error: {error_message}",
                    "error_code": error_info.get("ErrorCode", "BOOKING_DETAILS_FAILED"),
                    "booking_details": None
                }
            
            # Process booking details - structure will be similar to booking response
            # but may contain additional details or updated status
            booking_details = {
                "booking_status": api_response.get("status", ""),
                "supplier_confirmation_number": api_response.get("supplierConfirmationNum", ""),
                "reference_number": api_response.get("referenceNum", ""),
                "client_reference_number": api_response.get("clientRefNum", ""),
                "product_id": api_response.get("productId", ""),
                "booking_timestamp": api_response.get("bookingTimestamp", ""),
                "last_updated": api_response.get("lastUpdated", "")
            }
            
            # Extract room booking details if present
            room_book_details = api_response.get("roomBookDetails", {})
            if room_book_details:
                booking_details["hotel_details"] = {
                    "hotel_id": room_book_details.get("hotelId", ""),
                    "hotel_name": room_book_details.get("hotelName", ""),
                    "check_in_date": room_book_details.get("checkIn", ""),
                    "check_out_date": room_book_details.get("checkOut", ""),
                    "number_of_days": room_book_details.get("days", 0),
                    "currency": room_book_details.get("currency", ""),
                    "net_price": room_book_details.get("NetPrice", "0"),
                    "fare_type": room_book_details.get("fareType", ""),
                    "cancellation_policy": room_book_details.get("cancellationPolicy", ""),
                    "customer_email": room_book_details.get("customerEmail", ""),
                    "customer_phone": room_book_details.get("customerPhone", "")
                }
                
                # Process room details
                rooms_info = []
                rooms_data = room_book_details.get("rooms", [])
                for room in rooms_data:
                    room_info = {
                        "room_name": room.get("name", ""),
                        "description": room.get("description", ""),
                        "board_type": room.get("boardType", ""),
                        "guest_names": room.get("paxDetails", {}).get("name", [])
                    }
                    rooms_info.append(room_info)
                
                booking_details["rooms"] = rooms_info
                booking_details["pricing"] = {
                    "total_amount": float(room_book_details.get("NetPrice", "0")),
                    "currency": room_book_details.get("currency", "USD"),
                    "fare_type": room_book_details.get("fareType", ""),
                    "is_refundable": room_book_details.get("fareType", "").lower() == "refundable"
                }
            
            # Add display fields
            booking_details["display"] = {
                "status_message": self._format_booking_status_message(booking_details["booking_status"]),
                "confirmation_summary": f"Booking {booking_details['booking_status']} - {booking_details['supplier_confirmation_number']}" if booking_details['supplier_confirmation_number'] else f"Booking {booking_details['booking_status']}",
                "reference_summary": f"Ref: {booking_details['reference_number']}" if booking_details['reference_number'] else "",
            }
            
            if "hotel_details" in booking_details:
                hotel = booking_details["hotel_details"]
                booking_details["display"].update({
                    "stay_summary": f"{hotel.get('check_in_date', '')} to {hotel.get('check_out_date', '')} ({hotel.get('number_of_days', 0)} nights)",
                    "price_summary": f"{hotel.get('currency', '')} {hotel.get('net_price', '0')} ({hotel.get('fare_type', '')})",
                    "hotel_summary": hotel.get('hotel_name', 'Hotel booking')
                })
            
            return {
                "success": True,
                "booking_details": booking_details
            }
            
        except Exception as e:
            logger.error(f"Error processing booking details response: {str(e)}")
            return {
                "success": False,
                "error": f"Response processing error: {str(e)}",
                "booking_details": None
            }
    
    async def cancel_hotel_booking(
        self,
        supplier_confirmation_num: str,
        reference_num: str
    ) -> Dict[str, Any]:
        """
        Cancel a hotel booking using TravelNext Hotel API v6
        
        Args:
            supplier_confirmation_num: Supplier confirmation number from booking response
            reference_num: Reference number from booking response
            
        Returns:
            Dict containing cancellation result
        """
        try:
            # Build the cancellation payload according to API specification
            payload = {
                "user_id": self.user_id,
                "user_password": self.user_password,
                "access": self.access,
                "ip_address": self.ip_address,
                "supplierConfirmationNum": supplier_confirmation_num,
                "referenceNum": reference_num
            }
            
            logger.info(f"Cancelling hotel booking with payload: {payload}")
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.base_url}/cancel",
                    json=payload,
                    headers=self.headers
                )
                
                logger.info(f"Hotel cancellation API response status: {response.status_code}")
                logger.info(f"Hotel cancellation API response: {response.text}")
                
                if response.status_code != 200:
                    return {
                        "success": False,
                        "error": f"API request failed with status {response.status_code}",
                        "cancellation_result": None
                    }
                
                api_response = response.json()
                return self._process_hotel_cancellation_response(api_response)
                
        except httpx.TimeoutException:
            logger.error("Hotel cancellation API timeout")
            return {
                "success": False,
                "error": "Request timeout",
                "cancellation_result": None
            }
        except Exception as e:
            logger.error(f"Hotel cancellation API error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "cancellation_result": None
            }
    
    def _process_hotel_cancellation_response(self, api_response: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process hotel cancellation API response according to TravelNext specification
        """
        try:
            # Check for error response
            if "Errors" in api_response or api_response.get("error"):
                error_info = api_response.get("Errors", {})
                error_message = api_response.get("error", error_info.get("ErrorMessage", "Unknown cancellation error"))
                return {
                    "success": False,
                    "error": f"Cancellation Error: {error_message}",
                    "error_code": error_info.get("ErrorCode", "CANCELLATION_FAILED"),
                    "cancellation_result": None
                }
            
            # Extract cancellation information according to API response structure
            cancellation_status = api_response.get("status", "")
            cancel_reference_num = api_response.get("cancelReferenceNum", "")
            message = api_response.get("message", "")
            
            # Build normalized cancellation result
            cancellation_result = {
                "cancellation_status": cancellation_status,
                "is_cancelled": cancellation_status.upper() == "CANCELLED",
                "cancel_reference_number": cancel_reference_num,
                "cancellation_message": message,
                "cancellation_timestamp": api_response.get("cancellationTimestamp", ""),
                "refund_details": {
                    "refund_amount": api_response.get("refundAmount", 0.0),
                    "cancellation_fees": api_response.get("cancellationFees", 0.0),
                    "net_refund": api_response.get("netRefund", 0.0),
                    "currency": api_response.get("currency", "USD"),
                    "refund_method": api_response.get("refundMethod", ""),
                    "refund_timeline": api_response.get("refundTimeline", "")
                }
            }
            
            # Add display fields for frontend
            cancellation_result["display"] = {
                "status_message": self._format_cancellation_status_message(cancellation_status),
                "reference_summary": f"Cancellation Ref: {cancel_reference_num}" if cancel_reference_num else "Cancellation processed",
                "message_summary": message if message else "Booking cancellation completed",
                "refund_summary": self._format_refund_summary(cancellation_result["refund_details"])
            }
            
            return {
                "success": True,
                "cancellation_result": cancellation_result
            }
            
        except Exception as e:
            logger.error(f"Error processing hotel cancellation response: {str(e)}")
            return {
                "success": False,
                "error": f"Response processing error: {str(e)}",
                "cancellation_result": None
            }
    
    def _format_cancellation_status_message(self, status: str) -> str:
        """
        Format cancellation status message for display
        """
        status_upper = status.upper()
        status_messages = {
            "CANCELLED": "🚫 Booking Successfully Cancelled",
            "PENDING": "⏳ Cancellation Pending",
            "FAILED": "❌ Cancellation Failed",
            "PARTIAL": "⚠️ Partial Cancellation"
        }
        return status_messages.get(status_upper, f"Cancellation Status: {status}")
    
    def _format_refund_summary(self, refund_details: Dict[str, Any]) -> str:
        """
        Format refund information for display
        """
        try:
            refund_amount = refund_details.get("refund_amount", 0.0)
            cancellation_fees = refund_details.get("cancellation_fees", 0.0)
            currency = refund_details.get("currency", "USD")
            
            if refund_amount > 0:
                if cancellation_fees > 0:
                    return f"Refund: {currency} {refund_amount} (Fees: {currency} {cancellation_fees})"
                else:
                    return f"Full Refund: {currency} {refund_amount}"
            elif cancellation_fees > 0:
                return f"Cancellation Fees: {currency} {cancellation_fees}"
            else:
                return "No refund information available"
        except Exception:
            return "Refund details pending"
    
    async def get_static_content(
        self,
        from_range: int = 1,
        to_range: int = 100,
        city_name: str = None,
        country_name: str = None
    ) -> Dict[str, Any]:
        """
        Get static content of hotels in the given city using TravelNext Hotel API v6
        
        Args:
            from_range: Starting range of list (pagination)
            to_range: Ending range of list (pagination)
            city_name: City name for filtering (optional)
            country_name: Country name for filtering (optional)
            
        Returns:
            Dict containing static hotel content with details and images
        """
        try:
            # Build query parameters
            params = {
                "user_id": self.user_id,
                "user_password": self.user_password,
                "access": self.access,
                "ip_address": self.ip_address,
                "from": from_range,
                "to": to_range
            }
            
            # Add optional filters
            if city_name:
                params["city_name"] = city_name
            if country_name:
                params["country_name"] = country_name
            
            logger.info(f"Getting hotel static content with params: {params}")
            
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.get(
                    f"{self.base_url}/static_content",
                    params=params,
                    headers=self.headers
                )
                
                logger.info(f"Hotel static content API response status: {response.status_code}")
                logger.info(f"Hotel static content API response length: {len(response.text)}")
                
                if response.status_code != 200:
                    return {
                        "success": False,
                        "error": f"API request failed with status {response.status_code}",
                        "hotels": []
                    }
                
                api_response = response.json()
                return self._process_static_content_response(api_response)
                
        except httpx.TimeoutException:
            logger.error("Hotel static content API timeout")
            return {
                "success": False,
                "error": "Request timeout",
                "hotels": []
            }
        except Exception as e:
            logger.error(f"Hotel static content API error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "hotels": []
            }
    
    def _process_static_content_response(self, api_response: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process and normalize the hotel static content API response
        """
        try:
            # Check for error response
            if "Errors" in api_response or api_response.get("error"):
                error_info = api_response.get("Errors", {})
                error_message = api_response.get("error", error_info.get("ErrorMessage", "Unknown error"))
                return {
                    "success": False,
                    "error": f"Static Content Error: {error_message}",
                    "error_code": error_info.get("ErrorCode", "STATIC_CONTENT_FAILED"),
                    "hotels": []
                }
            
            # Extract pagination information
            from_range = api_response.get("from", "1")
            to_range = api_response.get("to", "100")
            total_hotels = api_response.get("total", 0)
            
            # Extract and normalize hotel data
            hotels_data = api_response.get("hotels", [])
            normalized_hotels = []
            
            for hotel in hotels_data:
                normalized_hotel = self._normalize_static_hotel_data(hotel)
                normalized_hotels.append(normalized_hotel)
            
            return {
                "success": True,
                "hotels": normalized_hotels,
                "pagination": {
                    "from": int(from_range),
                    "to": int(to_range),
                    "total": total_hotels,
                    "current_count": len(normalized_hotels),
                    "has_more": int(to_range) < total_hotels
                }
            }
            
        except Exception as e:
            logger.error(f"Error processing hotel static content response: {str(e)}")
            return {
                "success": False,
                "error": f"Response processing error: {str(e)}",
                "hotels": []
            }
    
    def _normalize_static_hotel_data(self, hotel_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize individual static hotel data from API response
        """
        try:
            # Process images list
            images = hotel_data.get("images", [])
            # Filter out empty image URLs
            valid_images = [img for img in images if img and img.strip()]
            
            # Extract and normalize hotel information
            normalized_hotel = {
                "hotel_id": hotel_data.get("hotelId", ""),
                "name": hotel_data.get("name", ""),
                "location": {
                    "city": hotel_data.get("city", ""),
                    "state": hotel_data.get("state", ""),
                    "country": hotel_data.get("country", ""),
                    "address": hotel_data.get("address", "")
                },
                "coordinates": {
                    "latitude": hotel_data.get("latitude"),
                    "longitude": hotel_data.get("longitude")
                },
                "contact": {
                    "email": hotel_data.get("email"),
                    "phone": hotel_data.get("phone")
                },
                "property_details": {
                    "hotel_type": hotel_data.get("hotelType", ""),
                    "rating": hotel_data.get("rating")
                },
                "description": {
                    "content": hotel_data.get("description", ""),
                    "has_description": bool(hotel_data.get("description", "").strip())
                },
                "media": {
                    "images": valid_images,
                    "image_count": len(valid_images),
                    "has_images": len(valid_images) > 0
                }
            }
            
            # Add display fields for frontend
            normalized_hotel["display"] = {
                "title": f"{normalized_hotel['name']} ({normalized_hotel['property_details']['rating']}★)" if normalized_hotel['property_details']['rating'] else normalized_hotel['name'],
                "location_summary": f"{normalized_hotel['location']['city']}, {normalized_hotel['location']['state']}, {normalized_hotel['location']['country']}",
                "address_summary": normalized_hotel['location']['address'] if normalized_hotel['location']['address'] else "Address not available",
                "contact_summary": self._format_contact_info(normalized_hotel['contact']),
                "media_summary": f"{normalized_hotel['media']['image_count']} images available" if normalized_hotel['media']['has_images'] else "No images available",
                "description_preview": self._get_description_preview(normalized_hotel['description']['content'], 100)
            }
            
            return normalized_hotel
            
        except Exception as e:
            logger.error(f"Error normalizing static hotel data: {str(e)}")
            # Return minimal hotel data if normalization fails
            return {
                "hotel_id": hotel_data.get("hotelId", ""),
                "name": hotel_data.get("name", "Unknown Hotel"),
                "error": f"Normalization failed: {str(e)}"
            }
    
    def _format_contact_info(self, contact: Dict[str, Any]) -> str:
        """
        Format contact information for display
        """
        try:
            contact_parts = []
            
            if contact.get("phone"):
                contact_parts.append(f"📞 {contact['phone']}")
            
            if contact.get("email"):
                contact_parts.append(f"✉️ {contact['email']}")
            
            return " | ".join(contact_parts) if contact_parts else "Contact information not available"
            
        except Exception:
            return "Contact information unavailable"
    
    async def get_cities(self) -> Dict[str, Any]:
        """
        Get list of supported cities for hotel search
        
        Returns:
            Dict containing list of cities with codes and names
        """
        try:
            payload = {
                "user_id": self.user_id,
                "user_password": self.user_password,
                "access": self.access,
                "ip_address": self.ip_address
            }
            
            logger.info("Getting hotel cities list")
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.base_url}/hotel_cities",
                    json=payload,
                    headers=self.headers
                )
                
                logger.info(f"Hotel cities API response status: {response.status_code}")
                
                if response.status_code != 200:
                    return {
                        "success": False,
                        "error": f"API request failed with status {response.status_code}",
                        "cities": []
                    }
                
                api_response = response.json()
                return self._process_cities_response(api_response)
                
        except httpx.TimeoutException:
            logger.error("Hotel cities API timeout")
            return {
                "success": False,
                "error": "Request timeout",
                "cities": []
            }
        except Exception as e:
            logger.error(f"Hotel cities API error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "cities": []
            }
    
    def _process_cities_response(self, api_response: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process cities API response
        """
        try:
            # Placeholder implementation
            return {
                "success": True,
                "cities": [],
                "total_cities": 0
            }
        except Exception as e:
            logger.error(f"Error processing cities response: {str(e)}")
            return {
                "success": False,
                "error": f"Response processing error: {str(e)}",
                "cities": []
            }
    
    def _generate_sample_hotels(self) -> Dict[str, Any]:
        """
        Generate sample hotel data for demo when API returns no results
        """
        sample_hotels = [
            {
                "hotel_code": "DEMO_HTL_001",
                "hotel_name": "Grand Palace Hotel & Spa",
                "address": "123 Business District, Central Delhi, India",
                "city": "New Delhi",
                "country": "India",
                "rating": 4.5,
                "description": "Luxurious 5-star hotel in the heart of Delhi with world-class amenities and exceptional service.",
                "amenities": ["Free WiFi", "Swimming Pool", "Spa & Wellness", "Business Center", "Restaurant", "Room Service", "Fitness Center", "Airport Shuttle"],
                "images": ["https://via.placeholder.com/400x300/4f46e5/white?text=Grand+Palace+Hotel"],
                "location": {
                    "latitude": 28.6139,
                    "longitude": 77.2090
                },
                "rooms": [{
                    "room_type": "Deluxe Room",
                    "room_name": "Deluxe King Room with City View",
                    "price": 120.00,
                    "currency": "USD",
                    "board_type": "Room Only",
                    "cancellation_policy": "Free cancellation up to 24 hours before check-in",
                    "room_amenities": ["King Size Bed", "City View", "Free WiFi", "Air Conditioning", "Minibar", "Safe"]
                }],
                "total_price": 120.00,
                "currency": "USD"
            },
            {
                "hotel_code": "DEMO_HTL_002", 
                "hotel_name": "TripyVerse Business Hotel",
                "address": "456 Metro Station Road, Connaught Place, New Delhi, India",
                "city": "New Delhi",
                "country": "India",
                "rating": 4.2,
                "description": "Modern business hotel with excellent connectivity and professional amenities.",
                "amenities": ["Free WiFi", "Business Center", "Conference Rooms", "Restaurant", "24/7 Room Service", "Gym"],
                "images": ["https://via.placeholder.com/400x300/06b6d4/white?text=TripyVerse+Business"],
                "location": {
                    "latitude": 28.6315,
                    "longitude": 77.2167
                },
                "rooms": [{
                    "room_type": "Executive Room",
                    "room_name": "Executive Twin Room",
                    "price": 95.00,
                    "currency": "USD", 
                    "board_type": "Breakfast Included",
                    "cancellation_policy": "Free cancellation up to 48 hours before check-in",
                    "room_amenities": ["Twin Beds", "Work Desk", "Free WiFi", "Coffee Maker", "Iron & Board"]
                }],
                "total_price": 95.00,
                "currency": "USD"
            },
            {
                "hotel_code": "DEMO_HTL_003",
                "hotel_name": "Heritage Boutique Inn", 
                "address": "789 Old Delhi Heritage Lane, Chandni Chowk, Delhi, India",
                "city": "New Delhi",
                "country": "India",
                "rating": 4.0,
                "description": "Charming boutique hotel blending traditional Indian hospitality with modern comfort.",
                "amenities": ["Free WiFi", "Traditional Restaurant", "Heritage Tours", "Courtyard Garden", "Yoga Classes"],
                "images": ["https://via.placeholder.com/400x300/dc2626/white?text=Heritage+Boutique"],
                "location": {
                    "latitude": 28.6506,
                    "longitude": 77.2334
                },
                "rooms": [{
                    "room_type": "Heritage Room", 
                    "room_name": "Traditional Heritage Room",
                    "price": 75.00,
                    "currency": "USD",
                    "board_type": "Room Only",
                    "cancellation_policy": "Free cancellation up to 72 hours before check-in", 
                    "room_amenities": ["Traditional Decor", "Garden View", "Free WiFi", "Tea/Coffee Station", "Traditional Artwork"]
                }],
                "total_price": 75.00,
                "currency": "USD"
            }
        ]
        
        return {
            "success": True,
            "hotels": sample_hotels,
            "total_results": len(sample_hotels),
            "currency": "USD",
            "search_metadata": {
                "is_demo_data": True,
                "message": "Showing sample hotels - API has limited inventory for test credentials"
            }
        }

# Initialize the hotel API service
hotel_api_service = HotelAPIService()