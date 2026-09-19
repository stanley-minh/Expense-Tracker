// src/App.tsx

import { Routes, Route } from "react-router";
import Home from "./home";
import Login from "./pages/login";

/**
 * Composant racine de l'application.
 *
 * Ne contient aucune logique métier : son seul rôle est de définir
 * la correspondance entre une URL et la page à afficher.
 * <Routes> évalue l'URL courante et rend le premier <Route> dont
 * le `path` correspond — jamais plusieurs en même temps.
 */
function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}

export default App;