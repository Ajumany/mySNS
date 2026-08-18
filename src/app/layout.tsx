import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SNS',
  description: '身内向けSNS',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-white antialiased">
        {children}
      </body>
    </html>
  );
}