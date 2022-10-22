import "./App.css";
import { MantineProvider } from "@mantine/core";
import _ from "lodash";
import { StoreProvider, useStore } from "./api/store";
import Desktop from "./UI/desktop";
import Taskbar from "./UI/taskbar";
import { WindowManager } from "./UI/window";

function Providers({ children }: any) {
  return (
    <MantineProvider
      theme={{
        fontFamily: "Segoe UI Variable",
      }}
    >
      <StoreProvider>
        <WindowManager>
          <App />
        </WindowManager>
      </StoreProvider>
    </MantineProvider>
  );
}

function App() {
  const store = useStore();
  store.set$("system.boot_times", (v) => v + 1, "system");

  return (
    <>
      <style>{`
        :root {
          --scaling: ${store.get$("settings.scaling", "user", 1)};
          --timing: ${store.get$("settings.timing", "user", 1)};
          --taskbar-opacity: ${store.get$(
            "settings.transparency",
            "user",
            0.6
          )};
          --wp: ${store.get$(
            "settings.wallpaper",
            "user",
            `url("/assets/Web/4k/Wallpapers/default.jpg")`
          )}
        }
      `}</style>
      <Desktop />
      <Taskbar />
    </>
  );
}

export default Providers;
