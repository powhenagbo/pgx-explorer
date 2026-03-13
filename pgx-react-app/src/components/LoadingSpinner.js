// src/components/LoadingSpinner.js
import React from 'react';

function LoadingSpinner() {
    return (
        <div className="text-center my-5">
            <div className="spinner-border text-primary" role="status" style={{width: '3rem', height: '3rem'}}>
                <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Fetching data from database...</p>
        </div>
    );
}

export default LoadingSpinner;
