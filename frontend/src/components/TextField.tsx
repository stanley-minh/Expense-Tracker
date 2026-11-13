import { useId } from "react";

interface TextFieldProps {
  /** Visible label (in French). */
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Input type: "text", "email", "password"... */
  type?: string;
  /** Error message shown under the field (from the API 422 or a local check). */
  error?: string;
  /**
   * Tells the browser / password manager what the field contains
   * ("email", "current-password", "new-password"...), so it can fill it in or
   * suggest a strong password. Also an accessibility requirement (WCAG 1.3.5).
   */
  autoComplete?: string;
  /** Help text shown under the field when there is no error. */
  hint?: string;
}

/**
 * Labeled text input with its error message (daisyUI "fieldset" styling).
 * Shared by the login, registration and account forms to avoid repeating the same markup.
 */
function TextField({
  label,
  value,
  onChange,
  type = "text",
  error,
  autoComplete,
  hint,
}: TextFieldProps) {
  // Unique id per field: links the <label> to its <input> even with several forms on the page
  const id = useId();

  return (
    <fieldset className="fieldset">
      <label className="fieldset-legend" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        className={`input w-full ${error ? "input-error" : ""}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        aria-invalid={error !== undefined}
      />
      {error ? (
        <p className="label text-error">{error}</p>
      ) : (
        hint && <p className="label">{hint}</p>
      )}
    </fieldset>
  );
}

export default TextField;
