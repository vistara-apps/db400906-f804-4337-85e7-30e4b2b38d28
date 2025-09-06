import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SpeakEasy Tasks - Voice-Powered Task Management',
  description: 'Turn your voice into organized to-do lists and schedule with AI-powered transcription',
  keywords: ['voice', 'tasks', 'calendar', 'AI', 'productivity', 'Base', 'blockchain'],
  authors: [{ name: 'SpeakEasy Tasks Team' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
