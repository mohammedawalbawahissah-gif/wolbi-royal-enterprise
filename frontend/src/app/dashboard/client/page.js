import ProtectedRoute from "@/components/ProtectedRoute";

export default function ClientDashboard() {
  return (
    <ProtectedRoute allowedRoles={["CLIENT"]}>
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px" }}>My Dashboard</h1>
        <p style={{ color: "var(--muted)" }}>View your services, projects, and updates.</p>
      </div>
    </ProtectedRoute>
  );
}
