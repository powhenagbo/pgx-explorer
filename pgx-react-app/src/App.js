
import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Card, Navbar, Nav, Badge } from 'react-bootstrap';
import FileList from './components/FileList';
import DataTable from './components/DataTable';
import ChemicalSearch from './components/ChemicalSearch';
import { API_BASE_URL } from './config/constants';

function StatCard({ title, value, subtitle, icon }) {
  return (
    <Card className="shadow-sm border-0 h-100">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <div className="text-muted small text-uppercase fw-semibold">{title}</div>
            <div className="display-6 fw-bold mt-1">{value}</div>
            {subtitle ? <div className="text-muted small mt-1">{subtitle}</div> : null}
          </div>
          <div style={{ fontSize: '1.6rem' }}>{icon}</div>
        </div>
      </Card.Body>
    </Card>
  );
}

function App() {
  const [activeView, setActiveView] = useState('data');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileData, setFileData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [columns, setColumns] = useState([]);
  const [error, setError] = useState(null);

  const dataSources = [
    {
      id: 1,
      name: 'PGx_Minority_Info.csv',
      description: 'Pharmacogenomic information in ethnic minority populations',
      endpoint: `${API_BASE_URL}/minority-info`,
      icon: '🧬',
      recordCount: 148
    },
    {
      id: 2,
      name: 'PGx_PubMed_Literature.csv',
      description: 'PubMed literature references for pharmacogenomics',
      endpoint: `${API_BASE_URL}/pubmed-literature`,
      icon: '📚',
      recordCount: 120
    }
  ];

  const totalRecords = dataSources.reduce((sum, item) => sum + item.recordCount, 0);

  const loadFile = async (source) => {
    setLoading(true);
    setSelectedFile(source);
    setError(null);

    try {
      const response = await fetch(source.endpoint);
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      setFileData(data);

      if (data && data.length > 0) {
        const allColumns = Object.keys(data[0]);
        const filteredColumns = allColumns.filter((col) => !col.startsWith('_') && col !== '__v');
        setColumns(filteredColumns);
      } else {
        setColumns([]);
      }
    } catch (err) {
      setError('Failed to load data. Make sure backend is running.');
      setFileData([]);
      setColumns([]);
    } finally {
      setLoading(false);
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
    link.setAttribute('download', selectedFile.name);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClear = () => {
    setSelectedFile(null);
    setFileData([]);
    setColumns([]);
    setError(null);
  };

  return (
    <div className="min-vh-100 bg-light">
      <Navbar bg="primary" variant="dark" expand="lg" className="px-3 py-3 shadow-sm">
        <Container fluid style={{ maxWidth: '1800px' }}>
          <Navbar.Brand href="#" className="fw-bold d-flex align-items-center">
            <span className="me-2">🧬</span>
            <div>
              <div>PGx Explorer Platform</div>
              <div className="small fw-normal opacity-75">FDA NCTR Pharmacogenomics Research Database</div>
            </div>
          </Navbar.Brand>

          <Nav className="ms-auto">
            <Nav.Link
              active={activeView === 'data'}
              onClick={() => setActiveView('data')}
              className="text-white px-3"
            >
              <span className="me-1">📊</span> Data Browser
            </Nav.Link>
            <Nav.Link
              active={activeView === 'chemical'}
              onClick={() => setActiveView('chemical')}
              className="text-white px-3"
            >
              <span className="me-1">🧪</span> Chemical Search
            </Nav.Link>
          </Nav>
        </Container>
      </Navbar>

      {activeView === 'data' ? (
        <Container fluid className="py-4" style={{ maxWidth: '1800px' }}>
          <Row className="g-3 mb-3">
            <Col md={3}>
              <StatCard title="Total Records" value={totalRecords} subtitle="Across available datasets" icon="📊" />
            </Col>
            <Col md={3}>
              <StatCard title="Minority Dataset" value={dataSources[0].recordCount} subtitle="Pharmacogenomic entries" icon="🧬" />
            </Col>
            <Col md={3}>
              <StatCard title="Literature Dataset" value={dataSources[1].recordCount} subtitle="PubMed-linked references" icon="📚" />
            </Col>
            <Col md={3}>
              <Card className="shadow-sm border-0 h-100">
                <Card.Body>
                  <div className="text-muted small text-uppercase fw-semibold">Backend Status</div>
                  <div className="mt-2">
                    <Badge bg="success" pill>Connected Endpoint</Badge>
                  </div>
                  
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col md={3} className="pe-2">
              <FileList
                files={dataSources}
                selectedFile={selectedFile}
                onSelectFile={loadFile}
                onClear={handleClear}
              />

              <Card className="shadow-sm border-0 mt-3">
                <Card.Body>
                  <div className="fw-semibold mb-2">Workspace Summary</div>
                  <small className="text-muted d-block">Selected view: {activeView === 'data' ? 'Data Browser' : 'Chemical Search'}</small>
                  <small className="text-muted d-block">Loaded file: {selectedFile ? selectedFile.name : 'None'}</small>
                  <small className="text-muted d-block">Visible rows: {fileData.length}</small>
                </Card.Body>
              </Card>
            </Col>

            <Col md={9} className="ps-2">
              {error && (
                <Card className="border-0 shadow-sm mb-3 bg-danger text-white">
                  <Card.Body className="py-2">⚠️ {error}</Card.Body>
                </Card>
              )}

              <DataTable
                data={fileData}
                columns={columns}
                loading={loading}
                selectedFile={selectedFile}
                onDownload={downloadCSV}
              />
            </Col>
          </Row>

          <footer className="text-center text-muted small py-4">
            FDA National Center for Toxicological Research • Pharmacogenomics Data Explorer
          </footer>
        </Container>
      ) : (
        <ChemicalSearch />
      )}
    </div>
  );
}

export default App;
