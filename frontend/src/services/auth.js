import api from "@/lib/api";

export async function login(username, password) {
  const res = await api.post("/auth/login/", { username, password });
  const { access, refresh } = res.data;

  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);

  // Set cookie for middleware (7 day expiry matching refresh token)
  document.cookie = `access_token=${access}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

  return res.data;
}

export function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  document.cookie = "access_token=; path=/; max-age=0";
  window.location.href = "/login";
}

export function getAccessToken() {
  return typeof window !== "undefined"
    ? localStorage.getItem("access_token")
    : null;
}
