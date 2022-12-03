import { Icon } from '@iconify/react';
import { HTMLAttributes, ReactNode, useState } from 'react';
import { useApplication, useDWM } from '@ui/window';
import { useSettings } from '@os';
import { cx } from '@api/util';
import ProgressRing from '@ui/progress';
import UI from '@ui/application';
import test2 from './test';
import './index.scss';

const test = {
  id: 'com.test',
  name: 'Test',
  icon: '/assets/application/settings_gear.svg',
  children: <App />,
};

type List =
  | {
      type: 'item';
      icon?: string;
      title: string;
      subtitle?: string;
      props?: HTMLAttributes<HTMLDivElement>;
      right?: ReactNode;
    }
  | {
      type: 'separator';
      height?: number;
    };

function App() {
  const wm = useDWM();
  const store = useSettings();
  const application = useApplication();
  const scale = store.get('scaling', 1);
  const timing = store.get('timing', 1);

  const [ring, setRing] = useState<[number, number]>([48, 6]);

  const setScale = (s: number) => store.set('scaling', s);
  const setTiming = (t: number) => store.set('timing', t);

  const options: List[] = [
    {
      icon: 'fluent:apps-24-filled',
      type: 'item',
      title: 'Debug Application',
      subtitle: 'Open the debugged application',
      props: {
        onClick: () => wm.open(test2),
      },
    },
    {
      type: 'item',
      icon: 'fluent:app-title-24-regular',
      title: 'App title',
      subtitle: 'Window app title, temporary',
      right: (
        <UI.Input
          defaultValue={application.window.title}
          onChange={(v) => (application.window.title = v.target.value)}
        />
      ),
    },
    {
      type: 'separator',
    },
    {
      icon: 'fluent:scale-fill-24-regular',
      type: 'item',
      title: 'Scaling',
      subtitle: 'How big the elements would be',
      right: (
        <UI.Select
          data={[
            { value: '100', label: '100%' },
            { value: '125', label: '125%' },
            { value: '150', label: '150%' },
            { value: '175', label: '175%' },
            { value: '200', label: '200%' },
          ]}
          value={scale * 100 + ''}
          onChange={(v) => setScale(Number(v) / 100)}
        />
      ),
    },
    {
      icon: 'fluent:clock-24-regular',
      type: 'item',
      title: 'Timing',
      subtitle: 'The elements animation speed',
      right: (
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
          onChange={(v) => setTiming(Number(v) / 100)}
        />
      ),
    },
    {
      icon: 'fluent:image-24-regular',
      type: 'item',
      title: 'Wallpaper',
      subtitle: 'Change the current wallpaper from the preset list',
      right: (
        <UI.Select
          data={[
            {
              label: 'Windows 11 Dark',
              value: '/assets/Web/4k/Wallpapers/default.jpg',
            },
            {
              label: 'Unsplash Image',
              value: '/assets/wp.jpg',
            },
            {
              label: 'Unsplash Image #2',
              value: '/assets/wp3.jpg',
            },
            {
              label: 'Color Orange',
              value: 'orange',
            },
          ]}
          value={store.get('wallpaper')?.url}
          onChange={(v) => {
            const image = v?.startsWith('/');
            store.set('wallpaper', (d) => {
              return image
                ? {
                    type: 'image',
                    url: v ?? d.url,
                    layout: 'cover',
                  }
                : {
                    type: 'color',
                    color: v,
                  };
            });
          }}
        />
      ),
    },
    {
      type: 'separator',
    },
    {
      icon: 'fluent:arrow-autofit-width-24-regular',
      type: 'item',
      title: 'ProgressRing size',
      subtitle: 'The size of the progress ring below, temporary',
      right: (
        <UI.Select
          data={['32', '48', '64', '96']}
          value={ring[0] + ''}
          onChange={(v) => setRing((r) => [Number(v), r[1]])}
        />
      ),
    },
    {
      icon: 'fluent:arrow-autofit-content-24-regular',
      type: 'item',
      title: 'ProgressRing thickness',
      subtitle: 'The thickness of the the progress ring below, temporary',
      right: (
        <UI.Select
          data={['2', '4', '6', '8', '10']}
          value={ring[1] + ''}
          onChange={(v) => setRing((r) => [r[0], Number(v)])}
        />
      ),
    },
    {
      type: 'separator',
    },
  ];

  return (
    <div className="test-frame">
      <h1>Debug</h1>
      <div className="list">
        {options.map((option, index) => {
          if (option.type == 'separator') {
            return <div className="list-separator" key={index} />;
          }

          if (option.type == 'item') {
            const classList = cx('list-item', option.props?.className);
            delete option.props?.className;

            return (
              <div className={classList} key={index} {...option.props}>
                {!!option.icon && <Icon icon={option.icon} data-icon />}
                <div data-heading>
                  <div data-title>{option.title}</div>
                  {!!option.subtitle && (
                    <div data-subtitle>{option.subtitle}</div>
                  )}
                </div>
                {!!option.right && <div data-right>{option.right}</div>}
              </div>
            );
          }
        })}
      </div>

      <ProgressRing size={ring[0]} thickness={ring[1]} reducedShaking />
    </div>
  );
}

export default test;
