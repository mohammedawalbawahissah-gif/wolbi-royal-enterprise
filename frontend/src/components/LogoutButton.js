"use client";

import { logout } from "@/services/auth";

export default function LogoutButton({ className = "", label = "Logout" }) {
  return (
    <button
      onClick={logout}
      className={className}
      style={{
        cursor: "pointer",
        background: "transparent",
        border: "none",
        color: "inherit",
        padding: 0,
      }}
    >
      {label}
    </button>
  );
}
