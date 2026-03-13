import React, { useState } from 'react';
import { Card, Table, Badge, Button, Alert } from 'react-bootstrap';

function ResultsDisplay({ data, view, selectedItem, onClear }) {
    const [expandedRows, setExpandedRows] = useState({});

    const toggleRow = (index) => {
        setExpandedRows(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    // If no data, show welcome message
    if (!data || data.length === 0) {
        return (
            <Card className="border-0 shadow-sm text-center py-5">
                <Card.Body>
                    <div className="mb-4">
                        <span className="display-1">🧬</span>
                    </div>
                    <h3 className="fw-light mb-3">Welcome to PGx Explorer</h3>
                    <p className="text-muted mb-4">
                        Select a drug from the dropdown or choose a biomarker to begin exploring
                    </p>
                    <div className="d-flex justify-content-center gap-3">
                        <Badge bg="light" text="dark" className="p-2">💊 70+ Drugs</Badge>
                        <Badge bg="light" text="dark" className="p-2">🧬 15+ Biomarkers</Badge>
                        <Badge bg="light" text="dark" className="p-2">🌍 6 Populations</Badge>
                    </div>
                </Card.Body>
            </Card>
        );
    }

    // If it's a drug list (from initial load)
    if (data.drugs) {
        return (
            <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 fw-bold">📋 Available Drugs</h5>
                    <Badge bg="primary">{data.drugs.length} total</Badge>
                </Card.Header>
                <Card.Body>
                    <div className="row g-2">
                        {data.drugs.map((drug, index) => (
                            <div key={index} className="col-md-3 col-sm-4">
                                <div className="border rounded p-2 text-center bg-light">
                                    <small>{drug}</small>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card.Body>
            </Card>
        );
    }

    // Display detailed results
    return (
        <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
                <div>
                    <h5 className="mb-0 fw-bold">
                        {view === 'drugs' && '💊 Drug Details'}
                        {view === 'biomarkers' && '🧬 Biomarker Results'}
                        {view === 'search' && '🔍 Search Results'}
                    </h5>
                    <small className="text-muted">{selectedItem}</small>
                </div>
                <div>
                    <Badge bg="secondary" className="me-2">{data.length} records</Badge>
                    <Button variant="outline-secondary" size="sm" onClick={onClear}>
                        Clear
                    </Button>
                </div>
            </Card.Header>
            <Card.Body className="p-0">
                <Table hover responsive className="mb-0">
                    <thead className="bg-light">
                        <tr>
                            <th style={{ width: '30px' }}></th>
                            <th>Drug</th>
                            <th>Biomarker</th>
                            <th>SNP</th>
                            <th>African</th>
                            <th>European</th>
                            <th>Latin Am.</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, index) => (
                            <React.Fragment key={index}>
                                <tr className="align-middle">
                                    <td>
                                        <Button 
                                            variant="link" 
                                            size="sm"
                                            onClick={() => toggleRow(index)}
                                            className="text-decoration-none p-0"
                                        >
                                            {expandedRows[index] ? '▼' : '▶'}
                                        </Button>
                                    </td>
                                    <td>
                                        <strong>{item.Drug}</strong>
                                    </td>
                                    <td>
                                        <Badge bg="info" pill>
                                            {item.Biomarker}
                                        </Badge>
                                    </td>
                                    <td>
                                        <code>{item.SNP}</code>
                                    </td>
                                    <td>{((item['African(AF)'] || 0) * 100).toFixed(1)}%</td>
                                    <td>{((item['European(AF)'] || 0) * 100).toFixed(1)}%</td>
                                    <td>{((item['Latin American(AF)'] || 0) * 100).toFixed(1)}%</td>
                                    <td>
                                        <a 
                                            href={item['dbSNP Link']} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="btn btn-sm btn-outline-primary"
                                        >
                                            dbSNP
                                        </a>
                                    </td>
                                </tr>
                                {expandedRows[index] && (
                                    <tr className="bg-light">
                                        <td colSpan="8" className="p-3">
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <small className="text-muted d-block">Position</small>
                                                    <p className="mb-2">{item.Chr}:{item.Pos}</p>
                                                    
                                                    <small className="text-muted d-block">Alleles</small>
                                                    <p className="mb-2">Ref: {item.Ref} | Alt: {item.Alt}</p>
                                                </div>
                                                <div className="col-md-6">
                                                    <small className="text-muted d-block">Therapeutic Area</small>
                                                    <p className="mb-2">{item['Therapeutic Area']}</p>
                                                    
                                                    <small className="text-muted d-block">Databases</small>
                                                    <p className="mb-0">{item['Drug Efficacy Databases']}</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </Table>
            </Card.Body>
        </Card>
    );
}

export default ResultsDisplay;