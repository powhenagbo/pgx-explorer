import React, { useMemo, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Card, Navbar, Nav, Badge } from 'react-bootstrap';
import DataTable from './components/DataTable';
import ChemicalSearch from './components/ChemicalSearch';
import { API_BASE_URL } from './config/constants';

const shellStyle = {
  minHeight: '100vh',
  background: '#f8fafc',
};

const panelCardStyle = {
  border: '1px solid #e5e7eb',
  borderRadius: 20,
  boxShadow: '0 18px 40px rgba(15,23,42,0.08)',
};

function ChevronIcon({ open }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      style={{
        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 0.18s ease',
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

function DatasetsDropdown({ datasets, isOpen, activeDatasetId, onToggle, onSelectDataset, loadingId }) {
  return (
    <Card className="border-0 h-100" style={{ ...panelCardStyle, overflow: 'visible' }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: '100%',
          border: 'none',
          background: 'transparent',
          padding: 24,
          textAlign: 'left',
          cursor: 'pointer',
        }}
      >
        <div className="d-flex justify-content-between align-items-center gap-3">
          <div>
            <div className="small text-uppercase fw-semibold" style={{ color: '#64748b', letterSpacing: '0.06em' }}>
              Dataset Picker
            </div>
            <div className="mt-2 fw-bold" style={{ color: '#0f172a', fontSize: 28 }}>
              Datasets
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Badge pill style={{ background: '#0f172a', color: '#ffffff', padding: '8px 12px' }}>
              {datasets.length} available
            </Badge>
            <div style={{ color: '#1d4ed8' }}>
              <ChevronIcon open={isOpen} />
            </div>
          </div>
        </div>
      </button>

      {isOpen ? (
        <Card.Body className="pt-0 px-4 pb-4">
          <div style={{ borderTop: '1px solid #dbeafe', paddingTop: 18, display: 'grid', gap: 12 }}>
            {datasets.map((dataset) => {
              const isActive = activeDatasetId === dataset.id;
              const isLoading = loadingId === dataset.id;

              return (
                <button
                  key={dataset.id}
                  type="button"
                  onClick={() => onSelectDataset(dataset)}
                  style={{
                    width: '100%',
                    border: isActive ? '1px solid #93c5fd' : '1px solid #e5e7eb',
                    background: isActive ? '#eff6ff' : 'white',
                    borderRadius: 16,
                    padding: 16,
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center gap-3">
                    <div className="fw-semibold" style={{ color: '#0f172a', fontSize: 18 }}>
                      {dataset.name}
                    </div>
                    <Badge pill style={{ background: '#e2e8f0', color: '#ffffff', padding: '8px 12px' }}>
                      {isLoading ? 'Loading...' : `${dataset.recordCount} records`}
                    </Badge>
                  </div>
                </button>
              );
            })}
          </div>
        </Card.Body>
      ) : null}
    </Card>
  );
}

function App() {
  const [activeView, setActiveView] = useState('chemical');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileData, setFileData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [columns, setColumns] = useState([]);
  const [error, setError] = useState(null);
  const [showDatasetsDropdown, setShowDatasetsDropdown] = useState(false);
  const [loadingDatasetId, setLoadingDatasetId] = useState(null);
  const [loadedDatasets, setLoadedDatasets] = useState({});

  const dataSources = useMemo(
    () => [
      {
        id: 1,
        name: 'PGx_Minority',
        fileName: 'PGx_Minority_Info.csv',
        description: 'Pharmacogenomic information in ethnic minority populations.',
        endpoint: `${API_BASE_URL}/minority-info`,
        recordCount: 148,
      },
      {
        id: 2,
        name: 'PGx_PubMed',
        fileName: 'PGx_PubMed_Literature.csv',
        description: 'PubMed literature references for pharmacogenomic evidence.',
        endpoint: `${API_BASE_URL}/pubmed-literature`,
        recordCount: 120,
      },
    ],
    []
  );

  const totalRecords = dataSources.reduce((sum, item) => sum + item.recordCount, 0);

  const ensureDatasetLoaded = async (source) => {
    if (loadedDatasets[source.id]) {
      return loadedDatasets[source.id];
    }

    setLoading(true);
    setLoadingDatasetId(source.id);
    setError(null);

    try {
      const response = await fetch(source.endpoint);
      if (!response.ok) throw new Error('Failed to fetch data');

      const data = await response.json();
      const nextColumns =
        data && data.length > 0
          ? Object.keys(data[0]).filter((col) => !col.startsWith('_') && col !== '__v')
          : [];

      const cachedDataset = {
        data,
        columns: nextColumns,
      };

      setLoadedDatasets((current) => ({
        ...current,
        [source.id]: cachedDataset,
      }));

      return cachedDataset;
    } catch (err) {
      setError('Failed to load data. Make sure backend is running.');
      throw err;
    } finally {
      setLoading(false);
      setLoadingDatasetId(null);
    }
  };

  const handleSelectDataset = async (source) => {
    try {
      const cachedDataset = await ensureDatasetLoaded(source);
      setSelectedFile(source);
      setFileData(cachedDataset.data);
      setColumns(cachedDataset.columns);
      setShowDatasetsDropdown(false);
    } catch {
      return;
    }
  };

  const downloadCSV = () => {
    if (!selectedFile || fileData.length === 0) return;

    const headers = columns.join(',');
    const rows = fileData.map((row) =>
      columns
        .map((col) => {
          const value = row[col] || '';
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(',')
    );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', selectedFile.fileName || selectedFile.name);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCloseDataset = () => {
    setSelectedFile(null);
    setFileData([]);
    setColumns([]);
    setError(null);
  };

  const activeDatasetName = selectedFile ? selectedFile.name : 'No dataset selected';

  return (
    <div style={shellStyle}>
      <Navbar
        expand="lg"
        className="px-3 py-3"
        style={{
          background: 'linear-gradient(135deg,#0f172a,#1e3a8a)',
          boxShadow: '0 18px 40px rgba(15,23,42,0.18)',
        }}
      >
        <Container fluid style={{ maxWidth: '1800px' }}>
          <Navbar.Brand href="#" className="fw-bold d-flex align-items-center text-white">
            <div>
              <div>PGx Explorer Platform</div>
              <div className="small fw-normal opacity-75">FDA NCTR Pharmacogenomics Research Database</div>
            </div>
          </Navbar.Brand>

          <Nav className="ms-auto d-flex flex-row gap-2">
            <Nav.Link
              active={activeView === 'chemical'}
              onClick={() => setActiveView('chemical')}
              className="px-3 py-2"
              style={{
                color: 'white',
                borderRadius: 999,
                background: activeView === 'chemical' ? 'rgba(255,255,255,0.14)' : 'transparent',
              }}
            >
              Chemical Search
            </Nav.Link>
            <Nav.Link
              active={activeView === 'data'}
              onClick={() => setActiveView('data')}
              className="px-3 py-2"
              style={{
                color: 'white',
                borderRadius: 999,
                background: activeView === 'data' ? 'rgba(255,255,255,0.14)' : 'transparent',
              }}
            >
              Data Browser
            </Nav.Link>
          </Nav>
        </Container>
      </Navbar>

      {activeView === 'chemical' ? (
        <ChemicalSearch />
      ) : (
        <Container fluid className="py-4" style={{ maxWidth: '1800px' }}>
          <div
            style={{
              background: 'linear-gradient(135deg,#0f172a,#1e3a8a)',
              color: 'white',
              borderRadius: 24,
              padding: 24,
              marginBottom: 20,
            }}
          >
            <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 8 }}>Pharmacogenomics data workspace</div>
            <div style={{ fontSize: 34, fontWeight: 800 }}>Data Browser</div>
            <div style={{ marginTop: 8, color: '#dbeafe', maxWidth: 900 }}>
              Choose a dataset from the dropdown to open its full table, then search within that table.
            </div>
          </div>

          <Row className="g-3 mb-4">
            <Col lg={4}>
              <DatasetsDropdown
                datasets={dataSources}
                isOpen={showDatasetsDropdown}
                activeDatasetId={selectedFile?.id}
                onToggle={() => setShowDatasetsDropdown((current) => !current)}
                onSelectDataset={handleSelectDataset}
                loadingId={loadingDatasetId}
              />
            </Col>
            <Col lg={4}>
              <Card className="border-0 h-100" style={panelCardStyle}>
                <Card.Body>
                  <div className="small text-uppercase fw-semibold" style={{ color: '#64748b' }}>Active Dataset</div>
                  <div className="mt-2 fw-bold" style={{ color: '#0f172a', fontSize: 28 }}>{activeDatasetName}</div>
                  <div className="small mt-1" style={{ color: '#64748b' }}>
                    {selectedFile ? 'Table opened with full dataset records.' : `Total records across datasets: ${totalRecords}`}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {error && (
            <Card className="border-0 mb-3" style={{ ...panelCardStyle, background: '#b91c1c', color: 'white' }}>
              <Card.Body className="py-2">{error}</Card.Body>
            </Card>
          )}

          <DataTable
            data={fileData}
            columns={columns}
            loading={loading}
            selectedFile={selectedFile}
            onDownload={downloadCSV}
            onClose={handleCloseDataset}
          />

          <footer className="text-center small py-4" style={{ color: '#64748b' }}>
            FDA National Center for Toxicological Research - Pharmacogenomics Data Explorer
          </footer>
        </Container>
      )}
    </div>
  );
}

export default App;
