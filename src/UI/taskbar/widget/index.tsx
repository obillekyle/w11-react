import Taskbar from "../../taskbar";

const Widget = () => {
  return (
    <div className="widget">
      <Taskbar.Button className="widget-menu" tooltip="Widgets">
        <svg data-src="/assets/taskbar/widget.svg" width="1em" height="1em" />
      </Taskbar.Button>
    </div>
  );
};

export default Widget;
