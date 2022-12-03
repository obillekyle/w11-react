import ProgressRing from '@ui/progress';
import { ReactNode, useEffect, useState } from 'react';

type BootManagerProps = {
  children: ReactNode;
};

const BootManager = ({ children }: BootManagerProps) => {
  const [boot, setBoot] = useState(false);

  useEffect(() => {
    setTimeout(() => setBoot(true), 1000);
  }, []);

  if (boot) return <>{children}</>;

  return (
    <div className="boot-splash">
      <svg data-src="/assets/WLOGO.svg" width={240} height={240} />
      <ProgressRing size={72} />
    </div>
  );
};

export default BootManager;
