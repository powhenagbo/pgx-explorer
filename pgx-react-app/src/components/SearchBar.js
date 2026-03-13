// src/components/SearchBar.js
import React, { useState } from 'react';

function SearchBar({ onSearch }) {
    const [inputValue, setInputValue] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSearch(inputValue);
    };

    const handleClear = () => {
        setInputValue('');
        onSearch('');
    };

    return (
        <form onSubmit={handleSubmit} className="mb-3">
            <div className="input-group">
                <input
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="Search by drug, biomarker, or SNP (e.g., Warfarin, CYP2D6, rs1057910)"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                />
                <button className="btn btn-primary" type="submit">
                    🔍 Search
                </button>
                {inputValue && (
                    <button className="btn btn-outline-secondary" type="button" onClick={handleClear}>
                        ✕ Clear
                    </button>
                )}
            </div>
        </form>
    );
}

export default SearchBar;
