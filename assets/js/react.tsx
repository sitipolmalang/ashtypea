import React from "react";
import ReactDOM from "react-dom";
import { createRoot } from "react-dom/client";

const root = createRoot(document.getElementById("app")!);

root.render(
  <React.StrictMode>
    Hello, React!
  </React.StrictMode>
);