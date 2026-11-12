import { useState } from "react";
import { useNavigate } from "react-router";
import { deleteAccount, updateAccount, ValidationError } from "../api/client";
import { useAuth } from "../auth/useAuth";
import TextField from "../components/TextField";
import type { User } from "../types/user";

/**
 * "Mon compte" page: edit the profile / password, or delete the account.
 * Only rendered inside ProtectedLayout, so a user is always logged in here.
 */
function Account() {
  const { user } = useAuth();

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-4 md:p-8">
      <h1 className="text-3xl font-bold">Mon compte</h1>
      {/* key: if the user changes (another login), the forms start from fresh values */}
      {user && <ProfileForm key={user.id} user={user} />}
      <DeleteAccountForm />
    </main>
  );
}

/**
 * Edit name, email and (optionally) password. The current password is always required.
 */
function ProfileForm({ user }: { user: User }) {
  const { setUser } = useAuth();

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setMessage(null);

    if (newPassword !== newPasswordConfirmation) {
      setErrors({ new_password_confirmation: "Les deux mots de passe ne sont pas identiques." });
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await updateAccount({
        name,
        email,
        current_password: currentPassword,
        new_password: newPassword,
      });
      setUser(updated); // the navbar shows the new name immediately
      // Never keep passwords in memory longer than needed
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirmation("");
      setMessage({ type: "success", text: "Vos informations ont été enregistrées." });
    } catch (updateError) {
      if (updateError instanceof ValidationError) {
        setErrors(updateError.errors);
      } else {
        console.error(updateError);
        setMessage({ type: "error", text: "Impossible d'enregistrer. Réessayez plus tard." });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card bg-base-100 shadow" noValidate>
      <div className="card-body">
        <h2 className="card-title">Informations du compte</h2>

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
          label="Nouveau mot de passe"
          type="password"
          value={newPassword}
          onChange={setNewPassword}
          error={errors.new_password}
          autoComplete="new-password"
          hint="Laissez vide pour garder le mot de passe actuel."
        />
        <TextField
          label="Confirmer le nouveau mot de passe"
          type="password"
          value={newPasswordConfirmation}
          onChange={setNewPasswordConfirmation}
          error={errors.new_password_confirmation}
          autoComplete="new-password"
        />
        <TextField
          label="Mot de passe actuel"
          type="password"
          value={currentPassword}
          onChange={setCurrentPassword}
          error={errors.current_password}
          autoComplete="current-password"
          hint="Obligatoire pour confirmer les modifications."
        />

        {message && (
          <div
            role="alert"
            className={`alert ${message.type === "success" ? "alert-success" : "alert-error"}`}
          >
            {message.text}
          </div>
        )}

        <div className="card-actions justify-end">
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </form>
  );
}

/**
 * Delete the account (and all its expenses), confirmed with the password.
 */
function DeleteAccountForm() {
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);

    // Irreversible action: a last confirmation
    if (!window.confirm("Supprimer définitivement votre compte et toutes vos dépenses ?")) {
      return;
    }

    setIsSubmitting(true);
    try {
      await deleteAccount(password);
      setUser(null);
      navigate("/login", { replace: true });
    } catch (deleteError) {
      if (deleteError instanceof ValidationError) {
        setError(deleteError.errors.password);
      } else {
        console.error(deleteError);
        setError("Impossible de supprimer le compte. Réessayez plus tard.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="card border border-error/40 bg-base-100 shadow"
      noValidate
    >
      <div className="card-body">
        <h2 className="card-title text-error">Supprimer le compte</h2>
        <p className="text-sm">
          Cette action est <strong>définitive</strong> : votre compte et{" "}
          <strong>toutes vos dépenses</strong> seront supprimés.
        </p>

        <TextField
          label="Mot de passe"
          type="password"
          value={password}
          onChange={setPassword}
          error={error}
          autoComplete="current-password"
        />

        <div className="card-actions justify-end">
          <button type="submit" className="btn btn-error" disabled={isSubmitting}>
            {isSubmitting ? "Suppression..." : "Supprimer mon compte"}
          </button>
        </div>
      </div>
    </form>
  );
}

export default Account;
