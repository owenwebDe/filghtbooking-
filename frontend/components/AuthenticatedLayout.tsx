'use client';

import React, { useState } from 'react';
import { useAuth } from '../lib/auth-simple';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Define protected routes that should use sidebar navigation
  const protectedRoutes = [
    '/dashboard',
    '/bookings',
    '/profile',
    '/wallet',
    '/referral',
    '/franchise'
  ];

  // Check if current route is a protected route
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If user is not authenticated OR on public pages, show regular navbar
  if (!user || !isProtectedRoute) {
    return (
      <>
        {!pathname.startsWith('/login') && !pathname.startsWith('/register') && <Navbar />}
        {children}
      </>
    );
  }

  // If user is authenticated AND on protected route, show sidebar layout
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
      
      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AuthenticatedLayout;