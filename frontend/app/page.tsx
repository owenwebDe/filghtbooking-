'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Footer from '../components/Footer';
import { 
  PaperAirplaneIcon as AirplaneIcon,
  BuildingLibraryIcon,
  BuildingOfficeIcon,
  GlobeAltIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ClockIcon,
  StarIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

export default function HomePage() {
  const router = useRouter();
  const [searchType, setSearchType] = useState('flights');
  const destinationsRef = useRef<HTMLDivElement>(null);
  const hotelsRef = useRef<HTMLDivElement>(null);
  const [destinationIndex, setDestinationIndex] = useState(0);
  const [hotelIndex, setHotelIndex] = useState(0);
  
  // Search form states
  const [searchData, setSearchData] = useState({
    flights: {
      from: '',
      to: '',
      date: '',
      passengers: '1'
    },
    hotels: {
      location: '',
      checkin: '',
      checkout: '',
      guests: '1'
    },
    packages: {
      destination: '',
      departure: '',
      duration: '3-5 days',
      travelers: '1'
    }
  });
  
  // Autocomplete suggestions
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  
  // Popular cities for autocomplete
  const popularCities = [
    'Dubai, UAE', 'Abu Dhabi, UAE', 'Sharjah, UAE', 'Ajman, UAE',
    'London, UK', 'Paris, France', 'Rome, Italy', 'Barcelona, Spain',
    'New York, USA', 'Los Angeles, USA', 'Miami, USA', 'Chicago, USA',
    'Tokyo, Japan', 'Osaka, Japan', 'Seoul, South Korea', 'Bangkok, Thailand',
    'Singapore', 'Kuala Lumpur, Malaysia', 'Jakarta, Indonesia', 'Manila, Philippines',
    'Mumbai, India', 'Delhi, India', 'Bangalore, India', 'Chennai, India',
    'Cairo, Egypt', 'Casablanca, Morocco', 'Istanbul, Turkey', 'Doha, Qatar',
    'Riyadh, Saudi Arabia', 'Kuwait City, Kuwait', 'Muscat, Oman', 'Manama, Bahrain'
  ];

  const destinations = [
    {
      name: "Paris, France",
      image: "https://images.pexels.com/photos/161853/eiffel-tower-paris-france-tower-161853.jpeg?w=500&h=500&fit=crop",
      price: "From AED 3,300",
      description: "City of Light and Love",
      continent: "Europe"
    },
    {
      name: "Tokyo, Japan", 
      image: "https://images.pexels.com/photos/2506923/pexels-photo-2506923.jpeg?w=500&h=500&fit=crop",
      price: "From AED 4,800",
      description: "Modern meets Traditional",
      continent: "Asia"
    },
    {
      name: "Bali, Indonesia",
      image: "https://images.pexels.com/photos/2474689/pexels-photo-2474689.jpeg?w=500&h=500&fit=crop",
      price: "From AED 2,600",
      description: "Tropical Paradise",
      continent: "Asia"
    },
    {
      name: "New York, USA",
      image: "https://images.pexels.com/photos/466685/pexels-photo-466685.jpeg?w=500&h=500&fit=crop",
      price: "From AED 2,200",
      description: "The City That Never Sleeps",
      continent: "North America"
    },
    {
      name: "Dubai, UAE",
      image: "https://images.pexels.com/photos/162031/dubai-tower-arab-khalifa-162031.jpeg?w=500&h=500&fit=crop",
      price: "From AED 1,100",
      description: "Luxury Desert Oasis",
      continent: "Middle East"
    },
    {
      name: "London, England",
      image: "https://images.pexels.com/photos/460672/pexels-photo-460672.jpeg?w=500&h=500&fit=crop",
      price: "From AED 2,900",
      description: "Harbor City Wonder",
      continent: "Oceania"
    },
    {
      name: "Maldives",
      image: "https://images.pexels.com/photos/1287460/pexels-photo-1287460.jpeg?w=500&h=500&fit=crop",
      price: "From AED 5,500",
      description: "Royal Heritage",
      continent: "Europe"
    },
    {
      name: "Singapore",
      image: "https://images.pexels.com/photos/247206/pexels-photo-247206.jpeg?w=500&h=500&fit=crop",
      price: "From AED 2,800",
      description: "Mother City Beauty",
      continent: "Africa"
    },
    {
      name: "Istanbul, Turkey",
      image: "https://images.pexels.com/photos/1878293/pexels-photo-1878293.jpeg?w=500&h=500&fit=crop",
      price: "From AED 1,800",
      description: "Eternal City",
      continent: "Europe"
    },
    {
      name: "Bangkok, Thailand",
      image: "https://images.pexels.com/photos/1659438/pexels-photo-1659438.jpeg?w=500&h=500&fit=crop",
      price: "From AED 1,900",
      description: "Street Food Capital",
      continent: "Asia"
    },
    {
      name: "Mumbai, India",
      image: "https://images.pexels.com/photos/1007426/pexels-photo-1007426.jpeg?w=500&h=500&fit=crop",
      price: "From AED 1,600",
      description: "Carnival City",
      continent: "South America"
    },
    {
      name: "Doha, Qatar",
      image: "https://images.pexels.com/photos/2356045/pexels-photo-2356045.jpeg?w=500&h=500&fit=crop",
      price: "From AED 1,400",
      description: "Bollywood Dreams",
      continent: "Asia"
    }
  ];

  const hotels = [
    {
      name: "Burj Al Arab Jumeirah",
      location: "Dubai, UAE",
      image: "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?w=500&h=500&fit=crop",
      rating: 4.9,
      price: "AED 4,500/night"
    },
    {
      name: "Atlantis The Palm",
      location: "Dubai, UAE",
      image: "https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg?w=500&h=500&fit=crop",
      rating: 4.8,
      price: "AED 2,200/night"
    },
    {
      name: "Emirates Palace",
      location: "Abu Dhabi, UAE",
      image: "https://images.pexels.com/photos/1134176/pexels-photo-1134176.jpeg?w=500&h=500&fit=crop",
      rating: 4.7,
      price: "AED 1,800/night"
    },
    {
      name: "Four Seasons Resort",
      location: "Dubai, UAE",
      image: "https://images.pexels.com/photos/1134185/pexels-photo-1134185.jpeg?w=500&h=500&fit=crop",
      rating: 4.8,
      price: "AED 1,500/night"
    },
    {
      name: "Armani Hotel Dubai",
      location: "Downtown Dubai",
      image: "https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?w=500&h=500&fit=crop",
      rating: 4.9,
      price: "AED 2,800/night"
    },
    {
      name: "Jumeirah Al Qasr",
      location: "Madinat Jumeirah",
      image: "https://images.pexels.com/photos/1134166/pexels-photo-1134166.jpeg?w=500&h=500&fit=crop",
      rating: 4.6,
      price: "AED 1,650/night"
    }
  ];

  // Auto-slide functionality
  useEffect(() => {
    const destinationsInterval = setInterval(() => {
      if (destinationsRef.current) {
        const cardWidth = 320 + 24; // 320px width + 24px gap
        const maxScroll = (destinations.length - 3) * cardWidth; // Show 3 cards at a time
        const currentScroll = destinationsRef.current.scrollLeft;
        
        if (currentScroll >= maxScroll) {
          destinationsRef.current.scrollTo({ left: 0, behavior: 'smooth' });
          setDestinationIndex(0);
        } else {
          const newIndex = destinationIndex + 1;
          destinationsRef.current.scrollTo({ 
            left: newIndex * cardWidth, 
            behavior: 'smooth' 
          });
          setDestinationIndex(newIndex);
        }
      }
    }, 4000); // Change slide every 4 seconds

    const hotelsInterval = setInterval(() => {
      if (hotelsRef.current) {
        const cardWidth = 320 + 24; // 320px width + 24px gap
        const maxScroll = (hotels.length - 3) * cardWidth; // Show 3 cards at a time
        const currentScroll = hotelsRef.current.scrollLeft;
        
        if (currentScroll >= maxScroll) {
          hotelsRef.current.scrollTo({ left: 0, behavior: 'smooth' });
          setHotelIndex(0);
        } else {
          const newIndex = hotelIndex + 1;
          hotelsRef.current.scrollTo({ 
            left: newIndex * cardWidth, 
            behavior: 'smooth' 
          });
          setHotelIndex(newIndex);
        }
      }
    }, 5000); // Change slide every 5 seconds (different timing)

    return () => {
      clearInterval(destinationsInterval);
      clearInterval(hotelsInterval);
    };
  }, [destinationIndex, hotelIndex, destinations.length, hotels.length]);

  // Handle input changes
  const handleInputChange = (field: string, value: string, inputType?: string) => {
    setSearchData(prev => ({
      ...prev,
      [searchType]: {
        ...prev[searchType as keyof typeof prev],
        [field]: value
      }
    }));

    // Show autocomplete for location-based fields
    if ((field === 'from' || field === 'to' || field === 'location' || field === 'destination') && value.length > 0) {
      const filtered = popularCities.filter(city => 
        city.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 6);
      setSuggestions(filtered);
      setShowSuggestions(true);
      setActiveSuggestion(0);
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: string, field: string) => {
    setSearchData(prev => ({
      ...prev,
      [searchType]: {
        ...prev[searchType as keyof typeof prev],
        [field]: suggestion
      }
    }));
    setShowSuggestions(false);
  };

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    let isValid = true;
    let missingFields: string[] = [];

    if (searchType === 'flights') {
      const flightData = searchData.flights;
      if (!flightData.from) { missingFields.push('departure city'); isValid = false; }
      if (!flightData.to) { missingFields.push('destination city'); isValid = false; }
      if (!flightData.date) { missingFields.push('departure date'); isValid = false; }
    } else if (searchType === 'hotels') {
      const hotelData = searchData.hotels;
      if (!hotelData.location) { missingFields.push('location'); isValid = false; }
      if (!hotelData.checkin) { missingFields.push('check-in date'); isValid = false; }
      if (!hotelData.checkout) { missingFields.push('check-out date'); isValid = false; }
    } else if (searchType === 'packages') {
      const packageData = searchData.packages;
      if (!packageData.destination) { missingFields.push('destination'); isValid = false; }
      if (!packageData.departure) { missingFields.push('departure date'); isValid = false; }
    }

    if (!isValid) {
      alert(`Please fill in the following fields: ${missingFields.join(', ')}`);
      return;
    }

    // Navigate to respective page with search params
    const searchParams = new URLSearchParams();
    const currentData = searchData[searchType as keyof typeof searchData];
    Object.entries(currentData).forEach(([key, value]) => {
      if (value) searchParams.set(key, value);
    });

    router.push(`/${searchType}?${searchParams.toString()}`);
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      
      {/* Hero Section with Flat Lay Travel Image */}
      <div className="relative min-h-screen overflow-hidden">
        {/* Background Image - Flat lay design with plane on red background */}
        <div className="absolute inset-0">
          <Image
            src="/Flat lay design of travel concept with plane on red background _ Premium Photo.jpg"
            alt="Premium Travel Experience - Airplane on Red Background"
            fill
            className="object-cover object-center"
            priority
          />
        </div>
        
        {/* Subtle floating elements positioned to avoid airplane (upper-right) */}
        <div className="absolute inset-0">
          <div className="absolute bottom-10 left-10 w-20 h-20 bg-white/10 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-float floating-element"></div>
          <div className="absolute top-20 left-20 w-16 h-16 bg-white/15 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-bounce-slow floating-element" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="relative z-10 flex items-start justify-center min-h-screen pt-20 md:pt-32">
          {/* Text positioned on LEFT SIDE as per image layout - MOVED UP */}
          <div className="max-w-7xl mx-auto mobile-container w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* LEFT SIDE - Primary text area (60% of image width available) */}
              <div className="text-left animate-fade-in lg:pr-8 mt-4 md:mt-8">
                <h1 className="mobile-heading text-4xl md:text-6xl lg:text-7xl font-black mb-8 text-white leading-[0.9] tracking-tight text-shadow-lg animate-scale-in">
                  Fly Smarter,
                  <span className="block text-white drop-shadow-2xl">
                    Travel Faster
                  </span>
                </h1>
                
                {/* Primary CTA Buttons in Left Area */}
                <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{animationDelay: '0.3s'}}>
                  <Link href="/flights" className="btn-primary btn-mobile-perfect flex items-center justify-center text-lg shadow-2xl red-glow hover-lift btn-press group">
                    <AirplaneIcon className="h-6 w-6 mr-3 group-hover:rotate-12 transition-transform duration-300" />
                    <span>Book Flights ✈️</span>
                  </Link>
                  <Link href="/packages" className="glass-card bg-white/90 backdrop-blur-sm text-red-600 hover:bg-white btn-mobile-perfect flex items-center justify-center text-lg font-bold shadow-2xl border-2 border-white/50 hover:border-red-300 transition-all hover-lift btn-press group">
                    <GlobeAltIcon className="h-6 w-6 mr-3 group-hover:scale-110 transition-transform duration-300" />
                    <span>Explore Packages 🌍</span>
                  </Link>
                </div>
              </div>

              {/* RIGHT SIDE - Airplane area, minimal content to avoid covering plane */}
              <div className="lg:text-right animate-slide-up hidden lg:block mt-16" style={{animationDelay: '0.5s'}}>
                <div className="text-right space-y-4">
                  {/* Content removed to keep airplane area clean */}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Modern Search Card - positioned properly to avoid covering buttons */}
        <div className="absolute bottom-4 left-0 right-0 z-20">
          <div className="max-w-5xl mx-auto mobile-container">
            <div className="glass-card bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-4 md:p-6 border border-red-100 card-hover red-shadow-lg animate-scale-in">
              {/* Search Type Tabs */}
              <div className="flex flex-wrap justify-center border-b border-red-100 mb-4">
                {[
                  { type: 'flights', icon: AirplaneIcon, label: 'Flights', emoji: '✈️' },
                  { type: 'hotels', icon: BuildingLibraryIcon, label: 'Hotels', emoji: '🏨' },
                  { type: 'packages', icon: GlobeAltIcon, label: 'Packages', emoji: '📦' }
                ].map(({ type, icon: Icon, label, emoji }) => (
                  <button
                    key={type}
                    onClick={() => setSearchType(type)}
                    className={`flex items-center space-x-2 px-4 py-2 border-b-3 font-bold transition-all duration-300 hover-lift ${
                      searchType === type
                        ? 'border-red-500 text-red-600 bg-red-50 red-shadow'
                        : 'border-transparent text-gray-600 hover:text-red-600 hover:bg-red-50'
                    } rounded-t-xl`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline text-sm">{label}</span>
                    <span className="sm:hidden text-sm">{emoji}</span>
                  </button>
                ))}
              </div>

              {/* Search Forms */}
              <form onSubmit={handleSearch}>
                {searchType === 'flights' && (
                  <div className="search-form-grid grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="relative">
                      <label className="block text-xs font-bold text-gray-700 mb-1">✈️ From</label>
                      <input
                        type="text"
                        placeholder="Departure city"
                        value={searchData.flights.from}
                        onChange={(e) => handleInputChange('from', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all duration-300 bg-white shadow-sm hover:shadow-md text-sm"
                        required
                      />
                      {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-red-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                          {suggestions.map((suggestion, index) => (
                            <div
                              key={index}
                              className="px-3 py-2 hover:bg-red-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                              onClick={() => handleSuggestionClick(suggestion, 'from')}
                            >
                              {suggestion}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <label className="block text-xs font-bold text-gray-700 mb-1">🎯 To</label>
                      <input
                        type="text"
                        placeholder="Destination city"
                        value={searchData.flights.to}
                        onChange={(e) => handleInputChange('to', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all duration-300 bg-white shadow-sm hover:shadow-md text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">📅 Date</label>
                      <input
                        type="date"
                        value={searchData.flights.date}
                        onChange={(e) => handleInputChange('date', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all duration-300 bg-white shadow-sm hover:shadow-md text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">👥 Passengers</label>
                      <select 
                        value={searchData.flights.passengers}
                        onChange={(e) => handleInputChange('passengers', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all duration-300 bg-white shadow-sm hover:shadow-md text-sm"
                      >
                        <option value="1">1 Passenger</option>
                        <option value="2">2 Passengers</option>
                        <option value="3">3+ Passengers</option>
                      </select>
                    </div>
                  </div>
                )}

                {searchType === 'hotels' && (
                  <div className="search-form-grid grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="relative">
                      <label className="block text-xs font-bold text-gray-700 mb-1">🏨 Location</label>
                      <input
                        type="text"
                        placeholder="Where to stay?"
                        value={searchData.hotels.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all duration-300 bg-white shadow-sm hover:shadow-md text-sm"
                        required
                      />
                      {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-red-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                          {suggestions.map((suggestion, index) => (
                            <div
                              key={index}
                              className="px-3 py-2 hover:bg-red-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                              onClick={() => handleSuggestionClick(suggestion, 'location')}
                            >
                              {suggestion}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">📅 Check-in</label>
                      <input
                        type="date"
                        value={searchData.hotels.checkin}
                        onChange={(e) => handleInputChange('checkin', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all duration-300 bg-white shadow-sm hover:shadow-md text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">📅 Check-out</label>
                      <input
                        type="date"
                        value={searchData.hotels.checkout}
                        onChange={(e) => handleInputChange('checkout', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all duration-300 bg-white shadow-sm hover:shadow-md text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">👥 Guests</label>
                      <select 
                        value={searchData.hotels.guests}
                        onChange={(e) => handleInputChange('guests', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all duration-300 bg-white shadow-sm hover:shadow-md text-sm"
                      >
                        <option value="1">1 Guest</option>
                        <option value="2">2 Guests</option>
                        <option value="3">3+ Guests</option>
                      </select>
                    </div>
                  </div>
                )}

                {searchType === 'packages' && (
                  <div className="search-form-grid grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="relative">
                      <label className="block text-xs font-bold text-gray-700 mb-1">📦 Destination</label>
                      <input
                        type="text"
                        placeholder="Where to go?"
                        value={searchData.packages.destination}
                        onChange={(e) => handleInputChange('destination', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all duration-300 bg-white shadow-sm hover:shadow-md text-sm"
                        required
                      />
                      {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-red-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                          {suggestions.map((suggestion, index) => (
                            <div
                              key={index}
                              className="px-3 py-2 hover:bg-red-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                              onClick={() => handleSuggestionClick(suggestion, 'destination')}
                            >
                              {suggestion}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">📅 Departure</label>
                      <input
                        type="date"
                        value={searchData.packages.departure}
                        onChange={(e) => handleInputChange('departure', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all duration-300 bg-white shadow-sm hover:shadow-md text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">⏱️ Duration</label>
                      <select 
                        value={searchData.packages.duration}
                        onChange={(e) => handleInputChange('duration', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all duration-300 bg-white shadow-sm hover:shadow-md text-sm"
                      >
                        <option value="3-5 days">3-5 days</option>
                        <option value="6-10 days">6-10 days</option>
                        <option value="11+ days">11+ days</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">👥 Travelers</label>
                      <select 
                        value={searchData.packages.travelers}
                        onChange={(e) => handleInputChange('travelers', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all duration-300 bg-white shadow-sm hover:shadow-md text-sm"
                      >
                        <option value="1">1 Traveler</option>
                        <option value="2">2 Travelers</option>
                        <option value="3">3+ Travelers</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="flex justify-center mt-4">
                  <button 
                    type="submit"
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-red-500/30 flex items-center text-sm"
                  >
                    <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                    <span>Search {searchType === 'flights' ? 'Flights ✈️' : searchType === 'hotels' ? 'Hotels 🏨' : 'Packages 📦'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Destinations Slider Section */}
      <section className="section-spacing bg-white pt-32">
        <div className="max-w-7xl mx-auto mobile-container">
          <div className="text-center mb-20 animate-fade-in">
            <div className="inline-flex items-center bg-red-100 text-red-800 px-6 py-3 rounded-full text-sm font-bold shadow-lg mb-6 animate-pulse-red">
              <SparklesIcon className="h-5 w-5 mr-2" />
              Handpicked Premium Destinations
            </div>
            <h2 className="mobile-heading text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-6 tracking-tight animate-scale-in">
              Popular 
              <span className="gradient-text-red">Destinations</span>
            </h2>
            <p className="mobile-text text-xl text-gray-600 max-w-3xl mx-auto font-medium animate-slide-up">
              🌍 Discover amazing places around the world with our handpicked destinations and exclusive deals
            </p>
          </div>

          {/* Slider Container */}
          <div className="relative">
            <div className="overflow-x-auto scrollbar-hide" ref={destinationsRef}>
              <div className="flex space-x-6 pb-4" style={{width: 'max-content'}}>
                {destinations.map((destination, index) => (
                  <div key={index} className="group cursor-pointer card-hover flex-shrink-0 w-80 animate-slide-up" style={{animationDelay: `${index * 0.1}s`}}>
                    <div className="glass-card mobile-card p-0 overflow-hidden red-shadow hover-lift">
                      <div className="relative h-56 overflow-hidden rounded-t-3xl">
                        <Image
                          src={destination.image}
                          alt={destination.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                        <div className="absolute top-4 right-4">
                          <span className="red-gradient-bg text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-pulse-red">
                            {destination.continent}
                          </span>
                        </div>
                        <div className="absolute bottom-4 left-4">
                          <div className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-bold">
                            ⭐ Featured
                          </div>
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-black text-gray-900 mb-2">{destination.name}</h3>
                        <p className="text-gray-600 text-sm mb-4 font-medium">{destination.description}</p>
                        <div className="flex items-center justify-between">
                          <p className="gradient-text-red font-black text-lg">{destination.price}</p>
                          <button className="btn-primary px-6 py-2 text-sm font-bold shadow-lg red-glow hover-lift btn-press">
                            🌍 Explore
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Scroll indicators */}
            <div className="text-center mt-8">
              <div className="glass-card bg-red-50 inline-block px-6 py-3 rounded-full border border-red-200 red-shadow">
                <p className="text-red-600 text-sm font-bold">← Scroll to explore more destinations →</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Luxury Hotels Slider Section */}
      <section className="section-spacing subtle-red-gradient">
        <div className="max-w-7xl mx-auto mobile-container">
          <div className="text-center mb-20 animate-fade-in">
            <div className="inline-flex items-center bg-red-100 text-red-800 px-6 py-3 rounded-full text-sm font-bold shadow-lg mb-6 animate-pulse-red">
              <SparklesIcon className="h-5 w-5 mr-2" />
              Luxury Travel Experiences
            </div>
            <h2 className="mobile-heading text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-6 tracking-tight animate-scale-in">
              Luxury 
              <span className="gradient-text-red">Accommodations</span>
            </h2>
            <p className="mobile-text text-xl text-gray-600 max-w-3xl mx-auto font-medium animate-slide-up">
              🏨 Stay in the world's most beautiful hotels and resorts, carefully selected for exceptional service
            </p>
          </div>

          {/* Hotels Slider Container */}
          <div className="relative">
            <div className="overflow-x-auto scrollbar-hide" ref={hotelsRef}>
              <div className="flex space-x-6 pb-4" style={{width: 'max-content'}}>
                {hotels.map((hotel, index) => (
                  <div key={index} className="glass-card mobile-card p-0 overflow-hidden card-hover red-shadow flex-shrink-0 w-80 group animate-slide-up hover-lift" style={{animationDelay: `${index * 0.1}s`}}>
                    <div className="relative h-56 overflow-hidden rounded-t-3xl">
                      <Image
                        src={hotel.image}
                        alt={hotel.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                      <div className="absolute top-4 left-4">
                        <div className="flex items-center glass-card bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg border border-red-100">
                          <StarIcon className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                          <span className="text-sm font-black text-gray-900">{hotel.rating}</span>
                        </div>
                      </div>
                      <div className="absolute top-4 right-4">
                        <div className="red-gradient-bg text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg animate-pulse-red">
                          🏨 Premium
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-black text-gray-900 mb-3">{hotel.name}</h3>
                      <p className="text-gray-600 mb-4 flex items-center text-sm font-medium">
                        <MapPinIcon className="h-4 w-4 mr-2 text-red-500" />
                        {hotel.location}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-black gradient-text-red">{hotel.price}</span>
                        <button className="btn-primary px-6 py-3 text-sm font-bold shadow-lg red-glow hover-lift btn-press">
                          🏨 Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Scroll indicators */}
            <div className="text-center mt-8">
              <div className="glass-card bg-red-50 inline-block px-6 py-3 rounded-full border border-red-200 red-shadow">
                <p className="text-red-600 text-sm font-bold">← Scroll to explore more accommodations →</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-red-50 via-white to-red-50 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-red-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float floating-element"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-red-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-bounce-slow floating-element"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center bg-red-100 text-red-800 px-6 py-3 rounded-full text-sm font-bold shadow-lg mb-6 animate-pulse-red">
              <SparklesIcon className="h-5 w-5 mr-2" />
              Premium Travel Benefits
            </div>
            <h2 className="section-title text-4xl md:text-5xl font-black text-gray-900 mb-6 animate-scale-in">
              Why Choose <span className="gradient-text-red">FlightBooking?</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto font-medium animate-slide-up">
              🌟 Experience travel planning redefined with our premium features and exceptional service
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group animate-slide-up hover-lift">
              <div className="glass-card bg-white/70 p-8 rounded-3xl red-shadow border border-red-100 hover:red-shadow-lg transition-all duration-300">
                <div className="relative w-20 h-20 mx-auto mb-6 red-gradient-bg rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform animate-pulse-red">
                  <ShieldCheckIcon className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-4">🔒 Secure & Trusted</h3>
                <p className="text-gray-600 leading-relaxed font-medium">
                  Your safety is our priority. All transactions are encrypted and protected with industry-leading security measures.
                </p>
              </div>
            </div>

            <div className="text-center group animate-slide-up hover-lift" style={{animationDelay: '0.1s'}}>
              <div className="glass-card bg-white/70 p-8 rounded-3xl red-shadow border border-red-100 hover:red-shadow-lg transition-all duration-300">
                <div className="relative w-20 h-20 mx-auto mb-6 red-gradient-bg rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform animate-pulse-red">
                  <ClockIcon className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-4">⏰ 24/7 Support</h3>
                <p className="text-gray-600 leading-relaxed font-medium">
                  Our dedicated support team is available around the clock to assist you with any travel needs or concerns.
                </p>
              </div>
            </div>

            <div className="text-center group animate-slide-up hover-lift" style={{animationDelay: '0.2s'}}>
              <div className="glass-card bg-white/70 p-8 rounded-3xl red-shadow border border-red-100 hover:red-shadow-lg transition-all duration-300">
                <div className="relative w-20 h-20 mx-auto mb-6 red-gradient-bg rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform animate-pulse-red">
                  <StarIcon className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-4">💰 Best Price Guarantee</h3>
                <p className="text-gray-600 leading-relaxed font-medium">
                  Find a lower price elsewhere? We'll match it and give you an additional 5% off your booking.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section - Redesigned */}
      <section className="py-20 bg-gradient-to-br from-red-50 via-white to-red-50 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-red-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float floating-element"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-red-300 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-bounce-slow floating-element"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-red-100 rounded-full mix-blend-multiply filter blur-xl opacity-25 animate-float floating-element" style={{animationDelay: '3s'}}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20 animate-fade-in">
            <div className="inline-flex items-center bg-red-100 text-red-800 px-6 py-3 rounded-full text-sm font-bold shadow-lg mb-6 animate-pulse-red">
              <SparklesIcon className="h-5 w-5 mr-2" />
              Authentic Traveler Reviews
            </div>
            <h2 className="mobile-heading text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-6 tracking-tight animate-scale-in">
              What Our 
              <span className="gradient-text-red">Travelers Say</span>
            </h2>
            <p className="mobile-text text-xl text-gray-600 max-w-3xl mx-auto font-medium animate-slide-up">
              ⭐ Read authentic reviews from millions of satisfied customers who've trusted us with their premium travel experiences
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {/* Large Featured Testimonial */}
            <div className="lg:col-span-2 glass-card bg-white/80 backdrop-blur-sm rounded-3xl p-8 md:p-12 red-shadow-lg border border-red-100 hover-lift animate-slide-up">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
                <div className="relative">
                  <div className="w-20 h-20 red-gradient-bg rounded-2xl flex items-center justify-center shadow-xl animate-pulse-red">
                    <span className="text-white text-2xl font-black">SM</span>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                    <StarIcon className="h-5 w-5 text-white fill-current" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-black text-gray-900 mb-2">Sarah Martinez</h3>
                  <p className="text-red-600 font-bold mb-3">✈️ Business Traveler • Premium Member</p>
                  <div className="flex items-center space-x-2">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon key={i} className="h-5 w-5 fill-current" />
                      ))}
                    </div>
                    <span className="text-gray-600 font-medium text-sm">5.0 • Verified Review</span>
                  </div>
                </div>
                <div className="glass-card bg-red-50 px-4 py-2 rounded-full border border-red-200">
                  <span className="text-red-600 font-bold text-sm">🎯 Featured Review</span>
                </div>
              </div>
              <blockquote className="text-xl md:text-2xl text-gray-700 leading-relaxed font-medium italic mb-6">
                "FlightBooking transformed my European business trip into a seamless experience. The booking process was incredibly intuitive, and their premium customer service was exceptional when I needed to make last-minute changes. The attention to detail and personalized service made all the difference!"
              </blockquote>
              <div className="glass-card bg-red-50 inline-block px-6 py-3 rounded-xl border border-red-200">
                <p className="text-red-700 font-bold text-sm">💰 Saved $1,200 on premium business class flights to 5 European cities</p>
              </div>
            </div>

            {/* Smaller Testimonials */}
            <div className="glass-card bg-white/70 backdrop-blur-sm rounded-3xl p-6 red-shadow border border-red-100 hover-lift animate-slide-up" style={{animationDelay: '0.1s'}}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 red-gradient-bg rounded-xl flex items-center justify-center shadow-lg animate-pulse-red">
                  <span className="text-white text-lg font-black">DJ</span>
                </div>
                <div>
                  <h4 className="text-xl font-black text-gray-900">David Johnson</h4>
                  <p className="text-red-600 font-bold">🏖️ Family Vacation</p>
                  <div className="flex text-yellow-400 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed font-medium mb-4">
                "Planned our family vacation to Bali through FlightBooking. The hotel recommendations were perfect, and we saved over $800 compared to other booking sites. Highly recommend!"
              </p>
              <div className="glass-card bg-green-50 inline-block px-4 py-2 rounded-full border border-green-200">
                <span className="text-green-700 font-bold text-sm">💚 Saved $800</span>
              </div>
            </div>

            <div className="glass-card bg-white/70 backdrop-blur-sm rounded-3xl p-6 red-shadow border border-red-100 hover-lift animate-slide-up" style={{animationDelay: '0.2s'}}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 red-gradient-bg rounded-xl flex items-center justify-center shadow-lg animate-pulse-red">
                  <span className="text-white text-lg font-black">EC</span>
                </div>
                <div>
                  <h4 className="text-xl font-black text-gray-900">Emily Chen</h4>
                  <p className="text-red-600 font-bold">🌏 Solo Traveler</p>
                  <div className="flex text-yellow-400 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed font-medium mb-4">
                "As a solo female traveler, safety is my priority. FlightBooking's verified hotel partners and 24/7 support gave me confidence throughout my journey across Southeast Asia."
              </p>
              <div className="glass-card bg-blue-50 inline-block px-4 py-2 rounded-full border border-blue-200">
                <span className="text-blue-700 font-bold text-sm">🔒 Safe Travel</span>
              </div>
            </div>
          </div>

          {/* Stats and Trust Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-fade-in" style={{animationDelay: '0.3s'}}>
            <div className="text-center glass-card bg-white/60 p-6 rounded-2xl border border-red-100 red-shadow hover-lift">
              <div className="text-3xl font-black gradient-text-red mb-2">500K+</div>
              <p className="text-gray-600 font-bold text-sm">Happy Travelers</p>
            </div>
            <div className="text-center glass-card bg-white/60 p-6 rounded-2xl border border-red-100 red-shadow hover-lift">
              <div className="text-3xl font-black gradient-text-red mb-2">4.9★</div>
              <p className="text-gray-600 font-bold text-sm">Average Rating</p>
            </div>
            <div className="text-center glass-card bg-white/60 p-6 rounded-2xl border border-red-100 red-shadow hover-lift">
              <div className="text-3xl font-black gradient-text-red mb-2">98%</div>
              <p className="text-gray-600 font-bold text-sm">Satisfaction Rate</p>
            </div>
            <div className="text-center glass-card bg-white/60 p-6 rounded-2xl border border-red-100 red-shadow hover-lift">
              <div className="text-3xl font-black gradient-text-red mb-2">24/7</div>
              <p className="text-gray-600 font-bold text-sm">Premium Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Travel Blog Preview */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Travel Inspiration
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover hidden gems, travel tips, and inspiring stories from our community of explorers
            </p>
          </div>

          <div className="card-grid grid grid-cols-1 md:grid-cols-3 gap-8">
            <article className="bg-white rounded-2xl shadow-lg overflow-hidden card-hover group">
              <div className="relative h-48">
                <Image
                  src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=500&q=80"
                  alt="Mountain landscape"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6">
                <div className="text-blue-600 text-sm font-semibold mb-2">ADVENTURE TRAVEL</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Hidden Hiking Trails in the Swiss Alps</h3>
                <p className="text-gray-600 mb-4">Discover breathtaking mountain paths that only locals know about, complete with stunning views and cozy mountain huts.</p>
                <Link href="/blog/swiss-alps-hiking" className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center">
                  Read More
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </article>

            <article className="bg-white rounded-2xl shadow-lg overflow-hidden card-hover group">
              <div className="relative h-48">
                <Image
                  src="https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=500&q=80"
                  alt="Japanese cuisine"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6">
                <div className="text-green-600 text-sm font-semibold mb-2">FOOD & CULTURE</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Tokyo's Best Street Food Markets</h3>
                <p className="text-gray-600 mb-4">A food lover's guide to authentic Japanese street food, from traditional ramen to modern fusion delicacies.</p>
                <Link href="/blog/tokyo-street-food" className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center">
                  Read More
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </article>

            <article className="bg-white rounded-2xl shadow-lg overflow-hidden card-hover group">
              <div className="relative h-48">
                <Image
                  src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&q=80"
                  alt="Tropical beach"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6">
                <div className="text-purple-600 text-sm font-semibold mb-2">LUXURY TRAVEL</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Maldives: Ultimate Resort Guide</h3>
                <p className="text-gray-600 mb-4">Explore the most exclusive overwater villas and private islands for an unforgettable luxury escape.</p>
                <Link href="/blog/maldives-resorts" className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center">
                  Read More
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </article>
          </div>

          <div className="text-center mt-12">
            <Link href="/blog" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg">
              View All Articles
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 subtle-red-gradient relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-red-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float floating-element"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-red-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-bounce-slow floating-element"></div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="animate-fade-in">
            <div className="inline-flex items-center bg-red-100 text-red-800 px-6 py-3 rounded-full text-sm font-bold shadow-lg mb-6 animate-pulse-red">
              <SparklesIcon className="h-5 w-5 mr-2" />
              Exclusive Travel Deals
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-gray-900 animate-scale-in">
              Never Miss a <span className="gradient-text-red">Deal</span>
            </h2>
            <p className="text-xl mb-8 text-gray-600 leading-relaxed font-medium animate-slide-up">
              📧 Subscribe to our newsletter and get exclusive travel deals, insider tips, and destination inspiration delivered to your inbox
            </p>
          </div>
          
          <div className="max-w-md mx-auto animate-slide-up" style={{animationDelay: '0.3s'}}>
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                placeholder="Enter your email address"
                className="input-field flex-1 hover:shadow-red-500/20"
              />
              <button className="btn-primary px-8 py-4 font-bold shadow-2xl red-glow hover-lift btn-press">
                📧 Subscribe
              </button>
            </div>
            <div className="glass-card bg-white/60 backdrop-blur-sm inline-block px-4 py-2 rounded-full mt-4 border border-red-100">
              <p className="text-sm text-gray-600 font-medium">
                ✨ Join 500,000+ travelers. No spam, unsubscribe anytime.
              </p>
            </div>
          </div>
        </div>
      </section>


      <Footer />
    </div>
  );
}