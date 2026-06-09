import { useState } from "react";

const WEBHOOK_URL = import.meta.env.VITE_LOGIN_WEBHOOK_URL ?? "";
const STORAGE_KEY = "mm_auth";

/** Call once after successful login to persist the session. */
export function saveSession(token) {
  localStorage.setItem(STORAGE_KEY, token ?? "1");
}

/** Returns truthy if the user has a saved session. */
export function getSession() {
  return localStorage.getItem(STORAGE_KEY);
}

/** Remove the saved session (logout). */
export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export default function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) throw new Error("Invalid credentials.");
      const data = await res.json().catch(() => ({}));
      // Store token if returned, otherwise store a plain flag
      saveSession(data?.token ?? data?.session ?? "1");
      onLogin();
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-bg">
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="brand-logo">
            <svg viewBox="0 0 22 22" width="28" height="28" xmlns="http://www.w3.org/2000/svg">
              <text x="11" y="17" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontSize="16" fontWeight="800" fill="#ffffff">M</text>
            </svg>
          </div>
          <div>
            <div className="login-logo__name">Momentum</div>
            <div className="login-logo__sub">Marketing Dashboard</div>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-form__field">
            <label htmlFor="l-user">Username</label>
            <input
              id="l-user"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              autoComplete="username"
              disabled={loading}
            />
          </div>

          <div className="login-form__field">
            <label htmlFor="l-pass">Password</label>
            <input
              id="l-pass"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? <span className="modal__spinner" /> : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
