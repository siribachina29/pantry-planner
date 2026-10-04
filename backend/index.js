import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import dotenv from "dotenv";
import Database from "better-sqlite3";


dotenv.config();

const app = express();
const upload = multer({ dest: "uploads/" });
const db = new Database("pantry.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ingredients TEXT NOT NULL,
    plan_json TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/scan", upload.single("image"), async (req, res) => {
  try {
    const imageBuffer = fs.readFileSync(req.file.path);
    const base64Image = imageBuffer.toString("base64");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: req.file.mimetype, data: base64Image },
              },
              {
                type: "text",
                text: 'List every edible ingredient visible in this photo. Reply with ONLY raw JSON, no markdown, no explanation: {"items":["ingredient1","ingredient2"]}',
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    const textBlock = data.content.find((b) => b.type === "text");
    const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    fs.unlinkSync(req.file.path); // delete temp file, we're done with it

    res.json({ items: parsed.items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Scan failed" });
  }
});

app.post("/plan", async (req, res) => {
  try {
    const { ingredients } = req.body;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: `Pantry has: ${ingredients.join(", ")}. Create a 7-day dinner plan using these ingredients as much as possible, assuming basic staples (oil, salt, pepper, rice, pasta) are available. Reply with ONLY raw JSON, no markdown: {"days":[{"day":"Monday","meal":"dish name","note":"one short sentence"}]}`,
          },
        ],
      }),
    });

    const data = await response.json();
    const textBlock = data.content.find((b) => b.type === "text");
    const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    res.json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Plan generation failed" });
  }
});

app.post("/save-plan", (req, res) => {
  const{ ingredients, plan } = req.body;
  const stmt = db.prepare("INSERT INTO plans (ingredients, plan_json) VALUES (?, ?)");
  const result = stmt.run(JSON.stringify(ingredients), JSON.stringify(plan));
  res.json({ saved: true, id: result.lastInsertRowid });
});

app.get("/plans", (req, res) => {
  const rows = db.prepare("SELECT * FROM plans ORDER BY created_at DESC").all();
  const parsed = rows.map((r) => ({ 
    id: r.id,
    ingredients: JSON.parse(r.ingredients),
    plan: JSON.parse(r.plan_json),
    created_at: r.created_at,
  }));
  res.json(parsed);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

