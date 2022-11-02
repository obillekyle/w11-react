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
  return (
    <MantineProvider>
      <BootManager>
        <OperatingSystem>
          <WindowManager>
            <App />
          </WindowManager>
        </OperatingSystem>
      </BootManager>
    </MantineProvider>
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
