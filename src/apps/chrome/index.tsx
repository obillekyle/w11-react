import { AppProps } from "../../UI/window";

const chrome: AppProps = {
  onlyOne: true,
  id: "com.google.chrome",
  children: <div>Welcome to chrome</div>,
  initialOptions: {
    header: {
      height: 48,
    },
  },
  icon: "/assets/application/com.google.chrome.svg",
};

export default chrome;
