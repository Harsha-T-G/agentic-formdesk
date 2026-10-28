import type {
  FieldError,
  Filters,
  FormValues,
  Status,
  Submission,
  SubmissionPage,
} from "./types";

const base = import.meta.env.VITE_API_BASE_URL || "/api/v1";
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details: FieldError[] = [],
  ) {
    super(message);
  }
}
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(
      "Couldn’t reach your workspace. Check that the backend is running, then try again.",
      0,
    );
  }
  if (response.status === 204) return undefined as T;
  let result;
  try {
    result = await response.json();
  } catch {
    throw new ApiError(
      "The server returned an unexpected response. Please try again.",
      response.status,
    );
  }
  if (!response.ok)
    throw new ApiError(
      result.error?.message || "Something went wrong. Please try again.",
      response.status,
      result.error?.details || [],
    );
  return result as T;
}
export const api = {
  async get(id: string): Promise<Submission> {
    return (
      await request<{ data: Submission }>(
        `/submissions/${encodeURIComponent(id)}`,
      )
    ).data;
  },
  async save(
    values: FormValues,
    status: Status,
    id: string | null,
  ): Promise<Submission> {
    const payload = {
      ...values,
      request_type: values.request_type || null,
      form_id: "contact",
      status,
    };
    return (
      await request<{ data: Submission }>(
        id ? `/submissions/${encodeURIComponent(id)}` : "/submissions",
        { method: id ? "PATCH" : "POST", body: JSON.stringify(payload) },
      )
    ).data;
  },
  list(filters: Partial<Filters> = {}, perPage = 8): Promise<SubmissionPage> {
    const query = new URLSearchParams({
      page: String(filters.page || 1),
      per_page: String(perPage),
    });
    if (filters.status) query.set("status", filters.status);
    if (filters.q) query.set("q", filters.q);
    return request(`/submissions?${query}`);
  },
  delete(id: string): Promise<void> {
    return request(`/submissions/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
  exportUrl(filters: Partial<Filters>): string {
    const query = new URLSearchParams();
    if (filters.status) query.set("status", filters.status);
    if (filters.q) query.set("q", filters.q);
    return `${base}/submissions.csv?${query}`;
  },
};
