import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SpeakEasy Tasks - Voice-Powered Task Management',
  description: 'Turn your voice into organized to-do lists and schedule with AI-powered transcription',
  keywords: ['voice', 'tasks', 'calendar', 'AI', 'productivity', 'Base', 'blockchain'],
  authors: [{ name: 'SpeakEasy Tasks Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#8B5CF6',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'SpeakEasy Tasks - Voice-Powered Task Management',
    description: 'Turn your voice into organized to-do lists and schedule with AI-powered transcription',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SpeakEasy Tasks',
    description: 'Turn your voice into organized to-do lists and schedule with AI-powered transcription',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <Providers>
            {children}
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
