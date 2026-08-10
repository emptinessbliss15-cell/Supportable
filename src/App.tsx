import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import { Login } from "./features/auth/Login";

type CapturedRequest = {
  type?: string;
  description: string;
  context?: {
    url?: string | null;
    title?: string | null;
    selectedText?: string | null;
  };
  capturedAt?: string;
};

function readCapturedRequest(): CapturedRequest | null {
  const prefix = "#support-request=";
  if (!window.location.hash.startsWith(prefix)) return null;

  try {
    const encoded = window.location.hash.slice(prefix.length);
    const json = decodeURIComponent(escape(atob(encoded)));
    const value = JSON.parse(json) as CapturedRequest;
    return value?.description ? value : null;
  } catch {
    return null;
  }
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [intent, setIntent] = useState("");
  const [capturedRequest, setCapturedRequest] = useState<CapturedRequest | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setCapturedRequest(readCapturedRequest());

    async function loadSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setUser(session?.user ?? null);
      setLoading(false);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function createCapturedRequest() {
    if (!capturedRequest || !user) return;

    setSubmitting(true);
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

      const requestType =
        capturedRequest.type === "problem"
          ? "bug"
          : capturedRequest.type === "feature"
            ? "feature"
            : capturedRequest.type === "question"
              ? "question"
              : "support";

      const { data, error } = await supabase
        .from("support_requests")
        .insert({
          title: capturedRequest.description.split("\n")[0].slice(0, 200),
          description: capturedRequest.description,
          request_type: requestType,
          application_id: application.id,
          requester_id: account.participant_id,
          originating_url: capturedRequest.context?.url ?? null,
        })
        .select("id")
        .single();

      if (error) throw error;

      setMessage(`Support request created: ${data.id}`);
      setCapturedRequest(null);
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    } catch (error) {
      console.error(error);
      setMessage("Unable to create the support request. Check your participant account and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="container">
        <h1>Supportable</h1>
        <p>Loading...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="container">
        <h1>Supportable</h1>
        <p>Helping people find and fulfill intent.</p>
        {capturedRequest && (
          <section>
            <h2>Captured support request</h2>
            <p>{capturedRequest.description}</p>
            {capturedRequest.context?.url && <p>{capturedRequest.context.url}</p>}
            <p>Sign in to submit this request.</p>
          </section>
        )}
        <Login />
      </main>
    );
  }

  return (
    <main className="container">
      <header>
        <h1>Supportable</h1>
        <p>Signed in as <strong>{user.email}</strong></p>
        <button type="button" onClick={signOut}>Sign out</button>
      </header>

      {capturedRequest ? (
        <section>
          <h2>Captured support request</h2>
          <p><strong>Type:</strong> {capturedRequest.type || "support"}</p>
          <p>{capturedRequest.description}</p>
          {capturedRequest.context?.title && <p><strong>Page:</strong> {capturedRequest.context.title}</p>}
          {capturedRequest.context?.url && <p><strong>URL:</strong> {capturedRequest.context.url}</p>}
          {capturedRequest.context?.selectedText && (
            <details>
              <summary>Selected text</summary>
              <p>{capturedRequest.context.selectedText}</p>
            </details>
          )}
          <button type="button" onClick={createCapturedRequest} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit support request"}
          </button>
          {message && <p>{message}</p>}
        </section>
      ) : (
        <section>
          <h2>What are you trying to accomplish?</h2>
          <textarea value={intent} onChange={(event) => setIntent(event.target.value)} placeholder="Describe your intent..." />
          <button type="button" onClick={() => console.log("Intent:", intent)} disabled={!intent.trim()}>
            Continue
          </button>
        </section>
      )}
    </main>
  );
}

export default App;
