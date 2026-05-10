import React, { useState } from "react";

function AuthForm({ mode, onSubmit, loading, error }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isRegister = mode === "register";

  return (
    <form
      className="card stack"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(email.trim().toLowerCase(), password);
      }}
    >
      <div>
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>

      <div>
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete={isRegister ? "new-password" : "current-password"}
        />
        {isRegister && (
          <p className="helper">
            Use 8+ chars with uppercase, lowercase, digit, and special char.
          </p>
        )}
      </div>

      {error && <div className="error-box">{error}</div>}

      <button type="submit" className="primary-button" disabled={loading}>
        {loading ? "Please wait..." : isRegister ? "Create account" : "Sign in"}
      </button>
    </form>
  );
}

export default AuthForm;
