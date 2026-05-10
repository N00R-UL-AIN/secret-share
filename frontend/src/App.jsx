// Main application component with routing
import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import CreateSecret from "./pages/CreateSecret";
import ViewSecret from "./pages/ViewSecret";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MySecrets from "./pages/MySecrets";
import { useAuth } from "./auth";

// Protected route component that requires authentication
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="center-screen">Loading session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<CreateSecret />} />
        <Route path="/secret/:secretId" element={<ViewSecret />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/my-secrets"
          element={
            <ProtectedRoute>
              <MySecrets />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;