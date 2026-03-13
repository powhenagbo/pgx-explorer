// src/components/BiomarkerFilters.js
import React from 'react';

function BiomarkerFilters({ onFilter }) {
    const biomarkers = [
        { name: 'CYP2D6', color: 'primary' },
        { name: 'CYP2C9', color: 'success' },
        { name: 'CYP2C19', color: 'info' },
        { name: 'CYP2B6', color: 'warning' },
        { name: 'TPMT', color: 'danger' },
        { name: 'VKORC1', color: 'secondary' }
    ];

    return (
        <div className="d-flex flex-wrap gap-2 mt-3">
            <span className="me-2 fw-bold">Quick Filters:</span>
            {biomarkers.map((bio) => (
                <button
                    key={bio.name}
                    className={`btn btn-sm btn-outline-${bio.color}`}
                    onClick={() => onFilter(bio.name)}
                >
                    🧬 {bio.name}
                </button>
            ))}
            <button
                className="btn btn-sm btn-outline-dark"
                onClick={() => onFilter('')}
            >
                Show All
            </button>
        </div>
    );
}

export default BiomarkerFilters;
