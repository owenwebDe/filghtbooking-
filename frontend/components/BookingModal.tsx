'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-simple';
import { bookingsAPI, walletAPI, paymentsAPI } from '../lib/api';
import {
  XMarkIcon,
  WalletIcon,
  CreditCardIcon,
  CheckCircleIcon,
  UserGroupIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  itemType: 'flight' | 'hotel' | 'package';
}

export default function BookingModal({ isOpen, onClose, item, itemType }: BookingModalProps) {
  const { user } = useAuth();
  const [walletData, setWalletData] = useState({ balance: 0, points: 0 });
  const [passengers, setPassengers] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'stripe'>('wallet');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (isOpen && user) {
      loadWalletData();
    }
  }, [isOpen, user]);

  const loadWalletData = async () => {
    try {
      const response = await walletAPI.getWallet();
      if (response.data) {
        setWalletData({
          balance: response.data.balance || 0,
          points: response.data.points || 0
        });
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
      setWalletData({ balance: 0, points: 0 });
    }
  };

  const calculateTotal = () => {
    if (!item) return 0;
    const basePrice = item.price || item.price_per_night || item.price_from || 0;
    return basePrice * passengers;
  };

  const handleBooking = async () => {
    if (!item || !user) {
      toast.error('🔐 Please log in to make a booking');
      return;
    }

    const totalAmount = calculateTotal();

    try {
      setLoading(true);
      
      // Check wallet balance if wallet payment selected
      if (paymentMethod === 'wallet' && walletData.balance < totalAmount) {
        const shortfall = totalAmount - walletData.balance;
        toast.error(
          `💳 Insufficient wallet balance! You need AED ${shortfall.toLocaleString()} more.\n🚀 Top up your wallet to complete this booking.`,
          { 
            duration: 6000,
            style: {
              background: '#FEE2E2',
              color: '#DC2626',
              border: '1px solid #FECACA',
              borderRadius: '12px',
              padding: '16px',
              fontWeight: 'bold'
            }
          }
        );
        return;
      }

      // Create booking data based on item type
      const bookingData = createBookingData(totalAmount);
      
      // Create the booking
      const bookingResponse = await bookingsAPI.create(bookingData);
      const bookingId = bookingResponse.data.id;

      if (paymentMethod === 'wallet') {
        await processWalletPayment(bookingId, totalAmount);
      } else {
        await processStripePayment(bookingId, totalAmount);
      }

    } catch (error) {
      console.error('Booking error:', error);
      toast.error('❌ Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createBookingData = (totalAmount: number) => {
    const baseData = {
      item_type: itemType,
      item_id: item.id,
      passengers: passengers,
      total_amount: totalAmount,
      payment_method: paymentMethod
    };

    switch (itemType) {
      case 'flight':
        return {
          ...baseData,
          item_details: {
            airline: item.airline,
            flight_number: item.flight_number,
            route: `${item.from || item.from_city} → ${item.to || item.to_city}`,
            departure_time: item.departure_time,
            arrival_time: item.arrival_time,
            duration: item.duration,
            aircraft_type: item.aircraft_type
          }
        };
      case 'hotel':
        return {
          ...baseData,
          item_details: {
            name: item.name,
            location: item.location || item.city,
            address: item.address,
            rating: item.rating,
            check_in_date: item.check_in,
            check_out_date: item.check_out
          }
        };
      case 'package':
        return {
          ...baseData,
          item_details: {
            name: item.title || item.name,
            destination: item.destination,
            duration: item.duration,
            includes: item.includes || []
          }
        };
      default:
        return baseData;
    }
  };

  const processWalletPayment = async (bookingId: string, amount: number) => {
    try {
      // Process wallet deduction (using negative amount)
      await walletAPI.deposit({
        amount: -amount,
        payment_method_id: 'wallet_balance'
      });

      // Award points for booking
      const pointsEarned = Math.floor(amount / 2);
      await walletAPI.earnPoints({
        booking_id: bookingId,
        amount: amount
      });

      toast.success(
        `🎉 Booking Confirmed!\n💳 AED ${amount.toLocaleString()} deducted from wallet\n✨ Earned ${pointsEarned} reward points!`,
        { 
          duration: 5000,
          style: {
            background: '#ECFDF5',
            color: '#047857',
            border: '1px solid #A7F3D0',
            borderRadius: '12px',
            padding: '16px',
            fontWeight: 'bold'
          }
        }
      );
      
      onClose();
      
    } catch (error) {
      console.error('Wallet payment error:', error);
      toast.error('Wallet payment failed. Please try again.');
    }
  };

  const processStripePayment = async (bookingId: string, amount: number) => {
    try {
      // Create payment intent
      const paymentResponse = await paymentsAPI.createPaymentIntent(bookingId);
      
      if (paymentResponse.data) {
        // Simulate successful Stripe payment for demo
        await paymentsAPI.confirmPayment({
          booking_id: bookingId,
          payment_intent_id: paymentResponse.data.id,
          status: 'succeeded'
        });

        // Award points for booking (same rate as wallet payments)
        const pointsEarned = Math.floor(amount / 2);
        try {
          await walletAPI.earnPoints({
            booking_id: bookingId,
            amount: amount
          });
          toast.success(`✨ Earned ${pointsEarned} points!`);
        } catch (pointsError) {
          console.error('Points earning error:', pointsError);
          // Don't fail the booking if points earning fails
        }

        toast.success('🎉 Booking confirmed! Payment processed successfully.');
        onClose();
      }
    } catch (error) {
      console.error('Stripe payment error:', error);
      toast.error('Payment failed. Please try again.');
    }
  };

  const getItemTitle = () => {
    switch (itemType) {
      case 'flight':
        return `${item?.airline} ${item?.flight_number}`;
      case 'hotel':
        return item?.name;
      case 'package':
        return item?.title || item?.name;
      default:
        return 'Booking';
    }
  };

  const getItemSubtitle = () => {
    switch (itemType) {
      case 'flight':
        return `${item?.from || item?.from_city} → ${item?.to || item?.to_city}`;
      case 'hotel':
        return item?.location || item?.city;
      case 'package':
        return item?.destination;
      default:
        return '';
    }
  };

  if (!isOpen || !item) return null;

  const totalAmount = calculateTotal();
  const pointsToEarn = Math.floor(totalAmount / 2);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass-card bg-white rounded-3xl red-shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto animate-scale-in border border-red-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-red-100 red-gradient-bg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <SparklesIcon className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-black text-white">Complete Booking</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors text-white hover-lift"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Item Details */}
          <div className="glass-card bg-red-50 rounded-2xl p-6 border border-red-200 hover-lift">
            <h3 className="text-xl font-black text-gray-900 mb-2">{getItemTitle()}</h3>
            <p className="text-red-600 font-bold mb-4">{getItemSubtitle()}</p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 font-medium">💰 Price per person</span>
              <span className="text-2xl font-black gradient-text-red">
                AED {(item.price || item.price_per_night || item.price_from || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Passengers */}
          <div className="flex items-center justify-between glass-card bg-white/50 p-4 rounded-xl border border-red-100 hover-lift">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 red-gradient-bg rounded-full flex items-center justify-center">
                <UserGroupIcon className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">👥 Passengers</span>
            </div>
            <select
              value={passengers}
              onChange={(e) => setPassengers(parseInt(e.target.value))}
              className="input-field px-4 py-2 w-20 text-center font-bold"
            >
              {[1,2,3,4,5,6].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>

          {/* Total Amount */}
          <div className="glass-card red-gradient-bg rounded-2xl p-6 text-white animate-pulse-red">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold">💎 Total Amount</span>
              <span className="text-3xl font-black">AED {totalAmount.toLocaleString()}</span>
            </div>
            <div className="mt-2 text-red-100 text-sm font-medium">
              ✨ Earn {pointsToEarn} reward points with this booking!
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-4">
            <h4 className="text-xl font-black text-gray-900 flex items-center space-x-2">
              <span className="w-6 h-6 red-gradient-bg rounded-full flex items-center justify-center text-white text-sm">💳</span>
              <span>Payment Method</span>
            </h4>
            
            {/* Wallet Payment */}
            <label className={`flex items-center space-x-4 p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 hover-lift ${
              paymentMethod === 'wallet' 
                ? 'border-red-500 bg-red-50 red-shadow' 
                : 'border-gray-200 hover:border-red-300 hover:bg-red-50'
            }`}>
              <input
                type="radio"
                name="payment"
                value="wallet"
                checked={paymentMethod === 'wallet'}
                onChange={(e) => setPaymentMethod(e.target.value as 'wallet' | 'stripe')}
                className="text-red-600 w-5 h-5"
              />
              <div className="w-12 h-12 red-gradient-bg rounded-xl flex items-center justify-center animate-pulse-red">
                <WalletIcon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">💳 Wallet Balance</p>
                <p className="text-sm font-medium text-red-600">Balance: AED {walletData.balance.toLocaleString()}</p>
              </div>
              {walletData.balance >= totalAmount ? (
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                  <CheckCircleIcon className="h-5 w-5 text-white" />
                </div>
              ) : (
                <span className="text-xs text-red-600 font-bold bg-red-100 px-3 py-1 rounded-full">Insufficient</span>
              )}
            </label>

            {/* Stripe Payment */}
            <label className={`flex items-center space-x-4 p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 hover-lift ${
              paymentMethod === 'stripe' 
                ? 'border-red-500 bg-red-50 red-shadow' 
                : 'border-gray-200 hover:border-red-300 hover:bg-red-50'
            }`}>
              <input
                type="radio"
                name="payment"
                value="stripe"
                checked={paymentMethod === 'stripe'}
                onChange={(e) => setPaymentMethod(e.target.value as 'wallet' | 'stripe')}
                className="text-red-600 w-5 h-5"
              />
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <CreditCardIcon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">💳 Credit/Debit Card</p>
                <p className="text-sm font-medium text-gray-600">🔒 Secure payment via Stripe</p>
              </div>
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircleIcon className="h-5 w-5 text-white" />
              </div>
            </label>
          </div>

          {/* Benefits */}
          {paymentMethod === 'wallet' && (
            <div className="glass-card bg-red-50 border border-red-200 rounded-2xl p-6 animate-slide-up">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 red-gradient-bg rounded-full flex items-center justify-center animate-pulse-red">
                  <SparklesIcon className="h-5 w-5 text-white" />
                </div>
                <h5 className="text-lg font-black text-red-900">✨ Wallet Benefits</h5>
              </div>
              <ul className="text-sm font-medium text-red-700 space-y-2">
                <li className="flex items-center space-x-2">
                  <span className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">🎯</span>
                  <span>Earn {pointsToEarn} points instantly</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">💝</span>
                  <span>No payment processing fees</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">⚡</span>
                  <span>Instant booking confirmation</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">💰</span>
                  <span>Tier-based cashback rewards</span>
                </li>
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <button
              onClick={onClose}
              className="flex-1 btn-outline py-4 px-6 text-lg font-bold rounded-2xl hover-lift btn-press"
            >
              Cancel
            </button>
            <button
              onClick={handleBooking}
              disabled={loading || (paymentMethod === 'wallet' && walletData.balance < totalAmount)}
              className="flex-1 btn-primary py-4 px-6 text-lg font-bold rounded-2xl shadow-2xl red-glow hover-lift btn-press disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ Processing...' : `🚀 Book Now`}
            </button>
          </div>

          {/* Insufficient Balance Notice */}
          {paymentMethod === 'wallet' && walletData.balance < totalAmount && (
            <div className="glass-card bg-gradient-to-r from-yellow-50 to-red-50 border-2 border-red-300 rounded-2xl p-6 animate-slide-up red-shadow">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-red-500 rounded-xl flex items-center justify-center animate-pulse-red flex-shrink-0">
                  <span className="text-white text-xl">⚠️</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-black text-red-900 mb-2">💳 Insufficient Wallet Balance</h4>
                  <p className="text-red-700 font-medium mb-4">
                    You need <span className="font-black text-xl">AED {(totalAmount - walletData.balance).toLocaleString()}</span> more to complete this booking.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                      onClick={() => {
                        onClose();
                        window.location.href = '/wallet?action=topup';
                      }}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/30 flex items-center justify-center hover-lift btn-press"
                    >
                      💰 Top Up Wallet
                    </button>
                    <button 
                      onClick={() => setPaymentMethod('stripe')}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/30 flex items-center justify-center hover-lift btn-press"
                    >
                      💳 Pay with Card
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}