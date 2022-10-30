import { Box, Button, RingProgress, Slider } from '@mantine/core';
import { ReactNode, useContext } from 'react';
import { useStore } from '../api/store';
import './desktop.scss';
import ProgressRing from './progress';
import AppWindow, { useDWM, Windows } from './window';

type DesktopProps = {
  children?: ReactNode;
};

const Desktop = ({ children }: DesktopProps) => {
  const store = useStore();
  const wm = useDWM();

  const user = store.get$('system.current_user', 'system', 'user') as string;

  return (
    <div
      className="desktop-main"
      onClick={(e) => e.currentTarget == e.target && wm.focus('')}
    >
      <Windows />
      {children}
      <WinVer ver="10502.rs_prerelease.221015-1010" />
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
