import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import type { Submission } from "./types";
import { ContactForm } from "./components/ContactForm";
import { Icon } from "./components/Icon";
import { Submissions, SubmissionDialog } from "./components/Submissions";

function rememberedDraft(): string | null {
  try {
    return localStorage.getItem("formdesk-postgres-draft");
  } catch {
    return null;
  }
}
export default function App() {
  const [view, setView] = useState(
    location.hash === "#submissions" ? "submissions" : "form",
  );
  const [draftId, setDraftId] = useState<string | null>(rememberedDraft);
  const [formKey, setFormKey] = useState(0);
  const [selected, setSelected] = useState<Submission | null>(null);
  const [toast, setToast] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countsQuery = useQuery({
    queryKey: ["submissions", "counts"],
    queryFn: () => api.list({}, 1),
  });
  const counts = countsQuery.data?.meta.counts || {
    all: 0,
    submitted: 0,
    draft: 0,
  };
  useEffect(() => {
    const listener = () =>
      setView(location.hash === "#submissions" ? "submissions" : "form");
    window.addEventListener("hashchange", listener);
    return () => window.removeEventListener("hashchange", listener);
  }, []);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  function navigate(next: string) {
    location.hash = next;
    setView(next);
  }
  function remember(id: string | null) {
    setDraftId(id);
    try {
      if (id) localStorage.setItem("formdesk-postgres-draft", id);
      else localStorage.removeItem("formdesk-postgres-draft");
    } catch {
      /* Drafts remain available in the server inbox. */
    }
  }
  function notify(text: string) {
    setToast(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 4500);
  }
  function startNew() {
    remember(null);
    setFormKey((key) => key + 1);
    navigate("form");
  }
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="app-shell">
        <aside className="sidebar" aria-label="Workspace sidebar">
          <a href="#form" className="brand" aria-label="Formdesk home">
            <img src="/favicon.svg" width="34" height="34" alt="" />
            <span>
              formdesk<span className="brand-dot">.</span>
            </span>
          </a>
          <div className="workspace-switch">
            <span className="workspace-monogram">P</span>
            <span>
              Personal workspace<small>Just a little more organized</small>
            </span>
          </div>
          <p className="nav-label">WORKSPACE</p>
          <nav className="main-nav" aria-label="Main navigation">
            <a href="#form" aria-current={view === "form" ? "page" : undefined}>
              <Icon name="form" />
              <span>New submission</span>
              <Icon name="plus" small />
            </a>
            <a
              href="#submissions"
              aria-current={view === "submissions" ? "page" : undefined}
            >
              <Icon name="inbox" />
              <span>Submissions</span>
              <span className="nav-count">{counts.all}</span>
            </a>
          </nav>
          <div className="sidebar-bottom">
            <a
              className="developer-link"
              href="/api-docs"
              target="_blank"
              rel="noopener"
            >
              <Icon name="code" />
              Developer docs
              <Icon name="arrow" small />
            </a>
            <div className="profile">
              <span className="avatar">Y</span>
              <span>
                Your workspace
                <small>
                  <span className="status-dot" />
                  Local &amp; personal
                </small>
              </span>
            </div>
          </div>
        </aside>
        <div className="workspace-content">
          <header className="topbar">
            <div className="breadcrumb">
              <span>Workspace</span>
              <Icon name="chevron" small />
              <span>{view === "form" ? "Contact form" : "Submissions"}</span>
            </div>
            <div className="topbar-right">
              <span className="local-badge">
                <span className="status-dot" />
                Local workspace
              </span>
              <span className="top-avatar" aria-label="Your workspace">
                Y
              </span>
            </div>
          </header>
          <main id="main" tabIndex={-1}>
            <section
              id="form-view"
              hidden={view !== "form"}
              aria-labelledby="form-title"
            >
              <ContactForm
                key={formKey}
                draftId={draftId}
                onDraftChange={remember}
                onView={(record) => {
                  navigate("submissions");
                  setSelected(record);
                }}
                notify={notify}
              />
            </section>
            <section
              id="submissions-view"
              hidden={view !== "submissions"}
              aria-labelledby="submissions-title"
            >
              <Submissions
                active={view === "submissions"}
                counts={counts}
                onNew={startNew}
                onOpen={setSelected}
              />
            </section>
            <footer className="workspace-footer">
              <span>Less paperwork. More possibilities.</span>
              <span>
                Made for the details that matter.
                <Icon name="spark" small />
              </span>
            </footer>
          </main>
        </div>
      </div>
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
      {selected && (
        <SubmissionDialog
          key={selected.id}
          record={selected}
          onClose={() => setSelected(null)}
          onDeleted={(id) => {
            if (id === draftId) {
              remember(null);
              setFormKey((key) => key + 1);
            }
          }}
          onContinue={(record) => {
            remember(record.id);
            setFormKey((key) => key + 1);
            navigate("form");
          }}
          notify={notify}
        />
      )}
    </>
  );
}
