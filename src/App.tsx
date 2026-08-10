import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import { Login } from "./features/auth/Login";
import { listSupportRequests, type SupportRequest } from "./features/requests/api";

type Theme = "default" | "midnight" | "paper";
type View = "requests" | "new";

const themes: { id: Theme; label: string }[] = [
  { id: "default", label: "Default" }, { id: "midnight", label: "Midnight" }, { id: "paper", label: "Paper" },
];
const statusOptions = ["All", "New", "Open", "Assigned", "In Progress", "Waiting", "Resolved", "Closed"];
const typeOptions = ["All", "Support", "Bug", "Feature Suggestion", "Question", "Other"];

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [view, setView] = useState<View>("requests");
  const [activeTab, setActiveTab] = useState("Requests");
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("supportable-theme") as Theme) || "default");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [type, setType] = useState("All");
  const [sort, setSort] = useState("newest");
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);
  const [intent, setIntent] = useState("");
  const [newType, setNewType] = useState("support");
  const [newBounty, setNewBounty] = useState("");
  const [newBountyCurrency, setNewBountyCurrency] = useState("USD");
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem("supportable-theme", theme); }, [theme]);
  useEffect(() => {
    async function loadSession() { const { data: { session } } = await supabase.auth.getSession(); setUser(session?.user ?? null); setLoading(false); }
    loadSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  async function loadRequests() {
    if (!user) return;
    setRequestsLoading(true); setRequestsError(null);
    try { setRequests(await listSupportRequests()); }
    catch (error: unknown) { setRequestsError(error instanceof Error ? error.message : "Unable to load requests."); }
    finally { setRequestsLoading(false); }
  }
  useEffect(() => { if (user) void loadRequests(); }, [user]);
  async function signOut() { await supabase.auth.signOut(); }

  async function createRequest() {
    const description = intent.trim(); if (!description || !user) return;
    setCreating(true); setMessage("");
    try {
      const { data: account, error: accountError } = await supabase.from("participant_accounts").select("participant_id").eq("auth_user_id", user.id).single();
      if (accountError) throw accountError;
      const { data: application, error: applicationError } = await supabase.from("applications").select("id").eq("name", "Supportable").single();
      if (applicationError) throw applicationError;
      const amount = newBounty.trim() ? Number(newBounty) : null;
      if (amount !== null && (!Number.isFinite(amount) || amount < 0)) throw new Error("Bounty must be a valid non-negative amount.");
      const { data, error } = await supabase.from("support_requests").insert({ title: description.split("\n")[0].slice(0, 200), description, request_type: newType, application_id: application.id, requester_id: account.participant_id, bounty_amount: amount, bounty_currency: amount === null ? null : newBountyCurrency }).select("id").single();
      if (error) throw error;
      setMessage(`Request created: ${data.id}`); setIntent(""); setNewBounty(""); await loadRequests(); setView("requests"); setActiveTab("Requests");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to create the request."); }
    finally { setCreating(false); }
  }

  const visibleRequests = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const filtered = requests.filter((request) => {
      const matchesSearch = !normalizedSearch || [request.id, request.title, request.application, request.requester, request.type, request.assignedTo ?? ""].some((value) => value.toLowerCase().includes(normalizedSearch));
      return matchesSearch && (status === "All" || request.status === status) && (type === "All" || request.type === type);
    });
    return [...filtered].sort((a, b) => { if (sort === "oldest") return a.createdAt.localeCompare(b.createdAt); if (sort === "bounty") return b.bounty - a.bounty; if (sort === "title") return a.title.localeCompare(b.title); return b.createdAt.localeCompare(a.createdAt); });
  }, [requests, search, sort, status, type]);

  if (loading) return <main className="app-shell loading-screen">Loading Supportable…</main>;
  if (!user) return <main className="app-shell auth-screen"><div className="auth-card"><div className="brand-mark">S</div><h1>Supportable</h1><p>Helping people find and fulfill intent.</p><Login /></div></main>;

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark">S</div><span>Supportable</span></div>
      <nav className="tabs" aria-label="Supportable sections">{["Requests", "Supporting", "My Requests", "Community"].map((tab) => <button key={tab} type="button" className={activeTab === tab ? "tab active" : "tab"} onClick={() => { setActiveTab(tab); if (tab === "Requests") setView("requests"); }}>{tab}</button>)}</nav>
      <div className="account-area"><label className="theme-control">Theme<select value={theme} onChange={(event) => setTheme(event.target.value as Theme)}>{themes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><span className="user-email">{user.email}</span><button className="secondary-button" type="button" onClick={signOut}>Sign out</button></div>
    </header>

    {activeTab === "Requests" && view === "requests" ? <section className="workspace">
      <div className="page-heading"><div><h1>Requests</h1><p>Support requests, questions, bugs, and feature suggestions.</p></div><div className="heading-actions"><button className="secondary-button" type="button" onClick={() => void loadRequests()}>Refresh</button><button className="primary-button" type="button" onClick={() => { setView("new"); setMessage(""); }}>+ Request</button></div></div>
      <div className="request-toolbar"><label className="search-box"><span aria-hidden="true">⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search requests…" aria-label="Search requests" /></label><select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status">{statusOptions.map((option) => <option key={option} value={option}>{option === "All" ? "All statuses" : option}</option>)}</select><select value={type} onChange={(event) => setType(event.target.value)} aria-label="Filter by type">{typeOptions.map((option) => <option key={option} value={option}>{option === "All" ? "All types" : option}</option>)}</select><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort requests"><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="bounty">Highest bounty</option><option value="title">Title</option></select></div>
      <div className="request-meta"><span>{requestsLoading ? "Loading requests…" : `${visibleRequests.length} request${visibleRequests.length === 1 ? "" : "s"}`}</span>{(status !== "All" || type !== "All" || search) && <button className="clear-button" type="button" onClick={() => { setSearch(""); setStatus("All"); setType("All"); }}>Clear filters</button>}</div>
      {requestsError && <div className="error-state" role="alert"><strong>Could not load requests.</strong><span>{requestsError}</span></div>}
      <div className="request-list">{visibleRequests.map((request) => <button key={request.id} type="button" className="request-row" onClick={() => setSelectedRequest(request)}><div className="status-dot-wrap"><span className={`status-dot status-${request.status.toLowerCase().replaceAll(" ", "-")}`} /></div><div className="request-main"><div className="request-title-line"><strong>{request.title}</strong><span className="request-id">{request.id.slice(0, 8)}</span></div><div className="request-subline"><span>{request.application}</span><span>•</span><span>{request.requester}</span><span>•</span><span>{request.type}</span></div></div><div className="request-badges">{request.recording && <span className="badge">Recording{request.recordingPublic ? " · Public" : ""}</span>}<span className={request.compensation === "Bounty" ? "badge bounty" : "badge"}>{request.compensation === "Bounty" ? `$${request.bounty} bounty` : "Free"}</span></div><div className="request-date">{formatDate(request.createdAt)}</div></button>)}{!requestsLoading && !requestsError && visibleRequests.length === 0 && <div className="empty-state"><h2>No requests found</h2><p>{requests.length === 0 ? "Requests created through Supportable will appear here." : "Try changing the filters or search terms."}</p></div>}</div>
    </section> : activeTab === "Requests" && view === "new" ? <section className="workspace"><div className="form-card"><div className="page-heading"><div><h1>New request</h1><p>Describe what you need help with.</p></div></div><label htmlFor="intent">What are you trying to accomplish?</label><textarea id="intent" value={intent} onChange={(event) => setIntent(event.target.value)} placeholder="Describe your intent..." /><div className="form-grid"><label>Request type<select value={newType} onChange={(event) => setNewType(event.target.value)}><option value="support">Get help</option><option value="bug">Report a problem</option><option value="feature">Request a feature</option><option value="question">Ask a question</option></select></label><label>Bounty (optional)<input inputMode="decimal" value={newBounty} onChange={(event) => setNewBounty(event.target.value)} placeholder="0.00" /></label><label>Currency<select value={newBountyCurrency} onChange={(event) => setNewBountyCurrency(event.target.value)}><option>USD</option><option>CAD</option><option>EUR</option><option>GBP</option></select></label></div><div className="row-actions"><button className="secondary-button" type="button" onClick={() => setView("requests")}>Cancel</button><button className="primary-button" type="button" onClick={createRequest} disabled={!intent.trim() || creating}>{creating ? "Creating..." : "Create request"}</button></div>{message && <div className="notice">{message}</div>}</div></section> : <section className="workspace empty-workspace"><h1>{activeTab}</h1><p>This view will use the same request collection with a role-specific filter.</p></section>}

    {selectedRequest && <div className="modal-backdrop" role="presentation" onClick={() => setSelectedRequest(null)}><aside className="request-panel" role="dialog" aria-modal="true" aria-label="Request details" onClick={(event) => event.stopPropagation()}><div className="panel-header"><div><span className="eyebrow">{selectedRequest.id}</span><h2>{selectedRequest.title}</h2></div><button className="icon-button" type="button" onClick={() => setSelectedRequest(null)} aria-label="Close">×</button></div><div className="panel-status"><span className={`status-pill status-${selectedRequest.status.toLowerCase().replaceAll(" ", "-")}`}>{selectedRequest.status}</span><span className="badge">{selectedRequest.type}</span>{selectedRequest.compensation === "Bounty" && <span className="badge bounty">${selectedRequest.bounty} bounty</span>}</div><dl className="details-grid"><div><dt>Application</dt><dd>{selectedRequest.application}</dd></div><div><dt>Requester</dt><dd>{selectedRequest.requester}</dd></div><div><dt>Assigned</dt><dd>{selectedRequest.assignedTo ?? "Unassigned"}</dd></div><div><dt>Created</dt><dd>{formatDate(selectedRequest.createdAt)}</dd></div><div><dt>Recording</dt><dd>{selectedRequest.recording ? (selectedRequest.recordingPublic ? "Public" : "Private") : "None"}</dd></div></dl><div className="panel-section"><h3>Next step</h3><p>This request workspace will become the handoff point for conversation, recording playback, assignment, and live support.</p><button className="primary-button" type="button">Open support session</button></div></aside></div>}
  </main>;
}

function formatDate(value: string) { return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value)); }
export default App;
