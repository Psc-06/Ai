import axios from 'axios';

const API_BASE = 'http://127.0.0.1:5000/api';

function getApiError(error, fallback) {
  return (
    error.response?.data?.details
    || error.response?.data?.error
    || error.response?.data?.message
    || error.message
    || fallback
  );
}

/**
 * Start a new security scan
 * @param {string} networkRange 
 * @param {string} ports 
 * @returns {Promise<{success: boolean, data?: any, error?: any}>}
 */
export const startScan = async (networkRange, ports) => {
  try {
    const response = await axios.post(`${API_BASE}/scan/start`, {
      network_range: networkRange,
      ports,
    });
    return { success: true, data: response.data, error: null };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: getApiError(error, 'Failed to start scan'),
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
      error: getApiError(error, 'Failed to fetch scan results'),
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
      error: getApiError(error, 'Failed to fetch OWASP report'),
    };
  }
};

export const getPdfReport = async (scanId) => {
  try {
    const response = await axios.get(`${API_BASE}/reports/${scanId}/pdf`, {
      responseType: 'arraybuffer',
      timeout: 30000,
    });
    return { success: true, data: response.data, error: null };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: getApiError(error, 'Failed to generate PDF report'),
    };
  }
};

/**
 * Check the health status of the API
 * @returns {Promise<{success: boolean, data?: any, error?: any}>}
 */
export const checkHealth = async () => {
  try {
    const response = await axios.get(`${API_BASE}/health`, { timeout: 3000 });
    return { success: true, data: response.data, error: null };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: getApiError(error, 'Failed to check API health'),
    };
  }
};
