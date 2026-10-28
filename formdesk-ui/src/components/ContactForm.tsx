import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { ApiError, api } from "../api";
import {
  emptyForm,
  formatDate,
  formValues,
  requestTypes,
  sampleForm,
} from "../types";
import type { FormValues, Status, Submission } from "../types";
import { Icon } from "./Icon";

interface Props {
  draftId: string | null;
  onDraftChange(id: string | null): void;
  onView(record: Submission): void;
  notify(message: string): void;
}
const textFields = [
  {
    name: "first_name",
    label: "First name",
    placeholder: "Alex",
    autoComplete: "given-name",
    maxLength: 80,
    required: true,
  },
  {
    name: "last_name",
    label: "Last name",
    placeholder: "Morgan",
    autoComplete: "family-name",
    maxLength: 80,
    required: true,
  },
  {
    name: "email",
    label: "Email address",
    placeholder: "alex@example.com",
    autoComplete: "email",
    maxLength: 254,
    required: true,
    type: "email",
  },
  {
    name: "phone",
    label: "Phone number",
    placeholder: "+1 (555) 000-0000",
    autoComplete: "tel",
    maxLength: 40,
    required: false,
    type: "tel",
  },
  {
    name: "company",
    label: "Company",
    placeholder: "Where you do your thing",
    autoComplete: "organization",
    maxLength: 120,
    required: false,
  },
] as const;

export function ContactForm({ draftId, onDraftChange, onView, notify }: Props) {
  const client = useQueryClient();
  const {
    register,
    watch,
    getValues,
    reset,
    handleSubmit,
    setError,
    clearErrors,
    setFocus,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ defaultValues: emptyForm });
  const values = watch();
  const [receipt, setReceipt] = useState<Submission | null>(null);
  const [message, setMessage] = useState("");
  const loadedId = useRef<string | null>(null);
  const successRef = useRef<HTMLElement>(null);
  const draft = useQuery({
    queryKey: ["submission", draftId],
    queryFn: () => api.get(draftId!),
    enabled: Boolean(draftId),
    staleTime: Infinity,
  });
  const save = useMutation({
    mutationFn: ({ values, status }: { values: FormValues; status: Status }) =>
      api.save(values, status, draftId),
  });

  // A selected draft hydrates the editor once, so background reads cannot overwrite edits.
  useEffect(() => {
    if (draft.data && draft.data.id !== loadedId.current) {
      reset(formValues(draft.data));
      loadedId.current = draft.data.id;
      setReceipt(null);
    }
  }, [draft.data, reset]);
  useEffect(() => {
    if (receipt) successRef.current?.focus();
  }, [receipt]);
  useEffect(() => {
    if (!isDirty || receipt) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty, receipt]);

  const progress = [
    values.first_name.trim() && values.last_name.trim(),
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email),
    values.request_type,
    Array.from(values.message.trim()).length >= 10,
    values.consent,
  ].filter(Boolean).length;
  const pending = save.isPending || (Boolean(draftId) && draft.isPending);
  const hasValues = Object.values(values).some(Boolean);

  function startNew() {
    reset(emptyForm);
    loadedId.current = null;
    onDraftChange(null);
    setReceipt(null);
    setMessage("");
    setFocus("first_name");
  }
  async function persist(status: Status) {
    clearErrors();
    setMessage("");
    try {
      const saved = await save.mutateAsync({ values: getValues(), status });
      reset(formValues(saved));
      loadedId.current = saved.id;
      client.setQueryData(["submission", saved.id], saved);
      onDraftChange(status === "draft" ? saved.id : null);
      await client.invalidateQueries({ queryKey: ["submissions"] });
      if (status === "draft") {
        setMessage("Draft saved. You can come back to it.");
        notify("Draft saved to your workspace.");
      } else setReceipt(saved);
    } catch (error) {
      const failure = error as ApiError;
      setError("root", { message: failure.message });
      const invalid =
        failure.details?.filter((item) => item.field in emptyForm) || [];
      for (const item of invalid)
        setError(item.field as keyof FormValues, {
          type: "server",
          message: item.message,
        });
      if (invalid[0]) setFocus(invalid[0].field as keyof FormValues);
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">A PLACE FOR YOUR NEXT HELLO</p>
          <h1 id="form-title">Good things start here.</h1>
          <p className="page-description">
            A few details, a little context, and we’re on our way.
          </p>
        </div>
        <span className="form-badge">
          <span className="status-dot" />
          Contact form
        </span>
      </div>
      <div className="form-layout">
        <div className="form-panel">
          <div className="panel-top">
            <span>
              <Icon name="form" />
              New submission
            </span>
            <span id="draft-indicator">
              {receipt
                ? "✓ Submission saved"
                : draftId
                  ? isDirty
                    ? "● Unsaved changes"
                    : "✓ Draft saved"
                  : "● Not saved yet"}
            </span>
          </div>
          {receipt ? (
            <section
              className="success-panel"
              ref={successRef}
              tabIndex={-1}
              aria-labelledby="success-title"
            >
              <span className="success-icon">
                <Icon name="check" />
              </span>
              <p className="eyebrow">A GOOD START</p>
              <h2 id="success-title">
                And just like that,
                <br />
                you’re all set.
              </h2>
              <p>
                Thanks, {receipt.first_name}. Your submission is saved in this
                workspace and ready whenever you need it.
              </p>
              <div className="success-receipt">
                {requestTypes[receipt.request_type!]} ·{" "}
                {formatDate(receipt.submitted_at!)}
              </div>
              <div className="success-actions">
                <button
                  className="button primary"
                  onClick={() => onView(receipt)}
                >
                  View submission
                  <Icon name="arrow" />
                </button>
                <button className="button secondary" onClick={startNew}>
                  Start another
                </button>
              </div>
            </section>
          ) : (
            <form
              id="contact-form"
              noValidate
              onSubmit={handleSubmit(() => persist("submitted"))}
              aria-busy={pending}
            >
              {errors.root && (
                <div className="alert error-alert" role="alert">
                  {errors.root.message}
                </div>
              )}
              {draft.isError && draftId && (
                <div className="alert error-alert" role="alert">
                  Couldn’t load this draft.{" "}
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => draft.refetch()}
                  >
                    Try again
                  </button>
                  <button
                    type="button"
                    className="button secondary"
                    onClick={startNew}
                  >
                    Start a new form
                  </button>
                </div>
              )}
              {draft.isPending && draftId && (
                <p className="loading-state" role="status">
                  Opening your saved draft…
                </p>
              )}
              <fieldset className="form-fields" disabled={pending}>
                <section
                  className="form-section"
                  aria-labelledby="contact-heading"
                >
                  <div className="section-heading">
                    <span className="section-number">01</span>
                    <div>
                      <h2 id="contact-heading">The introductions</h2>
                      <p>Let’s put a name to the conversation.</p>
                    </div>
                  </div>
                  <div className="field-grid">
                    {textFields.map((field) => (
                      <div className="field" key={field.name}>
                        <label htmlFor={field.name}>
                          {field.label}{" "}
                          {field.required ? (
                            <span className="required">*</span>
                          ) : (
                            <span className="optional">Optional</span>
                          )}
                        </label>
                        <input
                          {...register(field.name)}
                          id={field.name}
                          type={"type" in field ? field.type : "text"}
                          autoComplete={field.autoComplete}
                          placeholder={field.placeholder}
                          maxLength={field.maxLength}
                          aria-required={field.required}
                          aria-invalid={Boolean(errors[field.name])}
                          aria-describedby={`error-${field.name}`}
                        />
                        <span
                          className="field-error"
                          id={`error-${field.name}`}
                        >
                          {errors[field.name]?.message}
                        </span>
                      </div>
                    ))}
                    <div className="field">
                      <label htmlFor="role">
                        Your role <span className="optional">Optional</span>
                      </label>
                      <select
                        {...register("role")}
                        id="role"
                        aria-invalid={Boolean(errors.role)}
                        aria-describedby="error-role"
                      >
                        <option value="">Select your role</option>
                        {[
                          "Founder",
                          "Engineer",
                          "Designer",
                          "Student",
                          "Other",
                        ].map((role) => (
                          <option key={role}>{role}</option>
                        ))}
                      </select>
                      <span className="field-error" id="error-role">
                        {errors.role?.message}
                      </span>
                    </div>
                  </div>
                </section>
                <section
                  className="form-section request-section"
                  aria-labelledby="request-heading"
                >
                  <div className="section-heading">
                    <span className="section-number">02</span>
                    <div>
                      <h2 id="request-heading">What’s on your mind?</h2>
                      <p>A big idea or a small question. We’re all ears.</p>
                    </div>
                  </div>
                  <fieldset
                    className="request-types"
                    aria-describedby="error-request_type"
                  >
                    <legend>
                      What brings you here? <span className="required">*</span>
                    </legend>
                    <div className="type-options">
                      {Object.entries(requestTypes).map(([key, label]) => (
                        <label className="type-option" key={key}>
                          <input
                            {...register("request_type")}
                            type="radio"
                            value={key}
                            aria-invalid={Boolean(errors.request_type)}
                          />
                          <span className="radio-dot" />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                    <span className="field-error" id="error-request_type">
                      {errors.request_type?.message}
                    </span>
                  </fieldset>
                  <div className="field message-field">
                    <label htmlFor="message">
                      Your message <span className="required">*</span>
                    </label>
                    <textarea
                      {...register("message")}
                      id="message"
                      placeholder="Tell us a little about what you have in mind…"
                      rows={4}
                      maxLength={2000}
                      aria-required="true"
                      aria-invalid={Boolean(errors.message)}
                      aria-describedby="message-hint error-message"
                    />
                    <div className="textarea-footer">
                      <span id="message-hint">
                        A little detail goes a long way. At least 10 characters.
                      </span>
                      <span>
                        {values.message.length.toLocaleString()} / 2,000
                      </span>
                    </div>
                    <span className="field-error" id="error-message">
                      {errors.message?.message}
                    </span>
                  </div>
                </section>
                <div className="consent-section">
                  <label className="checkbox-label" htmlFor="consent">
                    <input
                      {...register("consent")}
                      type="checkbox"
                      id="consent"
                      aria-required="true"
                      aria-invalid={Boolean(errors.consent)}
                      aria-describedby="error-consent"
                    />
                    <span>
                      I agree to be contacted about this request.{" "}
                      <span className="required">*</span>
                    </span>
                  </label>
                  <span className="field-error" id="error-consent">
                    {errors.consent?.message}
                  </span>
                </div>
              </fieldset>
              <div className="form-actions">
                <button
                  type="button"
                  className="button text-button"
                  onClick={startNew}
                  disabled={pending || (!hasValues && !draftId)}
                >
                  Clear form
                </button>
                <div>
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => persist("draft")}
                    disabled={pending || !hasValues}
                  >
                    <Icon name="save" />
                    {save.isPending && save.variables?.status === "draft"
                      ? "Saving…"
                      : "Save draft"}
                  </button>
                  <button
                    type="submit"
                    className="button primary"
                    disabled={pending}
                  >
                    {save.isPending && save.variables?.status === "submitted"
                      ? "Sending…"
                      : "Send submission"}
                    <Icon name="arrow" />
                  </button>
                </div>
              </div>
              <div className="form-footnote">
                <span>* Required fields</span>
                <span role="status">{message}</span>
              </div>
            </form>
          )}
        </div>
        <aside className="form-companion" aria-label="Submission preview">
          <div className="companion-top">
            <span className="preview-symbol">
              <Icon name="spark" />
            </span>
            <p className="eyebrow">THE BIG PICTURE</p>
            <h2>A little about you.</h2>
            <p>
              Your details, coming together
              <br />
              one field at a time.
            </p>
          </div>
          <div className="preview-details">
            {[
              [
                "user",
                "NAME",
                [values.first_name, values.last_name]
                  .filter(Boolean)
                  .join(" ") || "Your name goes here",
              ],
              ["mail", "EMAIL", values.email || "A way to reach you"],
              [
                "building",
                "COMPANY",
                values.company || "Your corner of the world",
              ],
            ].map(([icon, label, text]) => (
              <div key={label}>
                <Icon name={icon} />
                <span>
                  <small>{label}</small>
                  <span>{text}</span>
                </span>
              </div>
            ))}
          </div>
          <div className="progress-section">
            <div>
              <span>Ready to send</span>
              <strong>{progress} of 5</strong>
            </div>
            <progress
              value={progress}
              max={5}
              aria-label="Required information completed"
            />
            <p>
              {receipt
                ? "All set. Your details are in Submissions."
                : progress === 5
                  ? "Looking good. Send it when you’re ready."
                  : "Every good conversation starts somewhere."}
            </p>
          </div>
          {!receipt && (
            <div className="sample-callout">
              <span className="sample-label">JUST LOOKING AROUND?</span>
              <p>Take the form for a little test drive.</p>
              <button
                type="button"
                className="sample-button"
                disabled={pending}
                onClick={() => {
                  reset(sampleForm, { keepDefaultValues: true });
                  notify("Sample details added. Review them before sending.");
                }}
              >
                Try sample details
                <Icon name="arrow" />
              </button>
            </div>
          )}
          <div className="privacy-note">
            <Icon name="lock" />
            <p>
              Saved in your local workspace.
              <br />
              Right where you left it.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
