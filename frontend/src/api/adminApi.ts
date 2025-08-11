import { apiClient } from './api';

export const getAdminMetrics = async () => {
  const response = await apiClient.get(`/api/admin/metrics`);
  return response.data;
};

export const exportTableCsv = async (table: string) => {
  const response = await apiClient.get(`/api/admin/export_csv/${table}`, {
    responseType: 'blob',
  });
  return response.data;
};

export const importTableCsv = async (table: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post(`/api/admin/import_csv/${table}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}; 