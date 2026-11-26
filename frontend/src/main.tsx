import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./index.css";
import App from "./App.tsx";
import AuthProvider from "./auth/AuthProvider.tsx";
import ToastProvider from "./toast/ToastProvider.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      {/* ToastProvider: any page can show a confirmation message through useToast() */}
      <ToastProvider>
        {/* AuthProvider: the logged-in user is available everywhere through useAuth() */}
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);
