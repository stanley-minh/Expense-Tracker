/** An accountant's account, as returned by the API (the password hash never leaves the server). */
export interface User {
  id: number;
  name: string;
  email: string;
  /** "YYYY-MM-DD HH:MM:SS" */
  created_at: string;
}

/** Body sent to POST /api/auth/register. */
export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  /** Code given by the church: without it, registration is refused. */
  registration_code: string;
}

/** Body sent to PUT /api/account. */
export interface AccountUpdateInput {
  name: string;
  email: string;
  /** Required to confirm any change. */
  current_password: string;
  /** Optional: empty string = keep the current password. */
  new_password: string;
}
