import ShowDesktop from './corner';
import NotificationMenu from './notif';
import SystemPanel from './panel';
import SystemTray from './tray';

const SystemTaskbar = () => {
  return (
    <div className="system">
      <SystemTray />
      <SystemPanel />
      <NotificationMenu />
      <ShowDesktop />
    </div>
  );
};

export default SystemTaskbar;
