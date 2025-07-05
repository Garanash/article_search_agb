import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const getToken = () => localStorage.getItem('token');

export const getAdminMetrics = async () => {
  const token = getToken();
  const response = await axios.get(`${API_BASE_URL}/admin/metrics/`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const exportTableCsv = async (table: string) => {
  const token = getToken();
  const response = await axios.get(`${API_BASE_URL}/admin/export_csv/${table}`, {
    headers: { Authorization: `Bearer ${token}` },
    responseType: 'blob',
  });
  return response.data;
};

export const importTableCsv = async (table: string, file: File) => {
  const token = getToken();
  const formData = new FormData();
  formData.append('file', file);
  const response = await axios.post(`${API_BASE_URL}/admin/import_csv/${table}`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}; 