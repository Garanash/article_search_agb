import axios from 'axios';

const API_BASE_URL = "";

// Получаем токен из localStorage
const getToken = (): string | null => {
  return localStorage.getItem('token');
};

// Создаем axios instance с перехватчиком для добавления токена
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Добавляем перехватчик запросов для автоматического добавления токена
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getAdminMetrics = async () => {
  const response = await apiClient.get(`/admin/metrics/`);
  return response.data;
};

export const exportTableCsv = async (table: string) => {
  const response = await apiClient.get(`/admin/export_csv/${table}`, {
    responseType: 'blob',
  });
  return response.data;
};

export const importTableCsv = async (table: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post(`/admin/import_csv/${table}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}; 