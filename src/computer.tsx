import './computer.scss';
import './scrollbar.scss';
import { MantineProvider } from '@mantine/core';
import Desktop from '@ui/desktop';
import Taskbar from '@ui/taskbar';
import { WindowManager } from '@ui/window';
import BootManager from './boot';
import OperatingSystem from './os';
import CrashHandler from '@ui/crash';

function Computer() {
  return (
    <MantineProvider>
      <BootManager>
        <CrashHandler>
          <OperatingSystem>
            <WindowManager>
              <App />
            </WindowManager>
          </OperatingSystem>
        </CrashHandler>
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
