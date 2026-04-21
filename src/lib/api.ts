const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export { API };

export async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API}${path}`, options);
  return res;
}
