import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import PassphraseInput from "../components/PassphraseInput";
import Layout from "../components/Layout";
import { apiRequest } from "../api";
import { decrypt } from "../utils/encryption";

function ViewSecret() {
  const { secretId } = useParams();
  const [passphrase, setPassphrase] = useState("");
  const [secret, setSecret] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [metadata, setMetadata] = useState(null);
  const [encryptedData, setEncryptedData] = useState(null);

  useEffect(() => {
    const checkSecret = async () => {
      try {
        const response = await apiRequest(`/api/secrets/${secretId}`);
        const meta = response.data || {};
        setMetadata(meta);
      } catch {
        setError("Secret not found, expired, or already destroyed.");
      } finally {
        setChecking(false);
      }
    };

    checkSecret();
  }, [secretId]);

  const handleReveal = async () => {
    if (!passphrase.trim()) {
      setError("Passphrase is necessary to reveal the secret.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let data = encryptedData;
      if (!data) {
        const response = await apiRequest(`/api/secrets/${secretId}/view`, {
          method: "POST",
          body: { passphrase },
        });
        data = response.data;
        setEncryptedData(data);
      }

      if (!data || typeof data.encryptedContent !== "string" || !data.iv || !data.authTag || !data.salt) {
        throw new Error("Failed to retrieve valid secret data. Please try again.");
      }

      const content = await decrypt(
        data.encryptedContent,
        data.iv,
        data.authTag,
        data.salt,
        passphrase
      );

      setSecret(content);
    } catch (err) {
      setError(err.message || "Failed to retrieve secret. Check passphrase.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (checking) {
    return <div className="center-screen">Checking secret...</div>;
  }

  if (error && !secret) {
    return (
      <Layout title="Secret unavailable">
        <div className="card stack centered">
          <p>{error}</p>
          <Link to="/" className="link-button">
            Create a new secret
          </Link>
        </div>
      </Layout>
    );
  }

  if (secret) {
    return (
      <Layout title="Secret revealed">
        <div className="card stack">
          <p className="warning-text">
            This secret has now been destroyed. Save it immediately.
          </p>
          <pre className="secret-block">{secret}</pre>
          <button onClick={handleCopy} className="primary-button">
            {copied ? "Copied" : "Copy to clipboard"}
          </button>
          <div className="centered">
            <Link to="/" className="link-button">
              Share another secret
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="A secret was shared with you"
      subtitle="Revealing this secret is irreversible and destroys it permanently."
    >
      <div className="card stack">
        {metadata?.expiresAt && (
          <p className="helper">
            Expires at: {new Date(metadata.expiresAt).toLocaleString()}
          </p>
        )}

        <PassphraseInput
          value={passphrase}
          onChange={setPassphrase}
          label="Passphrase required"
          placeholder="Enter the passphrase from sender"
        />

        {error && <div className="error-box">{error}</div>}

        <button
          onClick={handleReveal}
          disabled={loading || !passphrase.trim()}
          className="primary-button"
        >
          {loading ? "Revealing..." : "Reveal secret"}
        </button>
      </div>
    </Layout>
  );
}

export default ViewSecret;