// src/pages/login.tsx

import { useState } from "react";

    /**
     * Page de connexion.
     *
     * Formulaire contrôlé (email + mot de passe) qui appelle POST /api/login_check
     * pour obtenir un token JWT.
     *
     * @remarks
     * Version volontairement minimale à ce stade : le formulaire existe et
     * se soumet, mais ne stocke pas encore le token ni ne redirige l'utilisateur.
     * Ces deux points seront ajoutés à l'étape suivante (state partagé via
     * Context API, pour que le token soit accessible depuis toute l'app).
     */function Login() {
    /** Valeur actuelle du champ email, mise à jour à chaque frappe. */
    const [email, setEmail] = useState("");

    /** Valeur actuelle du champ mot de passe. */
    const [password, setPassword] = useState("");

    /**
     * Gère la soumission du formulaire.
     * `event.preventDefault()` empêche le rechargement complet de la page
     * que ferait un <form> HTML classique par défaut.
     */
    function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        console.log("À envoyer à l'API :", { email, password });
        // Prochaine étape : remplacer ce console.log par un vrai fetch vers /api/login_check
        event.preventDefault();
        // fetch returns a Promise: "await" pauses until the server answers
        const response = await fetch("http://127.0.0.1:8000/api/login_check", {
            method: "POST",
            // Tells the server the body is JSON, otherwise it can't parse it
            headers: { "Content-Type": "application/json" },
            // Keys must match the backend config (username_path: email)
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        console.log(response.status, data);
    }
    return (
        <form onSubmit={handleSubmit}>
            <h1>Connexion</h1>
            <label>
                Email
                <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                />
            </label>
            <label>
                Mot de passe
                <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                />
            </label>
            <button type="submit">Se connecter</button>
        </form>
    );
}

export default Login;