// src/config/constants.js

// The backend API URL 
export const API_BASE_URL = 'http://localhost:5001/api';

// Table display settings
export const ROWS_PER_PAGE = 25;
export const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

// Color scheme for the app
export const COLORS = {
    primary: '#4361ee',
    secondary: '#6c757d',
    success: '#2a9d8f',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    light: '#f8f9fa',
    dark: '#343a40',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
};

// External database links
export const EXTERNAL_LINKS = {
    pubchem: (drug) => `https://pubchem.ncbi.nlm.nih.gov/#query=${encodeURIComponent(drug)}`,
    pdb: (protein) => `https://www.rcsb.org/search?q=${encodeURIComponent(protein)}`,
    dbsnp: (snpId) => `https://www.ncbi.nlm.nih.gov/snp/${snpId}`,
    pubmed: (pmid) => `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
};