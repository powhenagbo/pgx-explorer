// src/components/DrugTable.js
import React, { useState } from 'react';

function DrugTable({ data, formatFrequency }) {
    const [sortField, setSortField] = useState(null);
    const [sortDirection, setSortDirection] = useState('asc');

    // Handle different data structures
    const isDrugList = data && data.drugs;
    const isArray = Array.isArray(data);
    
    if (!data || (isDrugList && data.drugs.length === 0) || (isArray && data.length === 0)) {
        return (
            <div className="alert alert-info text-center">
                No data available. Try a different search.
            </div>
        );
    }

    // If it's just a list of drugs (from initial load)
    if (isDrugList) {
        return (
            <div className="card">
                <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">Available Drugs in Database ({data.drugs.length})</h5>
                </div>
                <div className="card-body">
                    <div className="row">
                        {data.drugs.map((drug, index) => (
                            <div key={index} className="col-md-3 col-sm-4 mb-2">
                                <span className="badge bg-light text-dark p-2 border">
                                    💊 {drug}
                                </span>
                            </div>
                        ))}
                    </div>
                    <p className="text-muted mt-3">
                        Search for a specific drug above to see allele frequencies.
                    </p>
                </div>
            </div>
        );
    }

    // Sort function for detailed data
    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Sort the data
    const sortedData = [...data].sort((a, b) => {
        if (!sortField) return 0;
        
        let aVal = a[sortField] || '';
        let bVal = b[sortField] || '';
        
        if (typeof aVal === 'number') {
            return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
        
        if (sortDirection === 'asc') {
            return aVal.localeCompare(bVal);
        } else {
            return bVal.localeCompare(aVal);
        }
    });

    // Render detailed table
    return (
        <div className="card">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Allele Frequency Results ({data.length} records)</h5>
                <span className="badge bg-light text-dark">
                    Click column headers to sort
                </span>
            </div>
            <div className="card-body p-0">
                <div className="table-responsive">
                    <table className="table table-hover table-striped mb-0">
                        <thead className="table-dark">
                            <tr>
                                <th onClick={() => handleSort('Drug')} style={{cursor: 'pointer'}}>
                                    Drug {sortField === 'Drug' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleSort('Biomarker')} style={{cursor: 'pointer'}}>
                                    Biomarker {sortField === 'Biomarker' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleSort('SNP')} style={{cursor: 'pointer'}}>
                                    SNP {sortField === 'SNP' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleSort('African(AF)')} style={{cursor: 'pointer'}}>
                                    African {sortField === 'African(AF)' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleSort('European(AF)')} style={{cursor: 'pointer'}}>
                                    European {sortField === 'European(AF)' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleSort('Latin American(AF)')} style={{cursor: 'pointer'}}>
                                    Latin Am. {sortField === 'Latin American(AF)' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th>Therapeutic Area</th>
                                <th>Links</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedData.map((item, index) => (
                                <tr key={index}>
                                    <td><strong>{item.Drug}</strong></td>
                                    <td>
                                        <span className="badge bg-info text-dark">
                                            {item.Biomarker}
                                        </span>
                                    </td>
                                    <td>
                                        <code>{item.SNP}</code>
                                    </td>
                                    <td>{formatFrequency(item['African(AF)'])}</td>
                                    <td>{formatFrequency(item['European(AF)'])}</td>
                                    <td>{formatFrequency(item['Latin American(AF)'])}</td>
                                    <td>{item['Therapeutic Area']}</td>
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
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default DrugTable;
