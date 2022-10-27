import { clsx } from '@mantine/core';
import { useToggle } from '@mantine/hooks';
import { get } from 'get-wild';
import _ from 'lodash';
import { uniqueId } from 'lodash';
import {
  createContext,
  DragEvent,
  MouseEvent,
  PointerEvent,
  ReactNode,
  useContext,
  useState,
} from 'react';
import './window.scss';

export type AppProps = {
  id: string;
  name?: string;
  icon?: string;
  children?: ReactNode;
  onlyOne?: boolean;
  exec?: string;
  initialOptions?: {
    header?: {
      height?: number;
      scale?: number;
    };
    show?: {
      icon?: boolean;
      name?: boolean;
      window?: boolean;
    };
    custom?: {
      icon?: string;
      name?: string;
    };
  };
  window?: {
    scale?: number;
    height?: number;
    width?: number;
  };
};

type DefaultWindow = {
  focused: string;
  attention: string[];
  closing: string[];
  opened: {
    [key: string]: {
      icon: string;
      name: string;
      exec: string;
      windows: {
        [key: string]: {
          opts: AppProps['initialOptions'];
          name: string;
          icon: string;
          state: ('maximized' | 'minimized' | 'hidden')[];
          size: {
            height: number;
            width: number;
            scale?: number;
          };
          component: ReactNode;
        };
      };
    };
  };
};

type States = ('minimized' | 'maximized' | 'hidden')[];
type AppType = (wid: string) => {
  focus: () => void;
  close: () => boolean;
  readonly state: {
    value: States;
    maximized: boolean;
    hidden: boolean;
    minimized: boolean;
  };
  readonly window: {
    title: string;
    icon: string;
  };
};

const default_windows: DefaultWindow = {
  focused: '',
  attention: [],
  opened: {},
  closing: [],
};

const default_app: AppType = () => {
  return {
    focus: () => {},
    close: () => {},
    state: {
      hidden: false,
      maximized: false,
      minimized: false,
      value: [],
    },
  } as any;
};

type ReactState<T> = [T, (arg: T | ((arg: T) => T)) => void];
type WindowContext = {
  window: ReactState<DefaultWindow>;
  open: (any: AppProps | string, exec?: string) => boolean;
  close: (wid: string) => boolean;
  focus: (wid: string) => boolean;
  app: AppType;
};

const Window = createContext<WindowContext>({
  window: [default_windows, (arg) => {}],
  open: (any, exec) => false,
  close: (wid) => false,
  focus: (wid) => false,
  app: default_app,
});

export const useDWM = () => useContext(Window);
export const WindowManager = ({ children }: any) => {
  const [, u] = useToggle();
  const [w, sW] = useState(default_windows);

  type Param = Parameters<ReactState<DefaultWindow>[1]>[0];
  const setValue = (v: Param, i = false) => sW(v)! || i || u();
  const focus = (wid: string, ignore = false) => {
    if (wid == w.focused) return false;
    return setValue((w) => _.set(w, 'focused', wid), ignore)! || false;
  };

  const open = (any: AppProps | string, exec?: string) => {
    if (typeof any == 'string') {
      import(`../apps/${any}/index.tsx`)
        .then((o) => open(o.default, any))
        .catch((e) => console.error(e));
      return true;
    }

    const id = uniqueId('_');
    const alreadyOpened = _.has(w.opened, [any.id]);
    if (any.onlyOne && alreadyOpened) return false;

    focus(any.id + id, true);
    if (alreadyOpened) {
      return (
        setValue((w) =>
          _.set(w, ['opened', any.id, 'windows', id], {
            component: any.children,
            opts: any.initialOptions,
            icon: any.icon || '/assets/Application.svg',
            name: any.name || 'Application',
            size: {
              height: any.window?.height || 400,
              width: any.window?.width || 500,
            },
          })
        )! || true
      );
    }

    return (
      setValue((w) =>
        _.set(w, ['opened', any.id], {
          icon: any.icon || '/assets/Application.svg',
          name: any.name || 'Application',
          exec: exec,
          windows: {
            [id]: {
              component: any.children,
              opts: any.initialOptions,
              icon: any.icon || '/assets/Application.svg',
              name: any.name || 'Application',
              size: {
                height: any.window?.height || 400,
                width: any.window?.width || 500,
              },
            },
          },
        })
      )! || true
    );
  };

  const close = (wid: string) => {
    const id = wid.split('_');
    const key = ['opened', id[0], 'windows'];
    const onlyOne = _.keys(_.get(w, key)).length == 1;

    const add = (...ids: string[]) => {
      return (
        setValue((w) => _.set(w, 'closing', [...w.closing, ...ids]))! || true
      );
    };

    const remove = (key: string | string[]) => {
      const unset = _.unset(w, key);
      if (!unset) return false;
      return (
        setValue(() => {
          const pull = _.pull(w.closing, wid, id[0]);
          return { ...w, closing: pull as any };
        })! || true
      );
    };

    if (onlyOne) {
      if (!_.has(w, ['opened', id[0]])) return false;
      setTimeout(() => remove(['opened', id[0]]), 300);
      return add(id[0], wid);
    }

    if (!_.has(w, [...key, '_' + id[1]])) return false;
    setTimeout(() => remove([...key, '_' + id[1]]), 300);
    return add(wid);
  };

  const app = (wid: string) => ({
    focus: () => setValue((v) => ({ ...v, focused: wid })),
    close: () => close(wid),
    get state() {
      const id = wid.split('_');
      const path = ['opened', id[0], 'windows', '_' + id[1], 'state'];
      const state: States = _.get(w, path, []);

      const sV = (v: boolean, s: string) => {
        return v ? [...state, s] : state.filter((s) => s != 'maximized');
      };

      return {
        get value() {
          return state;
        },
        get maximized() {
          return this.value.includes('maximized') as boolean;
        },
        get hidden() {
          return this.value.includes('hidden');
        },
        get minimized() {
          return this.value.includes('minimized');
        },

        set value(v) {
          setValue((s) => _.setWith(s, path, v));
        },
        set maximized(bool) {
          setValue((v) => _.setWith(v, path, sV(bool, 'maximized')));
        },
        set hidden(bool) {
          setValue((v) => _.setWith(v, path, sV(bool, 'hidden')));
        },
        set minimized(bool) {
          setValue((v) => _.setWith(v, path, sV(bool, 'minimized')));
        },
      };
    },
    get window() {
      const id = wid.split('_');
      const path = ['opened', id[0], 'windows', '_' + id[1]];
      const object = _.get(w, path);

      return {
        get title() {
          return object.name ?? '';
        },
        set title(a: string) {
          if (object.name == a) return;
          setValue((v) => _.setWith(v, [...path, 'name'], a));
        },
        get icon() {
          return object.icon ?? '';
        },
        set icon(a: string) {
          if (object.icon == a) return;
          setValue((v) => _.set(v, [...path, 'title'], a));
        },
      };
    },
  });

  const window: ReactState<DefaultWindow> = [w, sW];

  return (
    <Window.Provider value={{ open, window, close, focus, app }}>
      {children}
    </Window.Provider>
  );
};

export const Windows = () => {
  const wm = useDWM();
  const [w] = wm.window;
  return (
    <>
      {_.map(w.opened, (app, o) =>
        _.map(app.windows, (window, ws) => (
          <AppWindow
            key={o + ws}
            id={o + ws}
            initialOptions={window.opts}
            icon={window.icon}
            name={window.name}
            window={{
              height: window.size.height,
              width: window.size.width,
              scale: window.size.scale,
            }}
          >
            {window.component}
          </AppWindow>
        ))
      )}
    </>
  );
};
const AppContext = createContext({} as ReturnType<AppType>);
export const useApplication = () => useContext(AppContext);

const AppWindow = ({ name, icon, children, id, ...props }: AppProps) => {
  const wm = useDWM();
  const [w] = wm.window;
  const app = wm.app(id);

  return (
    <AppContext.Provider value={app}>
      <div
        className={clsx(
          id,
          `app-window`,
          w.focused == id && 'focused',
          app.state.minimized && 'minimized',
          app.state.maximized && 'maximized',
          app.state.hidden && 'hidden',
          w.closing.includes(id) && 'closing'
        )}
        data-uid={id}
        onMouseDown={() => wm.focus(id)}
        style={
          {
            '--header-height': `${
              props.initialOptions?.header?.height ?? 30
            }px`,
          } as any
        }
      >
        <div
          className="app-header"
          onMouseDown={(e) => dragMouseDown(e, id, app)}
        >
          <img className="app-icon" src={icon} width="16px" height="16px" />
          <div className="app-name">{name}</div>
          <div className="actions">
            <div className="minimize">
              <svg data-src="/assets/window/minimize-task.svg" />
            </div>
            <div
              className="expand"
              onClick={() => (app.state.maximized = !app.state.maximized)}
            >
              <svg data-src="/assets/window/maximize-window.svg" />
            </div>
            <div className="close" onClick={() => wm.close(id)}>
              <svg data-src="/assets/window/close.svg" />
            </div>
          </div>
        </div>
        <div className="app-frame">{children}</div>

        {!app.state.maximized && (
          <>
            <div className="resize resize-n" onPointerDown={resize} />
            <div className="resize resize-s" onPointerDown={resize} />
            <div className="resize resize-e" onPointerDown={resize} />
            <div className="resize resize-w" onPointerDown={resize} />
            <div className="resize resize-nw" onPointerDown={resize} />
            <div className="resize resize-ne" onPointerDown={resize} />
            <div className="resize resize-sw" onPointerDown={resize} />
            <div className="resize resize-se" onPointerDown={resize} />
          </>
        )}
      </div>
    </AppContext.Provider>
  );
};

function resize(event: PointerEvent<HTMLDivElement>) {
  event.preventDefault();
  const target = event.currentTarget;
  const parent = target.parentElement;

  if (!parent) return;

  const rect = parent.getBoundingClientRect();
  parent.dataset.x = event.clientX + '';
  parent.dataset.y = event.clientY + '';

  let position = target.classList[1].split('-')[1];

  document.onpointermove = (e) => {
    document.body.style.cursor = position + '-resize';
    resizing(e as any, target.parentElement as any, position, rect);
  };
  document.onpointerup = () => {
    document.body.style.cursor = '';
    document.onpointermove = null;
  };
}

function resizing(
  event: PointerEvent<HTMLDivElement>,
  element: HTMLDivElement,
  position = 'n',
  irect: DOMRect
) {
  event.preventDefault();
  const target = element;
  if (!target?.classList.contains('app-window')) return;
  if (!(event.clientX && event.clientY)) return;

  const style = getComputedStyle(target, null);
  const width = Number(style.getPropertyValue('min-width').replace('px', ''));
  const height = Number(style.getPropertyValue('min-height').replace('px', ''));

  const clientX = event.clientX;
  const clientY = event.clientY;

  const rect = irect;
  const x = Number(target.dataset.x);
  const y = Number(target.dataset.y);
  let bottom = innerHeight - (rect.y + rect.height);
  let right = innerWidth - (rect.x + rect.width);
  let left = rect.left;
  let top = rect.top;

  if (clientX <= 0) return;
  if (clientY <= 0) return;

  if (position.includes('s')) {
    target.style.top = top + 'px';
    target.style.bottom = 'auto';
    target.style.height = clientY - rect.y + 'px';
    target.style.setProperty('--x', top + 'px');
  }

  if (position.includes('e')) {
    target.style.left = left + 'px';
    target.style.right = 'auto';
    target.style.width = clientX - rect.x + 'px';
    target.style.setProperty('--x', left + 'px');
  }

  if (position.includes('n')) {
    target.style.top = 'auto';
    target.style.bottom = bottom + 'px';
    const nh = rect.height + (y - clientY);
    target.style.height = (nh < height ? height : nh) + 'px';
  }

  if (position.includes('w')) {
    target.style.left = 'auto';
    target.style.right = right + 'px';
    const nw = rect.width + (x - clientX);
    target.style.width = (nw < width ? width : nw) + 'px';
  }

  setPos(target);
}

let pos1 = 0,
  pos2 = 0,
  pos3 = 0,
  pos4 = 0;

function dragMouseDown(
  e: MouseEvent<HTMLDivElement>,
  uid: string,
  app: ReturnType<AppType>
) {
  e = e || window.event;

  if (!(e.target as HTMLElement).classList.contains('app-header')) return;

  pos3 = e.clientX;
  pos4 = e.clientY;
  document.body.style.cursor = 'move';

  const target = document.querySelector(
    `[data-uid="${uid}"]`
  ) as HTMLDivElement;

  document.onmouseup = () => {
    const rect = target.getBoundingClientRect();

    if (rect.top < 0) target.style.top = 0 + 'px';
    if (rect.left < (rect.width - 5) * -1)
      target.style.left = (rect.width - 10) * -1 + 'px';
    if (innerWidth < rect.left) target.style.left = innerWidth - 10 + 'px';
    if (innerHeight < rect.top)
      target.style.top = `calc(${innerHeight}px - calc(56px * var(--scaling)))`;

    setPos(target);

    document.onmouseup = null;
    document.onmousemove = null;
    document.body.style.cursor = '';
  };
  document.onmousemove = (e) => elementDrag(e, target, app);
}

function elementDrag(e: any, target: HTMLDivElement, app: ReturnType<AppType>) {
  e = e || window.event;
  pos1 = pos3 - e.clientX;
  pos2 = pos4 - e.clientY;
  pos3 = e.clientX;
  pos4 = e.clientY;

  if (target.classList.contains('maximized')) {
    const style = getComputedStyle(target);
    const width = Number(style.getPropertyValue('min-width').replace('px', ''));

    app.state.maximized = false;
    target.style.top = e.clientY - 10 + 'px';
    target.style.left = e.clientX - width / 2 + 'px';
    return;
  }

  target.style.top = target.offsetTop - pos2 + 'px';
  target.style.left = target.offsetLeft - pos1 + 'px';
  setPos(target);
}

function setPos(target: HTMLElement) {
  const r = target.getBoundingClientRect();
  target.style.setProperty('--y', r.y + 'px');
  target.style.setProperty('--x', r.x + 'px');
}

export default AppWindow;
