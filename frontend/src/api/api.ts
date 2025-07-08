import axios from "axios";

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

export { apiClient };

export const login = async (username: string, password: string) => {
  const params = new URLSearchParams();
  params.append("username", username);
  params.append("password", password);
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json();
};

export const getArticles = async () => {
  const response = await apiClient.get("/api/articles/");
  return response.data;
};

export const addArticle = async (code: string) => {
  const response = await apiClient.post("/api/articles/", { code });
  return response.data;
};

export const deleteArticle = async (articleId: number) => {
  const response = await apiClient.delete(`/api/articles/${articleId}`);
  return response.data;
};

export const getSuppliers = async (articleId: number) => {
  const response = await apiClient.get("/api/suppliers/" + articleId);
  return response.data;
};

export const searchSuppliers = async (articleId: number) => {
  const response = await apiClient.post("/api/search_suppliers/" + articleId);
  return response.data;
};

export const getEmailTemplates = async () => {
  const response = await apiClient.get("/api/email_templates/");
  return response.data;
};

export const sendEmail = async (
  sender: string,
  password: string,
  recipient: string,
  subject: string,
  body: string,
  smtp_server: string,
  smtp_port: number
) => {
  const response = await apiClient.post("/api/send_email/", {
    sender, password, recipient, subject, body, smtp_server, smtp_port
  });
  return response.data;
};

export const getAnalytics = async () => {
  const response = await apiClient.get("/api/analytics/");
  return response.data;
};

export const updateSupplierEmail = async (supplierId: number, email: string) => {
  const response = await apiClient.patch(`/api/suppliers/${supplierId}/email`, { email });
  return response.data;
};

export const deleteSupplier = async (supplierId: number) => {
  const response = await apiClient.delete(`/api/suppliers/${supplierId}`);
  return response.data;
};

export const updateSupplierEmailValidated = async (supplierId: number, validated: boolean) => {
  const response = await apiClient.patch(`/api/suppliers/${supplierId}/email_validated`, { validated });
  return response.data;
};

// Проверка сайтов через whois
export const whoisCheck = async (sites: string[]) => {
  const response = await apiClient.post("/api/whois_check/", { sites });
  return response.data;
};

// Поиск email через Perplexity
export const searchEmailPerplexity = async (company_name: string, website: string, region: string) => {
  const response = await apiClient.post("/api/search_email_perplexity/", { company_name, website, region });
  return response.data;
};

// --- Request API ---
export const getRequests = async () => {
  const response = await apiClient.get("/api/requests/");
  return response.data;
};

export const createRequest = async (number: string) => {
  const response = await apiClient.post("/api/requests/", { number });
  return response.data;
};

export const addArticleToRequest = async (requestId: number, articleId: number) => {
  const response = await apiClient.post(`/api/requests/${requestId}/add-article/${articleId}`);
  return response.data;
};

export const removeArticleFromRequest = async (requestId: number, articleId: number) => {
  const response = await apiClient.post(`/api/requests/${requestId}/remove-article/${articleId}`);
  return response.data;
};

export const getArticlesByRequest = async (requestId: number) => {
  const response = await apiClient.get(`/api/requests/${requestId}/articles`);
  return response.data;
};

export const deleteRequest = async (requestId: number) => {
  const response = await apiClient.delete(`/api/requests/${requestId}`);
  return response.data;
};

// --- Bot Management API ---
export const getUserBots = async () => {
  const response = await apiClient.get("/api/user_bots/");
  return response.data;
};

export const assignBotToUser = async (userData: {
  user_id: number;
  bot_id: string;
  bot_name: string;
  bot_description: string;
  bot_avatar: string;
  bot_color: string;
}) => {
  const response = await apiClient.post("/api/admin/assign_bot/", userData);
  return response.data;
};

export const removeBotFromUser = async (userId: number, botId: string) => {
  const response = await apiClient.delete(`/api/admin/remove_bot/${userId}/${botId}`);
  return response.data;
};

export const getUsersWithBots = async () => {
  const response = await apiClient.get("/api/admin/users_with_bots/");
  return response.data;
};

// --- User Management API ---
export const createUser = async (userData: {
  username: string;
  email: string;
  role: string;
  department: string;
  position: string;
  phone: string;
  company: string;
}) => {
  const response = await apiClient.post("/api/users/", userData);
  return response.data;
};

export const getUserStatistics = async () => {
  const response = await apiClient.get("/api/users/statistics");
  return response.data;
};

export const changePassword = async (currentPassword: string | undefined, newPassword: string) => {
  const body: any = { new_password: newPassword };
  if (currentPassword !== undefined) body.current_password = currentPassword;
  const response = await apiClient.post("/api/change_password/", body);
  return response.data;
};

export const getUserProfile = async () => {
  const response = await apiClient.get("/api/users/profile");
  return response.data;
}; 