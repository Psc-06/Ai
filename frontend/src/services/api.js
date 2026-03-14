import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

/**
 * Start a new security scan
 * @param {string} networkRange 
 * @param {string} ports 
 * @returns {Promise<{success: boolean, data?: any, error?: any}>}
 */
export const startScan = async (networkRange, ports) => {
  try {
    const response = await axios.post(`${API_BASE}/scan/start`, {
      networkRange,
      ports,
    });
    return { success: true, data: response.data, error: null };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error.response?.data?.message || error.message || 'Failed to start scan',
    };
  }
};

/**
 * Get results for a specific scan
 * @param {string} scanId 
 * @returns {Promise<{success: boolean, data?: any, error?: any}>}
 */
export const getScanResults = async (scanId) => {
  try {
    const response = await axios.get(`${API_BASE}/scan/results/${scanId}`);
    return { success: true, data: response.data, error: null };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error.response?.data?.message || error.message || 'Failed to fetch scan results',
    };
  }
};

/**
 * Get OWASP report for a specific scan
 * @param {string} scanId 
 * @returns {Promise<{success: boolean, data?: any, error?: any}>}
 */
export const getOwaspReport = async (scanId) => {
  try {
    const response = await axios.get(`${API_BASE}/owasp/report/${scanId}`);
    return { success: true, data: response.data, error: null };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error.response?.data?.message || error.message || 'Failed to fetch OWASP report',
    };
  }
};

/**
 * Check the health status of the API
 * @returns {Promise<{success: boolean, data?: any, error?: any}>}
 */
export const checkHealth = async () => {
  try {
    const response = await axios.get(`${API_BASE}/health`);
    return { success: true, data: response.data, error: null };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error.response?.data?.message || error.message || 'Failed to check API health',
    };
  }
};
