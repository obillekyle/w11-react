import Taskbar from "../..";

const Widget = () => {
  const hidden = true;

  if (hidden) return null;

  return (
    <Taskbar.Button className="widget-menu" tooltip="Widgets">
      <svg data-src="/assets/taskbar/widget.svg" width="1em" height="1em" />
    </Taskbar.Button>
  );
};

export default Widget;
