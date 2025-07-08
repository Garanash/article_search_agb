import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, Card, List, Avatar, Typography, Divider, Select, Space, Slider, message as antdMessage, Spin } from 'antd';
import { PlusOutlined, SendOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';
import { getChatSessions, createChatSession, getChatHistory } from '../api/chatApi';
import ReactMarkdown from 'react-markdown';

const { TextArea } = Input;
const { Title, Text } = Typography;

// Безопасный компонент для рендера markdown
function SafeMarkdown({ children }: { children: string }) {
  try {
    return <ReactMarkdown>{children}</ReactMarkdown>;
  } catch (e) {
    console.error('Markdown render error:', e, children);
    return <span>[invalid markdown]</span>;
  }
}

// Безопасная функция для получения строки из любого контента
function safeContent(content: any): string {
  if (typeof content === 'string') return content;
  if (React.isValidElement(content)) return '[react element]';
  if (Array.isArray(content)) return content.map(safeContent).join(' ');
  if (content && typeof content === 'object') {
    if (content.$$typeof) return '[react element]';
    return JSON.stringify(content);
  }
  if (content !== undefined && content !== null) return String(content);
  return '[invalid content]';
}

// Типы моделей и пресеты
const vseGptModels = [
  { id: 'openai/gpt-4o', name: 'OpenAI: GPT-4o', type: 'text' },
  { id: 'openai/gpt-4-0125-preview', name: 'OpenAI: GPT-4 Turbo (0125-preview)', type: 'text' },
  { id: 'openai/gpt-3.5-turbo', name: 'OpenAI: GPT-3.5 Turbo', type: 'text' },
  { id: 'openai/dall-e-3', name: 'OpenAI: DALL-E 3', type: 'image', preset: 'Рисование' },
  { id: 'anthropic/claude-3-opus', name: 'Anthropic: Claude 3 Opus', type: 'text' },
  { id: 'google/gemini-2.5-pro', name: 'Google: Gemini 2.5 Pro', type: 'text' },
  // ... можно добавить остальные модели ...
];
const typeLabels: Record<string, string> = {
  text: 'Текст',
  image: 'Изображения',
};
const presetMap: Record<string, string[]> = {
  'openai/dall-e-3': ['Рисование'],
};

function isValidMessage(msg: any): msg is { id: string; role: string; content: string } {
  return (
    msg &&
    typeof msg === 'object' &&
    typeof msg.id !== 'undefined' &&
    (msg.role === 'user' || msg.role === 'assistant') &&
    typeof msg.content === 'string'
  );
}

const ChatBot: React.FC = () => {
  // Все хуки строго в начале
  const [dialogs, setDialogs] = useState<any[]>([]);
  const [selectedDialog, setSelectedDialog] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [selectedType, setSelectedType] = useState('text');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('');
  const [creativity, setCreativity] = useState(0.5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<any>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));

  // Загрузка диалогов
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const data = await getChatSessions(token);
        setDialogs(Array.isArray(data) ? data : []);
        setError(null);
      } catch (e) {
        setError('Ошибка загрузки диалогов');
        antdMessage.error('Ошибка загрузки диалогов');
        console.error('Ошибка загрузки диалогов:', e);
      }
    })();
  }, [token]);

  // Загрузка истории сообщений
  useEffect(() => {
    if (!token || !selectedDialog) return;
    (async () => {
      try {
        const data = await getChatHistory(token, selectedDialog.id);
        setMessages(
          Array.isArray(data)
            ? data.filter(isValidMessage).map(m => ({ ...m, content: typeof m.content === 'string' ? m.content : '[invalid content]' }))
            : []
        );
        setError(null);
      } catch (e) {
        setMessages([]);
        setError('Ошибка загрузки истории чата');
        antdMessage.error('Ошибка загрузки истории чата');
        console.error('Ошибка загрузки истории чата:', e);
      }
    })();
  }, [selectedDialog, token]);

  // Скролл к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedDialog]);

  // Смена типа модели
  useEffect(() => {
    const modelsOfType = vseGptModels.filter(m => m.type === selectedType);
    setSelectedModel(modelsOfType[0]?.id || '');
  }, [selectedType]);

  // Смена модели — сброс пресета
  useEffect(() => {
    const presets = presetMap[selectedModel];
    if (presets && presets.length > 0) {
      setSelectedPreset(presets[0]);
    } else {
      setSelectedPreset('');
    }
  }, [selectedModel]);

  // Создание нового диалога
  const handleNewDialog = async () => {
    if (!token) return;
    try {
      const newDialog = await createChatSession(token, selectedModel);
      setDialogs([newDialog, ...dialogs]);
      setSelectedDialog(newDialog);
      setMessages([]);
      setTimeout(() => inputRef.current?.focus(), 100);
      setError(null);
    } catch (e) {
      setError('Ошибка создания диалога');
      antdMessage.error('Ошибка создания диалога');
      console.error('Ошибка создания диалога:', e);
    }
  };

  // Отправка сообщения
  const handleSend = async () => {
    if (!input.trim() || !selectedDialog || loading) return;
    setLoading(true);
    const userMsg = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 100);
    try {
      const apiMessages = [
        ...messages.filter(isValidMessage),
        { role: 'user', content: input }
      ].map(m => ({ role: m.role, content: typeof m.content === 'string' ? m.content : '[invalid content]' }));
      const response = await fetch('/api/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          model: selectedModel,
          messages: apiMessages,
          temperature: creativity,
          max_tokens: 3000
        })
      });
      const data = await response.json();
      let content = '[invalid content]';
      if (typeof data.choices?.[0]?.message?.content === 'string') {
        content = data.choices[0].message.content;
      }
      const botMsg = { id: (Date.now() + 1).toString(), role: 'assistant', content };
      setMessages(prev => [...prev, botMsg]);
      setDialogs(ds => ds.map(d => d.id === selectedDialog.id ? { ...d, lastMessage: content } : d));
      setError(null);
    } catch (e: any) {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: e.message || 'Ошибка при получении ответа от бота.' }]);
      setError(e.message || 'Ошибка при получении ответа от бота.');
      antdMessage.error(e.message || 'Ошибка при получении ответа от бота.');
      console.error('Ошибка при отправке сообщения:', e);
    }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Если нет токена — просим авторизоваться
  if (!token) {
    return <div style={{ padding: 40, textAlign: 'center', fontSize: 20 }}>Войдите в систему для использования чата</div>;
  }

  // Если нет диалога — предлагаем создать
  if (!selectedDialog) {
    return <div style={{ padding: 40, textAlign: 'center' }}>
      <Button type="primary" onClick={handleNewDialog}>Создать диалог</Button>
      {error && <div style={{ color: 'red', marginTop: 16 }}>{error}</div>}
    </div>;
  }

  // Опции для селектов
  const typeOptions = Array.from(new Set(vseGptModels.map(m => m.type))).map(type => ({ label: typeLabels[type] || type, value: type }));
  const modelOptions = vseGptModels.filter(m => m.type === selectedType).map(m => ({ label: m.name, value: m.id }));
  const presetOptions = (presetMap[selectedModel] || []).map(preset => ({ label: preset, value: preset }));

  // Только валидные сообщения для рендера
  const safeMessages = messages.map(m => isValidMessage(m) ? m : { id: m?.id || Math.random().toString(), role: m?.role || 'assistant', content: '[invalid content]' });

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#e9ecf1' }}>
      {/* Сайдбар */}
      <div style={{ width: 340, background: '#f7f8fa', color: '#23272f', display: 'flex', flexDirection: 'column', height: '100vh', borderRight: '1px solid #e0e0e0', position: 'relative', zIndex: 2, boxShadow: '2px 0 8px #e0e0e033' }}>
        <div style={{ padding: '24px 24px 0 24px' }}>
          <Title level={4} style={{ color: '#23272f', margin: 0, letterSpacing: 1 }}>Меню</Title>
        </div>
        {/* Настройки */}
        <div style={{ padding: '0 24px', marginTop: 16 }}>
          <Card style={{ borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 8px #e0e0e033' }} bodyStyle={{ padding: 16 }}>
            <Title level={5} style={{ margin: 0, color: '#23272f' }}>Настройки</Title>
            <div style={{ marginTop: 12 }}>
              <Text style={{ color: '#555', fontSize: 14 }}>Тип модели:</Text>
              <Select style={{ width: '100%', marginTop: 8 }} value={selectedType} options={typeOptions} onChange={setSelectedType} />
              <Text style={{ color: '#555', fontSize: 14, marginTop: 12, display: 'block' }}>Модель:</Text>
              <Select style={{ width: '100%', marginTop: 8 }} value={selectedModel} options={modelOptions} onChange={setSelectedModel} showSearch optionFilterProp="label" />
            </div>
            {presetOptions.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Text style={{ color: '#555', fontSize: 14 }}>Пресет:</Text>
                <Select style={{ width: '100%', marginTop: 8 }} value={selectedPreset} options={presetOptions} onChange={setSelectedPreset} />
              </div>
            )}
            <div style={{ marginTop: 16 }}>
              <Text style={{ color: '#555', fontSize: 14 }}>Креативность:</Text>
              <Slider min={0} max={1} step={0.1} value={creativity} onChange={setCreativity} marks={{ 0: '0', 1: '1' }} tooltip={{ open: true }} />
            </div>
          </Card>
        </div>
        <Divider style={{ background: '#e0e0e0', margin: '0 0 12px 0' }} />
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 0 16px' }}>
          <Button type="primary" icon={<PlusOutlined />} block style={{ marginBottom: 18, background: '#FCB813', color: '#222', fontWeight: 600, border: 'none', borderRadius: 8, boxShadow: '0 2px 8px #FCB81322' }} onClick={handleNewDialog}>
            Новый диалог
          </Button>
          <List itemLayout="horizontal" dataSource={dialogs} renderItem={dialog => (
            <Card key={dialog.id} style={{ marginBottom: 14, background: selectedDialog?.id === dialog.id ? '#fffbe6' : '#f7f8fa', color: '#23272f', border: selectedDialog?.id === dialog.id ? '2px solid #FCB813' : '1px solid #e0e0e0', cursor: 'pointer', borderRadius: 10, boxShadow: selectedDialog?.id === dialog.id ? '0 2px 12px #FCB81333' : 'none', transition: 'all 0.2s' }} onClick={() => setSelectedDialog(dialog)} bodyStyle={{ padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar size={40} style={{ background: '#FCB813', color: '#222', fontWeight: 700 }}>
                {typeof dialog.avatar === 'string' || typeof dialog.avatar === 'number' ? dialog.avatar : ''}
              </Avatar>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: '#23272f', fontSize: 16 }}>{safeContent(dialog.title)}</div>
                <div style={{ color: '#888', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{safeContent(dialog.lastMessage)}</div>
              </div>
            </Card>
          )} />
        </div>
      </div>
      {/* Основная часть — чат */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', height: '100vh', background: '#fff' }}>
        {/* Заголовок чата */}
        <div style={{ padding: '32px 32px 0 32px' }}>
          <Title level={4} style={{ color: '#23272f', marginBottom: 24 }}>{safeContent(selectedDialog?.title)}</Title>
        </div>
        {/* Сообщения и поле ввода в одной колонке */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 32px 0 32px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {safeMessages.map(msg => (
            <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <Card style={{ maxWidth: '60%', background: msg.role === 'user' ? '#FCB813' : '#e6e8ea', color: '#23272f', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', marginBottom: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', fontSize: 17, fontWeight: 500 }} bodyStyle={{ padding: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Space align="center" size={12}>
                  {msg.role === 'user' ? <Avatar icon={<UserOutlined />} style={{ background: '#FCB813', color: '#23272f' }} /> : <Avatar icon={<RobotOutlined />} style={{ background: '#e6e8ea', color: '#23272f' }} />}
                  <SafeMarkdown>{safeContent(msg.content)}</SafeMarkdown>
                </Space>
              </Card>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0 0 8px', color: '#888', fontSize: 17 }}>
              <Spin size="small" />
              <span>FELIX думает...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
          {/* Окно ввода закреплено внизу области сообщений */}
          <div style={{ background: '#fff', borderTop: '1px solid #eee', padding: '16px 0 0 0', display: 'flex', alignItems: 'center', gap: 16, marginTop: 'auto' }}>
            <TextArea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onPressEnter={e => { if (!e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Введите сообщение..."
              autoSize={{ minRows: 1, maxRows: 4 }}
              style={{ flex: 1, borderRadius: 8, fontSize: 16, background: '#f8f9fa', color: '#23272f', border: '1px solid #FCB813', boxShadow: '0 2px 8px #FCB81311' }}
              disabled={loading || !selectedDialog}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              style={{ height: 48, width: 56, fontSize: 22, background: '#FCB813', color: '#222', border: 'none', borderRadius: 8, boxShadow: '0 2px 8px #FCB81322' }}
              disabled={loading || !input.trim() || !selectedDialog}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBot; 