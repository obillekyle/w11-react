import { Icon } from '@iconify/react';
import { HoverCard, Tooltip } from '@mantine/core';
import _ from 'lodash';
import { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../../api/util';

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
      onClick?: (arg: MouseEvent) => any;
      nodeProps?: HTMLAttributes<HTMLDivElement>;
    };

type MenuProps = {
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

export const Menu = ({ options }: MenuProps) => {
  return (
    <div className="app-ui-container-menu">
      <Tooltip.Group>
        {_.map(options, (object, key) => {
          if (!object.show) return null;

          return (
            <HoverCard>
              <HoverCard.Target key={key}>
                <div className="app-ui-container-menu-dropdown">{key}</div>
              </HoverCard.Target>
              <HoverCard.Dropdown>
                {object.submenu.map((sub) => {
                  if (sub.type == 'divider') {
                    return <div className="app-u-menu-divider" />;
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
                        className={cx(
                          'app-ui-menu-item',
                          sub.nodeProps?.className
                        )}
                      >
                        <div className="app-ui-menu-icon" data-icon>
                          {icon}
                        </div>
                        <div className="app-ui-menu-label" data-label>
                          {sub.label}
                        </div>
                        {!!sub.right && (
                          <div className="app-ui-menu-right" data-right>
                            {sub.right}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return null;
                })}
              </HoverCard.Dropdown>
            </HoverCard>
          );
        })}
      </Tooltip.Group>
    </div>
  );
};
