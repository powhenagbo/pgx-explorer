import React, { useState } from 'react';
import { Card, Badge } from 'react-bootstrap';

function BiomarkerPanel({ onSelect }) {
    const [selectedBiomarker, setSelectedBiomarker] = useState(null);

    const biomarkers = [
        { name: 'CYP2D6', count: 45, color: 'primary', description: 'Drug metabolism' },
        { name: 'CYP2C9', count: 28, color: 'success', description: 'Warfarin, phenytoin' },
        { name: 'CYP2C19', count: 22, color: 'info', description: 'Clopidogrel, PPIs' },
        { name: 'CYP2B6', count: 8, color: 'warning', description: 'Efavirenz' },
        { name: 'VKORC1', count: 9, color: 'danger', description: 'Warfarin sensitivity' },
        { name: 'TPMT', count: 3, color: 'secondary', description: 'Azathioprine' },
        { name: 'UGT1A1', count: 4, color: 'dark', description: 'Irinotecan' },
        { name: 'CFTR', count: 12, color: 'info', description: 'Ivacaftor' }
    ];

    const handleSelect = (biomarker) => {
        setSelectedBiomarker(biomarker.name);
        onSelect(biomarker.name);
    };

    return (
        <div>
            <label className="form-label fw-semibold text-secondary mb-2">
                Browse by Biomarker
            </label>
            <div className="biomarker-grid" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {biomarkers.map((bio, index) => (
                    <Card 
                        key={index}
                        className={`mb-2 border-0 shadow-sm cursor-pointer transition-all ${selectedBiomarker === bio.name ? 'bg-light' : ''}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSelect(bio)}
                    >
                        <Card.Body className="p-2">
                            <div className="d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center">
                                    <Badge bg={bio.color} className="me-2" pill>
                                        {bio.name}
                                    </Badge>
                                    <small className="text-muted">{bio.description}</small>
                                </div>
                                <Badge bg="light" text="dark" pill>
                                    {bio.count}
                                </Badge>
                            </div>
                        </Card.Body>
                    </Card>
                ))}
            </div>
        </div>
    );
}

export default BiomarkerPanel;