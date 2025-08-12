import React, { useState } from "react";
import { login } from "../api/api";

interface LoginFormProps {
  onLogin: (token: string) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await login(username, password);
      onLogin(data.access_token);
    } catch (err: any) {
      setError("Неверный логин или пароль");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f6f7f9" }}>
      <form
        onSubmit={handleSubmit}
        style={{
          background: "#fff",
          padding: 48,
          borderRadius: 18,
          boxShadow: "0 2px 16px #b0bec540",
          minWidth: 340,
          display: "flex",
          flexDirection: "column",
          gap: 24,
          border: "1.5px solid #e3e7ed"
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 26, color: "#23272b", letterSpacing: 1 }}>Вход в систему</span>
        </div>
        <input
          type="text"
          placeholder="Логин"
          value={username}
          onChange={e => setUsername(e.target.value)}
          autoFocus
          style={{ fontSize: 18, padding: 14, borderRadius: 10, border: "1.5px solid #e3e7ed" }}
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ fontSize: 18, padding: 14, borderRadius: 10, border: "1.5px solid #e3e7ed" }}
        />
        {error && <div style={{ color: "#c62828", background: "#ffebee", borderRadius: 10, padding: 12, fontSize: 16, border: "1.5px solid #ffcdd2", textAlign: "center" }}>{error}</div>}
        <button
          type="submit"
          disabled={loading}
          style={{
            background: "#23272b",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "14px 0",
            fontSize: 19,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: "0 2px 8px #b0bec540"
          }}
        >
          {loading ? "Вход..." : "Войти"}
        </button>
      </form>
    </div>
  );
};

export default LoginForm; 