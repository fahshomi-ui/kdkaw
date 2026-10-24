import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeSocket } from "./lib/store";

createRoot(document.getElementById("root")!).render(<App />);

initializeSocket();

// Register customer PWA service worker (skip on /admin which has its own SW)
if ('serviceWorker' in navigator && !location.pathname.startsWith('/admin')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .catch((err) => console.warn('SW registration failed', err));
  });
}
