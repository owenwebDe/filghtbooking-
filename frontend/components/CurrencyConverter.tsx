'use client';

import React, { useState, useEffect } from 'react';
import { currencyAPI, formatAEDCurrency, getCurrencySymbol } from '../lib/travel-apis';
import { 
  ArrowsRightLeftIcon,
  CurrencyDollarIcon 
} from '@heroicons/react/24/outline';

interface CurrencyConverterProps {
  className?: string;
  defaultAmount?: number;
}

const CurrencyConverter: React.FC<CurrencyConverterProps> = ({ 
  className = '',
  defaultAmount = 100 
}) => {
  const [amount, setAmount] = useState<string>(defaultAmount.toString());
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('AED');
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [rates, setRates] = useState<{ [key: string]: number }>({});

  const popularCurrencies = [
    { code: 'USD', name: 'US Dollar', flag: '🇺🇸' },
    { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
    { code: 'GBP', name: 'British Pound', flag: '🇬🇧' },
    { code: 'AED', name: 'UAE Dirham', flag: '🇦🇪' },
    { code: 'SAR', name: 'Saudi Riyal', flag: '🇸🇦' },
    { code: 'INR', name: 'Indian Rupee', flag: '🇮🇳' },
    { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵' },
    { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦' }
  ];

  useEffect(() => {
    loadExchangeRates();
  }, []);

  useEffect(() => {
    if (amount && !isNaN(parseFloat(amount))) {
      convertCurrency();
    }
  }, [amount, fromCurrency, toCurrency, rates]);

  const loadExchangeRates = async () => {
    try {
      const exchangeRates = await currencyAPI.getExchangeRates();
      setRates(exchangeRates);
    } catch (error) {
      console.error('Failed to load exchange rates:', error);
    }
  };

  const convertCurrency = async () => {
    if (!amount || isNaN(parseFloat(amount)) || fromCurrency === toCurrency) {
      setConvertedAmount(parseFloat(amount) || 0);
      return;
    }

    setLoading(true);
    try {
      const amountNum = parseFloat(amount);
      
      if (fromCurrency === 'AED') {
        // Converting from AED to other currency
        if (rates[toCurrency]) {
          const converted = amountNum / rates[toCurrency];
          setConvertedAmount(converted);
        }
      } else if (toCurrency === 'AED') {
        // Converting to AED
        const converted = await currencyAPI.convertToAED(amountNum, fromCurrency);
        setConvertedAmount(converted);
      } else {
        // Converting between non-AED currencies via AED
        const toAED = await currencyAPI.convertToAED(amountNum, fromCurrency);
        if (rates[toCurrency]) {
          const final = toAED / rates[toCurrency];
          setConvertedAmount(final);
        }
      }
    } catch (error) {
      console.error('Conversion failed:', error);
      setConvertedAmount(null);
    } finally {
      setLoading(false);
    }
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const formatAmount = (amount: number, currency: string): string => {
    if (currency === 'AED') {
      return formatAEDCurrency(amount);
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'JPY' ? 0 : 2
    }).format(amount);
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      <div className="flex items-center mb-4">
        <CurrencyDollarIcon className="h-6 w-6 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Currency Converter</h3>
      </div>

      <div className="space-y-4">
        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input-field"
            placeholder="Enter amount"
            min="0"
            step="0.01"
          />
        </div>

        {/* From Currency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            From
          </label>
          <select
            value={fromCurrency}
            onChange={(e) => setFromCurrency(e.target.value)}
            className="input-field"
          >
            {popularCurrencies.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.flag} {currency.code} - {currency.name}
              </option>
            ))}
          </select>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <button
            onClick={swapCurrencies}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            title="Swap currencies"
          >
            <ArrowsRightLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* To Currency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            To
          </label>
          <select
            value={toCurrency}
            onChange={(e) => setToCurrency(e.target.value)}
            className="input-field"
          >
            {popularCurrencies.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.flag} {currency.code} - {currency.name}
              </option>
            ))}
          </select>
        </div>

        {/* Result */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Converted Amount</div>
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Converting...</span>
              </div>
            ) : convertedAmount !== null ? (
              <div className="text-2xl font-bold text-gray-900">
                {formatAmount(convertedAmount, toCurrency)}
              </div>
            ) : (
              <div className="text-lg text-gray-500">Enter amount to convert</div>
            )}
          </div>
        </div>

        {/* Exchange Rate Info */}
        {convertedAmount !== null && parseFloat(amount) > 0 && (
          <div className="text-center text-sm text-gray-600">
            <div>
              1 {fromCurrency} = {formatAmount(convertedAmount / parseFloat(amount), toCurrency)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Rates updated in real-time via ExchangeRate-API
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrencyConverter;