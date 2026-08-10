import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import { Login } from "./features/auth/Login";

type Theme = "default" | "midnight" | "paper";
type View = "requests" | "new";

type SupportRequest = {
  id: string;
  title: string;
  description: string;
  status: string | null;
  request_type: string | null;
  bounty_amount: number | null;
  bounty_currency: string | null;
  originating_url: string | null;
  created_at: string;
  updated_at: string;
};

const themes: { id: Theme; label: string }[] = [
  { id: "default", label: "Default" },
  { id: "midnight", label: "Midnight" },
  { id: "paper", label: "Paper" },
];

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("requests");
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("supportable-theme") as Theme) || "default");
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [intent, setIntent] = useState("");
  const [newType, setNewType] = useState("support");
  const [newBounty, setNewBounty] = useState("");
  const [newBountyCurrency, setNewBountyCurrency] = useState("USD");
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("supportable-theme", theme);
  }, [theme]);

  useEffect(() => {
    async function loadSession() {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    }

    loadSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) loadRequests();
  }, [user]);

  async function loadRequests() {
    setRequestsLoading(true);
    setRequestError("");
    const { data, error } = await supabase
      .from("support_requests")
      .select("id,title,description,status,request_type,bounty_amount,bounty_currency,originating_url,created_at,updated_at")
      .order("created_at", { ascending: false });

    if (error) {
      setRequestError(error.message);
      setRequests([]);
    } else {
      setRequests((data ?? []) as SupportRequest[]);
    }
    setRequestsLoading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function createRequest() {
    const description = intent.trim();
    if (!description || !user) return;

    setCreating(true);
    setMessage("");
    try {
      const { data: account, error: accountError } = await supabase
        .from("participant_accounts")
        .select("participant_id")
        .eq("auth_user_id", user.id)
        .single();
      if (accountError) throw accountError;

      const { data: application, error: applicationError } = await supabase
        .from("applications")
        .select("id")
        .eq("name", "Supportable")
        .single();
      if (applicationError) throw applicationError;

      const amount = newBounty.trim() ? Number(newBounty) : null;
      if (amount !== null && (!Number.isFinite(amount) || amount < 0)) {
        throw new Error("Bounty must be a valid non-negative amount.");
      }

      const { data, error } = await supabase
        .from("support_requests")
        .insert({
          title: description.split("\n")[0].slice(0, 200),
          description,
          request_type: newType,
          application_id: application.id,
          requester_id: account.participant_id,
          bounty_amount: amount,
          bounty_currency: amount === null ? null : newBountyCurrency,
        })
        .select("id")
        .single();
      if (error) throw error;

      setMessage(`Request created: ${data.id}`);
      setIntent("");
      setNewBounty("");
      await loadRequests();
      setView("requests");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create the request.");
    } finally {
      setCreating(false);
    }
  }

  const statuses = useMemo(() => [...new Set(requests.map((request) => request.status).filter(Boolean))] as string[], [requests]);
  const types = useMemo(() => [...new Set(requests.map((request) => request.request_type).filter(Boolean))] as string[], [requests]);

  const filteredRequests = useMemo(() => {
    const term = search.trim().toLowerCase();
    const result = requests.filter((request) => {
      const matchesSearch = !term || [request.title, request.description, request.id, request.status, request.request_type]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
      const matchesStatus = statusFilter === "all" || request.status === statusFilter;
      const matchesType = typeFilter === "all" || request.request_type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });

    return [...result].sort((a, b) => {
      if (sort === "oldest") return a.created_at.localeCompare(b.created_at);
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "status") return (a.status || "").localeCompare(b.status || "");
      if (sort === "bounty") return (Number(b.bounty_amount) || 0) - (Number(a.bounty_amount) || 0);
      return b.created_at.localeCompare(a.created_at);
    });
  }, [requests, search, statusFilter, typeFilter, sort]);

  if (loading) {
    return <main className="container"><p>Loading Supportable...</p></main>;
  }

  if (!user) {
    return (
      <main className="container auth-container">
        <header className="brand-header"><h1>Supportable</h1><span>Helping people find and fulfill intent.</span></header>
        <Login />
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand"><h1>Supportable</h1><span>{requests.length} request{requests.length === 1 ? "" : "s"}</span></div>
        <div className="header-actions">
          <label className="theme-control">Theme
            <select value={theme} onChange={(event) => setTheme(event.target.value as Theme)}>
              {themes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          <span className="user-email">{user.email}</span>
          <button className="secondary" type="button" onClick={signOut}>Sign out</button>
        </div>
      </header>

      <nav className="tabs" aria-label="Supportable">
        <button className={view === "requests" ? "tab active" : "tab"} onClick={() => setView("requests")}>Requests</button>
        <button className={view === "new" ? "tab active" : "tab"} onClick={() => { setView("new"); setMessage(""); }}>New request</button>
      </nav>

      <section className="content">
        {view === "requests" ? (
          <>
            <div className="page-title-row">
              <div><h2>Requests</h2><p>Find, filter, and sort support requests.</p></div>
              <div className="row-actions"><button type="button" onClick={loadRequests}>Refresh</button><button type="button" onClick={() => setView("new")}>New request</button></div>
            </div>

            <div className="filters">
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search requests..." />
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All statuses</option>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select>
              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="all">All types</option>{types.map((type) => <option key={type} value={type}>{type}</option>)}</select>
              <select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="title">Title</option><option value="status">Status</option><option value="bounty">Bounty</option></select>
            </div>

            {requestError && <div className="notice error">{requestError}</div>}
            {requestsLoading ? <div className="empty">Loading requests...</div> : filteredRequests.length === 0 ? <div className="empty">No requests match the current filters.</div> : (
              <div className="request-list">
                {filteredRequests.map((request) => (
                  <article className="request-card" key={request.id}>
                    <div className="request-main">
                      <div className="request-title"><h3>{request.title || "Untitled request"}</h3><span className={`status status-${(request.status || "unknown").toLowerCase().replace(/\s+/g, "-")}`}>{request.status || "unknown"}</span></div>
                      <p>{request.description}</p>
                      <div className="meta"><span>{request.request_type || "support"}</span><span>{new Date(request.created_at).toLocaleString()}</span>{request.originating_url && <a href={request.originating_url} target="_blank" rel="noreferrer">Source page</a>}</div>
                    </div>
                    <div className="request-side">
                      {request.bounty_amount !== null && <strong>{request.bounty_amount} {request.bounty_currency || ""}</strong>}
                      <code title={request.id}>{request.id}</code>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        ) : (
          <section className="form-card">
            <div className="page-title-row"><div><h2>New request</h2><p>Describe what you need help with.</p></div></div>
            <label htmlFor="intent">What are you trying to accomplish?</label>
            <textarea id="intent" value={intent} onChange={(event) => setIntent(event.target.value)} placeholder="Describe your intent..." />
            <div className="form-grid">
              <label>Request type<select value={newType} onChange={(event) => setNewType(event.target.value)}><option value="support">Get help</option><option value="bug">Report a problem</option><option value="feature">Request a feature</option><option value="question">Ask a question</option></select></label>
              <label>Bounty (optional)<input inputMode="decimal" value={newBounty} onChange={(event) => setNewBounty(event.target.value)} placeholder="0.00" /></label>
              <label>Currency<select value={newBountyCurrency} onChange={(event) => setNewBountyCurrency(event.target.value)}><option>USD</option><option>CAD</option><option>EUR</option><option>GBP</option></select></label>
            </div>
            <div className="row-actions"><button className="secondary" type="button" onClick={() => setView("requests")}>Cancel</button><button type="button" onClick={createRequest} disabled={!intent.trim() || creating}>{creating ? "Creating..." : "Create request"}</button></div>
            {message && <div className="notice">{message}</div>}
          </section>
        )}
      </section>
    </main>
  );
}

export default App;
