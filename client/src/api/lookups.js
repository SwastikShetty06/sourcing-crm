import { http } from './http';

export function getLookups(params = {}) {
  const query = new URLSearchParams();
  if (params.type) query.set('type', params.type);
  if (params.parentId) query.set('parentId', params.parentId);
  if (params.includeInactive) query.set('includeInactive', 'true');

  const qs = query.toString();
  return http.get(`/lookups${qs ? `?${qs}` : ''}`);
}

export function updateLookup(id, updates) {
  return http.patch(`/lookups/${id}`, updates);
}

export function mergeLookup(id, intoId) {
  return http.post(`/lookups/${id}/merge`, { intoId });
}
