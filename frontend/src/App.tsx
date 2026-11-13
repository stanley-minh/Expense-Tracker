// src/App.tsx

import { Navigate, Route, Routes } from "react-router";
import GuestLayout from "./layouts/GuestLayout";
import ProtectedLayout from "./layouts/ProtectedLayout";
import Account from "./pages/Account";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Recap from "./pages/Recap";
import Register from "./pages/Register";

/**
 * Root component: maps each URL to a page.
 *
 * Routes are grouped by layout ("layout routes": a <Route> without a path that
 * wraps other routes and renders them in its <Outlet />):
 * - GuestLayout: login and registration, only when NOT logged in;
 * - ProtectedLayout: the app itself, only when logged in.
 */
function App() {
  return (
    <Routes>
      <Route element={<GuestLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/recap" element={<Recap />} />
        <Route path="/account" element={<Account />} />
      </Route>

      {/* Any unknown URL: back to the home page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
