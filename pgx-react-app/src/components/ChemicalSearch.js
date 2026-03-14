
import React, { useEffect, useMemo, useState } from "react";
import KetcherEditor from "./KetcherEditor";

function InfoTile({ label, value }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        padding: 16,
      }}
    >
      <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a" }}>{value}</div>
    </div>
  );
}

function FieldCard({ label, value }) {
  return (
    <div style={{ background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
      <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 14, color: "#0f172a", wordBreak: "break-word" }}>{value || "—"}</div>
    </div>
  );
}

function ToolbarButton({ children, onClick, primary = false }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 14px",
        borderRadius: 12,
        border: primary ? "none" : "1px solid #cbd5e1",
        background: primary ? "#0f172a" : "white",
        color: primary ? "white" : "#0f172a",
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

export default function ChemicalDatabaseBuilderApp() {
  const API_BASE = process.env.REACT_APP_API_URL + "/api";

  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedDrug, setSelectedDrug] = useState("all");
  const [selectedRow, setSelectedRow] = useState(null);
  const [editorSmiles, setEditorSmiles] = useState("");
  const [loading, setLoading] = useState(false);
  const [editorLoading, setEditorLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRows();
  }, []);

  const fetchRows = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_BASE}/minority-info`);
      if (!res.ok) throw new Error("Could not load records");
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load records");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStructure = async (row) => {
    if (!row?.Drug) return row?.smiles || "";
    try {
      setEditorLoading(true);
      const res = await fetch(`${API_BASE}/drug-structure/${encodeURIComponent(row.Drug)}`);
      if (!res.ok) return row.smiles || "";
      const data = await res.json();
      return data?.smiles || row.smiles || "";
    } catch {
      return row.smiles || "";
    } finally {
      setEditorLoading(false);
    }
  };

  const handleSelectRow = async (row) => {
    setSelectedRow(row);
    const smiles = await fetchStructure(row);
    setEditorSmiles(smiles);
  };

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const text = `${row.Drug || ""} ${row.SNP || ""} ${row.Biomarker || ""} ${row.Chr || ""} ${row.Pos || ""}`.toLowerCase();
      const matchesQuery = text.includes(query.toLowerCase());
      const matchesDrug = selectedDrug === "all" ? true : row.Drug === selectedDrug;
      return matchesQuery && matchesDrug;
    });
  }, [rows, query, selectedDrug]);

  const drugOptions = useMemo(
    () => [...new Set(rows.map((r) => r.Drug).filter(Boolean))].sort(),
    [rows]
  );

  const copySmiles = async () => {
    if (!editorSmiles) return;
    await navigator.clipboard.writeText(editorSmiles);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: 24, fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: 1500, margin: "0 auto", display: "grid", gap: 20 }}>
        <div style={{ background: "linear-gradient(135deg,#0f172a,#1e3a8a)", color: "white", borderRadius: 24, padding: 24 }}>
          <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 8 }}>Pharmacogenomics chemical workspace</div>
          <div style={{ fontSize: 34, fontWeight: 800 }}>Chemical Database Builder</div>
          <div style={{ marginTop: 8, color: "#dbeafe", maxWidth: 900 }}>
            Search your drug records, inspect pharmacogenomic metadata, and load structures directly into the embedded editor.
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 16 }}>
          <InfoTile label="Records" value={rows.length} />
          <InfoTile label="Filtered" value={filteredRows.length} />
          <InfoTile label="Unique Drugs" value={drugOptions.length} />
          <InfoTile label="Selected" value={selectedRow?.Drug || "None"} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "340px minmax(0,1fr)", gap: 20, alignItems: "start" }}>
          <div style={{ display: "grid", gap: 20 }}>
            <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 20, padding: 20 }}>
              <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 16 }}>Search Panel</div>
              <div style={{ display: "grid", gap: 12 }}>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by drug, SNP, biomarker, chromosome"
                  style={{ padding: 12, borderRadius: 12, border: "1px solid #cbd5e1" }}
                />
                <select
                  value={selectedDrug}
                  onChange={(e) => setSelectedDrug(e.target.value)}
                  style={{ padding: 12, borderRadius: 12, border: "1px solid #cbd5e1" }}
                >
                  <option value="all">All drugs</option>
                  {drugOptions.map((drug) => (
                    <option key={drug} value={drug}>{drug}</option>
                  ))}
                </select>
                <ToolbarButton primary onClick={() => { setQuery(""); setSelectedDrug("all"); }}>
                  Clear Filters
                </ToolbarButton>
                <ToolbarButton onClick={fetchRows}>Refresh Data</ToolbarButton>
              </div>
              <div style={{ marginTop: 14, color: "#64748b", fontSize: 14 }}>
                {loading ? "Loading records..." : `Showing ${filteredRows.length} of ${rows.length} records`}
              </div>
              {error ? <div style={{ marginTop: 10, color: "#b91c1c" }}>{error}</div> : null}
            </div>

            <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 20, padding: 20, display: "grid", gap: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 22 }}>Selected Record</div>
              <FieldCard label="Drug" value={selectedRow?.Drug} />
              <FieldCard label="SNP" value={selectedRow?.SNP} />
              <FieldCard label="Biomarker" value={selectedRow?.Biomarker} />
              <FieldCard label="Therapeutic Area" value={selectedRow?.["Therapeutic Area"]} />
              <FieldCard label="Editor SMILES" value={editorSmiles || "Not available"} />
              <FieldCard label="Editor Status" value={editorLoading ? "Loading structure..." : editorSmiles ? "Loaded into editor" : "No structure"} />
            </div>
          </div>

          <div style={{ display: "grid", gap: 20 }}>
            <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 20, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 22 }}>Chemical Editor</div>
                  <div style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>
                    The selected database structure is loaded directly into the editor. The editor size has been reduced.
                  </div>
                </div>
                <div style={{ fontSize: 14, color: "#64748b" }}>{selectedRow?.Drug || "No drug selected"}</div>
              </div>

              <div style={{ display: "grid", gap: 12, marginBottom: 12 }}>
                <textarea
                  value={editorSmiles}
                  onChange={(e) => setEditorSmiles(e.target.value)}
                  rows={3}
                  placeholder="Paste or edit a SMILES string"
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid #cbd5e1",
                    resize: "vertical"
                  }}
                />
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <ToolbarButton primary onClick={() => setEditorSmiles((s) => s)}>
                    Load Into Editor
                  </ToolbarButton>
                  <ToolbarButton onClick={copySmiles}>Copy SMILES</ToolbarButton>
                </div>

                <KetcherEditor
                  smiles={editorSmiles}
                  onChange={setEditorSmiles}
                  height="420px"
                />
              </div>

              <div style={{ marginTop: 10, fontSize: 12, color: "#64748b" }}>
                Select a row to load the structure into Ketcher. Edited SMILES can be read back from the editor.
              </div>
            </div>

            <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 20, padding: 20 }}>
              <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 16 }}>Search Results</div>

              <div style={{ overflowX: "auto", maxHeight: 520, overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: 16 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead style={{ position: "sticky", top: 0 }}>
                    <tr style={{ background: "#e2e8f0" }}>
                      <th style={{ textAlign: "left", padding: 12, borderBottom: "1px solid #cbd5e1" }}>Drug</th>
                      <th style={{ textAlign: "left", padding: 12, borderBottom: "1px solid #cbd5e1" }}>SNP</th>
                      <th style={{ textAlign: "left", padding: 12, borderBottom: "1px solid #cbd5e1" }}>Biomarker</th>
                      <th style={{ textAlign: "left", padding: 12, borderBottom: "1px solid #cbd5e1" }}>Chr</th>
                      <th style={{ textAlign: "left", padding: 12, borderBottom: "1px solid #cbd5e1" }}>Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row, index) => (
                      <tr
                        key={row._id || `${row.Drug}-${row.SNP}-${index}`}
                        onClick={() => handleSelectRow(row)}
                        style={{ cursor: "pointer", background: selectedRow?._id === row._id ? "#eff6ff" : "white" }}
                      >
                        <td style={{ padding: 12, borderBottom: "1px solid #e5e7eb", fontWeight: 700 }}>{row.Drug || "—"}</td>
                        <td style={{ padding: 12, borderBottom: "1px solid #e5e7eb" }}>{row.SNP || "—"}</td>
                        <td style={{ padding: 12, borderBottom: "1px solid #e5e7eb" }}>{row.Biomarker || "—"}</td>
                        <td style={{ padding: 12, borderBottom: "1px solid #e5e7eb" }}>{row.Chr || "—"}</td>
                        <td style={{ padding: 12, borderBottom: "1px solid #e5e7eb" }}>{row.Pos || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!selectedRow ? (
                <div
                  style={{
                    marginTop: 16,
                    border: "1px dashed #cbd5e1",
                    borderRadius: 16,
                    padding: 16,
                    color: "#64748b",
                    background: "#f8fafc"
                  }}
                >
                  No result selected yet. Click any row above to load it into the editor.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
