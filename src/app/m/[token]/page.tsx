import type { Metadata } from 'next';
import ThemeProvider from '@/state/ThemeProvider';
import ManageView from '@/screens/manage/ManageView';

// Manage/status page is private — never index it.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function ManagePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <ThemeProvider initialTheme="light">
      <ManageView token={token} />
    </ThemeProvider>
  );
}
