'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-simple';
import { 
  UserIcon, 
  Bars3Icon, 
  XMarkIcon,
  PaperAirplaneIcon as AirplaneIcon,
  HomeIcon,
  CalendarDaysIcon,
  BuildingOfficeIcon,
  GlobeAltIcon,
  WalletIcon,
  UserCircleIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  GiftIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Flights', href: '/flights', icon: AirplaneIcon },
    { name: 'Hotels', href: '/hotels', icon: BuildingOfficeIcon },
    { name: 'Packages', href: '/packages', icon: GlobeAltIcon },
    { name: 'My Bookings', href: '/bookings', icon: CalendarDaysIcon },
    { name: 'Wallet', href: '/wallet', icon: WalletIcon },
    { name: 'Referral', href: '/referral', icon: GiftIcon },
    ...(user?.is_admin ? [{ name: 'Franchise', href: '/franchise', icon: BuildingStorefrontIcon }] : []),
    { name: 'Profile', href: '/profile', icon: UserCircleIcon },
  ];

  const isActive = (href: string) => pathname === href;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center p-4' : 'justify-between p-6'} border-b border-gray-200`}>
        <Link href="/dashboard" className="flex items-center space-x-3">
          <div className="relative">
            <AirplaneIcon className="h-8 w-8 text-blue-600" />
          </div>
          {!isCollapsed && (
            <div>
              <span className="text-xl font-bold text-gray-900">FlightBooking</span>
              <div className="text-xs text-gray-500 font-medium">Premium Travel</div>
            </div>
          )}
        </Link>
        
        {/* Desktop Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:block p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {isCollapsed ? (
            <ChevronRightIcon className="h-5 w-5 text-gray-600" />
          ) : (
            <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
          )}
        </button>

        {/* Mobile Close Button */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <XMarkIcon className="h-6 w-6 text-gray-600" />
        </button>
      </div>

      {/* User Info */}
      <div className={`${isCollapsed ? 'p-3' : 'p-6'} border-b border-gray-200`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <UserIcon className="h-6 w-6 text-blue-600" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.full_name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center ${isCollapsed ? 'justify-center p-3' : 'px-4 py-3'} text-sm font-medium rounded-lg transition-all duration-200 group ${
                active
                  ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
              }`}
              onClick={() => setIsMobileOpen(false)}
            >
              <Icon className={`${isCollapsed ? 'h-6 w-6' : 'h-5 w-5 mr-3'} ${active ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'} transition-colors`} />
              {!isCollapsed && (
                <span className="truncate">{item.name}</span>
              )}
              {active && !isCollapsed && (
                <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className={`${isCollapsed ? 'p-3' : 'p-4'} border-t border-gray-200`}>
        <button
          onClick={handleLogout}
          className={`flex items-center w-full ${isCollapsed ? 'justify-center p-3' : 'px-4 py-3'} text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group`}
        >
          <ArrowRightOnRectangleIcon className={`${isCollapsed ? 'h-6 w-6' : 'h-5 w-5 mr-3'} transition-colors`} />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <AirplaneIcon className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">FlightBooking</span>
        </Link>
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Bars3Icon className="h-6 w-6 text-gray-600" />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-50 ${
        isCollapsed ? 'lg:w-20' : 'lg:w-64'
      } bg-white border-r border-gray-200 transition-all duration-300`}>
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMobileOpen(false)}
          />
          
          {/* Sidebar */}
          <div className="relative flex flex-col w-80 max-w-xs bg-white shadow-xl">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;