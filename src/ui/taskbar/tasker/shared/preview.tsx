import UI from '@ui/application';
import { clsx } from '@mantine/core';
import { elementToSVG } from 'dom-to-svg';
import _ from 'lodash';
import { useState, useLayoutEffect } from 'react';
import Taskbar from '../..';
import { AppWindow, Process, useDWM } from '../../../window';

type PreviewProps = {
  app: Omit<Process, 'windows'>;
  appId: string;
  pinned?: boolean;
};

const Preview = ({ app, appId, pinned }: PreviewProps) => {
  const wm = useDWM();
  const [w] = wm.window;

  const open = w.opened[appId];

  const classNames = [
    w.focused.split('_').includes(appId) && 'active',
    w.closing.includes(appId) && 'closing',
    _.keys(open?.windows).length && 'app',
    pinned && 'pinned',
  ];

  return (
    <Taskbar.Popover
      key={appId}
      hover
      target={
        <Taskbar.Button
          key={appId}
          tooltip="test"
          className={clsx(classNames)}
          onClick={(e) => {
            if (e.currentTarget.classList.contains('app')) return;
            if (app.exec) wm.open(app.exec);
          }}
        >
          <img src={app.icon} />
        </Taskbar.Button>
      }
    >
      <div className="app-previews">
        {_.map(open?.windows ?? {}, (window, w) => (
          <PreviewItem window={window} id={appId + w} key={w} />
        ))}
      </div>
    </Taskbar.Popover>
  );
};

type PreviewItemProps = {
  window: AppWindow;
  id: string;
};

const PreviewItem = ({ window, id }: PreviewItemProps) => {
  const wm = useDWM();
  const [w] = wm.window;
  const app = wm.app(id);
  const [preview, setPreview] = useState<string | undefined>(undefined);

  useLayoutEffect(() => {
    const frame = document.querySelector(`[data-uid^="${id}"]`);
    if (!frame) return;

    const svgDocument = elementToSVG(frame, { keepLinks: false });
    const string = new XMLSerializer().serializeToString(svgDocument);
    const data = `data:image/svg+xml;base64,${btoa(string)}`;
    setPreview(data);
  }, []);

  return (
    <div
      key={id}
      onClick={(e) => {
        e.preventDefault();
        wm.focus(id);
      }}
      className={clsx('app-preview', w.focused == id && 'focused')}
    >
      <div className="header">
        <img className="window-icon" src={window.icon} />
        <div className="window-name">{window.name}</div>
        <div className="close" onClick={() => app.close()}>
          <UI.Icon icon="close" size={10} />
        </div>
      </div>
      <svg data-src={preview} id={'image' + id} className="image-preview" />
    </div>
  );
};

Preview.Item = PreviewItem;

export default Preview;
