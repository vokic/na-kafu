import ThemeProvider from '@/state/ThemeProvider';
import SentRoute from '@/screens/sender/SentRoute';

export default function SentPage() {
  return (
    <ThemeProvider initialTheme="light">
      <SentRoute />
    </ThemeProvider>
  );
}
