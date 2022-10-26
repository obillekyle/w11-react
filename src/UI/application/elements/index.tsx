import { HoverCard, Tooltip } from '@mantine/core';
import _ from 'lodash';
import { HTMLAttributes } from 'react';
import { cx } from '../../../api/util';

export const Container = ({
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  const classList = props.className;
  delete props.className;

  return <div className={cx('app-ui-container', classList)}>{children}</div>;
};

type MenuProps = {
  options: {
    readonly file: {
      show: boolean;
      submenu: {
        type: 'item'
      }[]
    }
    [key: string]: {
      show: boolean;
      submenu: {
        type: 'item'
      }[]
    }
  }
}

export const Menu = ({options}: MenuProps) => {
  return (
    <div className='app-ui-container-menu'>
      <Tooltip.Group>
        {_.map(options, (object, key) => {
          if (!object.show) return null
  
          return <HoverCard>
            <HoverCard.Target key={key}>
              <div className='app-ui-container-menu-item'>{key}</div>
            </HoverCard.Target>
            <HoverCard.Dropdown>
              {object.submenu.map(() => null)}
            </HoverCard.Dropdown>
          </HoverCard>
        })}
      </Tooltip.Group>
    </div>
  )
}