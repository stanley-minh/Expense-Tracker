import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { ApiError, login } from "../api/client";
import { useAuth } from "../auth/useAuth";
import TextField from "../components/TextField";

/**
 * Login page (email + password).
 *
 * @remarks
 * After a successful login, the user is sent back to the page they wanted
 * (remembered by ProtectedLayout in the navigation state), or to the home page.
 */
function Login() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const user = await login(email, password);
      setUser(user);
      // Page requested before being redirected to /login, or the home page
      const from = (location.state as { from?: string } | null)?.from ?? "/";
      navigate(from, { replace: true });
    } catch (loginError) {
      // 401: wrong email or password — the API message is meant for the user
      if (loginError instanceof ApiError && loginError.status === 401) {
        setError(loginError.message);
      } else {
        console.error(loginError);
        setError("Impossible de joindre le serveur. Réessayez plus tard.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card w-full max-w-md bg-base-100 shadow" noValidate>
      <div className="card-body">
        <h1 className="card-title text-2xl">Connexion</h1>
        <p className="text-sm text-base-content/70">Espace réservé aux comptables de l'église.</p>

        <TextField
          label="Adresse e-mail"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
        />
        <TextField
          label="Mot de passe"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />

        {error && (
          <div role="alert" className="alert alert-error">
            {error}
          </div>
        )}

        <div className="card-actions flex-col items-stretch gap-3">
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Connexion..." : "Se connecter"}
          </button>
          <p className="text-center text-sm">
            Pas encore de compte ?{" "}
            <Link to="/register" className="link link-primary">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </form>
  );
}

export default Login;
