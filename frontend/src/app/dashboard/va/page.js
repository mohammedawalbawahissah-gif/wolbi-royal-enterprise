import ProtectedRoute from "@/components/ProtectedRoute";

export default function VADashboard() {
  return (
    <ProtectedRoute allowedRoles={["VA"]}>
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px" }}>Virtual Assistant Hub</h1>
        <p style={{ color: "var(--muted)" }}>Wolbi Virtual Solutions — task management and client support.</p>
      </div>
    </ProtectedRoute>
  );
}
