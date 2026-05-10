import React, { useState } from "react";
import PassphraseInput from "./PassphraseInput";
import { apiRequest, API_BASE_URL } from "../api";
import { useAuth } from "../auth";
import { Link } from "react-router-dom";
import { encrypt } from "../utils/encryption";

const EXPIRY_OPTIONS = [
  { label: "1 hour", value: 1 },
  { label: "24 hours", value: 24 },
  { label: "7 days", value: 168 },
];

function SecretForm({ onSecretCreated }) {
  const { isAuthenticated, authedRequest } = useAuth();
  const [text, setText] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [ttlHours, setTtlHours] = useState(24);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!text.trim()) return;
    if (!passphrase.trim()) {
      setError("Passphrase is required to create a secret.");
      return;
    }
    if (passphrase.length < 4) {
      setError("Passphrase must be at least 4 characters long.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { encryptedContent, iv, authTag, salt } = await encrypt(text.trim(), passphrase);

      const response = await authedRequest("/api/secrets", {
      method: "POST",
      body: {
        encryptedContent,
        iv,
        authTag,
        salt,
        passphrase,
        ttlHours,
      },
    });

    const secretId = response.data?.secretId;
    if (!secretId) {
      throw new Error("Unexpected response from server. Please try again.");
    }

    const link = `${window.location.origin}/secret/${secretId}`;
    onSecretCreated(link);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="card stack centered">
        <p>You need to be logged in to create secrets.</p>
        <div className="row">
          <Link to="/login" className="primary-button">Login</Link>
          <Link to="/register" className="secondary-button">Register</Link>
        </div>
      </div>
    );
  }

  return (
    <form className="card secret-form" onSubmit={handleSubmit}>
      <div>
        <label>Your secret</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your password, API key, private note..."
          rows={5}
          maxLength={65536}
        />
        <div className="char-count">
          <span>{text.length} chars</span>
        </div>
      </div>

      <div>
        <label>Expires after</label>
        <div className="chip-row">
          {EXPIRY_OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt.value}
              onClick={() => setTtlHours(opt.value)}
              className={ttlHours === opt.value ? "chip chip-active" : "chip"}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label>Passphrase (required)</label>
        <PassphraseInput
          value={passphrase}
          onChange={setPassphrase}
          placeholder="Recipient will need this to view the secret"
        />
        <p className="helper">
          Share the link via one channel (email), the passphrase via another (SMS or phone call).
        </p>
      </div>

      {error && <div className="error-box">{error}</div>}

      <button
        type="submit"
        disabled={!text.trim() || !passphrase.trim() || loading}
        className="primary-button"
      >
        {loading ? "Creating..." : "Create secret link"}
      </button>
    </form>
  );
}

export default SecretForm;