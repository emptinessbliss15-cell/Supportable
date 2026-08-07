import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import { Login } from "./features/auth/Login";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [intent, setIntent] = useState("");

  useEffect(() => {
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

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
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
        <Login />
      </main>
    );
  }

  return (
    <main className="container">
      <header>
        <h1>Supportable</h1>

        <p>
          Signed in as <strong>{user.email}</strong>
        </p>

        <button type="button" onClick={signOut}>
          Sign out
        </button>
      </header>

      <section>
        <h2>What are you trying to accomplish?</h2>

        <textarea
          value={intent}
          onChange={(event) => setIntent(event.target.value)}
          placeholder="Describe your intent..."
        />

        <button
          type="button"
          onClick={() => {
            console.log("Intent:", intent);
          }}
          disabled={!intent.trim()}
        >
          Continue
        </button>
      </section>
    </main>
  );
}

export default App;
