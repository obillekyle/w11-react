import { RingProgress } from '@mantine/core';
import { useInterval } from '@mantine/hooks';
import { useEffect, useState } from 'react';
import { useSettings } from '../os';
import { v } from '../api/util';
import './progress.scss';

const ProgressRing = ({
  speed = 0.75,
  thickness = 8,
  size = 64,
  reducedShaking = false,
}) => {
  const store = useSettings();
  const [width, setWidth] = useState<[number, boolean]>([1, true]);
  const scale = store.get('scaling', 1);
  const timed = store.get('timing', 1) * speed;

  const interval = useInterval(() => {
    setWidth((w) => {
      if (w[0] >= 45) return [w[0] - timed, false];
      if (w[0] <= 5) return [w[0] + timed, true];
      return [w[0] + (w[1] ? timed : -timed), w[1]];
    });
  }, 48 * timed);

  useEffect(() => {
    interval.start();
    return interval.stop;
  }, []);

  return (
    <div
      className="ring-root"
      style={
        {
          '--ring-width': v(size),
        } as any
      }
    >
      <RingProgress
        sections={[{ value: width[0], color: 'white' }]}
        roundCaps
        size={size * scale}
        thickness={thickness * scale}
        className="progress-ring"
        sx={{
          svg: {
            shapeRendering: reducedShaking
              ? 'crispEdges'
              : 'geometricPrecision',
          },
          'svg circle:nth-of-type(1)': {
            stroke: 'transparent!important',
          },
        }}
      />
    </div>
  );
};

export default ProgressRing;