import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { App } from "./app/App";
import { store } from "./app/store";
import "./index.css";

const root = document.getElementById("app");

if (!root) {
  throw new Error("Root element #app was not found");
}

createRoot(root).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
);
