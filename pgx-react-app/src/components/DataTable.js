
import React, { useMemo, useState } from 'react';
import { Card, Table, Button, Form, Alert, InputGroup, Badge } from 'react-bootstrap';

const DataTable = ({ data, columns, loading, selectedFile, onDownload }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;

  const getStructureLink = (drugName) =>
    `https://pubchem.ncbi.nlm.nih.gov/#query=${encodeURIComponent(drugName)}`;

  const getProteinLink = (proteinName) =>
    `https://www.rcsb.org/search?q=${encodeURIComponent(proteinName)}`;

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      if (!searchTerm) return true;
      return Object.values(row).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [data, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage);

  if (!selectedFile) {
    return (
      <Card className="shadow-sm border-0 h-100">
        <Card.Body className="d-flex flex-column justify-content-center align-items-center text-center py-5">
          <div className="display-1 mb-4">📊</div>
          <h4 className="fw-bold">No File Selected</h4>
          <p className="text-muted mb-0">
            Choose a dataset from the left panel to begin browsing records.
          </p>
        </Card.Body>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="shadow-sm border-0">
        <Card.Body className="text-center py-5">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mb-0">Loading data from database...</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-0">
      <Card.Header className="bg-white py-3 border-0 border-bottom">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <h4 className="mb-1 fw-bold">{selectedFile.name}</h4>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <small className="text-muted">{selectedFile.description}</small>
              <Badge bg="light" text="dark" pill>
                {filteredData.length} records
              </Badge>
            </div>
          </div>

          <Button variant="success" size="sm" onClick={onDownload}>
            ⬇️ Download CSV
          </Button>
        </div>
      </Card.Header>

      <Card.Body className="p-0">
        <div className="px-3 py-3 border-bottom bg-light">
          <InputGroup>
            <InputGroup.Text className="bg-white border-end-0">🔎</InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search drug, SNP, biomarker, chromosome..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="border-start-0 shadow-sm"
            />
          </InputGroup>
        </div>

        {filteredData.length > 0 ? (
          <>
            <div className="table-responsive" style={{ maxHeight: '68vh' }}>
              <Table hover striped size="sm" className="mb-0 align-middle">
                <thead className="bg-light sticky-top" style={{ zIndex: 1 }}>
                  <tr>
                    {columns.map((col, idx) => (
                      <th key={idx} className="py-3 px-3 fw-semibold text-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {paginatedData.map((row, rowIdx) => (
                    <tr key={rowIdx} style={{ cursor: 'pointer' }}>
                      {columns.map((col, colIdx) => {
                        const cellValue = row[col] ?? '-';

                        if (col.toLowerCase() === 'drug' && cellValue !== '-') {
                          return (
                            <td key={colIdx} className="py-2 px-3">
                              <a
                                href={getStructureLink(cellValue)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary text-decoration-none fw-semibold"
                              >
                                {cellValue} <span aria-hidden="true">↗</span>
                              </a>
                            </td>
                          );
                        }

                        if (col.toLowerCase() === 'biomarker' && cellValue !== '-') {
                          return (
                            <td key={colIdx} className="py-2 px-3">
                              <a
                                href={getProteinLink(cellValue)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-success text-decoration-none fw-semibold"
                              >
                                {cellValue} <span aria-hidden="true">🧬</span>
                              </a>
                            </td>
                          );
                        }

                        if (col === 'dbSNP Link' && cellValue !== '-') {
                          return (
                            <td key={colIdx} className="py-2 px-3">
                              <a
                                href={cellValue}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-decoration-none"
                              >
                                View SNP ↗
                              </a>
                            </td>
                          );
                        }

                        return (
                          <td key={colIdx} className="py-2 px-3">
                            {String(cellValue)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="px-3 py-3 border-top bg-light d-flex justify-content-between align-items-center flex-wrap gap-2">
                <small className="text-muted">
                  Page {currentPage} of {totalPages} • {filteredData.length} filtered records
                </small>

                <div>
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="me-2"
                  >
                    Previous
                  </Button>

                  <Button
                    size="sm"
                    variant="outline-secondary"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <Alert variant="info" className="m-3">
            No records found for the current search.
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
};

export default DataTable;
