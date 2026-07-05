import type { Metadata } from 'next';
import ThemeProvider from '@/state/ThemeProvider';
import SentRoute from '@/screens/sender/SentRoute';

// The page shows the user's fresh share/manage links — never index (mirrors /m).
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function SentPage() {
  return (
    <ThemeProvider initialTheme="light">
      <SentRoute />
    </ThemeProvider>
  );
}
