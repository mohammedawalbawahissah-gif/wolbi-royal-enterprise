"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import api from "@/lib/api";
import FileUploader from "@/components/FileUploader";
import StatusBadge from "@/components/StatusBadge";
import ProtectedRoute from "@/components/ProtectedRoute";

function ProjectDetailContent({ params }) {
  const { id } = use(params);
  const [project, setProject] = useState(null);
  const [files, setFiles] = useState([]);

  useEffect(() => { load(); loadFiles(); }, []);

  const load = () => api.get(`/projects/${id}/`).then((r) => setProject(r.data)).catch(() => {});
  const loadFiles = () => api.get(`/files/?project=${id}`).then((r) => setFiles(r.data.results || r.data)).catch(() => {});

  if (!project) return <p style={{ color: "var(--muted)" }}>Loading project…</p>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700 }}>{project.title}</h1>
          <p style={{ color: "var(--muted)", fontSize: "13px", marginTop: "4px" }}>
            {project.business_unit} · Created {new Date(project.created_at).toLocaleDateString()}
          </p>
        </div>
        <StatusBadge status={project.status} />
      </div>

      <div style={{ background: "var(--card-bg)", padding: "24px", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow)", marginBottom: "24px" }}>
        <p style={{ color: "var(--foreground)", lineHeight: 1.7 }}>{project.description || project.summary}</p>
      </div>

      <div style={{ background: "var(--card-bg)", padding: "24px", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow)" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>Project Files</h2>
        <FileUploader projectId={id} onUploaded={loadFiles} />
        {files.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: "13px" }}>No files uploaded yet.</p>
        ) : (
          files.map((f) => (
            <div key={f.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
              <a href={f.file} target="_blank" rel="noopener noreferrer"
                style={{ color: "var(--primary)", fontSize: "14px" }}>
                {f.name}
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function ProjectDetailPage({ params }) {
  return (
    <ProtectedRoute>
      <ProjectDetailContent params={params} />
    </ProtectedRoute>
  );
}
