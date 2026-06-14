"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

function CreateAssignmentContent() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "", description: "", assigned_to: "", status: "PENDING", due_date: "",
  });

  useEffect(() => {
    api.get("/auth/users/")
      .then((res) => setUsers(res.data.results || res.data))
      .catch(() => {});
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/assignments/", formData);
      router.push("/dashboard/assignments");
    } catch {
      alert("Failed to create assignment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "10px 14px", borderRadius: "var(--radius)",
    border: "1px solid var(--border)", background: "var(--input-bg)",
    color: "var(--foreground)", fontSize: "14px",
  };

  return (
    <div>
      <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "24px" }}>Create Assignment</h1>
      <div style={{ background: "var(--card-bg)", padding: "32px", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow)", maxWidth: "600px" }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500 }}>Title</label>
            <input name="title" value={formData.title} onChange={handleChange} required style={inputStyle} />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500 }}>Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={4} style={inputStyle} />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500 }}>Assign To</label>
            <select name="assigned_to" value={formData.assigned_to} onChange={handleChange} required style={inputStyle}>
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

          <button type="submit" disabled={loading} style={{
            padding: "10px 24px", background: "var(--primary)", color: "#fff",
            border: "none", borderRadius: "var(--radius)", fontSize: "14px", fontWeight: 500,
            cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
          }}>
            {loading ? "Creating…" : "Create Assignment"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function CreateAssignmentPage() {
  return (
    <ProtectedRoute allowedRoles={["ADMIN", "MEDICAL", "VA", "FOUNDATION"]}>
      <CreateAssignmentContent />
    </ProtectedRoute>
  );
}
