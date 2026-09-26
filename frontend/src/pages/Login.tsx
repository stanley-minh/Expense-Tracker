import { useState } from "react";

/**
 * Login page.
 *
 * Controlled form (email + password) that calls POST /api/login_check
 * to obtain a JWT.
 *
 * @remarks
 * Minimal version: the token is only logged, not stored yet, and errors
 * are not handled. Token storage (Context API) and error handling come next.
 */
function Login() {
    /** Current value of the email field. */
    const [email, setEmail] = useState("");

    /** Current value of the password field. */
    const [password, setPassword] = useState("");

    /**
     * Handles the form submission: sends the credentials to the API.
     * `event.preventDefault()` stops the full page reload that a classic
     * HTML <form> would trigger by default.
     */
    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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
            <h1>Log in</h1>
            <label>
                Email
                <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                />
            </label>
            <label>
                Password
                <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                />
            </label>
            <button type="submit">Log in</button>
        </form>
    );
}

export default Login;
