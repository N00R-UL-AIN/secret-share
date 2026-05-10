import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useAuth } from "../auth";

function MySecrets() {
  const { authedRequest } = useAuth();
  const [secrets, setSecrets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadSecrets() {
    setLoading(true);
    setError("");
    try {
      const response = await authedRequest("/api/secrets/my");
      setSecrets(response.data.secrets || []);
    } catch (err) {
      setError(err.message || "Could not load your secrets");
    } finally {
      setLoading(false);
    }
  }

  async function deleteSecret(secretId) {
    try {
      await authedRequest(`/api/secrets/${secretId}`, { method: "DELETE" });
      setSecrets((previous) => previous.filter((item) => item.secretId !== secretId));
    } catch (err) {
      setError(err.message || "Delete failed");
    }
  }

  useEffect(() => {
    loadSecrets();
  }, []);

  return (
    <Layout title="My secrets" subtitle="Review active secrets and revoke any before they are opened.">
      {loading && <div className="card">Loading your secrets...</div>}
      {!loading && error && <div className="error-box">{error}</div>}
      {!loading && !error && secrets.length === 0 && (
        <div className="card">No active secrets found.</div>
      )}
      {!loading && secrets.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Created</th>
                <th>Expires</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {secrets.map((secret) => (
                <tr key={secret.secretId}>
                  <td>
                    <code>{secret.secretId}</code>
                  </td>
                  <td>{new Date(secret.createdAt).toLocaleString()}</td>
                  <td>{new Date(secret.expiresAt).toLocaleString()}</td>
                  <td>{secret.isViewed ? "Viewed" : "Active"}</td>
                  <td>
                    {!secret.isViewed && (
                      <button
                        type="button"
                        className="danger-button"
                        onClick={() => deleteSecret(secret.secretId)}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}

export default MySecrets;
