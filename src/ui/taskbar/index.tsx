import {
  clsx,
  HoverCard,
  Menu,
  Popover,
  PopoverBaseProps,
  Tooltip,
} from '@mantine/core';
import { forwardRef, HTMLAttributes, ReactNode, useState } from 'react';
import SystemTaskbar from './system';
import Widget from './widget';
import Tasker from './tasker';
import './index.scss';
import { useSettings } from '../../os';

type TaskbarButton = {
  active?: boolean;
  children?: ReactNode;
  tooltip?: ReactNode;
} & HTMLAttributes<HTMLButtonElement>;

const Btn = forwardRef<HTMLButtonElement, TaskbarButton>(
  ({ active, children, tooltip, ...props }, ref) => {
    return (
      <Tp label={tooltip}>
        <button
          {...props}
          ref={ref}
          className={clsx('taskbar-button', props.className)}
        >
          <div className={clsx('button', active && 'active')}>
            <div className="container">{children}</div>
          </div>
        </button>
      </Tp>
    );
  }
);

type TaskbarTooltip = {
  label?: ReactNode;
  children?: ReactNode;
};

const Tp = ({ label, children }: TaskbarTooltip) => {
  const store = useSettings();
  const scale = store.get('scaling', 1);
  const timed = store.get('timing', 1);

  return (
    <Tooltip
      disabled={!label}
      label={label}
      withinPortal
      offset={19 * scale}
      transitionDuration={400 / timed}
      styles={{
        tooltip: {
          fontSize: 12 * scale,
          textAlign: 'left',
          background: 'rgba(33, 33, 33, var(--taskbar-opacity, 1))',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 2px 5px #0005',
        },
      }}
    >
      {children}
    </Tooltip>
  );
};

type TaskbarPopover = {
  hover?: boolean;
  target: ReactNode;
  children?: ReactNode;
  clickOutside?: () => void;
  transitionDelay?: number;
} & PopoverBaseProps;

const Po = ({
  hover,
  position,
  target,
  children,
  clickOutside,
  transitionDelay = 0,
  ...props
}: TaskbarPopover) => {
  const [open, setOpen] = useState(false);
  const close = clickOutside ? clickOutside : () => setOpen(false);

  const style = {
    transitionDelay: `${transitionDelay}ms`,
    background: 'transparent',
    border: 'none',
    borderRadius: 0,
    padding: 0,
  };

  if (hover) {
    return (
      <HoverCard {...props} withinPortal>
        <HoverCard.Target>
          <div className="popover hover">{target}</div>
        </HoverCard.Target>
        <HoverCard.Dropdown sx={style}>{children}</HoverCard.Dropdown>
      </HoverCard>
    );
  }

  return (
    <Popover
      opened={open}
      onOpen={() => setOpen(true)}
      {...props}
      onClose={close}
      withinPortal
    >
      <Popover.Target>
        <div className="popover">{target}</div>
      </Popover.Target>

      <Popover.Dropdown sx={style}>{children}</Popover.Dropdown>
    </Popover>
  );
};

const Taskbar = () => {
  const store = useSettings();
  const timed = store.get('scaling', 1);

  return (
    <Tooltip.Group closeDelay={300 / timed} openDelay={1200 / timed}>
      <div className="taskbar-main">
        <Widget />
        <Tasker />
        <SystemTaskbar />
      </div>
    </Tooltip.Group>
  );
};

Taskbar.Popover = Po;
Taskbar.Button = Btn;
Taskbar.Tooltip = Tp;
export default Taskbar;
