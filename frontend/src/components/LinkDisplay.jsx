import React, { useState } from "react";

function LinkDisplay({ link, onReset }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="stack">
      <div className="centered">
        <h2>Your secret link is ready</h2>
        <p>Share this link once. After first reveal, it is permanently deleted.</p>
      </div>

      <div className="card stack">
        <code className="link-box">{link}</code>
        <button
          onClick={handleCopy}
          className="primary-button"
        >
          {copied ? "Copied to clipboard" : "Copy link"}
        </button>
      </div>

      <div className="warning-box">
        <p>Before you share:</p>
        <ul>
          <li>The link stops working after the first view.</li>
          <li>If you used a passphrase, send it through a different channel.</li>
          <li>We cannot recover this secret once it's destroyed.</li>
        </ul>
      </div>

      <div className="centered">
        <button onClick={onReset} className="link-button">
          Share another secret
        </button>
      </div>
    </div>
  );
}

export default LinkDisplay;