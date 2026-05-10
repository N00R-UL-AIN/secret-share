import React, { useState } from "react";
import SecretForm from "../components/SecretForm";
import LinkDisplay from "../components/LinkDisplay";
import Layout from "../components/Layout";

function CreateSecret() {
  const [generatedLink, setGeneratedLink] = useState("");

  return (
    <Layout
      title="Share a secret securely"
      subtitle="Encrypted server-side. Viewed once. Destroyed immediately."
    >
      {generatedLink ? (
        <LinkDisplay link={generatedLink} onReset={() => setGeneratedLink("")} />
      ) : (
        <SecretForm onSecretCreated={setGeneratedLink} />
      )}
    </Layout>
  );
}

export default CreateSecret;