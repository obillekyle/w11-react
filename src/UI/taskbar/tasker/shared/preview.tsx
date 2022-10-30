import { clsx } from '@mantine/core';
import { elementToSVG } from 'dom-to-svg';
import _ from 'lodash';
import { useState, useLayoutEffect } from 'react';
import Taskbar from '../..';
import { useDWM } from '../../../window';

const Preview = ({ app, o, p }: any) => {
  const wm = useDWM();
  const [w] = wm.window;

  const open = w.opened[o];

  const classNames = [
    w.focused.split('_').includes(o) && 'active',
    w.closing.includes(o) && 'closing',
    _.keys(open?.windows).length && 'app',
    p && 'pinned',
  ];

  return (
    <Taskbar.Popover
      key={o}
      hover
      target={
        <Taskbar.Button
          key={o}
          tooltip="test"
          className={clsx(classNames)}
          onClick={(e) => {
            e.currentTarget.classList.contains('app') || wm.open(app.exec);
          }}
        >
          <img src={app.icon} />
        </Taskbar.Button>
      }
    >
      <div className="app-previews">
        {_.map(open?.windows ?? {}, (window, w) => (
          <PreviewItem window={window} id={o + w} key={w} />
        ))}
      </div>
    </Taskbar.Popover>
  );
};

type PreviewProps = {
  window: any;
  id: string;
};

const PreviewItem = ({ window, id }: PreviewProps) => {
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
          <svg data-src="/assets/window/close.svg" />
        </div>
      </div>
      <svg data-src={preview} id={'image' + id} className="image-preview" />
    </div>
  );
};

Preview.Item = PreviewItem;

export default Preview;
