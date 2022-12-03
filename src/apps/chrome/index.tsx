import { AppProps } from '@ui/window';
import './index.scss';

const chrome: AppProps = {
  onlyOne: true,
  id: 'com.google.chrome',
  icon: '/assets/application/com.google.chrome.svg',
  children: <div>Welcome to chrome</div>,
  initialOptions: {
    header: {
      height: 48,
    },
    hide: {
      icon: true,
      name: true,
    },
    custom: {
      header: <div> Hello</div>,
    },
  },
};

export default chrome;
