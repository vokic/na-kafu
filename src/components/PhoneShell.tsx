'use client';

import { useTheme } from '@/state/ThemeProvider';
import SvgDefs from './SvgDefs';
import HoloBg from './HoloBg';
import AuroraBg from './AuroraBg';
import TopBar from './TopBar';

// The .phone wrapper carries data-theme. Mounts the document-global SVG defs and
// the holo/aurora backgrounds once. `children` is the active screen.
// When `onDevFill` is provided (dev only), shows the ⚡ prefill button bottom-right
// on every screen this shell wraps.
export default function PhoneShell({
  children,
  showThemeSwitcher = true,
  topRight = null,
  onDevFill,
}: {
  children: React.ReactNode;
  showThemeSwitcher?: boolean;
  topRight?: React.ReactNode;
  onDevFill?: () => void;
}) {
  const { theme } = useTheme();
  return (
    <div className="phone" data-theme={theme}>
      <SvgDefs />
      <HoloBg />
      <AuroraBg />
      <TopBar showThemeSwitcher={showThemeSwitcher} right={topRight} />
      {children}
      {onDevFill && (
        <button className="fillbtn" type="button" title="popuni polja (test)" onClick={onDevFill}>
          ⚡
        </button>
      )}
    </div>
  );
}
