'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/auth-simple';
import { useRouter } from 'next/navigation';
import { 
  UserIcon, 
  Bars3Icon, 
  XMarkIcon,
  PaperAirplaneIcon as AirplaneIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-white/95 backdrop-blur-lg red-shadow-lg sticky top-0 z-50 border-b border-red-100 animate-slide-up">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 group hover-lift">
              <div className="relative red-gradient-bg rounded-xl p-2 shadow-lg red-glow animate-pulse-red">
                <AirplaneIcon className="h-8 w-8 text-white group-hover:text-red-100 transition-colors duration-300" />
              </div>
              <div>
                <span className="text-2xl font-black text-gray-900 group-hover:text-red-600 transition-colors">
                  FlightBooking
                </span>
                <div className="text-xs text-red-600 font-bold">Premium Travel Experience</div>
              </div>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/flights" className="text-gray-700 hover:text-red-600 transition-colors font-bold relative group hover-lift">
              Flights
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 red-gradient-bg group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link href="/hotels" className="text-gray-700 hover:text-red-600 transition-colors font-bold relative group hover-lift">
              Hotels
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 red-gradient-bg group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link href="/packages" className="text-gray-700 hover:text-red-600 transition-colors font-bold relative group hover-lift">
              Packages
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 red-gradient-bg group-hover:w-full transition-all duration-300"></span>
            </Link>
            
            {/* Protected Links - Only show when logged in */}
            {user && (
              <>
                {user.is_admin && (
                  <Link href="/franchise" className="text-gray-700 hover:text-red-600 transition-colors font-bold relative group hover-lift">
                    Franchise
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 red-gradient-bg group-hover:w-full transition-all duration-300"></span>
                  </Link>
                )}
                <Link href="/referral" className="text-gray-700 hover:text-red-600 transition-colors font-bold relative group hover-lift">
                  Referral
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 red-gradient-bg group-hover:w-full transition-all duration-300"></span>
                </Link>
                <Link href="/wallet" className="text-gray-700 hover:text-red-600 transition-colors font-bold relative group hover-lift">
                  Wallet
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 red-gradient-bg group-hover:w-full transition-all duration-300"></span>
                </Link>
              </>
            )}

            {user ? (
              <div className="flex items-center space-x-6">
                <Link href="/bookings" className="text-gray-700 hover:text-red-600 transition-colors font-bold hover-lift">
                  My Trips
                </Link>
                <div className="relative group">
                  <button className="flex items-center space-x-2 glass-card bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition-all red-shadow hover-lift">
                    <div className="w-8 h-8 red-gradient-bg rounded-full flex items-center justify-center animate-pulse-red">
                      <UserIcon className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-bold text-gray-700">{user.full_name}</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-56 glass-card red-shadow py-2 hidden group-hover:block border border-red-100 animate-scale-in">
                    <Link href="/profile" className="block px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors rounded-lg mx-2 font-medium">
                      Profile Settings
                    </Link>
                    <Link href="/bookings" className="block px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors rounded-lg mx-2 font-medium">
                      My Bookings
                    </Link>
                    <hr className="my-2 border-red-100" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-lg mx-2 font-bold"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/login" className="text-gray-700 hover:text-red-600 transition-colors font-bold hover-lift">
                  Sign In
                </Link>
                <Link href="/register" className="btn-primary px-6 py-3 text-sm font-bold shadow-2xl red-glow hover-lift btn-press">
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="text-gray-700 hover:text-red-600 transition-colors p-2 rounded-xl hover:bg-red-50 red-shadow"
            >
              {isMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden animate-slide-up">
            <div className="px-2 pt-2 pb-4 space-y-2 bg-white border-t border-red-100 red-shadow">
              <Link href="/flights" className="block px-4 py-3 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-bold hover-lift">
                ✈️ Flights
              </Link>
              <Link href="/hotels" className="block px-4 py-3 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-bold hover-lift">
                🏨 Hotels
              </Link>
              <Link href="/packages" className="block px-4 py-3 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-bold hover-lift">
                📦 Packages
              </Link>
              
              {/* Protected Links - Only show when logged in */}
              {user && (
                <>
                  {user.is_admin && (
                    <Link href="/franchise" className="block px-4 py-3 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-bold hover-lift">
                      🏢 Franchise Portal
                    </Link>
                  )}
                  <Link href="/referral" className="block px-4 py-3 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-bold hover-lift">
                    🎁 Referral Program
                  </Link>
                  <Link href="/wallet" className="block px-4 py-3 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-bold hover-lift">
                    💳 Membership Wallet
                  </Link>
                </>
              )}

              {user ? (
                <>
                  <Link href="/bookings" className="block px-4 py-3 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-bold hover-lift">
                    📋 My Bookings
                  </Link>
                  <Link href="/profile" className="block px-4 py-3 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-bold hover-lift">
                    👤 Profile
                  </Link>
                  <hr className="my-2 border-red-100" />
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all font-bold"
                  >
                    🚪 Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="block px-4 py-3 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-bold hover-lift">
                    🔐 Sign In
                  </Link>
                  <Link href="/register" className="block px-4 py-3 btn-primary text-white font-bold rounded-xl transition-all mx-2 text-center shadow-xl red-glow hover-lift btn-press">
                    🚀 Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;