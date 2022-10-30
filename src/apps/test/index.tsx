import { Icon } from '@iconify/react';
import { useState } from 'react';
import { useStore } from '#api/store';
import ProgressRing from '#ui/progress';
import { useApplication, useDWM } from '#ui/window';
import UI from '#ui/application';
import './index.scss';
import test2 from './test';
import { useMantineTheme } from '@mantine/core';

const test = {
  id: 'com.test',
  name: 'Test',
  icon: '/assets/application/settings_gear.svg',
  children: <App />,
};

function App() {
  const store = useStore();
  const scale = store.get$('settings.scaling', 'user', 1);
  const timing = store.get$('settings.timing', 'user', 1);
  const application = useApplication();
  const wm = useDWM();

  const [ring, setRing] = useState<[number, number]>([48, 6]);

  const setScale = (s: number) => store.set$('settings.scaling', s, 'user');
  const setTiming = (t: number) => store.set$('settings.timing', t, 'user');

  const wallpaper = store.get$('settings.wallpaper', 'user');

  return (
    <div className="test-frame">
      <h1>Debug</h1>
      <div className="list">
        <div className="list-item">
          <Icon icon="fluent:app-title-24-regular" className="icon" />
          <div className="heading">
            <div className="title">App title</div>
            <div className="sub">Window app title, Not permanent</div>
          </div>
          <div className="right">
            <div className="right">
              <UI.Input
                defaultValue={application.window.title}
                onChange={(v) => (application.window.title = v.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="list-item">
          <div className="icon">
            <Icon icon="fluent:scale-fill-24-regular" className="icon" />
          </div>
          <div className="heading">
            <div className="title">Scaling</div>
            <div className="sub">How big screen elements would be</div>
          </div>
          <div className="right">
            <UI.Select
              data={[
                { value: '100', label: '100%' },
                { value: '125', label: '125%' },
                { value: '150', label: '150%' },
                { value: '175', label: '175%' },
                { value: '200', label: '200%' },
              ]}
              value={scale * 100 + ''}
              onChange={(v) => setScale(parseInt(v!) / 100)}
            />
          </div>
        </div>
        <div className="list-item">
          <Icon
            icon="fluent:text-column-one-wide-lightning-24-regular"
            className="icon"
          />
          <div className="heading">
            <div className="title">Timing</div>
            <div className="sub">The speed of the display animations</div>
          </div>
          <div className="right">
            <div className="right">
              <UI.Select
                data={[
                  { value: '50', label: '1/2x' },
                  { value: '100', label: '1x' },
                  { value: '200', label: '2x' },
                  { value: '300', label: '3x' },
                  { value: '400', label: '4x' },
                  { value: '500', label: '5x' },
                ]}
                value={timing * 100 + ''}
                onChange={(v) => setTiming(parseInt(v!) / 100)}
              />
            </div>
          </div>
        </div>
        <div className="list-item">
          <Icon icon="fluent:arrow-autofit-width-24-regular" className="icon" />
          <div className="heading">
            <div className="title">Progress Ring size</div>
            <div className="sub">The size of the progress ring</div>
          </div>
          <div className="right">
            <div className="right">
              <UI.Select
                data={['32', '48', '64', '96']}
                value={ring[0] + ''}
                onChange={(v) => setRing((r) => [parseInt(v!), r[1]])}
              />
            </div>
          </div>
        </div>
        <div className="list-item">
          <Icon
            icon="fluent:arrow-autofit-content-24-regular"
            className="icon"
          />
          <div className="heading">
            <div className="title">Progress Ring thickness</div>
            <div className="sub">The thickness of the progress ring</div>
          </div>
          <div className="right">
            <div className="right">
              <UI.Select
                data={['2', '4', '6', '8', '10']}
                value={ring[1] + ''}
                onChange={(v) => setRing((r) => [r[0], parseInt(v!)])}
              />
            </div>
          </div>
        </div>
        <div className="list-item" onClick={() => wm.open(test2)}>
          <Icon icon="fluent:apps-24-regular" className="icon" />
          <div className="heading">
            <div className="title">Custom App</div>
            <div className="sub">Open the custom application</div>
          </div>
        </div>
      </div>

      <ProgressRing size={ring[0]} thickness={ring[1]} reducedShaking />
    </div>
  );
}

export default test;
