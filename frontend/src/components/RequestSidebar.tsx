import Papa from "papaparse";
import React, { useEffect, useState, useRef } from "react";
import { getRequests, createRequest, deleteRequest, getArticlesByRequest } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { Button, List, Input, Drawer, message, Spin } from "antd";
import { EyeOutlined } from "@ant-design/icons";

interface Request {
  id: number;
  number: string;
  created_at: string;
}

interface RequestSidebarProps {
  activeRequestId: number | null;
  onSelect: (requestId: number | null) => void;
  requests: any[];
  setRequests: React.Dispatch<React.SetStateAction<any[]>>;
}

// Адаптивные стили для боковой панели
const sidebarStyles = {
  container: {
    width: "280px",
    minWidth: "250px",
    maxWidth: "350px",
    marginLeft: "16px",
    display: "flex",
    flexDirection: "column" as const,
    height: "100%",
  },
  
  title: {
    marginBottom: "12px",
    fontWeight: 600,
    fontSize: "18px",
  },
  
  input: {
    marginBottom: "8px",
  },
  
  createButton: {
    marginBottom: "16px",
  },
  
  listItem: {
    borderRadius: "6px",
    cursor: "pointer",
    marginBottom: "8px",
    padding: "12px",
    border: "2px solid #FCB813",
    boxShadow: "0 2px 8px rgba(252, 184, 19, 0.08)",
    fontWeight: 400,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#fff"
  },
  
  activeListItem: {
    background: "#e6f7ff",
    borderRadius: "6px",
    cursor: "pointer",
    marginBottom: "8px",
    padding: "12px",
    border: "2.5px solid #1890ff",
    boxShadow: "0 2px 8px rgba(24, 144, 255, 0.12)",
    fontWeight: 600,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  
  requestNumber: {
    fontSize: "15px",
  },
  
  requestCount: {
    fontSize: "12px",
    color: "#888",
  },
  
  allArticlesButton: {
    marginTop: "12px",
  },
  
  drawer: {
    width: "500px",
  },
};

const RequestSidebar: React.FC<RequestSidebarProps> = ({ activeRequestId, onSelect, requests, setRequests }) => {
  const { token } = useAuth();
  const [newNumber, setNewNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewArticles, setPreviewArticles] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewRequest, setPreviewRequest] = useState<Request | null>(null);
  const [articleCounts, setArticleCounts] = useState<{ [id: number]: number }>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await getRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading requests:", error);
      message.error("Ошибка при загрузке запросов");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line
  }, [token]);

  useEffect(() => {
    const fetchCounts = async () => {
      const counts: { [id: number]: number } = {};
      await Promise.all(requests.map(async (req) => {
        try {
          const arts = await getArticlesByRequest(req.id);
          counts[req.id] = Array.isArray(arts) ? arts.length : 0;
        } catch {
          counts[req.id] = 0;
        }
      }));
      setArticleCounts(counts);
    };
    fetchCounts();
  }, [token, requests]);

  const handlePreview = async (req: Request) => {
    if (!token) return;
    setPreviewLoading(true);
    setPreviewRequest(req);
    setPreviewVisible(true);
    try {
      const arts = await getArticlesByRequest(req.id);
      setPreviewArticles(Array.isArray(arts) ? arts : []);
    } catch {
      setPreviewArticles([]);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!token || !newNumber) return;
    try {
      const req = await createRequest(newNumber);
      setRequests(prev => [...prev, req]);
      setNewNumber("");
      message.success("Запрос создан");
    } catch (e: any) {
      if (e && e.message && e.message.includes('UNIQUE constraint failed: requests.number')) {
        message.error('Запрос с таким номером уже существует!');
      } else {
        message.error("Ошибка создания запроса");
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    try {
      await deleteRequest(id);
      setRequests(prev => prev.filter(req => req.id !== id));
      if (activeRequestId === id) onSelect(null);
    } catch {
      message.error("Ошибка удаления запроса");
    }
  };

  return (
    <div style={sidebarStyles.container} className="request-sidebar">
      <div style={sidebarStyles.title}>Запросы</div>
      <Input
        placeholder="Номер нового запроса (например, ВЭД-20240704-12345)"
        value={newNumber}
        onChange={e => setNewNumber(e.target.value)}
        onPressEnter={handleCreate}
        style={sidebarStyles.input}
      />
      <Button block type="primary" onClick={handleCreate} style={sidebarStyles.createButton}>
        Создать запрос
      </Button>
      <List
        dataSource={requests}
        loading={loading}
        renderItem={req => (
          <List.Item
            style={req.id === activeRequestId ? sidebarStyles.activeListItem : sidebarStyles.listItem}
            onClick={() => onSelect(req.id)}
            actions={[
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, maxWidth: 80 }}>
                <Button size="small" style={{ padding: '0 6px', width: 60 }} onClick={e => { e.stopPropagation(); handlePreview(req); }}>👁️</Button>
                <Button size="small" danger style={{ padding: '0 6px', width: 60 }} onClick={e => { e.stopPropagation(); handleDelete(req.id); }}>Удалить</Button>
              </div>
            ]}
          >
            <div>
              <div style={sidebarStyles.requestNumber}>{req.number}</div>
              <div style={sidebarStyles.requestCount}>Артикулов: {articleCounts[req.id] || 0}</div>
            </div>
          </List.Item>
        )}
        locale={{ emptyText: 'Нет запросов' }}
      />
      <Button block style={sidebarStyles.allArticlesButton} onClick={() => onSelect(null)} disabled={activeRequestId === null}>
        Все артикулы
      </Button>
      <Drawer
        title={previewRequest ? `Артикулы запроса: ${previewRequest.number}` : ""}
        open={previewVisible}
        onClose={() => setPreviewVisible(false)}
        width={500}
      >
        {previewLoading ? <Spin /> : (
          <List
            dataSource={previewArticles}
            renderItem={a => (
              <List.Item>
                <div>{a.code}</div>
              </List.Item>
            )}
            locale={{ emptyText: 'Нет артикулов' }}
          />
        )}
      </Drawer>
    </div>
  );
};

export default RequestSidebar; 