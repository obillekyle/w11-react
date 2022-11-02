import ProgressRing from '@ui/progress';
import { useEffect, useState } from 'react';

const BootManager = ({ children }: any) => {
  const [boot, setBoot] = useState(false);

  useEffect(() => {
    setInterval(() => {
      setBoot(true);
    }, 1000);
  }, []);

  if (boot) {
    return children;
  }

  return (
    <div className="boot-splash">
      <svg data-src="/assets/WLOGO.svg" width={240} height={240} />
      <ProgressRing size={72} />
    </div>
  );
};

export default BootManager;
