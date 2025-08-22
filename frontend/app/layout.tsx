import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../lib/auth-simple';
import { Toaster } from 'react-hot-toast';
import AuthenticatedLayout from '../components/AuthenticatedLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TripyVerse - Your Ultimate Travel Universe',
  description: 'Discover the universe of travel with TripyVerse. Book flights, hotels, and vacation packages worldwide with real-time pricing and instant confirmations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <AuthenticatedLayout>
            {children}
          </AuthenticatedLayout>
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}