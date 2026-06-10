const API = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001';

export interface SearchResult {
  id:           string;
  type:         'user' | 'drawing' | 'community' | 'room';
  title:        string;
  description?: string;
  image?:       string;
  url:          string;
  score:        number;
}

export async function search(q: string, type?: string): Promise<SearchResult[]> {
  if (!q.trim() || q.trim().length < 2) return [];
  const params = new URLSearchParams({ q: q.trim() });
  if (type) params.set('type', type);
  try {
    const r = await fetch(`${API}/api/search?${params}`);
    const d = await r.json() as { results: SearchResult[] };
    return d.results ?? [];
  } catch {
    return [];
  }
}
