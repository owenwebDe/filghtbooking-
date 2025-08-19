'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  const [searchType, setSearchType] = useState('flights');

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

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      
      {/* Hero Section with Background Image */}
      <div className="relative min-h-screen overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="https://images.pexels.com/photos/162031/dubai-tower-arab-khalifa-162031.jpeg?w=1920&h=1080&fit=crop"
            alt="Dubai Skyline"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-white/70"></div>
        </div>
        
        {/* Floating Yellow Accents */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-yellow-400 rounded-full opacity-20 animate-float"></div>
          <div className="absolute top-40 right-20 w-40 h-40 bg-yellow-500 rounded-full opacity-15 animate-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-20 left-1/2 w-36 h-36 bg-yellow-300 rounded-full opacity-25 animate-float" style={{animationDelay: '4s'}}></div>
        </div>
        
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen pt-32 pb-20">
          <div className="max-w-7xl mx-auto mobile-container text-center">
            <h1 className="mobile-heading text-6xl md:text-7xl lg:text-8xl font-black mb-8 text-gray-900 leading-[0.9] tracking-tight">
              Your Perfect
              <span className="block text-yellow-600">
                Journey Awaits
              </span>
            </h1>
            
            <div className="hero-buttons flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <button className="btn-primary btn-mobile-perfect flex items-center justify-center text-lg">
                <AirplaneIcon className="h-6 w-6 mr-3" />
                Explore Flights
              </button>
              <button className="btn-outline btn-mobile-perfect flex items-center justify-center text-lg">
                <GlobeAltIcon className="h-6 w-6 mr-3" />
                View Packages
              </button>
            </div>
          </div>
          
          {/* Search Card - Now part of flex layout */}
          <div className="floating-search w-full max-w-6xl mx-auto px-4">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20 card-hover">
            {/* Search Type Tabs */}
            <div className="flex flex-wrap justify-center border-b border-gray-200 mb-8">
              {[
                { type: 'flights', icon: AirplaneIcon, label: 'Flights' },
                { type: 'hotels', icon: BuildingLibraryIcon, label: 'Hotels' },
                { type: 'packages', icon: GlobeAltIcon, label: 'Packages' }
              ].map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  onClick={() => setSearchType(type)}
                  className={`flex items-center space-x-2 px-6 py-3 border-b-3 font-semibold transition-all ${
                    searchType === type
                      ? 'border-yellow-500 text-yellow-600 bg-yellow-50'
                      : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-yellow-50'
                  } rounded-t-lg`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Search Forms */}
            {searchType === 'flights' && (
              <div className="search-form-grid grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Departure</label>
                  <input
                    type="text"
                    placeholder="From where?"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Destination</label>
                  <input
                    type="text"
                    placeholder="To where?"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Departure Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Passengers</label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                    <option>1 Passenger</option>
                    <option>2 Passengers</option>
                    <option>3+ Passengers</option>
                  </select>
                </div>
              </div>
            )}

            <div className="flex justify-center mt-8">
              <button className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-12 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg flex items-center">
                <MagnifyingGlassIcon className="h-6 w-6 mr-2" />
                Search {searchType === 'flights' ? 'Flights' : searchType === 'hotels' ? 'Hotels' : 'Packages'}
              </button>
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Popular Destinations Slider Section */}
      <section className="section-spacing bg-white">
        <div className="max-w-7xl mx-auto mobile-container">
          <div className="text-center mb-20">
            <h2 className="mobile-heading text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-6 tracking-tight">
              Popular 
              <span className="text-yellow-600">Destinations</span>
            </h2>
            <p className="mobile-text text-xl text-gray-600 max-w-3xl mx-auto font-medium">
              Discover amazing places around the world with our handpicked destinations and exclusive deals
            </p>
          </div>

          {/* Slider Container */}
          <div className="relative">
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex space-x-6 pb-4" style={{width: 'max-content'}}>
                {destinations.map((destination, index) => (
                  <div key={index} className="group cursor-pointer card-hover flex-shrink-0 w-80">
                    <div className="glass-card mobile-card p-0 overflow-hidden yellow-shadow">
                      <div className="relative h-56 overflow-hidden">
                        <Image
                          src={destination.image}
                          alt={destination.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/20"></div>
                        <div className="absolute top-4 right-4">
                          <span className="bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                            {destination.continent}
                          </span>
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{destination.name}</h3>
                        <p className="text-gray-600 text-sm mb-3">{destination.description}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-yellow-600 font-bold text-lg">{destination.price}</p>
                          <button className="btn-outline px-4 py-2 text-sm">
                            Explore
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Scroll indicators */}
            <div className="text-center mt-6">
              <p className="text-gray-500 text-sm">← Scroll to explore more destinations →</p>
            </div>
          </div>
        </div>
      </section>

      {/* Luxury Hotels Slider Section */}
      <section className="section-spacing bg-yellow-50">
        <div className="max-w-7xl mx-auto mobile-container">
          <div className="text-center mb-20">
            <h2 className="mobile-heading text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-6 tracking-tight">
              Luxury 
              <span className="text-yellow-600">Accommodations</span>
            </h2>
            <p className="mobile-text text-xl text-gray-600 max-w-3xl mx-auto font-medium">
              Stay in the world's most beautiful hotels and resorts, carefully selected for exceptional service
            </p>
          </div>

          {/* Hotels Slider Container */}
          <div className="relative">
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex space-x-6 pb-4" style={{width: 'max-content'}}>
                {hotels.map((hotel, index) => (
                  <div key={index} className="glass-card mobile-card p-0 overflow-hidden card-hover yellow-shadow flex-shrink-0 w-80 group">
                    <div className="relative h-56 overflow-hidden">
                      <Image
                        src={hotel.image}
                        alt={hotel.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute top-4 left-4">
                        <div className="flex items-center bg-white px-3 py-1 rounded-full shadow-lg">
                          <StarIcon className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                          <span className="text-sm font-bold text-gray-900">{hotel.rating}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{hotel.name}</h3>
                      <p className="text-gray-600 mb-4 flex items-center text-sm">
                        <MapPinIcon className="h-4 w-4 mr-2 text-yellow-500" />
                        {hotel.location}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold text-yellow-600">{hotel.price}</span>
                        <button className="btn-primary px-6 py-2 text-sm">
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Scroll indicators */}
            <div className="text-center mt-6">
              <p className="text-gray-500 text-sm">← Scroll to explore more accommodations →</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why Choose FlightBooking?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience travel planning redefined with our premium features and exceptional service
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="relative w-24 h-24 mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Image
                  src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=200&q=80"
                  alt="Security and Trust"
                  fill
                  className="object-cover rounded-2xl shadow-lg"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-2xl"></div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Secure & Trusted</h3>
              <p className="text-gray-600 leading-relaxed">
                Your safety is our priority. All transactions are encrypted and protected with industry-leading security measures.
              </p>
            </div>

            <div className="text-center group">
              <div className="relative w-24 h-24 mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Image
                  src="https://images.unsplash.com/photo-1559523161-0fc0d8b38a7a?w=200&q=80"
                  alt="24/7 Customer Support"
                  fill
                  className="object-cover rounded-2xl shadow-lg"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-blue-600/20 rounded-2xl"></div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">24/7 Support</h3>
              <p className="text-gray-600 leading-relaxed">
                Our dedicated support team is available around the clock to assist you with any travel needs or concerns.
              </p>
            </div>

            <div className="text-center group">
              <div className="relative w-24 h-24 mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Image
                  src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=200&q=80"
                  alt="Best Price Guarantee"
                  fill
                  className="object-cover rounded-2xl shadow-lg"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-2xl"></div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Best Price Guarantee</h3>
              <p className="text-gray-600 leading-relaxed">
                Find a lower price elsewhere? We'll match it and give you an additional 5% off your booking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              What Our Travelers Say
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Read authentic reviews from millions of satisfied customers who've trusted us with their journeys
            </p>
          </div>

          <div className="testimonial-grid grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white text-xl font-bold">SM</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Sarah Martinez</h4>
                  <p className="text-gray-600">Business Traveler</p>
                  <div className="flex text-yellow-400 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">
                "FlightBooking made my European business trip seamless. The booking process was intuitive, and their customer service was exceptional when I needed to make last-minute changes."
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white text-xl font-bold">DJ</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">David Johnson</h4>
                  <p className="text-gray-600">Family Vacation</p>
                  <div className="flex text-yellow-400 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">
                "Planned our family vacation to Bali through FlightBooking. The hotel recommendations were perfect, and we saved over $800 compared to other booking sites. Highly recommend!"
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white text-xl font-bold">EC</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Emily Chen</h4>
                  <p className="text-gray-600">Solo Traveler</p>
                  <div className="flex text-yellow-400 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">
                "As a solo female traveler, safety is my priority. FlightBooking's verified hotel partners and 24/7 support gave me confidence throughout my journey across Southeast Asia."
              </p>
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
      <section className="py-20 bg-yellow-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">Never Miss a Deal</h2>
          <p className="text-xl mb-8 text-gray-600 leading-relaxed">
            Subscribe to our newsletter and get exclusive travel deals, insider tips, and destination inspiration delivered to your inbox
          </p>
          
          <div className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 px-6 py-4 rounded-xl text-gray-900 border-2 border-gray-200 focus:outline-none focus:border-yellow-400 transition-all"
              />
              <button className="bg-yellow-400 text-gray-900 hover:bg-yellow-500 px-8 py-4 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg">
                Subscribe
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Join 500,000+ travelers. No spam, unsubscribe anytime.
            </p>
          </div>
        </div>
      </section>


      <Footer />
    </div>
  );
}