import _, { add } from 'lodash';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { useStore } from '../../../api/store';
import { useDWM } from '../../window';
import SearchButton from './internal/search';
import StartButton from './internal/start';
import TaskView from './internal/taskview';
import Widget from './shared/widget';
import Preview from './shared/preview';

type PinProps = {
  id: string;
  icon: string;
  name: string;
  exec: string;
};

const Tasker = () => {
  const wm = useDWM();
  const store = useStore();
  const [ap, setAp] = useState<PinProps[]>([]);
  const [w] = wm.window;
  const pinned = useMemo(
    () => store.get$('taskbar.pinned', 'user', ['test', 'chrome']),
    [store]
  );

  const getPinned = useCallback(async () => {
    const pin = pinned.map(async (p) => {
      const app = (await import(`../../../apps/${p}/index.tsx`)).default;
      return {
        exec: p,
        icon: app.icon || '/assets/Application.svg',
        name: app.name || 'Application',
        id: app.id,
      } as PinProps;
    });

    setAp(await Promise.all(pin));
  }, [pinned, w]);

  useEffect(() => {
    getPinned().then();
  }, []);

  useEffect(() => {
    getPinned().then();
  }, [pinned, w]);

  return (
    <div className="tasker">
      <StartButton />
      <SearchButton />
      <TaskView />
      <Widget />
      {_.map(ap, (app, o) => (
        <Preview app={app} o={app.id} key={o} p={true} />
      ))}
      {_.map(w.opened, (app, o) => {
        if (app.exec in pinned) return null;
        <Preview app={app} o={o.split('_')[0]} key={o} />;
      })}
    </div>
  );
};

export default Tasker;
