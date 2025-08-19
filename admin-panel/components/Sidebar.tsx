'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon,
  AirplaneIcon,
  BuildingLibraryIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  CreditCardIcon,
  UsersIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const Sidebar: React.FC = () => {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Flights', href: '/flights', icon: AirplaneIcon },
    { name: 'Hotels', href: '/hotels', icon: BuildingLibraryIcon },
    { name: 'Packages', href: '/packages', icon: GlobeAltIcon },
    { name: 'Bookings', href: '/bookings', icon: DocumentTextIcon },
    { name: 'Payments', href: '/payments', icon: CreditCardIcon },
    { name: 'Users', href: '/users', icon: UsersIcon },
    { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  ];

  return (
    <div className="bg-white h-full shadow-lg">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <AirplaneIcon className="h-8 w-8 text-primary-600" />
          <span className="text-xl font-bold text-gray-900">Admin Panel</span>
        </div>
      </div>
      
      <nav className="mt-6">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;