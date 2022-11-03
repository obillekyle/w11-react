import { ReactNode } from 'react';
import { useDWM, Windows } from './window';
import './desktop.scss';

type DesktopProps = {
  children?: ReactNode;
};

const Desktop = ({ children }: DesktopProps) => {
  const wm = useDWM();

  return (
    <div
      className="desktop-main"
      onClick={(e) => e.currentTarget == e.target && wm.focus('')}
    >
      <Windows />
      {children}
      <WindowsVersion version="10607.rs_prerelease.221101-1001" />
    </div>
  );
};

type WindowsVersionProps = {
  version?: string;
};

const WindowsVersion = ({ version }: WindowsVersionProps) => {
  return version ? (
    <div className="not-windows-version">
      Not Windows 11 Pro Debug
      <br />
      Evaluation copy. Build {version}
    </div>
  ) : null;
};

export default Desktop;
