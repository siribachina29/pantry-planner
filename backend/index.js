import express from "express";
import cors from "cors";
import multer from "multer";

const app = express();
const upload = multer({ dest: "uploads/"});
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

app.post("/upload", upload.single("image"), (req,res) => {
    console.log(req.file);
    res.json({name: req.file.filename, size: req.file.size});
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

