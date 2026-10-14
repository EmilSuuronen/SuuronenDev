import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import SessionRoot from "./SessionRoot";
import { LocaleProvider } from "./i18n/locale";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LocaleProvider>
      <SessionRoot />
    </LocaleProvider>
  </StrictMode>,
);
