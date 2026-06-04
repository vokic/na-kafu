import ThemeProvider from '@/state/ThemeProvider';
import SenderFlow from '@/screens/sender/SenderFlow';

export default function HomePage() {
  return (
    <ThemeProvider initialTheme="light" persist>
      <SenderFlow />
    </ThemeProvider>
  );
}
