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
    <nav className="bg-white/95 backdrop-blur-lg shadow-xl sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <AirplaneIcon className="h-10 w-10 text-yellow-600 group-hover:text-yellow-700 transition-colors duration-300" />
              </div>
              <div>
                <span className="text-2xl font-bold text-gray-900">
                  FlightBooking
                </span>
                <div className="text-xs text-gray-500 font-medium">Premium Travel</div>
              </div>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/flights" className="text-gray-700 hover:text-yellow-600 transition-colors font-medium relative group">
              Flights
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-yellow-400 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link href="/hotels" className="text-gray-700 hover:text-yellow-600 transition-colors font-medium relative group">
              Hotels
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-yellow-400 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link href="/packages" className="text-gray-700 hover:text-yellow-600 transition-colors font-medium relative group">
              Packages
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-yellow-400 group-hover:w-full transition-all duration-300"></span>
            </Link>
            
            {/* Protected Links - Only show when logged in */}
            {user && (
              <>
                {user.is_admin && (
                  <Link href="/franchise" className="text-gray-700 hover:text-yellow-600 transition-colors font-medium relative group">
                    Franchise
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-yellow-400 group-hover:w-full transition-all duration-300"></span>
                  </Link>
                )}
                <Link href="/referral" className="text-gray-700 hover:text-yellow-600 transition-colors font-medium relative group">
                  Referral
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-yellow-400 group-hover:w-full transition-all duration-300"></span>
                </Link>
                <Link href="/wallet" className="text-gray-700 hover:text-yellow-600 transition-colors font-medium relative group">
                  Wallet
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-yellow-400 group-hover:w-full transition-all duration-300"></span>
                </Link>
              </>
            )}

            {user ? (
              <div className="flex items-center space-x-6">
                <Link href="/dashboard" className="text-gray-700 hover:text-yellow-600 transition-colors font-medium">
                  Dashboard
                </Link>
                <Link href="/bookings" className="text-gray-700 hover:text-yellow-600 transition-colors font-medium">
                  My Trips
                </Link>
                <div className="relative group">
                  <button className="flex items-center space-x-2 bg-yellow-50 hover:bg-yellow-100 px-4 py-2 rounded-xl transition-all">
                    <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                      <UserIcon className="h-4 w-4 text-gray-900" />
                    </div>
                    <span className="font-medium text-gray-700">{user.full_name}</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl py-2 hidden group-hover:block border border-gray-100">
                    <Link href="/dashboard" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded-lg mx-2">
                      Dashboard
                    </Link>
                    <Link href="/profile" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded-lg mx-2">
                      Profile Settings
                    </Link>
                    <Link href="/bookings" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded-lg mx-2">
                      My Bookings
                    </Link>
                    <hr className="my-2 border-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-lg mx-2"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/login" className="text-gray-700 hover:text-yellow-600 transition-colors font-medium">
                  Sign In
                </Link>
                <Link href="/register" className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg">
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="text-gray-700 hover:text-yellow-600 transition-colors p-2 rounded-xl hover:bg-yellow-50"
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
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-4 space-y-2 bg-white border-t border-gray-100">
              <Link href="/flights" className="block px-4 py-3 text-gray-700 hover:text-yellow-600 hover:bg-yellow-50 rounded-xl transition-all">
                Flights
              </Link>
              <Link href="/hotels" className="block px-4 py-3 text-gray-700 hover:text-yellow-600 hover:bg-yellow-50 rounded-xl transition-all">
                Hotels
              </Link>
              <Link href="/packages" className="block px-4 py-3 text-gray-700 hover:text-yellow-600 hover:bg-yellow-50 rounded-xl transition-all">
                Packages
              </Link>
              
              {/* Protected Links - Only show when logged in */}
              {user && (
                <>
                  {user.is_admin && (
                    <Link href="/franchise" className="block px-4 py-3 text-gray-700 hover:text-yellow-600 hover:bg-yellow-50 rounded-xl transition-all">
                      Franchise Portal
                    </Link>
                  )}
                  <Link href="/referral" className="block px-4 py-3 text-gray-700 hover:text-yellow-600 hover:bg-yellow-50 rounded-xl transition-all">
                    Referral Program
                  </Link>
                  <Link href="/wallet" className="block px-4 py-3 text-gray-700 hover:text-yellow-600 hover:bg-yellow-50 rounded-xl transition-all">
                    Membership Wallet
                  </Link>
                </>
              )}

              {user ? (
                <>
                  <Link href="/dashboard" className="block px-4 py-3 text-gray-700 hover:text-yellow-600 hover:bg-yellow-50 rounded-xl transition-all">
                    Dashboard
                  </Link>
                  <Link href="/bookings" className="block px-4 py-3 text-gray-700 hover:text-yellow-600 hover:bg-yellow-50 rounded-xl transition-all">
                    My Bookings
                  </Link>
                  <Link href="/profile" className="block px-4 py-3 text-gray-700 hover:text-yellow-600 hover:bg-yellow-50 rounded-xl transition-all">
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="block px-4 py-3 text-gray-700 hover:text-yellow-600 hover:bg-yellow-50 rounded-xl transition-all">
                    Sign In
                  </Link>
                  <Link href="/register" className="block px-4 py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-xl transition-all mx-2 text-center">
                    Get Started
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