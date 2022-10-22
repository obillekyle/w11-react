import { Icon } from "@iconify/react";
import Taskbar from "../../taskbar";

const SystemTray = () => {
  return (
    <>
      <Taskbar.Button
        className={"show-hidden-icons"}
        tooltip="Show hidden icons"
      >
        <Icon icon="fluent:chevron-up-20-filled" height="auto" />
      </Taskbar.Button>
      <Taskbar.Button
        className="kb-layout"
        tooltip={
          <div>
            <div>English (United States)</div>
            <div>US</div>
            <br />
            <div>To switch input methods, press Windows key + space.</div>
          </div>
        }
      >
        <div>ENG</div>
        <div>US</div>
      </Taskbar.Button>
    </>
  );
};

export default SystemTray;
