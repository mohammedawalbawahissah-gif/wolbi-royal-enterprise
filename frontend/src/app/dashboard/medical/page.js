import ProtectedRoute from "@/components/ProtectedRoute";

export default function MedicalDashboard() {
  return (
    <ProtectedRoute allowedRoles={["MEDICAL"]}>
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px" }}>Medical Hub</h1>
        <p style={{ color: "var(--muted)" }}>Wolbi Medical Services — operations and patient workflows.</p>
      </div>
    </ProtectedRoute>
  );
}
