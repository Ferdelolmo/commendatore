import { createRoot } from "react-dom/client";
import './i18n';
import App from "./App.tsx";
import "./index.css";

// GitHub Pages SPA deep-link redirect:
// 404.html writes the original path to sessionStorage; we restore it here
// so React Router can handle the correct route on first load.
const ghRedirect = sessionStorage.getItem('gh_pages_redirect');
if (ghRedirect) {
  sessionStorage.removeItem('gh_pages_redirect');
  window.history.replaceState(null, '', ghRedirect);
}

createRoot(document.getElementById("root")!).render(<App />);

