import { Icon } from '@iconify/react';
import { Group, Indicator } from '@mantine/core';
import { useInterval } from '@mantine/hooks';
import _ from 'lodash';
import { useEffect, useLayoutEffect, useState } from 'react';
import Taskbar from '../../taskbar';
import { useStore } from '../../../api/store';

const Panel = () => {
  return (
    <Taskbar.Button className="panels">
      <Group spacing={4}>
        <Internet />
        <Volume />
        <Battery />
      </Group>
    </Taskbar.Button>
  );
};

type NetworkConnection =
  | {
      online: false;
    }
  | {
      readonly online: true;
      readonly effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
      readonly downLink: number;
      readonly downLinkMax: number;
      readonly rtt: number;
      readonly saveData: number;
      readonly type?:
        | 'bluetooth'
        | 'cellular'
        | 'ethernet'
        | 'none'
        | 'wifi'
        | 'wimax'
        | 'other'
        | 'unknown';
    };

function getConnectionInfo(): NetworkConnection {
  const nav = navigator as any;
  const online = navigator.onLine;
  const connection = 'connection' in nav ? nav.connection : null;

  if (!(online && connection)) return { online: false };

  return {
    ...connection,
    online: true,
  };
}

const Internet = () => {
  const [connection, setConnection] = useState<NetworkConnection>();
  const interval = useInterval(() => setConnection(getConnectionInfo), 1000);

  useLayoutEffect(() => {
    interval.start();
    return interval.stop;
  }, []);

  return (
    <Taskbar.Tooltip
      label={
        connection?.online ? (
          <div>
            Wi-Fi
            <br />
            Internet Access
          </div>
        ) : (
          <div>
            No internet access
            <br />
            No connections available
          </div>
        )
      }
    >
      <Icon
        icon={
          connection?.online
            ? 'fluent:wifi-1-20-regular'
            : 'fluent:globe-prohibited-20-regular'
        }
        height={38}
        width={20}
      />
    </Taskbar.Tooltip>
  );
};

const getAudioDevices = async () => {
  const nav = navigator as any;
  const media: (MediaDeviceInfo | InputDeviceInfo)[] =
    'mediaDevices' in nav
      ? await nav.mediaDevices.enumerateDevices()
      : undefined;
  const audio: MediaDeviceInfo[] = media.filter((m) => m.kind == 'audiooutput');
  const names = audio.map((i) => i.label);
  return names;
};

const Volume = () => {
  const [devices, updateDevices] = useState<string[]>([]);
  const interval = useInterval(
    async () => updateDevices(await getAudioDevices()),
    500
  );

  useLayoutEffect(() => {
    interval.start();
    getAudioDevices().then(updateDevices);
    return interval.stop;
  }, []);

  const defaultDevice = devices
    .find((a) => a.startsWith('Default'))
    ?.replace('Default - ', '');

  return (
    <Taskbar.Tooltip label={`${defaultDevice}: 69%`}>
      <Icon icon="ion:volume-medium-outline" height={38} width={20} />
    </Taskbar.Tooltip>
  );
};

type BatteryProps = {
  charging: boolean;
  dischargingTime: number;
  chargingTime: number;
  level: number;
  icon: string;
  indicator: string;
};

// Battery

const getBattery = async (): Promise<BatteryProps | undefined> => {
  const nav = navigator as any;
  const battery: Omit<BatteryProps, 'icon' | 'indicator'> =
    'getBattery' in nav ? await nav.getBattery() : undefined;

  if (battery) {
    const keys = _.keys(bi);
    const level = Number((battery.level * 100).toFixed());
    const icon = keys.find((v) => Number(v) >= level);
    const indicator = () => {
      if (battery.charging) return bi.charging;
      if (level >= 7) return bi.critical;
      if (level >= 15) return bi.warning;
      return bi.warning;
    };

    return {
      level,
      icon: (bi as any)[icon ?? '0'],
      indicator: indicator(),
      charging: battery.charging,
      dischargingTime: battery.dischargingTime,
      chargingTime: battery.chargingTime,
    };
  }

  return undefined;
};

const bi: Record<string, string> = {
  0: 'fluent:battery-0-20-regular',
  10: 'fluent:battery-1-20-regular',
  20: 'fluent:battery-2-20-regular',
  30: 'fluent:battery-3-20-regular',
  40: 'fluent:battery-4-20-regular',
  50: 'fluent:battery-5-20-regular',
  60: 'fluent:battery-6-20-regular',
  70: 'fluent:battery-7-20-regular',
  80: 'fluent:battery-8-20-regular',
  90: 'fluent:battery-9-20-regular',
  100: 'fluent:battery-10-20-regular',
  charging: 'ic:outline-bolt',
  warning: 'fluent:warning-16-regular',
  critical: 'fluent:dismiss-circle-16-regular',
};

const Battery = () => {
  const store = useStore();
  const scaling = store.get$('settings.scaling', 'user', 1);
  const [battery, setBattery] = useState<BatteryProps | undefined>();
  const interval = useInterval(
    async () => setBattery(await getBattery()),
    1000
  );

  useLayoutEffect(() => {
    interval.start();
    getBattery().then(setBattery);
    return interval.stop;
  }, []);

  if (!battery) return null;

  const { level, charging, dischargingTime, chargingTime, icon, indicator } =
    battery;

  const time = () => {
    if (chargingTime !== Infinity) return chargingTime;
    if (dischargingTime !== Infinity) return dischargingTime;
    return 0;
  };
  const overall = time() / 60;
  const hours = overall / 60;
  const minute = overall % 60;
  const estimated = hours && `${hours} h` + minute && ` ${minute} min`;

  return (
    <Taskbar.Tooltip
      label={
        <div>
          Battery status: {level}%
          {charging ? ' available (plugged in)' : ' remaining'}
          {!!overall && <br />}
          {!!overall && estimated}
        </div>
      }
    >
      <Indicator
        label={
          <Icon
            icon={indicator}
            stroke="black"
            height={16 * scaling}
            strokeWidth={1.1}
            shapeRendering={'geometricPrecision'}
          />
        }
        size={18 * scaling}
        position="top-start"
        color="transparent"
        styles={{
          indicator: {
            marginTop: (charging ? 16 : 24) - 2 * scaling,
            marginLeft: 5 * scaling,
          },
        }}
      >
        <Icon icon={icon} height={38} width={20} />
      </Indicator>
    </Taskbar.Tooltip>
  );
};

export default Panel;
