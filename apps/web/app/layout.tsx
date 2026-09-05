import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Forge | Commerce & operations',
  description: 'One workspace for connected commerce and operations.',
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
