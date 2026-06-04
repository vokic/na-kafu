import ThemeProvider from '@/state/ThemeProvider';
import RecipientFlow from '@/screens/recipient/RecipientFlow';

// FE phase: client-rendered, reads the store by token. BE phase: this becomes a
// Server Component doing SSR data fetch + dynamic OG image (HANDOVER §6).
export default async function RecipientPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <ThemeProvider initialTheme="light">
      <RecipientFlow token={token} />
    </ThemeProvider>
  );
}
