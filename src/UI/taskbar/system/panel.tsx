import { Icon } from '@iconify/react';
import { Group, Indicator } from '@mantine/core';
import { useInterval } from '@mantine/hooks';
import dayjs from 'dayjs';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import Taskbar from '../../taskbar';
import Duration from 'dayjs/plugin/duration';

dayjs.extend(Duration);

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

const Internet = () => {
  return (
    <Taskbar.Tooltip
      label={
        <div>
          No internet access
          <br />
          No connections available
        </div>
      }
    >
      <Icon icon="fluent:globe-prohibited-20-regular" height={38} width={20} />
    </Taskbar.Tooltip>
  );
};

const getAudioDevices = async () => {
  const nav = navigator as any;
  // const media: (MediaDeviceInfo | InputDeviceInfo)[] =
  //   "mediaDevices" in nav
  //     ? await nav.mediaDevices.enumerateDevices()
  //     : undefined;
  // const audio: MediaDeviceInfo[] = media.filter(
  //   (m) => m.kind == "audiooutput"
  // );
  // audio.find(a => )

  // const media = nav.getUserMedia({ deviceId: true });

  // new MediaDevices().getUserMedia({audio: true})
};

const Volume = () => {
  const [devices, updateDevices] = useState({} as any);
  const interval = useInterval(
    async () => updateDevices(await getAudioDevices()),
    500
  );

  useEffect(() => {
    interval.start();
    getAudioDevices().then((v) => updateDevices(v));
    return interval.stop;
  }, []);

  return (
    <Taskbar.Tooltip label={'Speakers (HD Audio): 69%'}>
      <Icon icon="ion:volume-medium-outline" height={38} width={20} />
    </Taskbar.Tooltip>
  );
};

// Battery

const getBattery = async (): Promise<[any, string] | undefined> => {
  const nav = navigator as any;
  const percent = 'getBattery' in nav ? await nav.getBattery() : undefined;

  if (percent) {
    const keys = _.keys(battery_icons);
    const icon = keys.find((v) => Number(v) >= percent.level * 100);
    return [percent, battery_icons[icon ?? 0]];
  }

  return undefined;
};

const battery_icons: any = {
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
};

const Battery = () => {
  const [battery, setBattery] = useState<[any, string] | undefined>([{}, '']);
  const interval = useInterval(
    async () => setBattery(await getBattery()),
    1000
  );

  useEffect(() => {
    interval.start();
    getBattery().then(setBattery);
    return interval.stop;
  }, []);

  if (!battery) {
    interval.stop();
    return null;
  }

  const { level, charging, dischargingTime } = battery[0];

  const discharge =
    dischargingTime === Infinity
      ? null
      : dayjs().add(battery[0].dischargingTime, 'seconds');
  const hours = discharge?.diff(dayjs(), 'hours') ?? 0;
  const minute = (discharge?.diff(dayjs(), 'minutes') ?? 0) - 60 * hours;

  return (
    <Taskbar.Tooltip
      label={
        <div>
          Battery status: {(level * 100).toFixed()}%
          {charging ? ' available (plugged in)' : ' remaining'}
          {discharge && <br />}
          {discharge &&
            `${hours ? hours + 'h ' : ''} ${minute > 0 ? minute + 'min' : ''}`}
        </div>
      }
    >
      <Indicator
        label={
          <Icon
            icon={charging ? 'ic:outline-bolt' : ''}
            stroke="black"
            width={18}
            strokeWidth={1.1}
            shapeRendering={'geometricPrecision'}
          />
        }
        position="top-start"
        styles={{
          indicator: {
            marginTop: 'calc(70% / var(--scaling, 1))',
            marginLeft: 'calc(30% / var(--scaling, 1))',
            '.iconify': {
              width: 'calc(12px * var(--scaling, 1)) !important',
            },
          },
        }}
        color="transparent"
      >
        <Icon icon={battery[1]} height={38} width={20} />
      </Indicator>
    </Taskbar.Tooltip>
  );
};

export default Panel;
