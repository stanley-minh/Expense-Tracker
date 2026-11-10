import type { Category, Expense, ExpenseInput, ValidationErrors } from "../types/expense";

/**
 * Base path of the API. It is relative: in development Vite forwards /api to the
 * PHP backend (see the proxy in vite.config.ts), in production nginx will do it.
 */
const API_URL = "/api";

/** Thrown when the API answers 422: carries one message per invalid field. */
export class ValidationError extends Error {
  readonly errors: ValidationErrors;

  constructor(errors: ValidationErrors) {
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
 * Sends a request to the API and returns the decoded JSON.
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

/** DELETE /api/expenses/{id} */
export function deleteExpense(id: number): Promise<void> {
  return request<void>(`/expenses/${id}`, { method: "DELETE" });
}
