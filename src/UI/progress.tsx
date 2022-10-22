import { RingProgress } from "@mantine/core";
import { useInterval } from "@mantine/hooks";
import { useEffect, useState } from "react";
import { useStore } from "../api/store";
import "./progress.scss";

const ProgressRing = ({
  speed = 0.75,
  thickness = 8,
  size = 64,
  reducedShaking = false,
}) => {
  const store = useStore();
  const [width, setWidth] = useState<[number, boolean]>([1, true]);
  const scale = store.get$("settings.scaling", "user", 1);
  const timed = (store.get$("settings.timing", "user", 1) as number) * speed;

  const interval = useInterval(() => {
    setWidth((w) => {
      if (w[0] >= 45) return [w[0] - timed, false];
      if (w[0] <= 5) return [w[0] + timed, true];
      return [w[0] + (w[1] ? timed : -timed), w[1]];
    });
  }, 64 * speed);

  useEffect(() => {
    interval.start();
    return interval.stop;
  }, []);

  return (
    <RingProgress
      sections={[{ value: width[0], color: "white" }]}
      roundCaps
      size={size * (scale as number)}
      thickness={thickness * (scale as number)}
      className="progress-ring"
      sx={{
        svg: {
          shapeRendering: reducedShaking ? "crispEdges" : "geometricPrecision",
        },
        "svg circle:nth-of-type(1)": {
          stroke: "transparent!important",
        },
      }}
    />
  );
};

export default ProgressRing;
