import _ from 'lodash';
import SearchButton from './internal/search';
import StartButton from './internal/start';
import TaskView from './internal/taskview';
import Widget from './shared/widget';
import Preview from './shared/preview';
import { useSettings } from '../../../os';
import { useDWM } from '@ui/window';

// BUG vite hmr spams indefinitely

// type PinProps = {
//   id: string;
//   icon: string;
//   name: string;
//   exec: string;
// };

// const getApp = async (app: string): Promise<AppProps | undefined> => {
//   const applet = await import(`../../../apps/${app}/index.tsx`);
//   if (!(applet && applet.default)) return undefined;
//   return applet.default;
// };

const Tasker = () => {
  const wm = useDWM();
  const [w] = wm.window;
  const store = useSettings();
  // const [ap, setAp] = useState<PinProps[]>([]);

  const pinned = store.get('pinned', [
    {
      exec: 'chrome',
      icon: '/assets/application/com.google.chrome.svg',
      name: 'Google Chrome',
      id: 'com.google.chrome',
    },
    {
      exec: 'test',
      icon: '/assets/application/settings_gear.svg',
      name: 'Testing',
      id: 'com.test',
    },
  ]);
  // const getPinned = useCallback(async () => {
  //   const pin: PinProps[] = [];
  //   console.log('update', '1');
  //   pinned.map(async (curr) => {
  //     const app = await getApp(curr);
  //     if (!app) return;
  //     pin.push({
  //       exec: curr,
  //       icon: app.icon || '/assets/Application.svg',
  //       name: app.name || 'Application',
  //       id: app.id,
  //     } as PinProps);
  //   });

  //   setAp(pin);
  // }, pinned);

  // useEffect(() => {
  //   getPinned();
  //   return () => setAp([]);
  // }, pinned);

  return (
    <div className="tasker">
      <StartButton />
      <SearchButton />
      <TaskView />
      <Widget />
      {_.map(pinned, (app, o) => (
        <Preview app={app} appId={app.id} key={o} pinned={true} />
      ))}
      {_.map(w.opened, (app, o) => {
        if (app.exec in pinned) return null;
        <Preview app={app} appId={o.split('_')[0]} key={o} />;
      })}
    </div>
  );
};

export default Tasker;
