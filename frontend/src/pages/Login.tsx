import { useState } from "react";

/**
 * Login page.
 *
 * Controlled form (email + password) that calls POST /api/login_check
 * to obtain a JWT.
 *
 * @remarks
 * Minimal version: the token is only logged, not stored yet.
 * Invalid credentials (non-2xx response) and network failures display
 * distinct error messages. The submit button is disabled while the
 * request is in progress to prevent duplicate submissions.
 * Token storage (Context API) comes next.
 */
function Login() {
  /** Current value of the email field. */
  const [email, setEmail] = useState("");

  /** Current value of the password field. */
  const [password, setPassword] = useState("");

  /** Error message displayed to the user, or null when there is no error. */
  const [error, setError] = useState<string | null>(null);

  /** Whether the login request is in progress (disables the submit button). */
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * Handles the form submission: sends the credentials to the API.
   * `event.preventDefault()` stops the full page reload that a classic
   * HTML <form> would trigger by default.
   */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Clear the previous error: each attempt starts from a clean state
    setError(null);
    // Disable the button until the request is over (see finally below)
    setIsLoading(true);
    try {
      // fetch returns a Promise: "await" pauses until the server answers
      const response = await fetch("http://127.0.0.1:8000/api/login_check", {
        method: "POST",
        // Tells the server the body is JSON, otherwise it can't parse it
        headers: { "Content-Type": "application/json" },
        // Keys must match the backend config (username_path: email)
        body: JSON.stringify({ email, password }),
      });

      // fetch does NOT throw on HTTP errors (401, 500...),
      // so we must check the status ourselves.
      if (!response.ok) {
        setError("Invalid email or password.");
        return; // stop here: no token to read
      }

      const data = await response.json();
      console.log(response.status, data);
    } catch (err) {
      // fetch only rejects on network failure (server down, no connection, CORS)
      console.error(err);
      setError("Unable to reach the server. Please try again later.");
    } finally {
      // Runs whatever happens above (success, early return or error),
      // so the button can never stay disabled.
      setIsLoading(false);
    }
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
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Logging in..." : "Log in"}
      </button>
    </form>
  );
}

export default Login;
