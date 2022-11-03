import { clsx } from '@mantine/core';
import { useToggle } from '@mantine/hooks';
import _ from 'lodash';
import { uniqueId } from 'lodash';
import {
  createContext,
  MouseEvent,
  PointerEvent,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSettings } from '../os';
import UI from './application';
import './window.scss';

export type AppProps = {
  id: string;
  name?: string;
  icon?: string;
  children?: ReactNode;
  onlyOne?: boolean;
  exec?: string;
  initialOptions?: {
    position?: {
      x?: 'center' | number;
      y?: 'center' | number;
    };
    header?: {
      height?: number;
      scale?: number;
    };
    hide?: {
      icon?: boolean;
      name?: boolean;
      window?: boolean;
    };
    custom?: {
      header?: ReactNode;
    };
  };
  window?: {
    scale?: number;
    height?: number;
    width?: number;
  };
};

export type Process = {
  icon: string;
  name: string;
  exec: string;
  windows: Record<string, AppWindow>;
};

export type AppWindow = {
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

export type DefaultWindow = {
  focused: string;
  attention: string[];
  closing: string[];
  opened: Record<string, Process>;
};

export type States = ('minimized' | 'maximized' | 'hidden')[];
export type AppType = (wid: string) => {
  focus: (onError?: (error: string) => void) => void;
  close: (onError?: (error: string) => void) => void;
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

export const default_windows: DefaultWindow = {
  focused: '',
  attention: [],
  opened: {},
  closing: [],
};

const default_app: AppType = () => {
  return {
    focus: () => void 0,
    close: () => false,
    state: {
      hidden: false,
      maximized: false,
      minimized: false,
      value: [],
    },
    window: {
      icon: '',
      title: '',
    },
  };
};

type ReactState<T> = [T, (arg: T | ((arg: T) => T)) => void];
type WindowContext = {
  window: ReactState<DefaultWindow>;
  open(
    executable: AppProps | string,
    execPath?: string,
    onError?: (error: string) => void
  ): void;
  focus(wid: string, ignore?: boolean, onError?: (error: string) => void): void;
  close(wid: string, onError?: (error: string) => void): void;
  app: AppType;
};

const Window = createContext<WindowContext>({
  window: [default_windows, () => void ''],
  open: () => false,
  close: () => false,
  focus: () => false,
  app: default_app,
});

export const useDWM = () => useContext(Window);
export const WindowManager = (props: { children: ReactNode }) => {
  const [, update] = useToggle();
  const [windows, setWindows] = useState(default_windows);

  type Param = Parameters<ReactState<DefaultWindow>[1]>[0];
  const setValue = (value: Param, ignore = false) => {
    setWindows(value);
    ignore || update();
  };

  const window: ReactState<DefaultWindow> = [windows, setWindows];

  return (
    <Window.Provider
      value={{
        window,
        open(executable, exec, onError) {
          if (typeof executable == 'string') {
            import(`../apps/${executable}/index.tsx`)
              .then((o) => this.open(o.default, executable))
              .catch((error) => onError?.(error));
            return true;
          }

          const id = uniqueId('_');
          const alreadyOpened = _.has(windows.opened, [executable.id]);
          if (executable.onlyOne && alreadyOpened) return false;

          this.focus(executable.id + id, true);
          if (alreadyOpened) {
            return setValue((windows) =>
              _.set(windows, ['opened', executable.id, 'windows', id], {
                component: executable.children,
                opts: executable.initialOptions,
                icon: executable.icon || '/assets/Application.svg',
                name: executable.name || 'Application',
                size: {
                  height: executable.window?.height || 400,
                  width: executable.window?.width || 500,
                  scale: executable.window?.scale,
                },
              })
            );
          }

          return setValue((w) =>
            _.set(w, ['opened', executable.id], {
              icon: executable.icon || '/assets/Application.svg',
              name: executable.name || 'Application',
              exec: exec,
              windows: {
                [id]: {
                  component: executable.children,
                  opts: executable.initialOptions,
                  icon: executable.icon || '/assets/Application.svg',
                  name: executable.name || 'Application',
                  size: {
                    height: executable.window?.height || 400,
                    width: executable.window?.width || 500,
                    scale: executable.window?.scale,
                  },
                },
              },
            })
          );
        },

        close(windowId: string) {
          const id = windowId.split('_');
          const key = ['opened', id[0], 'windows'];
          const onlyOne = _.keys(_.get(windows, key)).length == 1;

          const add = (...ids: string[]) => {
            return setValue((current) =>
              _.set(current, 'closing', [...current.closing, ...ids])
            );
          };

          const remove = (key: string | string[]) => {
            const unset = _.unset(windows, key);
            if (!unset) return false;
            return setValue(() => {
              const pull = _.pull(windows.closing, windowId, id[0]);
              return { ...windows, closing: pull };
            });
          };

          if (onlyOne) {
            if (!_.has(windows, ['opened', id[0]])) return false;
            setTimeout(() => remove(['opened', id[0]]), 300);
            return add(id[0], windowId);
          }

          if (!_.has(windows, [...key, '_' + id[1]])) return false;
          setTimeout(() => remove([...key, '_' + id[1]]), 300);
          return add(windowId);
        },

        focus(windowId, ignore = false, onError) {
          if (windowId == windows.focused) return onError?.('Already focused');
          setValue((w) => _.set(w, 'focused', windowId), ignore);
          return;
        },

        app(wid: string) {
          const [appId, windowId] = wid.split('_');
          const windowPath = ['opened', appId, 'windows', '_' + windowId];

          return {
            focus: () => setValue((current) => ({ ...current, focused: wid })),
            close: () => this.close(wid),
            get state() {
              const path = [...windowPath, 'state'];
              const states: States = _.get(windows, path, []);

              const setStateValue = (state: States[0], newState: boolean) => {
                const newStates = newState
                  ? states.includes(state)
                    ? states
                    : [...states, state]
                  : states.filter((oldState) => oldState != state);

                setValue((current) => _.set(current, path, newStates));
              };

              return {
                get value() {
                  return states;
                },
                get maximized() {
                  return this.value.includes('maximized');
                },
                get hidden() {
                  return this.value.includes('hidden');
                },
                get minimized() {
                  return this.value.includes('minimized');
                },

                set value(current) {
                  setValue((s) => _.set(s, path, current));
                },
                set maximized(bool) {
                  setStateValue('maximized', bool);
                },
                set hidden(bool) {
                  setStateValue('hidden', bool);
                },
                set minimized(bool) {
                  setStateValue('minimized', bool);
                },
              };
            },
            get window() {
              const path = windowPath;
              const application = _.get(windows, path) as AppWindow;

              return {
                get title() {
                  return application.name;
                },
                set title(newTitle: string) {
                  if (application.name == newTitle) return;
                  setValue((v) => _.set(v, [...path, 'name'], newTitle));
                },

                get icon() {
                  return application.icon;
                },
                set icon(newIcon: string) {
                  if (application.icon == newIcon) return;
                  setValue((current) =>
                    _.set(current, [...path, 'title'], newIcon)
                  );
                },
              };
            },
          };
        },
      }}
    >
      {props.children}
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

const AppWindow = ({
  name,
  icon,
  children,
  initialOptions: init,
  id,
  window,
}: AppProps) => {
  const store = useSettings();
  const scale = store.get('scaling', 1);
  const ref = useRef<HTMLDivElement>(null);

  const wm = useDWM();
  const [w] = wm.window;
  const app = wm.app(id);

  useEffect(() => {
    if (!ref.current) return;
    const element = ref.current;
    const pos = init?.position;

    const cx = innerWidth / 2 - (window?.width ?? 400) / 2;
    const cy = innerHeight / 2 - (window?.height ?? 400) / 2;
    const top = (typeof pos?.y == 'number' ? pos.y : cy) + 'px';
    const left = (typeof pos?.x == 'number' ? pos.x : cx) + 'px';

    element.style.top = top;
    element.style.left = left;
    element.style.setProperty('--y', top);
    element.style.setProperty('--x', left);
  }, [ref]);

  const style = useMemo(
    () => ({
      '--header-height': (init?.header?.height ?? 30) + 'px',
      '--window-min-width': (window?.width ?? 400) + 'px',
      '--window-min-height': (window?.height ?? 300) + 'px',
      '--window-scaling': (window?.scale ?? scale) + '',
      width: (window?.width ?? 400) + 'px',
      height: (window?.height ?? 300) + 'px',
    }),
    [scale]
  );

  return (
    <AppContext.Provider value={app}>
      <div
        className={clsx(
          id,
          'app-window',
          w.focused == id && 'focused',
          app.state.minimized && 'minimized',
          app.state.maximized && 'maximized',
          app.state.hidden && 'hidden',
          w.closing.includes(id) && 'closing'
        )}
        data-uid={id}
        onMouseDown={() => wm.focus(id)}
        style={style}
        ref={ref}
      >
        <div
          className="app-header"
          onPointerDown={(e) => dragMouseDown(e, id, app)}
        >
          {init?.hide?.icon || <img className="app-icon" src={icon} />}
          {init?.hide?.name || <div className="app-name">{name}</div>}
          {init?.custom?.header}
          <div className="actions">
            <div className="minimize">
              <UI.Icon icon="minimize-task" />
            </div>
            <div
              className="expand"
              onClick={() => (app.state.maximized = !app.state.maximized)}
            >
              <UI.Icon
                icon={
                  app.state.maximized ? 'minimize-window' : 'maximize-window'
                }
              />
            </div>
            <div className="close" onClick={() => wm.close(id)}>
              <UI.Icon icon="close" />
            </div>
          </div>
        </div>
        <div className="app-frame w11-scroll">{children}</div>
        {!app.state.maximized && <Resize />}
      </div>
    </AppContext.Provider>
  );
};

function Resize() {
  return (
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
  );
}

/**
 * Temporary, will be replaced with requestAnimationFrame in the future
 */
let update = true;
const ready = () => {
  if (!update) return false;
  update = false;
  setTimeout(() => (update = true), 1000 / 75);
  return true;
};

function resize(event: PointerEvent<HTMLDivElement>) {
  event.preventDefault();
  const target = event.currentTarget;
  const parent = target.parentElement;

  if (!parent) return;

  const rect = parent.getBoundingClientRect();
  parent.dataset.x = event.clientX + '';
  parent.dataset.y = event.clientY + '';

  const position = target.classList[1].split('-')[1];

  document.onpointermove = (e) => {
    document.body.style.cursor = position + '-resize';
    const parentElement = target.parentElement;
    if (!parentElement) return;

    resizing(e, target.parentElement, position, rect);
  };

  document.onpointerup = () => {
    document.body.style.cursor = '';
    document.onpointermove = null;
  };
}

function resizing(
  event: PointerEvent<HTMLDivElement> | globalThis.PointerEvent,
  element: HTMLElement,
  position = 'n',
  irect: DOMRect
) {
  event.preventDefault();
  if (!ready()) return;

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
  const bottom = innerHeight - (rect.y + rect.height);
  const right = innerWidth - (rect.x + rect.width);
  const left = rect.left;
  const top = rect.top;

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

function dragMouseDown(
  e: MouseEvent<HTMLDivElement>,
  uid: string,
  app: ReturnType<AppType>
) {
  e = e || window.event;

  if (!(e.target as HTMLElement).classList.contains('app-header')) return;

  document.body.style.cursor = 'move';
  const target = document.querySelector(
    `[data-uid="${uid}"]`
  ) as HTMLDivElement;

  target.dataset.x = e.clientX + '';
  target.dataset.y = e.clientY + '';

  document.onpointerup = () => {
    const rect = target.getBoundingClientRect();

    if (rect.top < 0) target.style.top = 0 + 'px';
    if (rect.left < (rect.width - 5) * -1)
      target.style.left = (rect.width - 10) * -1 + 'px';
    if (innerWidth < rect.left) target.style.left = innerWidth - 10 + 'px';
    if (innerHeight < rect.top)
      target.style.top = `calc(${innerHeight}px - calc(56px * var(--scaling)))`;

    setPos(target);

    document.onpointerup = null;
    document.onpointermove = null;
    document.body.style.cursor = '';
  };
  document.onpointermove = (e) => {
    elementDrag(e, target, app);
  };
}

function elementDrag(
  e: globalThis.PointerEvent,
  target: HTMLDivElement,
  app: ReturnType<AppType>
) {
  e = e || window.event;

  if (!ready()) return;

  const newX = Number(target.dataset.x) - e.clientX;
  const newY = Number(target.dataset.y) - e.clientY;

  target.dataset.x = e.clientX + '';
  target.dataset.y = e.clientY + '';

  if (target.classList.contains('maximized')) {
    const style = getComputedStyle(target);
    const width = Number(style.getPropertyValue('min-width').replace('px', ''));

    app.state.maximized = false;
    target.style.top = e.clientY - 10 + 'px';
    target.style.left = e.clientX - width / 2 + 'px';
    return;
  }

  target.style.top = target.offsetTop - newY + 'px';
  target.style.left = target.offsetLeft - newX + 'px';
  setPos(target);
}

function setPos(target: HTMLElement) {
  const r = target.getBoundingClientRect();
  target.style.setProperty('--y', r.y + 'px');
  target.style.setProperty('--x', r.x + 'px');
}

export default AppWindow;
