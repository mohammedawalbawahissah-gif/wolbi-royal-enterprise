"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

function EditAssignmentContent({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({ title: "", description: "", assigned_to: "", status: "PENDING", due_date: "" });

  useEffect(() => {
    Promise.all([
      api.get(`/assignments/${id}/`),
      api.get("/auth/users/"),
    ]).then(([aRes, uRes]) => {
      const a = aRes.data;
      setFormData({
        title: a.title || "",
        description: a.description || "",
        assigned_to: a.assigned_to || "",
        status: a.status || "PENDING",
        due_date: a.due_date || "",
      });
      setUsers(uRes.data.results || uRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/assignments/${id}/`, formData);
      router.push(`/dashboard/assignments/${id}`);
    } catch {
      alert("Update failed. Please try again.");
    }
  };

  const inputStyle = {
    width: "100%", padding: "10px 14px", borderRadius: "var(--radius)",
    border: "1px solid var(--border)", background: "var(--input-bg)",
    color: "var(--foreground)", fontSize: "14px",
  };

  if (loading) return <p style={{ color: "var(--muted)" }}>Loading…</p>;

  return (
    <div>
      <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "24px" }}>Edit Assignment</h1>
      <div style={{ background: "var(--card-bg)", padding: "32px", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow)", maxWidth: "600px" }}>
        <form onSubmit={handleSubmit}>
          {[{ label: "Title", name: "title", type: "input" }, { label: "Description", name: "description", type: "textarea" }].map(({ label, name, type }) => (
            <div key={name} style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500 }}>{label}</label>
              {type === "textarea" ? (
                <textarea name={name} value={formData[name]} onChange={handleChange} rows={4} style={inputStyle} />
              ) : (
                <input name={name} value={formData[name]} onChange={handleChange} style={inputStyle} />
              )}
            </div>
          ))}

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500 }}>Assign To</label>
            <select name="assigned_to" value={formData.assigned_to} onChange={handleChange} style={inputStyle}>
              <option value="">Select user</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.username} ({u.role})</option>)}
            </select>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500 }}>Status</label>
            <select name="status" value={formData.status} onChange={handleChange} style={inputStyle}>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="REVIEW">Under Review</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500 }}>Due Date</label>
            <input type="date" name="due_date" value={formData.due_date} onChange={handleChange} style={inputStyle} />
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button type="submit" style={{
              padding: "10px 24px", background: "var(--primary)", color: "#fff",
              border: "none", borderRadius: "var(--radius)", fontSize: "14px", fontWeight: 500, cursor: "pointer",
            }}>
              Save Changes
            </button>
            <button type="button" onClick={() => router.back()} style={{
              padding: "10px 24px", background: "var(--muted-bg)", color: "var(--foreground)",
              border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: "14px", cursor: "pointer",
            }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EditAssignmentPage({ params }) {
  return (
    <ProtectedRoute allowedRoles={["ADMIN", "MEDICAL", "VA", "FOUNDATION"]}>
      <EditAssignmentContent params={params} />
    </ProtectedRoute>
  );
}
