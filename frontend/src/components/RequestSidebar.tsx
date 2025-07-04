import Papa from "papaparse";
import React, { useEffect, useState, useRef } from "react";
import { getRequests, createRequest, deleteRequest, getArticlesByRequest } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { Button, List, Input, Drawer, message, Spin } from "antd";

interface Request {
  id: number;
  number: string;
  created_at: string;
}

interface RequestSidebarProps {
  activeRequestId: number | null;
  onSelect: (requestId: number | null) => void;
}

const RequestSidebar: React.FC<RequestSidebarProps> = ({ activeRequestId, onSelect }) => {
  const { token } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [newNumber, setNewNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewArticles, setPreviewArticles] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewRequest, setPreviewRequest] = useState<Request | null>(null);
  const [articleCounts, setArticleCounts] = useState<{ [id: number]: number }>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchRequests = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getRequests(token);
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      message.error("Ошибка загрузки запросов");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line
  }, [token]);

  useEffect(() => {
    const fetchCounts = async () => {
      if (!token || !requests.length) return;
      const counts: { [id: number]: number } = {};
      await Promise.all(requests.map(async (req) => {
        try {
          const arts = await getArticlesByRequest(token, req.id);
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
      const arts = await getArticlesByRequest(token, req.id);
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
      const req = await createRequest(token, newNumber);
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
      await deleteRequest(token, id);
      setRequests(prev => prev.filter(req => req.id !== id));
      if (activeRequestId === id) onSelect(null);
    } catch {
      message.error("Ошибка удаления запроса");
    }
  };

  return (
    <div style={{ width: 280, marginRight: 16 }}>
      <div style={{ marginBottom: 12, fontWeight: 600, fontSize: 18 }}>Запросы</div>
      <Input
        placeholder="Номер нового запроса (например, ВЭД-20240704-12345)"
        value={newNumber}
        onChange={e => setNewNumber(e.target.value)}
        onPressEnter={handleCreate}
        style={{ marginBottom: 8 }}
      />
      <Button block type="primary" onClick={handleCreate} style={{ marginBottom: 16 }}>
        Создать запрос
      </Button>
      <List
        dataSource={requests}
        loading={loading}
        renderItem={req => (
          <List.Item
            style={{
              background: req.id === activeRequestId ? '#e6f7ff' : undefined,
              borderRadius: 6,
              cursor: 'pointer',
              marginBottom: 4,
              padding: 8,
              border: req.id === activeRequestId ? '1.5px solid #1890ff' : '1px solid #f0f0f0',
              fontWeight: req.id === activeRequestId ? 600 : 400,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}
            onClick={() => onSelect(req.id)}
            actions={[
              <Button size="small" onClick={e => { e.stopPropagation(); handlePreview(req); }}>👁️</Button>,
              <Button size="small" danger onClick={e => { e.stopPropagation(); handleDelete(req.id); }}>Удалить</Button>
            ]}
          >
            <div>
              <div style={{ fontSize: 15 }}>{req.number}</div>
              <div style={{ fontSize: 12, color: '#888' }}>Артикулов: {articleCounts[req.id] || 0}</div>
            </div>
          </List.Item>
        )}
        locale={{ emptyText: 'Нет запросов' }}
      />
      <Button block style={{ marginTop: 12 }} onClick={() => onSelect(null)} disabled={activeRequestId === null}>
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