import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ApiError, register, ValidationError } from "../api/client";
import { useAuth } from "../auth/useAuth";
import TextField from "../components/TextField";

/**
 * Account creation page.
 *
 * @remarks
 * The registration code is given by the church to its accountants: without it
 * the API refuses the registration (422 on "registration_code").
 * The password confirmation is only checked here, in the browser: the API never
 * receives it (it would just be the same value twice).
 */
function Register() {
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [registrationCode, setRegistrationCode] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setFormError(null);

    if (password !== passwordConfirmation) {
      setErrors({ password_confirmation: "Les deux mots de passe ne sont pas identiques." });
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await register({ name, email, password, registration_code: registrationCode });
      setUser(user); // the API logged the new user in
      navigate("/", { replace: true });
    } catch (registerError) {
      if (registerError instanceof ValidationError) {
        setErrors(registerError.errors);
      } else if (registerError instanceof ApiError && registerError.status === 403) {
        setFormError(registerError.message); // "Les inscriptions sont fermées."
      } else {
        console.error(registerError);
        setFormError("Impossible de créer le compte. Réessayez plus tard.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card w-full max-w-md bg-base-100 shadow" noValidate>
      <div className="card-body">
        <h1 className="card-title text-2xl">Créer un compte</h1>

        <TextField
          label="Nom"
          value={name}
          onChange={setName}
          error={errors.name}
          autoComplete="name"
        />
        <TextField
          label="Adresse e-mail"
          type="email"
          value={email}
          onChange={setEmail}
          error={errors.email}
          autoComplete="email"
        />
        <TextField
          label="Mot de passe"
          type="password"
          value={password}
          onChange={setPassword}
          error={errors.password}
          autoComplete="new-password"
          hint="12 caractères minimum. Une phrase de plusieurs mots est idéale."
        />
        <TextField
          label="Confirmer le mot de passe"
          type="password"
          value={passwordConfirmation}
          onChange={setPasswordConfirmation}
          error={errors.password_confirmation}
          autoComplete="new-password"
        />
        <TextField
          label="Code d'inscription"
          value={registrationCode}
          onChange={setRegistrationCode}
          error={errors.registration_code}
          autoComplete="off"
          hint="Code fourni par l'église."
        />

        {formError && (
          <div role="alert" className="alert alert-error">
            {formError}
          </div>
        )}

        <div className="card-actions flex-col items-stretch gap-3">
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Création..." : "Créer mon compte"}
          </button>
          <p className="text-center text-sm">
            Déjà un compte ?{" "}
            <Link to="/login" className="link link-primary">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </form>
  );
}

export default Register;
