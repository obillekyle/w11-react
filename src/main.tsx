import React from "react";
import ReactDOM from "react-dom/client";
import "./index.scss";
import "external-svg-loader";
import Providers from "./App";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Providers />
  </React.StrictMode>
);
