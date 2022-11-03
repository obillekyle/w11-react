import Taskbar from '../..';

const StartButton = () => {
  return (
    <Taskbar.Button className="start-menu" tooltip="Start">
      <svg data-src="/assets/taskbar/logo.svg" width="1em" height="1em" />
    </Taskbar.Button>
  );
};

export default StartButton;
