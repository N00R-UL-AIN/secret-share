import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth";

function Layout({ title, subtitle, children }) {
  const { isAuthenticated, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="header">
        <div className="container header-content">
          <Link to="/" className="brand">
            <img src="/logo.png" alt="SecureShare logo" className="brand-icon" />
            <span>SecureShare</span>
          </Link>
          <nav className="nav">
            <Link to="/">Create</Link>
            <Link to="/my-secrets">My Secrets</Link>
            {isAuthenticated ? (
              <button type="button" className="link-button" onClick={logout}>
                Logout
              </button>
            ) : (
              <>
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="container main-content">
        {title && <h1>{title}</h1>}
        {subtitle && <p className="subtitle">{subtitle}</p>}
        {children}
      </main>
    </div>
  );
}

export default Layout;
