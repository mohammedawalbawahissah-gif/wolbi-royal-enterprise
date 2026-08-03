"use client";

import { useState, useRef } from "react";
import api from "@/lib/api";

export default function FileUploader({ assignmentId, projectId, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef();

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", file.name);
    if (assignmentId) formData.append("assignment", assignmentId);
    if (projectId) formData.append("project", projectId);

    setUploading(true);
    setError("");

    try {
      await api.post("/files/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (onUploaded) onUploaded();
      if (inputRef.current) inputRef.current.value = "";
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ margin: "12px 0" }}>
      <input
        ref={inputRef}
        type="file"
        onChange={handleUpload}
        disabled={uploading}
        style={{ display: "block", marginBottom: "6px" }}
      />
      {uploading && <p style={{ color: "var(--muted)", fontSize: "13px" }}>Uploading…</p>}
      {error && <p style={{ color: "#dc2626", fontSize: "13px" }}>{error}</p>}
    </div>
  );
}
