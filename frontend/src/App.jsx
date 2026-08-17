import { useState, useEffect } from "react";

function App() {
  const [status, setStatus] = useState("checking...");
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3000/health")
    .then((res) => res.json())
    .then((data) => setStatus(data.status))
    .catch((err) => setStatus("error: " + err.message));
  }, []);

  function handleFileChange(e) {
    const file = e.target.files[0];
    setSelectedFile(file);
    console.log(file);
  }

  async function handleUpload() {
  const formData = new FormData();
  formData.append("image", selectedFile);

  const res = await fetch("http://localhost:3000/upload", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  console.log(data);
}

  return (
    <div>
      <h1>Backened status: {status}</h1>
      <input type= "file" accept="image/*" onChange={handleFileChange} />
      {selectedFile && <p>Selected: {selectedFile.name}</p>}
      <button onClick={handleUpload}>Upload</button>
    </div>
  );




}

export default App;