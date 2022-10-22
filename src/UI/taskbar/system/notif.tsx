import { useInterval } from "@mantine/hooks";
import dayjs from "dayjs";
import { useState, useEffect } from "react";
import Taskbar from "../../taskbar";

const NotificationMenu = () => {
  const [time, setTime] = useState(dayjs());
  const interval = useInterval(() => setTime(dayjs()), 500);

  useEffect(() => {
    interval.start();
    return interval.stop;
  });

  return (
    <Taskbar.Button
      className="time-date"
      tooltip={time.format("dddd, MMMM D, YYYY")}
    >
      <div>{time.format("h:mm A")}</div>
      <div>{time.format("M/D/YYYY")}</div>
    </Taskbar.Button>
  );
};

export default NotificationMenu;
