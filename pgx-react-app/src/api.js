// src/api.js - This handles all communication with the backend
const API_BASE_URL = 'http://localhost:3000/api';

export const fetchDrugs = async () => {
    const response = await fetch(`${API_BASE_URL}/drugs`);
    return await response.json();
};

export const searchDrugs = async (term) => {
    const response = await fetch(`${API_BASE_URL}/search/${term}`);
    return await response.json();
};

export const fetchDrugDetails = async (drugName) => {
    const response = await fetch(`${API_BASE_URL}/drug/${drugName}`);
    return await response.json();
};

export const fetchByBiomarker = async (biomarker) => {
    const response = await fetch(`${API_BASE_URL}/search/${biomarker}`);
    return await response.json();
};
