"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import api from "@/lib/api";
import FileUploader from "@/components/FileUploader";
import StatusBadge from "@/components/StatusBadge";
import ProtectedRoute from "@/components/ProtectedRoute";

function AssignmentDetailContent({ params }) {
  const { id } = use(params);
  const [assignment, setAssignment] = useState(null);
  const [files, setFiles] = useState([]);
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [summarizing, setSummarizing] = useState(false);
  const [aiError, setAiError] = useState(null);

  useEffect(() => { loadAssignment(); loadFiles(); }, []);

  const loadAssignment = () =>
    api.get(`/assignments/${id}/`).then((r) => setAssignment(r.data)).catch(() => {});
  const loadFiles = () =>
    api.get(`/files/?assignment=${id}`).then((r) => setFiles(r.data.results || r.data)).catch(() => {});

  const runAiSummary = async () => {
    setSummarizing(true);
    setAiError(null);
    try {
      const res = await api.get(`/assignments/${id}/ai_summary/`);
      setAiSummary(res.data.summary);
    } catch {
      setAiError("AI summary isn't available right now. Make sure ANTHROPIC_API_KEY is configured.");
    }
    setSummarizing(false);
  };

  const postComment = async () => {
    if (!comment.trim()) return;
    setPosting(true);
    try {
      await api.post("/assignments/comments/", { assignment: id, comment });
      setComment("");
      loadAssignment();
    } catch { /* empty */ } finally { setPosting(false); }
  };

  if (!assignment) return <p style={{ color: "var(--muted)" }}>Loading assignment…</p>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700 }}>{assignment.title}</h1>
          <p style={{ color: "var(--muted)", fontSize: "13px", marginTop: "4px" }}>
            Assigned to: {assignment.assigned_to_name || assignment.assigned_to}
            {assignment.due_date ? ` · Due ${new Date(assignment.due_date).toLocaleDateString()}` : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <StatusBadge status={assignment.status} />
          <Link href={`/dashboard/assignments/${id}/edit`} style={{
            padding: "6px 14px", background: "var(--primary)", color: "#fff",
            borderRadius: "var(--radius)", fontSize: "13px",
          }}>
            Edit
          </Link>
        </div>
      </div>

      <div style={{ background: "var(--card-bg)", padding: "24px", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow)", marginBottom: "20px" }}>
        <p style={{ lineHeight: 1.7 }}>{assignment.description}</p>
      </div>

      <div style={{ background: "var(--card-bg)", padding: "24px", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow)", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: aiSummary || aiError ? "10px" : 0 }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600 }}>🤖 AI Progress Summary</h2>
          <button
            onClick={runAiSummary}
            disabled={summarizing}
            style={{ padding: "6px 14px", background: "var(--primary)", color: "#fff", border: "none", borderRadius: "var(--radius)", fontSize: "13px", cursor: "pointer" }}
          >
            {summarizing ? "Summarizing…" : aiSummary ? "Refresh" : "Summarize progress"}
          </button>
        </div>
        {aiError && <p style={{ color: "#e11d48", fontSize: "13px" }}>{aiError}</p>}
        {aiSummary && <p style={{ lineHeight: 1.7, fontSize: "14px" }}>{aiSummary}</p>}
      </div>

      <div style={{ background: "var(--card-bg)", padding: "24px", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow)", marginBottom: "20px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>Evidence / Files</h2>
        <FileUploader assignmentId={id} onUploaded={loadFiles} />
        {files.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: "13px" }}>No files uploaded yet.</p>
        ) : files.map((f) => (
          <div key={f.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
            <a href={f.file} target="_blank" rel="noopener noreferrer"
              style={{ color: "var(--primary)", fontSize: "14px" }}>{f.name}</a>
          </div>
        ))}
      </div>

      <div style={{ background: "var(--card-bg)", padding: "24px", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow)" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>Comments</h2>
        {(assignment.comments || []).length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: "13px", marginBottom: "16px" }}>No comments yet.</p>
        ) : (
          assignment.comments.map((c) => (
            <div key={c.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
              <p style={{ fontSize: "13px", fontWeight: 600 }}>{c.author_name}</p>
              <p style={{ fontSize: "13px", color: "var(--foreground)", marginTop: "4px" }}>{c.comment}</p>
              <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>
                {new Date(c.created_at).toLocaleString()}
              </p>
            </div>
          ))
        )}
        <div style={{ marginTop: "16px", display: "flex", gap: "10px" }}>
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment…"
            style={{
              flex: 1, padding: "9px 14px", borderRadius: "var(--radius)",
              border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--foreground)", fontSize: "14px",
            }}
          />
          <button
            onClick={postComment}
            disabled={posting}
            style={{
              padding: "9px 18px", background: "var(--primary)", color: "#fff",
              border: "none", borderRadius: "var(--radius)", cursor: "pointer", fontSize: "14px",
            }}
          >
            {posting ? "Posting…" : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AssignmentDetailPage({ params }) {
  return (
    <ProtectedRoute>
      <AssignmentDetailContent params={params} />
    </ProtectedRoute>
  );
}
