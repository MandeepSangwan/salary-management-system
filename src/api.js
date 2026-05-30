// src/api.js

/**
 * Get headers with the authenticated user
 */
function getHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const user = localStorage.getItem('salary_user');
  if (user) {
    headers['x-user'] = user;
  }
  return headers;
}

/**
 * Login
 */
export async function login(username, password) {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Login failed');
  }
  return res.json();
}

/**
 * Fetch all saved months from the backend.
 * @returns {Promise<Array>} Array of { year, month, data }
 */
export async function getSavedMonths() {
  const res = await fetch('/api/salaries', { headers: getHeaders() });
  if (res.status === 401) throw new Error('Unauthorized');
  if (!res.ok) throw new Error('Failed to fetch saved months');
  return res.json();
}

/**
 * Fetch data for a specific month from the backend.
 * @param {number} year 
 * @param {number} month 
 * @returns {Promise<Object>} { year, month, data }
 */
export async function fetchMonthData(year, month) {
  const res = await fetch(`/api/salaries/${year}/${month}`, { headers: getHeaders() });
  if (res.status === 401) throw new Error('Unauthorized');
  if (res.status === 404) return null; // Not found, so return null
  if (!res.ok) throw new Error('Failed to fetch month data');
  return res.json();
}

/**
 * Save data for a specific month to the backend.
 * @param {number} year 
 * @param {number} month 
 * @param {Object} data - { cash: [], cheque: [], esi: [] }
 */
export async function saveMonthData(year, month, data) {
  const res = await fetch('/api/salaries', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ year, month, data })
  });
  if (res.status === 401) throw new Error('Unauthorized');
  if (!res.ok) throw new Error('Failed to save data');
  return res.json();
}

/**
 * Delete a specific month from the backend.
 * @param {number} year 
 * @param {number} month 
 */
export async function deleteMonthData(year, month) {
  const res = await fetch(`/api/salaries/${year}/${month}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (res.status === 401) throw new Error('Unauthorized');
  if (!res.ok) throw new Error('Failed to delete data');
  return res.json();
}
