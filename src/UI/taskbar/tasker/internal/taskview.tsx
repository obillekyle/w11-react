import { Icon } from "@iconify/react";
import { Menu } from "@mantine/core";
import Taskbar from "../..";

const TaskView = () => {
  return (
    <Menu position="top">
      <Menu.Target>
        <Taskbar.Button className="tasker-menu">
          <svg data-src="/assets/taskbar/tasker.svg" width="1em" height="1em" />
        </Taskbar.Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item icon={<Icon icon={"fluent:search-24-filled"} />}>
          Hello
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};

export default TaskView;
