'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
              <div className="relative rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <Image 
                  src="/logo.png" 
                  alt="TripyVerse Logo" 
                  width={48} 
                  height={48}
                  className="rounded-xl group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div>
                <span className="text-2xl font-black gradient-text-red group-hover:scale-105 transition-transform">
                  TripyVerse
                </span>
                <div className="text-xs text-red-600 font-bold">Your Ultimate Travel Universe</div>
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
                <Link href="/membership" className="text-gray-700 hover:text-red-600 transition-colors font-bold relative group hover-lift">
                  Club
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
                  <button className="flex items-center space-x-2 glass-card bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-xl transition-all red-shadow hover-lift">
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
                <Link href="/register" className="px-6 py-3 text-sm font-bold shadow-2xl red-glow hover-lift btn-press bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-2xl transition-all duration-300 transform hover:scale-105">
                  Join Universe
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
                  <Link href="/membership" className="block px-4 py-3 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-bold hover-lift">
                    👑 Club Membership
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
                  <Link href="/register" className="block px-4 py-3 text-white font-bold rounded-xl transition-all mx-2 text-center shadow-xl red-glow hover-lift btn-press bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700">
                    🌟 Join TripyVerse
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