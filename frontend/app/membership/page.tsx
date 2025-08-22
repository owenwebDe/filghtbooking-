'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-simple';
import { useRouter } from 'next/navigation';
import Footer from '../../components/Footer';
import toast from 'react-hot-toast';
import {
  StarIcon,
  TrophyIcon,
  SparklesIcon,
  CheckCircleIcon,
  GiftIcon,
  ShieldCheckIcon,
  ClockIcon,
  PaperAirplaneIcon,
  BuildingOffice2Icon,
  GlobeAltIcon,
  ArrowRightIcon,
  CurrencyDollarIcon,
  HeartIcon,
  PhoneIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

interface MembershipTier {
  id: string;
  name: string;
  price: number;
  duration: string;
  color: string;
  gradient: string;
  icon: any;
  popular: boolean;
  benefits: string[];
  discounts: {
    flights: number;
    hotels: number;
    packages: number;
  };
  points_multiplier: number;
  priority_support: boolean;
  exclusive_deals: boolean;
}

const ClubMembershipPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>('');

  // Membership tiers configuration
  const membershipTiers: MembershipTier[] = [
    {
      id: 'bronze',
      name: 'Bronze Explorer',
      price: 99,
      duration: 'per year',
      color: 'text-orange-600',
      gradient: 'from-orange-400 to-orange-600',
      icon: StarIcon,
      popular: false,
      benefits: [
        '5% discount on all flights',
        '3% discount on hotels',
        '2% cashback on bookings',
        'Priority customer support',
        'Early access to deals',
        'Free booking modifications'
      ],
      discounts: { flights: 5, hotels: 3, packages: 2 },
      points_multiplier: 1.5,
      priority_support: true,
      exclusive_deals: false
    },
    {
      id: 'silver',
      name: 'Silver Voyager',
      price: 199,
      duration: 'per year',
      color: 'text-gray-600',
      gradient: 'from-gray-400 to-gray-600',
      icon: TrophyIcon,
      popular: true,
      benefits: [
        '10% discount on all flights',
        '8% discount on hotels',
        '5% discount on packages',
        '5% cashback on bookings',
        'Priority customer support',
        'Exclusive member deals',
        'Free cancellations',
        'Lounge access vouchers (2x/year)'
      ],
      discounts: { flights: 10, hotels: 8, packages: 5 },
      points_multiplier: 2,
      priority_support: true,
      exclusive_deals: true
    },
    {
      id: 'gold',
      name: 'Gold Navigator',
      price: 399,
      duration: 'per year',
      color: 'text-yellow-600',
      gradient: 'from-yellow-400 to-yellow-600',
      icon: TrophyIcon,
      popular: false,
      benefits: [
        '15% discount on all flights',
        '12% discount on hotels',
        '10% discount on packages',
        '8% cashback on bookings',
        'Premium customer support',
        'Exclusive VIP deals',
        'Free cancellations & modifications',
        'Airport lounge access',
        'Travel insurance included',
        'Personal travel consultant'
      ],
      discounts: { flights: 15, hotels: 12, packages: 10 },
      points_multiplier: 3,
      priority_support: true,
      exclusive_deals: true
    }
  ];

  const handleUpgrade = async (tier: MembershipTier) => {
    if (!user) {
      toast.error('Please login to upgrade your membership');
      router.push('/login');
      return;
    }

    setLoading(true);
    setSelectedTier(tier.id);

    try {
      // Simulate API call for membership upgrade
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`Successfully upgraded to ${tier.name}! Welcome to the club!`);
      
      // Redirect to wallet page to show updated membership
      setTimeout(() => {
        router.push('/wallet');
      }, 1500);
      
    } catch (error) {
      console.error('Membership upgrade error:', error);
      toast.error('Failed to upgrade membership. Please try again.');
    } finally {
      setLoading(false);
      setSelectedTier('');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      
      {/* Hero Header */}
      <div className="relative hero-gradient py-20 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float floating-element"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-bounce-slow floating-element"></div>
        <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-float floating-element"></div>
        
        <div className="max-w-7xl mx-auto mobile-container relative z-10">
          <div className="text-center animate-fade-in">
            <h1 className="mobile-heading text-5xl md:text-7xl font-black text-gray-900 mb-6 tracking-tight animate-scale-in">
              TripyVerse 
              <span className="gradient-text-red block">Club Membership</span>
            </h1>
            <p className="mobile-text text-xl text-gray-600 font-medium max-w-3xl mx-auto animate-slide-up">
              Join our exclusive club and unlock incredible travel benefits, discounts, and VIP experiences
            </p>
            <div className="mt-8 flex justify-center space-x-6 text-sm">
              <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <CurrencyDollarIcon className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-gray-700">Up to 15% Savings</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <StarIcon className="h-4 w-4 text-yellow-500" />
                <span className="font-semibold text-gray-700">VIP Treatment</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <GiftIcon className="h-4 w-4 text-purple-600" />
                <span className="font-semibold text-gray-700">Exclusive Deals</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Membership Tiers */}
      <div className="max-w-7xl mx-auto mobile-container section-spacing">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">Choose Your Adventure Level</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-medium">
            Unlock exclusive benefits and save money on every trip with our club membership tiers
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {membershipTiers.map((tier, index) => (
            <div 
              key={tier.id} 
              className={`relative glass-card mobile-card card-hover red-shadow group animate-slide-up ${
                tier.popular ? 'ring-4 ring-red-500 ring-opacity-50 transform scale-105' : ''
              }`}
              style={{animationDelay: `${index * 0.2}s`}}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg animate-pulse-red">
                    MOST POPULAR
                  </div>
                </div>
              )}
              
              {/* Tier Header */}
              <div className="text-center mb-8">
                <div className={`w-20 h-20 mx-auto mb-6 bg-gradient-to-r ${tier.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <tier.icon className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">{tier.name}</h3>
                <div className="flex items-baseline justify-center space-x-2">
                  <span className="text-4xl font-black gradient-text-red">AED {tier.price}</span>
                  <span className="text-gray-600 font-medium">/{tier.duration}</span>
                </div>
              </div>

              {/* Benefits List */}
              <div className="space-y-4 mb-8">
                {tier.benefits.map((benefit, benefitIndex) => (
                  <div key={benefitIndex} className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircleIcon className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-gray-700 font-medium leading-relaxed">{benefit}</span>
                  </div>
                ))}
              </div>

              {/* Upgrade Button */}
              <button
                onClick={() => handleUpgrade(tier)}
                disabled={loading && selectedTier === tier.id}
                className={`btn-primary w-full py-4 text-lg font-bold shadow-2xl red-glow hover-lift btn-press group transition-all duration-300 ${
                  loading && selectedTier === tier.id ? 'opacity-50 cursor-not-allowed' : ''
                } bg-gradient-to-r ${tier.gradient} hover:shadow-xl`}
              >
                <span className="flex items-center justify-center space-x-2">
                  {loading && selectedTier === tier.id ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Upgrading...</span>
                    </>
                  ) : (
                    <>
                      <span>Upgrade to {tier.name}</span>
                      <ArrowRightIcon className="h-5 w-5 transform group-hover:translate-x-1 transition-transform duration-300" />
                    </>
                  )}
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Club Benefits Section */}
      <div className="bg-gradient-to-br from-gray-50 to-white py-20">
        <div className="max-w-7xl mx-auto mobile-container">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">
              Why Join <span className="gradient-text-red">TripyVerse Club?</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto font-medium">
              Experience travel like never before with exclusive member benefits and VIP treatment
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: CurrencyDollarIcon,
                title: 'Instant Savings',
                description: 'Get up to 15% off on flights, hotels, and packages with your membership discount',
                color: 'from-green-400 to-green-600'
              },
              {
                icon: StarIcon,
                title: 'VIP Treatment',
                description: 'Enjoy priority customer support, lounge access, and exclusive member-only deals',
                color: 'from-yellow-400 to-yellow-600'
              },
              {
                icon: GiftIcon,
                title: 'Exclusive Rewards',
                description: 'Earn cashback and points on every booking, plus access to special promotions',
                color: 'from-purple-400 to-purple-600'
              },
              {
                icon: ShieldCheckIcon,
                title: 'Travel Protection',
                description: 'Free cancellations, modifications, and travel insurance included with higher tiers',
                color: 'from-blue-400 to-blue-600'
              },
              {
                icon: PhoneIcon,
                title: 'Dedicated Support',
                description: '24/7 priority support with personal travel consultants for Gold members',
                color: 'from-red-400 to-red-600'
              },
              {
                icon: GlobeAltIcon,
                title: 'Global Access',
                description: 'Worldwide benefits and partnerships with premium hotels and airlines',
                color: 'from-indigo-400 to-indigo-600'
              }
            ].map((feature, index) => (
              <div key={index} className="text-center group animate-slide-up" style={{animationDelay: `${index * 0.1}s`}}>
                <div className={`w-16 h-16 mx-auto mb-6 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed font-medium">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Current Member Status */}
      {user && (
        <div className="bg-gradient-to-r from-red-500 to-red-600 py-16 text-white">
          <div className="max-w-4xl mx-auto mobile-container text-center">
            <div className="animate-fade-in">
              <UserGroupIcon className="h-16 w-16 mx-auto mb-6 opacity-90" />
              <h2 className="text-3xl md:text-4xl font-black mb-6">Welcome Back, {user.full_name}!</h2>
              <p className="text-xl mb-8 opacity-90">
                Current Status: <span className="font-black">Free Member</span>
              </p>
              <p className="text-lg mb-8 opacity-80">
                Upgrade your membership today and start saving on your next adventure!
              </p>
              <button
                onClick={() => document.querySelector('.grid')?.scrollIntoView({ behavior: 'smooth' })}
                className="glass-card bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 px-8 py-4 text-lg font-bold shadow-2xl border-2 border-white/50 hover:border-white transition-all hover-lift btn-press group"
              >
                <span className="flex items-center justify-center space-x-2">
                  <span>View Membership Plans</span>
                  <ArrowRightIcon className="h-5 w-5 transform group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ClubMembershipPage;