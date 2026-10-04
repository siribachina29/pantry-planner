import { useState } from "react";

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [newIngredient, setNewIngredient] = useState("");
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  function handleFileChange(e) {
    setSelectedFile(e.target.files[0]);
  }

  async function handleScan() {
    if (!selectedFile) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("image", selectedFile);

    const res = await fetch("http://localhost:3000/scan", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setIngredients(data.items || []);
    setLoading(false);
  }

  function addIngredient() {
    if (!newIngredient.trim()) return;
    setIngredients([...ingredients, newIngredient.trim()]);
    setNewIngredient("");
  }

  function removeIngredient(idx) {
    setIngredients(ingredients.filter((_, i) => i !== idx));
  }

  async function handlePlan() {
    setLoading(true);
    const res = await fetch("http://localhost:3000/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients }),
    });
    const data = await res.json();
    setPlan(data);
    setLoading(false);
  }

  async function handleSavePlan() {
    await fetch("http://localhost:3000/save-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json"},
      body: JSON.stringify({ ingredients, plan }),
    });
    alert("Plan saved!")
  }

  return (
    <div style={{ maxWidth: 500, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>Pantry Planner</h1>

      <input type="file" accept="image/*" onChange={handleFileChange} />
      <button onClick={handleScan} disabled={!selectedFile || loading}>
        {loading ? "Working..." : "Scan Ingredients"}
      </button>

      {ingredients.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3>Ingredients</h3>
          <ul>
            {ingredients.map((ing, idx) => (
              <li key={idx}>
                {ing} <button onClick={() => removeIngredient(idx)}>x</button>
              </li>
            ))}
          </ul>
          <input
            value={newIngredient}
            onChange={(e) => setNewIngredient(e.target.value)}
            placeholder="Add ingredient"
          />
          <button onClick={addIngredient}>Add</button>

          <div style={{ marginTop: 16 }}>
            <button onClick={handlePlan} disabled={loading}>
              {loading ? "Working..." : "Generate Weekly Plan"}
            </button>
          </div>
        </div>
      )}

     {plan && (
        <div style={{ marginTop: 20 }}>
          <h3>Your Week</h3>
          {plan.days.map((d, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <strong>{d.day}:</strong> {d.meal} — <em>{d.note}</em>
            </div>
          ))}
          <button onClick ={handleSavePlan}> Save This Plan</button>
        </div>
      )}
    </div>
  );
}

export default App; 