import ProtectedRoute from "@/components/ProtectedRoute";

export default function FoundationDashboard() {
  return (
    <ProtectedRoute allowedRoles={["FOUNDATION"]}>
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px" }}>Foundation Hub</h1>
        <p style={{ color: "var(--muted)" }}>Wolbi Foundation — community programs, volunteers, and impact tracking.</p>
      </div>
    </ProtectedRoute>
  );
}
