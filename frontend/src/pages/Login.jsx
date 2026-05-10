import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import AuthForm from "../components/AuthForm";
import { useAuth } from "../auth";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(email, password) {
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      navigate("/my-secrets");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout title="Sign in" subtitle="Access your account and manage your secrets.">
      <AuthForm mode="login" onSubmit={handleLogin} loading={loading} error={error} />
      <p className="centered">
        No account yet? <Link to="/register">Create one</Link>
      </p>
    </Layout>
  );
}

export default Login;
