'use client';

import { useTheme } from '@/state/ThemeProvider';
import SvgDefs from './SvgDefs';
import HoloBg from './HoloBg';
import AuroraBg from './AuroraBg';
import TopBar from './TopBar';

// The .phone wrapper carries data-theme. Mounts the document-global SVG defs and
// the holo/aurora backgrounds once. `children` is the active screen.
export default function PhoneShell({
  children,
  showThemeSwitcher = true,
  topRight = null,
  overlay = null,
}: {
  children: React.ReactNode;
  showThemeSwitcher?: boolean;
  topRight?: React.ReactNode;
  overlay?: React.ReactNode; // absolute-positioned extras (e.g. dev fill button)
}) {
  const { theme } = useTheme();
  return (
    <div className="phone" data-theme={theme}>
      <SvgDefs />
      <HoloBg />
      <AuroraBg />
      <TopBar showThemeSwitcher={showThemeSwitcher} right={topRight} />
      {children}
      {overlay}
    </div>
  );
}
