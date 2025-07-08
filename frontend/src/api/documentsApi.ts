// Простой API клиент для документов
const apiClient = {
  get: async (url: string) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api${url}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  
  post: async (url: string, data: any) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api${url}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  
  put: async (url: string, data: any) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api${url}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  
  delete: async (url: string) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api${url}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }
};

export interface Document {
  id: number;
  document_type: string;
  title: string;
  data: any;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  created_by: number;
  approver_id: number;
  created_at: string;
  updated_at: string;
  approval_comment?: string;
}

export interface DocumentCreate {
  document_type: string;
  title: string;
  data: any;
}

export interface DocumentUpdate {
  title?: string;
  data?: any;
}

export interface DocumentApproval {
  approved: boolean;
  comment?: string;
}

export interface DocumentType {
  type: string;
  title: string;
  icon: string;
  color: string;
  available_for: string[];
  is_printable?: boolean;
}

export interface DocumentStatistics {
  total_my_documents: number;
  pending_my_documents: number;
  approved_my_documents: number;
  rejected_my_documents: number;
  pending_approvals: number;
  by_type: Record<string, {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  }>;
}

// Получить список документов пользователя
export const getDocuments = async (
  documentType?: string,
  status?: string
): Promise<Document[]> => {
  const params = new URLSearchParams();
  if (documentType) params.append('document_type', documentType);
  if (status) params.append('status', status);
  
  const response = await apiClient.get(`/documents/?${params.toString()}`);
  return response;
};

// Получить документы, ожидающие согласования
export const getPendingApprovals = async (): Promise<Document[]> => {
  const response = await apiClient.get('/documents/pending-approvals');
  return response;
};

// Создать новый документ
export const createDocument = async (document: DocumentCreate): Promise<Document> => {
  const response = await apiClient.post('/documents/', document);
  return response;
};

// Получить документ по ID
export const getDocument = async (documentId: number): Promise<Document> => {
  const response = await apiClient.get(`/documents/${documentId}`);
  return response;
};

// Согласовать или отклонить документ
export const approveDocument = async (
  documentId: number,
  approval: DocumentApproval
): Promise<Document> => {
  const response = await apiClient.put(`/documents/${documentId}/approve`, approval);
  return response;
};

// Обновить документ
export const updateDocument = async (
  documentId: number,
  update: DocumentUpdate
): Promise<Document> => {
  const response = await apiClient.put(`/documents/${documentId}`, update);
  return response;
};

// Удалить документ
export const deleteDocument = async (documentId: number): Promise<void> => {
  await apiClient.delete(`/documents/${documentId}`);
};

// Получить доступные типы документов
export const getAvailableDocumentTypes = async (): Promise<DocumentType[]> => {
  const response = await apiClient.get('/documents/types/available');
  return response;
};

// Получить статистику по документам
export const getDocumentStatistics = async (): Promise<DocumentStatistics> => {
  const response = await apiClient.get('/documents/statistics');
  return response;
}; 