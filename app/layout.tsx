import './globals.css';

export const metadata = {
  title: 'Scope Check',
  description: 'Secure your scope. Save your sanity.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
