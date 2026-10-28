import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import { formatDate, requestTypes } from "../types";
import type { Counts, Filters, Submission } from "../types";
import { Icon } from "./Icon";

interface Props {
  active: boolean;
  counts: Counts;
  onNew(): void;
  onOpen(record: Submission): void;
}
export function Submissions({ active, counts, onNew, onOpen }: Props) {
  const [filters, setFilters] = useState<Filters>({
    status: "",
    q: "",
    page: 1,
  });
  const [search, setSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(
      () =>
        setFilters((previous) => ({ ...previous, q: search.trim(), page: 1 })),
      200,
    );
    return () => clearTimeout(timer);
  }, [search]);
  const records = useQuery({
    queryKey: ["submissions", "list", filters],
    queryFn: () => api.list(filters),
    enabled: active,
  });
  const meta = records.data?.meta;
  useEffect(() => {
    if (meta && filters.page > 1 && !records.data?.data.length)
      setFilters((previous) => ({
        ...previous,
        page: Math.max(1, meta.total_pages),
      }));
  }, [meta, filters.page, records.data?.data.length]);
  const clearFilters = () => {
    setSearch("");
    setFilters({ status: "", q: "", page: 1 });
  };
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">EVERY CONVERSATION, IN ONE PLACE</p>
          <h1 id="submissions-title">Your submissions.</h1>
          <p className="page-description">
            The finished thoughts. The works in progress. All here.
          </p>
        </div>
        <button className="button primary" onClick={onNew}>
          <Icon name="plus" />
          New submission
        </button>
      </div>
      <div className="records-panel">
        <div className="records-toolbar">
          <div
            className="filter-tabs"
            role="group"
            aria-label="Filter submissions"
          >
            {(["", "submitted", "draft"] as const).map((status) => (
              <button
                className={`filter-tab ${filters.status === status ? "active" : ""}`}
                key={status}
                aria-pressed={filters.status === status}
                onClick={() =>
                  setFilters((previous) => ({ ...previous, status, page: 1 }))
                }
              >
                {status === ""
                  ? "All"
                  : status === "submitted"
                    ? "Submitted"
                    : "Drafts"}
                <span>{counts[status || "all"]}</span>
              </button>
            ))}
          </div>
          <a
            className="button secondary export-button"
            href={api.exportUrl(filters)}
            download
          >
            <Icon name="download" />
            Export CSV
          </a>
        </div>
        <div className="search-row">
          <div className="search-input">
            <Icon name="search" />
            <input
              type="search"
              aria-label="Search submissions"
              placeholder="Search name, email or company…"
              maxLength={200}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <span id="results-caption">
            {meta
              ? `${meta.total} ${meta.total === 1 ? "submission" : "submissions"}`
              : "Your saved submissions"}
          </span>
        </div>
        <div aria-live="polite" aria-busy={records.isFetching}>
          {records.isPending ? (
            <div className="loading-state" role="status">
              <span className="loading-dots">●</span> Loading your submissions…
            </div>
          ) : records.isError ? (
            <div className="empty-state">
              <span className="empty-icon">
                <Icon name="inbox" />
              </span>
              <h2>Let’s try that again.</h2>
              <p>{records.error.message}</p>
              <button
                className="button secondary"
                onClick={() => records.refetch()}
              >
                Try again
              </button>
            </div>
          ) : !records.data.data.length ? (
            <div className="empty-state">
              <span className="empty-icon">
                <Icon name={filters.q || filters.status ? "search" : "inbox"} />
              </span>
              <h2>
                {filters.q || filters.status
                  ? "Nothing here just yet."
                  : "Your first hello is waiting."}
              </h2>
              <p>
                {filters.q || filters.status
                  ? "Try a different search or check your other submissions."
                  : "Every conversation starts with a first step. Your submissions will find a home here."}
              </p>
              <button
                className="button primary"
                onClick={filters.q || filters.status ? clearFilters : onNew}
              >
                {filters.q || filters.status
                  ? "Clear filters"
                  : "Create a submission"}
                <Icon name="arrow" />
              </button>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">NAME &amp; EMAIL</th>
                      <th scope="col">REQUEST TYPE</th>
                      <th scope="col">STATUS</th>
                      <th scope="col">CREATED</th>
                      <th scope="col">
                        <span className="sr-only">Open</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.data.data.map((record) => (
                      <tr key={record.id}>
                        <td>
                          <button
                            className="record-name"
                            onClick={() => onOpen(record)}
                          >
                            {[record.first_name, record.last_name]
                              .filter(Boolean)
                              .join(" ") || "Untitled draft"}
                          </button>
                          <span className="record-email">
                            {record.email || "Email not added yet"}
                          </span>
                        </td>
                        <td>
                          {record.request_type
                            ? requestTypes[record.request_type]
                            : "Not selected"}
                        </td>
                        <td>
                          <StatusBadge record={record} />
                        </td>
                        <td className="record-date">
                          {formatDate(record.created_at)}
                        </td>
                        <td>
                          <button
                            className="icon-button row-open"
                            onClick={() => onOpen(record)}
                            aria-label={`Open ${record.first_name || "draft"}`}
                          >
                            <Icon name="chevron" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pagination">
                <span>
                  Showing {(meta!.page - 1) * meta!.per_page + 1}–
                  {Math.min(meta!.page * meta!.per_page, meta!.total)} of{" "}
                  {meta!.total}
                </span>
                <div>
                  <button
                    className="button secondary small-button"
                    disabled={filters.page <= 1}
                    onClick={() =>
                      setFilters((previous) => ({
                        ...previous,
                        page: previous.page - 1,
                      }))
                    }
                  >
                    Previous
                  </button>
                  <button
                    className="button secondary small-button"
                    disabled={filters.page >= meta!.total_pages}
                    onClick={() =>
                      setFilters((previous) => ({
                        ...previous,
                        page: previous.page + 1,
                      }))
                    }
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export function StatusBadge({ record }: { record: Submission }) {
  return (
    <span className={`record-status ${record.status}`}>
      <span className="status-dot" />
      {record.status === "draft" ? "Draft" : "Submitted"}
    </span>
  );
}

export function SubmissionDialog({
  record,
  onClose,
  onContinue,
  onDeleted,
  notify,
}: {
  record: Submission;
  onClose(): void;
  onContinue(record: Submission): void;
  onDeleted(id: string): void;
  notify(message: string): void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [confirming, setConfirming] = useState(false);
  const client = useQueryClient();
  const deletion = useMutation({ mutationFn: () => api.delete(record.id) });
  useEffect(() => {
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
  }, []);
  async function remove() {
    try {
      await deletion.mutateAsync();
      await client.invalidateQueries({ queryKey: ["submissions"] });
      notify("Submission deleted.");
      onDeleted(record.id);
      dialog.current?.close();
    } catch {
      /* The mutation error stays visible in the dialog. */
    }
  }
  return (
    <dialog ref={dialog} aria-labelledby="details-title" onClose={onClose}>
      <div className="dialog-heading">
        <h2 id="details-title">Submission details</h2>
        <button
          className="icon-button"
          aria-label="Close submission details"
          onClick={() => dialog.current?.close()}
        >
          <Icon name="close" />
        </button>
      </div>
      <div id="details-content">
        <StatusBadge record={record} />
        <h3 className="detail-name">
          {[record.first_name, record.last_name].filter(Boolean).join(" ") ||
            "Untitled draft"}
        </h3>
        <p className="detail-email">{record.email || "No email address yet"}</p>
        <dl className="detail-grid">
          {[
            ["Phone number", record.phone],
            ["Company", record.company],
            ["Your role", record.role],
            [
              "Request type",
              record.request_type ? requestTypes[record.request_type] : "",
            ],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value || "Not provided"}</dd>
            </div>
          ))}
        </dl>
        <p className="detail-label">MESSAGE</p>
        <p className="detail-message">{record.message || "No message yet."}</p>
        <div className="detail-meta">
          Consent to contact: {record.consent ? "Given" : "Not yet given"}
          <br />
          Created {formatDate(record.created_at)}
          <br />
          Last updated {formatDate(record.updated_at)}
          <br />
          Reference: {record.id}
        </div>
        {confirming && (
          <div className="delete-confirmation" role="alert">
            <strong>Delete this submission?</strong>
            <p>
              This removes this record from your workspace and cannot be undone.
            </p>
            <button
              className="button secondary"
              onClick={() => setConfirming(false)}
              disabled={deletion.isPending}
            >
              Keep it
            </button>{" "}
            <button
              className="button danger-solid"
              onClick={remove}
              disabled={deletion.isPending}
            >
              {deletion.isPending ? "Deleting…" : "Confirm deletion"}
            </button>
          </div>
        )}
        {deletion.isError && (
          <p className="field-error" role="alert">
            {deletion.error.message}
          </p>
        )}
      </div>
      <div className="dialog-actions">
        <button
          className="button danger-button"
          onClick={() => setConfirming(true)}
          disabled={deletion.isPending}
        >
          Delete submission
        </button>
        {record.status === "draft" && (
          <button
            className="button primary"
            onClick={() => {
              onContinue(record);
              dialog.current?.close();
            }}
          >
            Continue draft
            <Icon name="arrow" />
          </button>
        )}
        <button
          className="button secondary"
          onClick={() => dialog.current?.close()}
        >
          Done
        </button>
      </div>
    </dialog>
  );
}
