import React, { useEffect, useMemo, useState } from 'react';
import { Card, Table, Button, Alert, Badge, Form, InputGroup } from 'react-bootstrap';

const rowsPerPage = 50;
const FDA_PGX_LABELING_URL =
  'https://www.fda.gov/drugs/science-and-research-drugs/table-pharmacogenomic-biomarkers-drug-labeling';

const cardStyle = {
  border: '1px solid #e5e7eb',
  borderRadius: 20,
  boxShadow: '0 18px 40px rgba(15,23,42,0.08)',
};

function LinkIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="12"
      height="12"
      style={{ marginLeft: 6, verticalAlign: 'middle' }}
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

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16">
      <path
        d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const truncateValue = (value) => {
  const stringValue = String(value ?? '-');
  const isTruncated = stringValue.length > 20;

  return {
    displayValue: isTruncated ? `${stringValue.slice(0, 20)}...` : stringValue,
    fullValue: stringValue,
    isTruncated,
  };
};

const DataTable = ({ data, columns, loading, selectedFile, onDownload, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const normalizedSearchTerm = searchTerm.trim();

  useEffect(() => {
    setSearchTerm('');
    setCurrentPage(1);
  }, [selectedFile?.id]);

  useEffect(() => {
    setCurrentPage(1);
  }, [normalizedSearchTerm]);

  const getStructureLink = (drugName) =>
    `${FDA_PGX_LABELING_URL}#:~:text=${encodeURIComponent(drugName)}`;

  const getProteinLink = (proteinName) =>
    `https://www.genecards.org/Search/Keyword?queryString=${encodeURIComponent(proteinName)}`;

  const getSnpLink = (snpId) =>
    `https://www.ncbi.nlm.nih.gov/snp/${encodeURIComponent(snpId)}`;

  const getPmidLink = (pmidValue) => {
    const firstPmid = String(pmidValue)
      .split(';')
      .map((value) => value.trim())
      .find(Boolean);

    return firstPmid ? `https://pubmed.ncbi.nlm.nih.gov/${encodeURIComponent(firstPmid)}/` : null;
  };

  const filteredData = useMemo(() => {
    if (!normalizedSearchTerm) {
      return data;
    }

    return data.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(normalizedSearchTerm.toLowerCase())
      )
    );
  }, [data, normalizedSearchTerm]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage);

  if (!selectedFile) {
    return (
      <Card className="h-100 border-0" style={cardStyle}>
        <Card.Body className="d-flex flex-column justify-content-center align-items-center text-center py-5">
          <h4 className="fw-bold" style={{ color: '#0f172a' }}>Choose a Dataset</h4>
          <p className="mb-0" style={{ color: '#64748b', maxWidth: 520 }}>
            Select a dataset from the dropdown above to display its full table here.
          </p>
        </Card.Body>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="border-0" style={cardStyle}>
        <Card.Body className="text-center py-5">
          <div className="spinner-border mb-3" role="status" style={{ color: '#1e3a8a' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mb-0" style={{ color: '#64748b' }}>Loading data from database...</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="border-0" style={cardStyle}>
      <Card.Header className="py-3 border-0 border-bottom bg-white" style={{ borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <h4 className="mb-1 fw-bold" style={{ color: '#0f172a' }}>{selectedFile.name}</h4>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <small style={{ color: '#64748b' }}>{selectedFile.description}</small>
              <Badge pill style={{ background: '#0f172a', color: '#ffffff' }}>
                {normalizedSearchTerm ? `${filteredData.length} matches` : `${data.length} records`}
              </Badge>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <Button
              size="sm"
              variant="outline-secondary"
              onClick={onClose}
              style={{ borderRadius: 12 }}
            >
              Close Table
            </Button>
            <Button
              size="sm"
              onClick={onDownload}
              disabled={data.length === 0}
              style={{ background: '#0f172a', borderColor: '#0f172a', borderRadius: 12 }}
            >
              Download CSV
            </Button>
          </div>
        </div>
      </Card.Header>

      <Card.Body className="p-0">
        <div className="px-3 py-3 border-bottom" style={{ background: '#f8fafc' }}>
          <InputGroup>
            <InputGroup.Text className="bg-white border-end-0" style={{ color: '#64748b' }}>
              <SearchIcon />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder={`Search ${selectedFile.name} data`}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="border-start-0 shadow-none"
            />
          </InputGroup>
        </div>

        {filteredData.length > 0 ? (
          <>
            <div className="table-responsive" style={{ maxHeight: '68vh' }}>
              <Table hover size="sm" className="mb-0 align-middle">
                <thead className="sticky-top" style={{ zIndex: 1 }}>
                  <tr style={{ background: '#e2e8f0' }}>
                    {columns.map((col, idx) => (
                      <th
                        key={idx}
                        className="fw-semibold text-nowrap"
                        style={{ padding: '14px 16px', color: '#0f172a', borderBottom: '1px solid #cbd5e1' }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {paginatedData.map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      {columns.map((col, colIdx) => {
                        const cellValue = row[col] ?? '-';
                        const { displayValue, fullValue, isTruncated } = truncateValue(cellValue);
                        const tooltipProps = isTruncated ? { title: fullValue } : {};
                        const cellStyle = { padding: '14px 16px', borderBottom: '1px solid #e5e7eb', color: '#334155' };

                        if (col.toLowerCase() === 'drug' && cellValue !== '-') {
                          return (
                            <td key={colIdx} style={cellStyle}>
                              <a
                                href={getStructureLink(cellValue)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="fw-semibold"
                                style={{ color: '#1d4ed8', textDecoration: 'none' }}
                                {...tooltipProps}
                              >
                                {displayValue}
                                <LinkIcon />
                              </a>
                            </td>
                          );
                        }

                        if (col.toLowerCase() === 'biomarker' && cellValue !== '-') {
                          return (
                            <td key={colIdx} style={cellStyle}>
                              <a
                                href={getProteinLink(cellValue)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="fw-semibold"
                                style={{ color: '#0f766e', textDecoration: 'none' }}
                                {...tooltipProps}
                              >
                                {displayValue}
                                <LinkIcon />
                              </a>
                            </td>
                          );
                        }

                        if (col.toLowerCase() === 'snp' && cellValue !== '-') {
                          return (
                            <td key={colIdx} style={cellStyle}>
                              <a
                                href={getSnpLink(cellValue)}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#1d4ed8', textDecoration: 'none' }}
                                {...tooltipProps}
                              >
                                {displayValue}
                                <LinkIcon />
                              </a>
                            </td>
                          );
                        }

                        if (col.toLowerCase() === 'pmid' && cellValue !== '-') {
                          const pmidLink = getPmidLink(cellValue);

                          return (
                            <td key={colIdx} style={cellStyle}>
                              {pmidLink ? (
                                <a
                                  href={pmidLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: '#1d4ed8', textDecoration: 'none' }}
                                  {...tooltipProps}
                                >
                                  {displayValue}
                                  <LinkIcon />
                                </a>
                              ) : (
                                displayValue
                              )}
                            </td>
                          );
                        }

                        if (col === 'dbSNP Link' && cellValue !== '-') {
                          return (
                            <td key={colIdx} style={cellStyle}>
                              <a
                                href={cellValue}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#1d4ed8', textDecoration: 'none' }}
                                {...tooltipProps}
                              >
                                {displayValue}
                                <LinkIcon />
                              </a>
                            </td>
                          );
                        }

                        return (
                          <td key={colIdx} style={cellStyle} {...tooltipProps}>
                            {displayValue}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="px-3 py-3 border-top d-flex justify-content-between align-items-center flex-wrap gap-2" style={{ background: '#f8fafc' }}>
                <small style={{ color: '#64748b' }}>
                  Page {currentPage} of {totalPages} - {filteredData.length} visible records
                </small>

                <div>
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    className="me-2"
                    style={{ borderRadius: 10 }}
                  >
                    Previous
                  </Button>

                  <Button
                    size="sm"
                    variant="outline-secondary"
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                    style={{ borderRadius: 10 }}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <Alert variant="light" className="m-3 mb-0" style={{ borderRadius: 16, border: '1px solid #cbd5e1', color: '#64748b' }}>
            No records found for the current search.
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
};

export default DataTable;
