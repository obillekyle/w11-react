import { Icon } from '@iconify/react';
import { Popover, Tooltip } from '@mantine/core';
import { useClickOutside } from '@mantine/hooks';
import { HTMLAttributes, MouseEvent, ReactNode, useState } from 'react';
import { cx } from '#api/util';
import _ from 'lodash';

export const Container = ({
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  const classList = props.className;
  delete props.className;

  return <div className={cx('app-ui-container', classList)}>{children}</div>;
};

type SubMenuProps =
  | {
      type: 'divider';
    }
  | {
      type: 'item';
      disabled?: boolean;
      hidden?: boolean;
      icon?: ReactNode;
      right?: ReactNode;
      shortcut?: string;
      label: ReactNode;
      onClick?: (arg: MouseEvent<HTMLDivElement>) => any;
      nodeProps?: HTMLAttributes<HTMLDivElement>;
    };

type ToolbarProps = {
  options: {
    readonly file: {
      show: boolean;
      submenu: SubMenuProps[];
    };
    [key: string]: {
      show: boolean;
      submenu: SubMenuProps[];
    };
  };
};

export const Toolbar = ({ options }: ToolbarProps) => {
  const [f, sF] = useState(false);
  const [h, sH] = useState('');
  const ref = useClickOutside(() => sF(false));

  return (
    <div className="app-ui-toolbar" onClick={() => sF((t) => !t)}>
      <Tooltip.Group>
        {_.map(options, (object, key) => {
          if (!object.show) return null;
          const focus = h == key;

          return (
            <Popover
              withinPortal
              position="bottom-start"
              offset={0}
              opened={focus && f}
            >
              <Popover.Target key={key}>
                <div
                  ref={ref}
                  onMouseEnter={() => !focus && sH(key)}
                  className={cx(`app-ui-toolbar-item`, focus && f && 'active')}
                >
                  {key}
                </div>
              </Popover.Target>
              <Popover.Dropdown className="app-ui-toolbar-menu">
                {object.submenu.map((sub) => {
                  if (sub.type == 'divider') {
                    return <div className="app-ui-toolbar-menu-divider" />;
                  }

                  if (sub.type == 'item') {
                    const icon =
                      typeof sub.icon == 'string' ? (
                        <Icon icon={sub.icon} width={16} />
                      ) : (
                        sub.icon
                      );

                    return (
                      <div
                        {...sub.nodeProps}
                        onClick={(e) => {
                          sub.onClick?.(e);
                          sub.nodeProps?.onClick?.(e);
                        }}
                        className={cx(
                          'app-ui-toolbar-menu-item',
                          sub.nodeProps?.className
                        )}
                      >
                        <div className="app-ui-toolbar-menu-icon" data-icon>
                          {icon}
                        </div>
                        <div className="app-ui-toolbar-menu-label" data-label>
                          {sub.label}
                        </div>
                        {!!sub.right && (
                          <div className="app-ui-toolbar-menu-right" data-right>
                            {sub.right}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return null;
                })}
              </Popover.Dropdown>
            </Popover>
          );
        })}
      </Tooltip.Group>
    </div>
  );
};

type TabsProps = {
  initial?: number;
  tabs: {
    label: string;
    element: ReactNode;
  }[];
};

export const Tabs = ({ tabs, initial = 0 }: TabsProps) => {
  const [state, setState] = useState(tabs.length >= initial ? initial : 0);

  return (
    <>
      <div className="app-ui-tabs">
        {tabs.map((t, i) => (
          <div
            key={i}
            className={cx('app-ui-tab', state == i && 'active')}
            onClick={() => setState(tabs.length >= i ? i : 0)}
          >
            {t.label}
          </div>
        ))}
      </div>
      <div className="app-ui-tab-content w11-scroll">{tabs[state].element}</div>
    </>
  );
};
