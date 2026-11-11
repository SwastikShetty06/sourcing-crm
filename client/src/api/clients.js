import { http } from './http';

export function getClients(params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, value);
    }
  }
  const qs = query.toString();
  return http.get(`/clients${qs ? `?${qs}` : ''}`);
}

export function getClient(id) {
  return http.get(`/clients/${id}`);
}

export function createClient(data) {
  return http.post('/clients', data);
}

export function updateClient(id, data) {
  return http.patch(`/clients/${id}`, data);
}

export function addInteraction(id, interaction) {
  return http.post(`/clients/${id}/interactions`, interaction);
}

export function updateInteraction(id, interactionId, data) {
  return http.patch(`/clients/${id}/interactions/${interactionId}`, data);
}

export function deleteInteraction(id, interactionId) {
  return http.delete(`/clients/${id}/interactions/${interactionId}`);
}

export function deleteClient(id) {
  return http.delete(`/clients/${id}`);
}

export function updateClientStatus(id, statusData) {
  return http.post(`/clients/${id}/status`, statusData);
}

export function archiveClient(id) {
  return http.post(`/clients/${id}/archive`);
}
