import { createContext, ReactNode, useContext, useState } from 'react';
import { useInterval } from 'usehooks-ts';
import './crash.scss';

type CrashHandlerProps = {
  children: ReactNode;
};

const Crash = createContext((message: string) => {
  return null;
  message;
});
export const useCrash = () => useContext(Crash);

const CrashHandler = ({ children }: CrashHandlerProps) => {
  const [v, sv] = useState(0);
  const [crash, setCrash] = useState('');
  useInterval(() => {
    if (!crash) return;
    v > 80 ? location.reload() : sv((v) => v + 20);
  }, 1370);

  return crash ? (
    <div className="crash-screen">
      <div className="crash-container">
        <div className="crash-header">:(</div>
        <div className="crash-subheader">
          Your PC ran into a problem and needs to restart. We're just collecting
          some error info, and then we'll restart for you
        </div>
        <div className="crash-subheader crash-dump-progress">{v}% complete</div>
        <div className="crash-info">
          <svg
            className="crash-qr"
            data-src="/assets/stopcode.svg"
            width={128}
            height={128}
          />
          <div className="crash-guides">
            For more information about this issue and possible fixes, visit
            https://www.windows.com/stopcode
            <div className="crash-code">
              If you call a support person, give them this info: <br />
              Stop code: {crash.toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <Crash.Provider
      value={(m) => {
        setCrash(m);
        return null;
      }}
    >
      {children}
    </Crash.Provider>
  );
};

export default CrashHandler;
