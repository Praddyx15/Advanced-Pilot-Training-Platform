import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// Import our WebSocket fix before rendering the app
import "./vite-hmr-fix";

createRoot(document.getElementById("root")!).render(<App />);
