#!/usr/bin/env python3

import asyncio
import httpx
import json
from datetime import datetime, timedelta

async def test_flight_api():
    """Test the flight API directly"""
    
    # Tomorrow's date for testing
    tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    
    # Test credentials
    payload = {
        "user_id": "ravindrakute1_testAPI",
        "user_password": "ravindrakute1Test@2025",
        "access": "Test",
        "ip_address": "127.0.0.1",
        "requiredCurrency": "USD",
        "journeyType": "OneWay",
        "OriginDestinationInfo": [{
            "departureDate": tomorrow,
            "airportOriginCode": "DEL",
            "airportDestinationCode": "BOM"
        }],
        "class": "Economy",
        "adults": 1,
        "childs": 0,
        "infants": 0
    }
    
    print(f"Testing Flight API with payload:")
    print(json.dumps(payload, indent=2))
    print(f"\nTesting date: {tomorrow}")
    print("=" * 50)
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            print("Making request to: https://travelnext.works/api/aeroVE5/availability")
            
            response = await client.post(
                "https://travelnext.works/api/aeroVE5/availability",
                json=payload,
                headers={
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            )
            
            print(f"Response Status: {response.status_code}")
            print(f"Response Headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"Response Data:")
                print(json.dumps(result, indent=2))
                
                if "results" in result:
                    print(f"\nFound {len(result['results'])} flights")
                else:
                    print("No 'results' key in response")
                    
            else:
                print(f"Error Response: {response.text}")
                
    except httpx.TimeoutException:
        print("ERROR: Request timeout")
    except Exception as e:
        print(f"ERROR: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_flight_api())