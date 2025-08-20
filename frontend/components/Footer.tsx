'use client';

import React from 'react';
import Link from 'next/link';
import { PaperAirplaneIcon as AirplaneIcon } from '@heroicons/react/24/outline';

const Footer: React.FC = () => {
  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 text-white overflow-hidden animate-fade-in">
      {/* Animated Background Elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-red-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-float floating-element"></div>
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-red-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-bounce-slow floating-element"></div>
      <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-red-300 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-float floating-element"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-3 mb-6 group animate-scale-in">
              <div className="red-gradient-bg rounded-xl p-2 shadow-xl red-glow animate-pulse-red">
                <AirplaneIcon className="h-8 w-8 text-white group-hover:text-red-100 transition-colors duration-300" />
              </div>
              <div>
                <span className="text-2xl font-black gradient-text-red">FlightBooking</span>
                <div className="text-xs text-red-400 font-bold">Premium Travel Experience</div>
              </div>
            </div>
            <p className="text-gray-300 leading-relaxed font-medium">
              🌟 Your trusted premium partner for flights, luxury hotels, and unforgettable vacation packages worldwide. Experience travel like never before.
            </p>
            <div className="mt-6 glass-card bg-white/5 p-4 rounded-xl border border-red-500/20">
              <div className="text-red-400 font-bold mb-2">✨ Why Choose Us?</div>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>🔒 Secure & Safe Booking</li>
                <li>💳 Best Price Guarantee</li>
                <li>🎯 24/7 Premium Support</li>
              </ul>
            </div>
          </div>

          {/* Quick Links */}
          <div className="animate-slide-up" style={{animationDelay: '0.1s'}}>
            <h3 className="text-xl font-black text-white mb-6 gradient-text-red">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/flights" className="text-gray-300 hover:text-red-400 transition-all duration-300 font-medium hover-lift flex items-center space-x-2 group">
                  <span className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs group-hover:bg-red-400 transition-colors">✈️</span>
                  <span>Premium Flights</span>
                </Link>
              </li>
              <li>
                <Link href="/hotels" className="text-gray-300 hover:text-red-400 transition-all duration-300 font-medium hover-lift flex items-center space-x-2 group">
                  <span className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs group-hover:bg-red-400 transition-colors">🏨</span>
                  <span>Luxury Hotels</span>
                </Link>
              </li>
              <li>
                <Link href="/packages" className="text-gray-300 hover:text-red-400 transition-all duration-300 font-medium hover-lift flex items-center space-x-2 group">
                  <span className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs group-hover:bg-red-400 transition-colors">📦</span>
                  <span>Vacation Packages</span>
                </Link>
              </li>
              <li>
                <Link href="/wallet" className="text-gray-300 hover:text-red-400 transition-all duration-300 font-medium hover-lift flex items-center space-x-2 group">
                  <span className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs group-hover:bg-red-400 transition-colors">💳</span>
                  <span>Membership Wallet</span>
                </Link>
              </li>
              <li>
                <Link href="/bookings" className="text-gray-300 hover:text-red-400 transition-all duration-300 font-medium hover-lift flex items-center space-x-2 group">
                  <span className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs group-hover:bg-red-400 transition-colors">📋</span>
                  <span>My Bookings</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="animate-slide-up" style={{animationDelay: '0.2s'}}>
            <h3 className="text-xl font-black text-white mb-6 gradient-text-red">Premium Support</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/help" className="text-gray-300 hover:text-red-400 transition-all duration-300 font-medium hover-lift flex items-center space-x-2 group">
                  <span className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs group-hover:bg-red-400 transition-colors">💡</span>
                  <span>Help Center</span>
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-red-400 transition-all duration-300 font-medium hover-lift flex items-center space-x-2 group">
                  <span className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs group-hover:bg-red-400 transition-colors">📞</span>
                  <span>Contact Us</span>
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-300 hover:text-red-400 transition-all duration-300 font-medium hover-lift flex items-center space-x-2 group">
                  <span className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs group-hover:bg-red-400 transition-colors">🔒</span>
                  <span>Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-300 hover:text-red-400 transition-all duration-300 font-medium hover-lift flex items-center space-x-2 group">
                  <span className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs group-hover:bg-red-400 transition-colors">📜</span>
                  <span>Terms of Service</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="animate-slide-up" style={{animationDelay: '0.3s'}}>
            <h3 className="text-xl font-black text-white mb-6 gradient-text-red">Contact Info</h3>
            <div className="space-y-4">
              <div className="glass-card bg-white/5 p-4 rounded-xl border border-red-500/20 hover-lift">
                <div className="space-y-3 text-gray-300">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 red-gradient-bg rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">📞</span>
                    </div>
                    <div>
                      <div className="font-bold text-white">Phone Support</div>
                      <div className="text-sm">1-800-FLIGHTS</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 red-gradient-bg rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">✉️</span>
                    </div>
                    <div>
                      <div className="font-bold text-white">Email Support</div>
                      <div className="text-sm">support@flightbooking.com</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 red-gradient-bg rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">🕒</span>
                    </div>
                    <div>
                      <div className="font-bold text-white">Availability</div>
                      <div className="text-sm">24/7 Premium Support</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-red-500/20 mt-12 pt-8 text-center animate-fade-in" style={{animationDelay: '0.4s'}}>
          <div className="glass-card bg-white/5 inline-block px-8 py-4 rounded-xl border border-red-500/20 red-shadow">
            <p className="text-gray-300 font-medium">
              &copy; 2024 <span className="gradient-text-red font-bold">FlightBooking</span>. All rights reserved. 
              <span className="text-red-400 font-bold"> ✨ Premium Travel Experience</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;