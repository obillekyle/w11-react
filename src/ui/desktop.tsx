import { ReactNode } from 'react';
import { useSystem } from '../os';
import './desktop.scss';
import { useDWM, Windows } from './window';

type DesktopProps = {
  children?: ReactNode;
};

const Desktop = ({ children }: DesktopProps) => {
  const system = useSystem();
  const wm = useDWM();

  const user = system.get('current_user', 'user') as string;

  return (
    <div
      className="desktop-main"
      onClick={(e) => e.currentTarget == e.target && wm.focus('')}
    >
      <Windows />
      {children}
      <WinVer ver="10607.rs_prerelease.221101-1001" />
    </div>
  );
};

const WinVer = ({ ver = '1' }) => {
  return (
    <div className="not-windows-version">
      Not Windows 11 Pro Debug
      <br />
      Evaluation copy. Build {ver}
    </div>
  );
};

export default Desktop;
