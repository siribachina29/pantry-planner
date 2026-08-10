import { useState, useEffect } from "react";

function App() {
  const [status, setStatus] = useState("checking...");

  useEffect(() => {
    fetch("http://localhost:3000/health")
    .then((res) => res.json())
    .then((data) => setStatus(data.status))
    .catch((err) => setStatus("error: " + err.message));
  }, []);

  return (
    <div>
      <h1>Backened status: {status}</h1>
    </div>
  );
}

export default App;