
import React, { useEffect, useState } from "react";
import { Editor } from "ketcher-react";
import { StandaloneStructServiceProvider } from "ketcher-standalone";
import "ketcher-react/dist/index.css";

const structServiceProvider = new StandaloneStructServiceProvider();

export default function KetcherEditor({ smiles = "", onChange, height = "420px" }) {
  const [ketcher, setKetcher] = useState(null);

  useEffect(() => {
    if (!ketcher) return;

    const loadStructure = async () => {
      try {
        await ketcher.setMolecule(smiles || "");
      } catch (error) {
        console.error("Failed to load SMILES:", error);
      }
    };

    loadStructure();
  }, [ketcher, smiles]);

  const readSmiles = async () => {
    if (!ketcher) return;
    try {
      const s = await ketcher.getSmiles();
      if (onChange) onChange(s);
    } catch (error) {
      console.error("Failed to get SMILES:", error);
    }
  };

  return (
    <div
      style={{
        height,
        border: "1px solid #ccc",
        borderRadius: "12px",
        overflow: "hidden",
        background: "white"
      }}
    >
      <Editor
        staticResourcesUrl=""
        structServiceProvider={structServiceProvider}
        onInit={(instance) => {
          setKetcher(instance);
          window.ketcher = instance;
        }}
        errorHandler={(message) => console.error(message)}
      />

      <div style={{ padding: 10, borderTop: "1px solid #eee" }}>
        <button
          onClick={readSmiles}
          style={{
            padding: "8px 14px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            cursor: "pointer"
          }}
        >
          Get SMILES From Editor
        </button>
      </div>
    </div>
  );
}
