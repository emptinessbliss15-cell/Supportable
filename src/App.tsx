import { useState } from "react";

function App() {
  const [intent, setIntent] = useState("");

  return (
    <main className="container">
      <h1>Supportable</h1>

      <p>
        What are you trying to accomplish?
      </p>

      <textarea
        value={intent}
        onChange={(event) => setIntent(event.target.value)}
        placeholder="Describe your intent..."
      />

      <button
        onClick={() => {
          console.log("Intent:", intent);
        }}
      >
        Continue
      </button>
    </main>
  );
}

export default App;
