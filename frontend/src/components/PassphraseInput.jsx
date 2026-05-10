import React, { useState } from "react";

function PassphraseInput({ value, onChange, placeholder, label }) {
  const [show, setShow] = useState(false);

  return (
    <div className="input-block">
      {label && <label>{label}</label>}
      <div className="password-row">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onDrop={(e) => e.preventDefault()}
          placeholder={placeholder || "Enter passphrase"}
          maxLength={128}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="secondary-button"
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}

export default PassphraseInput;