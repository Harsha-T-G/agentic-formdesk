import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, api } from "../api";
import { ContactForm } from "./ContactForm";
import type { Submission } from "../types";

vi.mock("../api", async (importOriginal) => {
  const original = await importOriginal<typeof import("../api")>();
  return { ...original, api: { ...original.api, get: vi.fn(), save: vi.fn() } };
});
const record: Submission = {
  id: "c8ed63e2-46fe-4228-8a80-4b1696463047",
  form_id: "contact",
  status: "submitted",
  first_name: "Alex",
  last_name: "Morgan",
  email: "alex.morgan@example.com",
  phone: "",
  company: "Acorn Studio",
  role: "Designer",
  request_type: "project",
  message: "I would like to discuss a new project.",
  consent: true,
  created_at: "2026-10-28T10:00:00Z",
  updated_at: "2026-10-28T10:00:00Z",
  submitted_at: "2026-10-28T10:00:00Z",
};
function setup(draftId: string | null = null) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const onDraftChange = vi.fn();
  render(
    <QueryClientProvider client={client}>
      <ContactForm
        draftId={draftId}
        onDraftChange={onDraftChange}
        onView={vi.fn()}
        notify={vi.fn()}
      />
    </QueryClientProvider>,
  );
  return { client, onDraftChange, user: userEvent.setup() };
}
beforeEach(() => vi.clearAllMocks());
describe("Contact form workflows", () => {
  it("keeps consent a deliberate choice and shows a receipt after the API accepts a submission", async () => {
    vi.mocked(api.save).mockResolvedValue(record);
    const { user } = setup();
    await user.click(
      screen.getByRole("button", { name: "Try sample details" }),
    );
    const consent = screen.getByRole("checkbox", {
      name: /I agree to be contacted/,
    });
    expect(consent).not.toBeChecked();
    await user.click(consent);
    await user.click(screen.getByRole("button", { name: "Send submission" }));
    expect(
      await screen.findByRole("heading", { name: /And just like that/ }),
    ).toBeVisible();
    expect(api.save).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: "Alex",
        consent: true,
        request_type: "project",
      }),
      "submitted",
      null,
    );
  });
  it("retains entered values and focuses the server-reported invalid field", async () => {
    vi.mocked(api.save).mockRejectedValue(
      new ApiError("Please check the highlighted fields.", 422, [
        { field: "email", message: "Enter a valid email address." },
      ]),
    );
    const { user } = setup();
    await user.type(
      screen.getByRole("textbox", { name: /First name/ }),
      "Jamie",
    );
    await user.type(
      screen.getByRole("textbox", { name: /Email address/ }),
      "invalid",
    );
    await user.click(screen.getByRole("button", { name: "Send submission" }));
    expect(
      await screen.findByText("Enter a valid email address."),
    ).toBeVisible();
    expect(screen.getByRole("textbox", { name: /First name/ })).toHaveValue(
      "Jamie",
    );
    expect(
      screen.getByRole("textbox", { name: /Email address/ }),
    ).toHaveFocus();
  });
  it("hydrates a saved draft once and does not replace unsaved edits with a background read", async () => {
    vi.mocked(api.get).mockResolvedValue({
      ...record,
      status: "draft",
      consent: false,
      submitted_at: null,
    });
    const { user, client } = setup(record.id);
    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: /First name/ })).toHaveValue(
        "Alex",
      ),
    );
    await user.clear(screen.getByRole("textbox", { name: /First name/ }));
    await user.type(
      screen.getByRole("textbox", { name: /First name/ }),
      "Edited name",
    );
    await act(async () => {
      await client.refetchQueries({ queryKey: ["submission", record.id] });
    });
    expect(screen.getByRole("textbox", { name: /First name/ })).toHaveValue(
      "Edited name",
    );
  });
});
