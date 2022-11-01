import './computer.scss';
import './scrollbar.scss';
import { MantineProvider } from '@mantine/core';
import _ from 'lodash';
import Desktop from '@ui/desktop';
import Taskbar from '@ui/taskbar';
import { WindowManager } from '@ui/window';
import BootManager from './boot';
import OperatingSystem from './os';
import { useEffect, useRef } from 'react';

function Computer() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    ref.current.requestPointerLock();
  }, [ref]);

  return (
    <div ref={ref}>
      <MantineProvider>
        <BootManager>
          <OperatingSystem>
            <WindowManager>
              <App />
            </WindowManager>
          </OperatingSystem>
        </BootManager>
      </MantineProvider>
    </div>
  );
}

function App() {
  return (
    <MantineProvider
      inherit
      theme={{
        fontFamily: 'Segoe UI Variable',
        colorScheme: 'dark',
      }}
    >
      <Desktop />
      <Taskbar />
    </MantineProvider>
  );
}
export default Computer;
