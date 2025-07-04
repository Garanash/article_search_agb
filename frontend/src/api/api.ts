import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000",
});

export const login = async (username: string, password: string) => {
  const params = new URLSearchParams();
  params.append("username", username);
  params.append("password", password);
  const response = await fetch("http://localhost:8000/token", {
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

export const getArticles = async (token: string) => {
  const res = await fetch("http://localhost:8000/articles/", { headers: { Authorization: `Bearer ${token}` } });
  return res.json();
};

export const addArticle = async (token: string, code: string) => {
  const params = new URLSearchParams();
  params.append("code", code);
  const res = await fetch("http://localhost:8000/articles/", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: params
  });
  return res.json();
};

export const deleteArticle = async (token: string, articleId: number) => {
  const res = await fetch(`http://localhost:8000/articles/${articleId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const getSuppliers = async (token: string, articleId: number) => {
  const res = await fetch(`http://localhost:8000/suppliers/${articleId}`, { headers: { Authorization: `Bearer ${token}` } });
  return res.json();
};

export const searchSuppliers = async (token: string, articleId: number) => {
  const res = await fetch(`http://localhost:8000/search_suppliers/${articleId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const getEmailTemplates = async (token: string) => {
  const res = await fetch("http://localhost:8000/email_templates/", { headers: { Authorization: `Bearer ${token}` } });
  return res.json();
};

export const sendEmail = async (
  token: string,
  sender: string,
  password: string,
  recipient: string,
  subject: string,
  body: string,
  smtp_server: string,
  smtp_port: number
) => {
  const res = await fetch("http://localhost:8000/send_email/", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ sender, password, recipient, subject, body, smtp_server, smtp_port })
  });
  return res.json();
};

export const getAnalytics = async (token: string) => {
  const res = await fetch("http://localhost:8000/analytics/", { headers: { Authorization: `Bearer ${token}` } });
  return res.json();
};

export const updateSupplierEmail = async (token: string, supplierId: number, email: string) => {
  const res = await fetch(`http://localhost:8000/suppliers/${supplierId}/email`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ email })
  });
  return res.json();
};

export const deleteSupplier = async (token: string, supplierId: number) => {
  const res = await fetch(`http://localhost:8000/suppliers/${supplierId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const updateSupplierEmailValidated = async (token: string, supplierId: number, validated: boolean) => {
  const res = await fetch(`http://localhost:8000/suppliers/${supplierId}/email_validated`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ validated })
  });
  return res.json();
};

// Проверка сайтов через whois
export const whoisCheck = async (sites: string[]) => {
  const res = await fetch("http://localhost:8000/whois_check/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sites })
  });
  return res.json();
};

// Поиск email через Perplexity
export const searchEmailPerplexity = async (company_name: string, website: string, region: string) => {
  const res = await fetch("http://localhost:8000/search_email_perplexity/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ company_name, website, region })
  });
  return res.json();
};

// --- Request API ---
export const getRequests = async (token: string) => {
  const res = await fetch("http://localhost:8000/requests/", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return await res.json();
};

export const createRequest = async (token: string, number: string) => {
  const res = await fetch("http://localhost:8000/requests/", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ number }),
  });
  return await res.json();
};

export const addArticleToRequest = async (token: string, requestId: number, articleId: number) => {
  const res = await fetch(`http://localhost:8000/requests/${requestId}/add_article/${articleId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return await res.json();
};

export const removeArticleFromRequest = async (token: string, requestId: number, articleId: number) => {
  const res = await fetch(`http://localhost:8000/requests/${requestId}/remove_article/${articleId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return await res.json();
};

export const getArticlesByRequest = async (token: string, requestId: number) => {
  const res = await fetch(`http://localhost:8000/requests/${requestId}/articles`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return await res.json();
};

export const deleteRequest = async (token: string, requestId: number) => {
  const res = await fetch(`http://localhost:8000/requests/${requestId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return await res.json();
}; 