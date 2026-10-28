export type Status = "draft" | "submitted";
export type RequestType = "general" | "project" | "feedback";
export interface FormValues {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  request_type: RequestType | "";
  message: string;
  consent: boolean;
}
export interface Submission extends Omit<FormValues, "request_type"> {
  id: string;
  form_id: string;
  status: Status;
  request_type: RequestType | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
}
export interface Counts {
  all: number;
  submitted: number;
  draft: number;
}
export interface SubmissionPage {
  data: Submission[];
  meta: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
    counts: Counts;
  };
}
export interface FieldError {
  field: string;
  message: string;
}
export interface Filters {
  status: Status | "";
  q: string;
  page: number;
}
export const emptyForm: FormValues = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  company: "",
  role: "",
  request_type: "",
  message: "",
  consent: false,
};
export const requestTypes: Record<RequestType, string> = {
  general: "General inquiry",
  project: "Project request",
  feedback: "Feedback",
};
export const sampleForm: FormValues = {
  first_name: "Alex",
  last_name: "Morgan",
  email: "alex.morgan@example.com",
  phone: "+1 (555) 010-2040",
  company: "Acorn Studio",
  role: "Designer",
  request_type: "project",
  message:
    "I’m exploring a new project and would love to share a few ideas. Let’s find a good place to start.",
  consent: false,
};
export function formValues(record: Submission): FormValues {
  return Object.fromEntries(
    Object.keys(emptyForm).map((key) => [
      key,
      record[key as keyof FormValues] ?? emptyForm[key as keyof FormValues],
    ]),
  ) as unknown as FormValues;
}
export function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
