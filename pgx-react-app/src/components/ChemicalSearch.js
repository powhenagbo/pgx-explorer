import React, { useEffect, useMemo, useRef, useState } from "react";
import KetcherEditor from "./KetcherEditor";

const API_BASE = process.env.REACT_APP_API_URL + "/api";
const FDA_PGX_LABELING_URL =
  "https://www.fda.gov/drugs/science-and-research-drugs/table-pharmacogenomic-biomarkers-drug-labeling";

function LinkIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="12"
      height="12"
      style={{ marginLeft: 6, verticalAlign: "middle" }}
    >
      <path
        d="M14 5h5v5M10 14 19 5M19 14v5H5V5h5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronIcon({ open = false }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="14"
      height="14"
      style={{
        marginLeft: 8,
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 0.18s ease",
      }}
    >
      <path
        d="m6 9 6 6 6-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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

function FieldCard({ label, value, href }) {
  return (
    <div style={{ background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
      <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 14, color: "#0f172a", wordBreak: "break-word" }}>
        {href && value ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            style={{ color: "#1d4ed8", textDecoration: "none", fontWeight: 600 }}
          >
            {value}
            <LinkIcon />
          </a>
        ) : (
          value || "-"
        )}
      </div>
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

const getGeneCardsLink = (biomarker) =>
  `https://www.genecards.org/Search/Keyword?queryString=${encodeURIComponent(biomarker)}`;

const getDbSnpLink = (snp) => `https://www.ncbi.nlm.nih.gov/snp/${encodeURIComponent(snp)}`;

const buildDrugFdaLink = (drug) =>
  `${FDA_PGX_LABELING_URL}#:~:text=${encodeURIComponent(drug)}`;

export default function ChemicalDatabaseBuilderApp() {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [showDrugSuggestions, setShowDrugSuggestions] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [detailRow, setDetailRow] = useState(null);
  const [editorSmiles, setEditorSmiles] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [editorLoading, setEditorLoading] = useState(false);
  const [isEditorCollapsed, setIsEditorCollapsed] = useState(true);
  const [openBiomarkerCardId, setOpenBiomarkerCardId] = useState(null);
  const [biomarkerCardPosition, setBiomarkerCardPosition] = useState({ top: 0, left: 0 });
  const [error, setError] = useState("");
  const biomarkerCardCloseTimerRef = useRef(null);

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

  const openDetails = async (row) => {
    setDetailRow(row);
    await handleSelectRow(row);
  };

  const normalizedQuery = query.trim().toLowerCase();
  const normalizedSubmittedQuery = submittedQuery.trim().toLowerCase();
  const hasActiveSearch = normalizedSubmittedQuery.length > 0;

  const groupedRows = useMemo(() => {
    const grouped = new Map();

    rows.forEach((row) => {
      const drug = String(row.Drug || "").trim();
      const biomarker = String(row.Biomarker || "").trim();
      if (!drug && !biomarker) return;

      const key = `${drug.toLowerCase()}|${biomarker.toLowerCase()}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          id: key,
          Drug: drug,
          Biomarker: biomarker,
          SNPEntries: [],
          TherapeuticAreas: new Set(),
        });
      }

      const group = grouped.get(key);
      const snp = String(row.SNP || "").trim();
      const chr = String(row.Chr || "").trim();
      const pos = String(row.Pos || "").trim();
      const therapeuticArea = String(row["Therapeutic Area"] || "").trim();

      if (therapeuticArea) {
        group.TherapeuticAreas.add(therapeuticArea);
      }

      if (snp && !group.SNPEntries.some((entry) => entry.SNP === snp && entry.Chr === chr && entry.Pos === pos)) {
        group.SNPEntries.push({
          SNP: snp,
          Chr: chr || "-",
          Pos: pos || "-",
        });
      }
    });

    return Array.from(grouped.values())
      .map((group) => ({
        ...group,
        SNPCount: group.SNPEntries.length,
        TherapeuticAreaLabel: Array.from(group.TherapeuticAreas).join(", ") || "-",
      }))
      .sort((a, b) => a.Drug.localeCompare(b.Drug));
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (!hasActiveSearch) return [];

    return groupedRows.filter((row) => {
      const snpText = row.SNPEntries.map((entry) => `${entry.SNP} ${entry.Chr} ${entry.Pos}`).join(" ");
      const text = `${row.Drug} ${row.Biomarker} ${snpText}`.toLowerCase();
      return text.includes(normalizedSubmittedQuery);
    });
  }, [groupedRows, hasActiveSearch, normalizedSubmittedQuery]);

  const drugOptions = useMemo(() => {
    const uniqueDrugs = new Map();

    groupedRows.forEach((row) => {
      const rawDrug = typeof row.Drug === "string" ? row.Drug.trim() : "";
      if (!rawDrug) return;

      const normalizedDrug = rawDrug.toLowerCase();
      if (!uniqueDrugs.has(normalizedDrug)) {
        uniqueDrugs.set(normalizedDrug, rawDrug);
      }
    });

    return Array.from(uniqueDrugs.values()).sort((a, b) => a.localeCompare(b));
  }, [groupedRows]);

  const filteredDrugOptions = useMemo(() => {
    if (!showDrugSuggestions) return [];
    if (!normalizedQuery) return drugOptions;

    return drugOptions.filter((drug) => drug.toLowerCase().includes(normalizedQuery));
  }, [drugOptions, normalizedQuery, showDrugSuggestions]);

  const copySmiles = async () => {
    if (!editorSmiles) return;
    await navigator.clipboard.writeText(editorSmiles);
  };

  const handleSuggestionSelect = (drug) => {
    setQuery(drug);
    setShowDrugSuggestions(false);
  };

  const openBiomarkerCard = (rowId, element) => {
    if (!element) return;

    if (biomarkerCardCloseTimerRef.current) {
      window.clearTimeout(biomarkerCardCloseTimerRef.current);
      biomarkerCardCloseTimerRef.current = null;
    }

    const bounds = element.getBoundingClientRect();
    setBiomarkerCardPosition({
      top: bounds.bottom + 2,
      left: bounds.left,
    });
    setOpenBiomarkerCardId(rowId);
  };

  const scheduleBiomarkerCardClose = (rowId) => {
    if (biomarkerCardCloseTimerRef.current) {
      window.clearTimeout(biomarkerCardCloseTimerRef.current);
    }

    biomarkerCardCloseTimerRef.current = window.setTimeout(() => {
      setOpenBiomarkerCardId((current) => (current === rowId ? null : current));
      biomarkerCardCloseTimerRef.current = null;
    }, 220);
  };

  const cancelBiomarkerCardClose = () => {
    if (biomarkerCardCloseTimerRef.current) {
      window.clearTimeout(biomarkerCardCloseTimerRef.current);
      biomarkerCardCloseTimerRef.current = null;
    }
  };

  const runSearch = () => {
    setShowDrugSuggestions(false);
    setSearchLoading(true);
    window.setTimeout(() => {
      setSubmittedQuery(query);
      setSearchLoading(false);
    }, 200);
  };

  const clearSearch = () => {
    setQuery("");
    setSubmittedQuery("");
    setShowDrugSuggestions(false);
    setSelectedRow(null);
    setDetailRow(null);
    setEditorSmiles("");
    setSearchLoading(false);
    setOpenBiomarkerCardId(null);
    setBiomarkerCardPosition({ top: 0, left: 0 });
    cancelBiomarkerCardClose();
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
          <InfoTile label="Variant Records" value={rows.length} />
          <InfoTile label="Grouped Results" value={filteredRows.length} />
          <InfoTile label="Unique Drugs" value={drugOptions.length} />
          <InfoTile label="Selected" value={selectedRow?.Drug || "None"} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "340px minmax(0,1fr)", gap: 20, alignItems: "start" }}>
          <div style={{ display: "grid", gap: 20 }}>
            <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 20, padding: 20 }}>
              <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 16 }}>Search Panel</div>
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ position: "relative" }}>
                  <input
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setShowDrugSuggestions(true);
                    }}
                    onFocus={() => setShowDrugSuggestions(true)}
                    onBlur={() => {
                      window.setTimeout(() => setShowDrugSuggestions(false), 120);
                    }}
                    placeholder="Search by drug, SNP, biomarker, chromosome"
                    style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #cbd5e1" }}
                  />

                  {showDrugSuggestions ? (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 8px)",
                        left: 0,
                        right: 0,
                        maxHeight: 260,
                        overflowY: "auto",
                        background: "white",
                        border: "1px solid #cbd5e1",
                        borderRadius: 16,
                        boxShadow: "0 18px 40px rgba(15,23,42,0.12)",
                        zIndex: 5,
                      }}
                    >
                      {filteredDrugOptions.length > 0 ? (
                        filteredDrugOptions.map((drug, index) => (
                          <button
                            key={drug}
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => handleSuggestionSelect(drug)}
                            style={{
                              width: "100%",
                              padding: "12px 14px",
                              border: "none",
                              borderBottom: index === filteredDrugOptions.length - 1 ? "none" : "1px solid #e5e7eb",
                              background: "white",
                              textAlign: "left",
                              cursor: "pointer",
                              color: "#0f172a",
                              fontWeight: 600,
                            }}
                          >
                            {drug}
                          </button>
                        ))
                      ) : (
                        <div style={{ padding: 14, color: "#64748b", fontSize: 14 }}>
                          No drugs match the current search.
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>

                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <ToolbarButton onClick={clearSearch}>Clear Filter</ToolbarButton>
                  </div>
                  <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
                    <ToolbarButton primary onClick={runSearch}>Search</ToolbarButton>
                  </div>
                </div>
                <div style={{ width: "100%" }}>
                  <button
                    onClick={fetchRows}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 12,
                      border: "1px solid #cbd5e1",
                      background: "white",
                      color: "#0f172a",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Refresh Data
                  </button>
                </div>
              </div>
              <div style={{ marginTop: 14, color: "#64748b", fontSize: 14 }}>
                {loading
                  ? "Loading records..."
                  : hasActiveSearch
                    ? `Showing ${filteredRows.length} grouped results`
                    : "Start typing, then click search to query the dataset."}
              </div>
              {error ? <div style={{ marginTop: 10, color: "#b91c1c" }}>{error}</div> : null}
            </div>

            <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 20, padding: 20, display: "grid", gap: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 22 }}>Selected Record</div>
              <FieldCard label="Drug" value={selectedRow?.Drug} />
              <FieldCard
                label="Biomarker"
                value={selectedRow?.Biomarker}
                href={selectedRow?.Biomarker ? getGeneCardsLink(selectedRow.Biomarker) : null}
              />
              <FieldCard label="SNP Count" value={selectedRow?.SNPCount ?? "-"} />
              <FieldCard label="Therapeutic Area" value={selectedRow?.TherapeuticAreaLabel} />
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
                    {isEditorCollapsed
                      ? "The canvas is collapsed by default. Expand it whenever you want to inspect or edit a structure."
                      : "The selected database structure is loaded directly into the editor."}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 14, color: "#64748b" }}>{selectedRow?.Drug || "No drug selected"}</div>
                  <ToolbarButton onClick={() => setIsEditorCollapsed((collapsed) => !collapsed)}>
                    {isEditorCollapsed ? "Expand Canvas" : "Collapse Canvas"}
                  </ToolbarButton>
                </div>
              </div>

              {isEditorCollapsed ? (
                <div
                  style={{
                    border: "1px dashed #cbd5e1",
                    borderRadius: 16,
                    padding: 18,
                    background: "#f8fafc",
                    color: "#475569",
                    fontSize: 14,
                  }}
                >
                  Expand the canvas to open the molecule editor, load the selected record, and work with SMILES directly.
                </div>
              ) : (
                <>
                  <div style={{ display: "grid", gap: 12, marginBottom: 12 }}>
                    <textarea
                      value={editorSmiles}
                      onChange={(event) => setEditorSmiles(event.target.value)}
                      rows={3}
                      placeholder="Paste or edit a SMILES string"
                      style={{
                        width: "100%",
                        padding: 12,
                        borderRadius: 12,
                        border: "1px solid #cbd5e1",
                        resize: "vertical",
                      }}
                    />
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <ToolbarButton primary onClick={() => setEditorSmiles((smiles) => smiles)}>
                        Load Into Editor
                      </ToolbarButton>
                      <ToolbarButton onClick={copySmiles}>Copy SMILES</ToolbarButton>
                    </div>

                    <KetcherEditor smiles={editorSmiles} onChange={setEditorSmiles} height="420px" />
                  </div>

                  <div style={{ marginTop: 10, fontSize: 12, color: "#64748b" }}>
                    Select a result or open the detail panel to load the structure into Ketcher. Edited SMILES can be read back from the editor.
                  </div>
                </>
              )}
            </div>

            <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 20, padding: 20 }}>
              <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 16 }}>Search Results</div>

              {searchLoading ? (
                <div
                  style={{
                    border: "1px solid #cbd5e1",
                    borderRadius: 16,
                    padding: 24,
                    color: "#0f172a",
                    background: "#f8fafc",
                    display: "grid",
                    gap: 10,
                  }}
                >
                  <div style={{ fontWeight: 700 }}>Loading search results...</div>
                  <div style={{ color: "#64748b", fontSize: 14 }}>
                    We&apos;re matching your query against the pharmacogenomics records now.
                  </div>
                </div>
              ) : !hasActiveSearch ? (
                <div
                  style={{
                    border: "1px dashed #cbd5e1",
                    borderRadius: 16,
                    padding: 20,
                    color: "#64748b",
                    background: "#f8fafc",
                  }}
                >
                  Your search results will show here.
                </div>
              ) : filteredRows.length === 0 ? (
                <div
                  style={{
                    border: "1px dashed #cbd5e1",
                    borderRadius: 16,
                    padding: 20,
                    color: "#64748b",
                    background: "#f8fafc",
                  }}
                >
                  No result matches your search term, try again with another query.
                </div>
              ) : (
                <div style={{ overflowX: "auto", maxHeight: 560, overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: 16 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                    <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                      <tr style={{ background: "#e2e8f0" }}>
                        <th style={{ textAlign: "left", padding: 14, borderBottom: "1px solid #cbd5e1", color: "#0f172a" }}>Drug</th>
                        <th style={{ textAlign: "left", padding: 14, borderBottom: "1px solid #cbd5e1", color: "#0f172a" }}>Biomarker</th>
                        <th style={{ textAlign: "left", padding: 14, borderBottom: "1px solid #cbd5e1", color: "#0f172a" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((row) => {
                        const isBiomarkerCardOpen = openBiomarkerCardId === row.id;

                        return (
                          <tr
                            key={row.id}
                            style={{ background: selectedRow?.id === row.id ? "#eff6ff" : "white" }}
                          >
                            <td style={{ padding: 14, borderBottom: "1px solid #e5e7eb", color: "#334155", fontWeight: 700 }}>
                              <a
                                href={buildDrugFdaLink(row.Drug)}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => handleSelectRow(row)}
                                style={{ color: "#1d4ed8", textDecoration: "none" }}
                              >
                                {row.Drug}
                                <LinkIcon />
                              </a>
                            </td>
                            <td
                              style={{ padding: 14, borderBottom: "1px solid #e5e7eb", color: "#334155", position: "relative" }}
                              onMouseEnter={(event) => openBiomarkerCard(row.id, event.currentTarget)}
                              onMouseLeave={() => scheduleBiomarkerCardClose(row.id)}
                            >
                              <button
                                type="button"
                                onClick={(event) => {
                                  if (isBiomarkerCardOpen) {
                                    cancelBiomarkerCardClose();
                                    setOpenBiomarkerCardId(null);
                                  } else {
                                    openBiomarkerCard(row.id, event.currentTarget);
                                  }
                                }}
                                style={{
                                  border: "none",
                                  background: "transparent",
                                  padding: 0,
                                  margin: 0,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  color: "#0f172a",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                {row.Biomarker}
                                <ChevronIcon open={isBiomarkerCardOpen} />
                              </button>

                              {isBiomarkerCardOpen ? (
                                <div
                                  style={{
                                    position: "fixed",
                                    top: biomarkerCardPosition.top,
                                    left: biomarkerCardPosition.left,
                                    minWidth: 260,
                                    maxWidth: 320,
                                    maxHeight: 320,
                                    overflowY: "auto",
                                    background: "white",
                                    border: "1px solid #cbd5e1",
                                    borderRadius: 16,
                                    boxShadow: "0 18px 40px rgba(15,23,42,0.14)",
                                    padding: 14,
                                    zIndex: 4,
                                  }}
                                  onMouseEnter={cancelBiomarkerCardClose}
                                  onMouseLeave={() => scheduleBiomarkerCardClose(row.id)}
                                >
                                  <div style={{ marginBottom: 10, color: "#64748b", fontSize: 12, textTransform: "uppercase", fontWeight: 700 }}>
                                    Biomarker and SNP links
                                  </div>
                                  <div style={{ marginBottom: 12 }}>
                                    <a
                                      href={getGeneCardsLink(row.Biomarker)}
                                      target="_blank"
                                      rel="noreferrer"
                                      onClick={() => handleSelectRow(row)}
                                      style={{ color: "#1d4ed8", textDecoration: "none", fontWeight: 700 }}
                                    >
                                      {row.Biomarker}
                                      <LinkIcon />
                                    </a>
                                  </div>
                                  <div style={{ display: "grid", gap: 8 }}>
                                    {row.SNPEntries.length > 0 ? (
                                      row.SNPEntries.map((entry) => (
                                        <a
                                          key={`${row.id}-${entry.SNP}-${entry.Chr}-${entry.Pos}`}
                                          href={getDbSnpLink(entry.SNP)}
                                          target="_blank"
                                          rel="noreferrer"
                                          onClick={() => handleSelectRow(row)}
                                          style={{ color: "#0f172a", textDecoration: "none", fontSize: 14 }}
                                        >
                                          {entry.SNP}
                                          <LinkIcon />
                                        </a>
                                      ))
                                    ) : (
                                      <div style={{ color: "#64748b", fontSize: 14 }}>No SNPs available.</div>
                                    )}
                                  </div>
                                </div>
                              ) : null}
                            </td>
                            <td style={{ padding: 14, borderBottom: "1px solid #e5e7eb" }}>
                              <button
                                type="button"
                                onClick={() => openDetails(row)}
                                style={{
                                  border: "1px solid #cbd5e1",
                                  background: "white",
                                  color: "#0f172a",
                                  borderRadius: 10,
                                  padding: "8px 12px",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                }}
                              >
                                View More
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              
            </div>
          </div>
        </div>
      </div>

      {detailRow ? (
        <>
          <div
            onClick={() => setDetailRow(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15,23,42,0.28)",
              zIndex: 30,
            }}
          />
          <aside
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              width: 420,
              maxWidth: "92vw",
              height: "100vh",
              background: "white",
              borderLeft: "1px solid #e5e7eb",
              boxShadow: "-18px 0 40px rgba(15,23,42,0.14)",
              padding: 24,
              overflowY: "auto",
              zIndex: 31,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 12, textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>Result Details</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginTop: 6 }}>{detailRow.Drug}</div>
              </div>
              <button
                type="button"
                onClick={() => setDetailRow(null)}
                style={{
                  border: "1px solid #cbd5e1",
                  background: "white",
                  color: "#0f172a",
                  borderRadius: 10,
                  padding: "8px 12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              <FieldCard label="Drug" value={detailRow.Drug} />
              <FieldCard
                label="Biomarker"
                value={detailRow.Biomarker}
                href={detailRow.Biomarker ? getGeneCardsLink(detailRow.Biomarker) : null}
              />
              <FieldCard label="Therapeutic Area" value={detailRow.TherapeuticAreaLabel} />
              <FieldCard label="SNP Count" value={detailRow.SNPCount} />
            </div>

            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 12, textTransform: "uppercase", color: "#64748b", fontWeight: 700, marginBottom: 10 }}>
                Variant Details
              </div>
              <div style={{ display: "grid", gap: 12 }}>
                {detailRow.SNPEntries.length > 0 ? (
                  detailRow.SNPEntries.map((entry) => (
                    <div
                      key={`${detailRow.id}-${entry.SNP}-${entry.Chr}-${entry.Pos}`}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 14,
                        padding: 14,
                        background: "#f8fafc",
                      }}
                    >
                      <div style={{ marginBottom: 8 }}>
                        <a
                          href={getDbSnpLink(entry.SNP)}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "#1d4ed8", textDecoration: "none", fontWeight: 700 }}
                        >
                          {entry.SNP}
                          <LinkIcon />
                        </a>
                      </div>
                      <div style={{ color: "#475569", fontSize: 14 }}>Chr: {entry.Chr}</div>
                      <div style={{ color: "#475569", fontSize: 14 }}>Position: {entry.Pos}</div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: "#64748b" }}>No SNP details available for this record.</div>
                )}
              </div>
            </div>
          </aside>
        </>
      ) : null}
    </div>
  );
}
