export const API_BASE = 'http://127.0.0.1:8000';
export const WS_BASE = 'ws://127.0.0.1:8000';

export async function safeJsonFetch(path, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${path}`, options);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}
