import React, { useState, useEffect, useRef } from 'react';
import { Form } from 'react-bootstrap';

function DrugSelector({ drugs, onSelect, selectedValue }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Filter drugs based on search
    const filteredDrugs = drugs.filter(drug =>
        drug.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10); // Limit to 10 results for performance

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (drug) => {
        onSelect(drug);
        setSearchTerm(drug);
        setIsOpen(false);
    };

    return (
        <div className="position-relative" ref={dropdownRef}>
            <div className="input-group">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Type to search drugs..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                />
                <button 
                    className="btn btn-outline-secondary" 
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    ▼
                </button>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="position-absolute w-100 mt-1 bg-white border rounded shadow-sm" style={{ zIndex: 1000, maxHeight: '300px', overflowY: 'auto' }}>
                    {filteredDrugs.length > 0 ? (
                        filteredDrugs.map((drug, index) => (
                            <div
                                key={index}
                                className={`px-3 py-2 cursor-pointer hover-bg-light ${drug === selectedValue ? 'bg-primary text-white' : ''}`}
                                onClick={() => handleSelect(drug)}
                                style={{ cursor: 'pointer' }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = drug === selectedValue ? '#0d6efd' : '#f8f9fa'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = drug === selectedValue ? '#0d6efd' : 'transparent'}
                            >
                                <span className="me-2">💊</span>
                                {drug}
                                {drug === selectedValue && <span className="float-end">✓</span>}
                            </div>
                        ))
                    ) : (
                        <div className="px-3 py-2 text-muted">
                            No drugs found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default DrugSelector;