import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import AuthForm from "../components/AuthForm";
import { useAuth } from "../auth";

function Register() {
  const { register, login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister(email, password) {
    setLoading(true);
    setError("");
    try {
      await register(email, password);
      await login(email, password);
      navigate("/my-secrets");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout title="Create account" subtitle="Register to track and manage your created secrets.">
      <AuthForm mode="register" onSubmit={handleRegister} loading={loading} error={error} />
      <p className="centered">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </Layout>
  );
}

export default Register;
