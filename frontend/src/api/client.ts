import type { Category, Expense, ExpenseInput } from "../types/expense";
import type { AccountUpdateInput, RegisterInput, User } from "../types/user";

/**
 * Base path of the API. It is relative: in development Vite forwards /api to the
 * PHP backend (see the proxy in vite.config.ts), in production nginx will do it.
 */
const API_URL = "/api";

/** Thrown when the API answers 422: carries one message per invalid field. */
export class ValidationError extends Error {
  /** Field name => message, e.g. { email: "Saisissez une adresse e-mail valide." } */
  readonly errors: Record<string, string>;

  constructor(errors: Record<string, string>) {
    super("Les données envoyées sont invalides.");
    this.name = "ValidationError";
    this.errors = errors;
  }
}

/** Thrown for any other error status (400, 404, 500...). */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Function called when the API answers 401 (session expired, account deleted...).
 * The AuthProvider registers it to send the user back to the login page.
 */
let unauthorizedHandler: (() => void) | null = null;

/** Registers the function to call on any 401 answer (see AuthProvider). */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

/**
 * Sends a request to the API and returns the decoded JSON.
 *
 * The session cookie is sent automatically: the frontend and the API share the
 * same origin (Vite proxy in development, nginx in production), and fetch sends
 * same-origin cookies by default.
 *
 * Centralizes what every call needs: base URL, JSON headers, and turning HTTP
 * errors into exceptions. fetch() itself does NOT throw on 4xx/5xx: it only
 * rejects on network failures, so the status has to be checked here.
 *
 * @param path    Path after /api, e.g. "/expenses/3"
 * @param options Standard fetch options (method, body, signal...)
 * @throws {ValidationError} on 422
 * @throws {ApiError} on any other non-2xx status
 * @throws {TypeError} when the server cannot be reached (thrown by fetch)
 */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });

  // 204 No Content: success, but there is no body to decode
  if (response.status === 204) {
    return undefined as T;
  }

  // .catch: a body that is not JSON (e.g. an nginx HTML error page) becomes null
  const data = await response.json().catch(() => null);

  // 401 on a protected route: the session is no longer valid.
  // (Not for the login route itself, where 401 just means "wrong password".)
  if (response.status === 401 && path !== "/auth/login") {
    unauthorizedHandler?.();
  }

  if (response.status === 422) {
    throw new ValidationError(data?.errors ?? {});
  }
  if (!response.ok) {
    throw new ApiError(response.status, data?.error ?? "Une erreur est survenue.");
  }

  return data as T;
}

/** GET /api/categories */
export function getCategories(signal?: AbortSignal): Promise<Category[]> {
  return request<Category[]>("/categories", { signal });
}

/** GET /api/expenses */
export function getExpenses(signal?: AbortSignal): Promise<Expense[]> {
  return request<Expense[]>("/expenses", { signal });
}

/** POST /api/expenses — returns the created expense (with its id and category name). */
export function createExpense(input: ExpenseInput): Promise<Expense> {
  return request<Expense>("/expenses", { method: "POST", body: JSON.stringify(input) });
}

/** PUT /api/expenses/{id} — replaces every field, returns the updated expense. */
export function updateExpense(id: number, input: ExpenseInput): Promise<Expense> {
  return request<Expense>(`/expenses/${id}`, { method: "PUT", body: JSON.stringify(input) });
}

/** PATCH /api/expenses/{id}/validation — checks or unchecks "validated". */
export function setExpenseValidated(id: number, isValidated: boolean): Promise<Expense> {
  return request<Expense>(`/expenses/${id}/validation`, {
    method: "PATCH",
    body: JSON.stringify({ is_validated: isValidated }),
  });
}

/** DELETE /api/expenses/{id} */
export function deleteExpense(id: number): Promise<void> {
  return request<void>(`/expenses/${id}`, { method: "DELETE" });
}

// --- Authentication and account ---

/** POST /api/auth/register — creates the account and logs the user in. */
export function register(input: RegisterInput): Promise<User> {
  return request<User>("/auth/register", { method: "POST", body: JSON.stringify(input) });
}

/** POST /api/auth/login */
export function login(email: string, password: string): Promise<User> {
  return request<User>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

/** POST /api/auth/logout */
export function logout(): Promise<void> {
  return request<void>("/auth/logout", { method: "POST" });
}

/** GET /api/auth/me — the logged-in user (throws ApiError 401 when nobody is logged in). */
export function getCurrentUser(signal?: AbortSignal): Promise<User> {
  return request<User>("/auth/me", { signal });
}

/** PUT /api/account — updates the logged-in user's account. */
export function updateAccount(input: AccountUpdateInput): Promise<User> {
  return request<User>("/account", { method: "PUT", body: JSON.stringify(input) });
}

/** DELETE /api/account — deletes the account and all its expenses. */
export function deleteAccount(password: string): Promise<void> {
  return request<void>("/account", { method: "DELETE", body: JSON.stringify({ password }) });
}
