import React, { useEffect, useState, useRef } from 'react';
import { Button, Input, Card, List, Avatar, Typography, Divider, Select, Space, Slider, Modal, Spin, message as antdMessage, Form, Popconfirm } from 'antd';
import { PlusOutlined, SendOutlined, RobotOutlined, UserOutlined, DeleteOutlined, SettingOutlined, EditOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import {
  getChats, createChat, getChatHistory, sendMessage, deleteChat, updateChat, getAvailableModels, getBalance
} from './VseGptApi';

const { TextArea } = Input;
const { Title, Text } = Typography;

// Безопасная функция для получения строки из любого контента
function safeContent(content: any): string {
  if (typeof content === 'string') return content;
  if (React.isValidElement?.(content)) return '[react element]';
  if (Array.isArray(content)) return content.map(safeContent).join(' ');
  if (content && typeof content === 'object') {
    if (content.$$typeof) return '[react element]';
    return JSON.stringify(content);
  }
  if (content !== undefined && content !== null) return String(content);
  return '[invalid content]';
}

function isValidMessage(msg: any): msg is { id: string; role: string; content: string } {
  return (
    msg &&
    typeof msg === 'object' &&
    typeof msg.id !== 'undefined' &&
    (msg.role === 'user' || msg.role === 'assistant') &&
    typeof msg.content === 'string'
  );
}

// Удаляю SafeMarkdown и заменяю рендер на безопасный <pre>

// TODO: получить список моделей и параметров с API VseGPT (пока хардкод)
// Модели VseGPT по категориям (группам) из https://vsegpt.ru/Docs/Models
const vseGptModels = [
  {
    label: 'OpenAI',
    options: [
      { id: 'openai/gpt-4o', name: 'GPT-4o', type: 'text' },
      { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', type: 'text' },
      { id: 'openai/gpt-4', name: 'GPT-4', type: 'text' },
      { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo', type: 'text' },
      { id: 'openai/dall-e-3', name: 'DALL-E 3', type: 'image' },
    ]
  },
  {
    label: 'Anthropic',
    options: [
      { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', type: 'text' },
      { id: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet', type: 'text' },
      { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', type: 'text' },
      { id: 'anthropic/claude-2.1', name: 'Claude 2.1', type: 'text' },
    ]
  },
  {
    label: 'Google',
    options: [
      { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', type: 'text' },
      { id: 'google/gemini-1.5-flash', name: 'Gemini 1.5 Flash', type: 'text' },
      { id: 'google/gemini-1.5-pro', name: 'Gemini 1.5 Pro', type: 'text' },
      { id: 'google/gemini-pro', name: 'Gemini Pro', type: 'text' },
    ]
  },
  {
    label: 'Кодовые',
    options: [
      { id: 'deepseek/deepseek-coder', name: 'DeepSeek Coder', type: 'code' },
      { id: 'openai/gpt-4o-coder', name: 'GPT-4o Coder', type: 'code' },
      { id: 'openai/gpt-4-coder', name: 'GPT-4 Coder', type: 'code' },
      { id: 'openai/gpt-3.5-coder', name: 'GPT-3.5 Coder', type: 'code' },
    ]
  },
  {
    label: 'Изображения',
    options: [
      { id: 'openai/dall-e-3', name: 'DALL-E 3', type: 'image' },
      { id: 'stability/stable-diffusion-xl', name: 'Stable Diffusion XL', type: 'image' },
      { id: 'stability/stable-diffusion', name: 'Stable Diffusion', type: 'image' },
    ]
  },
  {
    label: 'Другие',
    options: [
      { id: 'mistral/mistral-large', name: 'Mistral Large', type: 'text' },
      { id: 'mistral/mistral-medium', name: 'Mistral Medium', type: 'text' },
      { id: 'mistral/mistral-small', name: 'Mistral Small', type: 'text' },
      { id: 'yandex/yandex-gpt', name: 'YandexGPT', type: 'text' },
      { id: 'phind/phind-codellama', name: 'Phind CodeLlama', type: 'code' },
    ]
  },
];

// Системные промты для разных типов моделей
const systemPrompts = {
  text: `Ты - полезный ассистент. Отвечай на вопросы пользователя четко, информативно и дружелюбно. Используй эмодзи где уместно для лучшего восприятия.`,
  
  code: `Ты - опытный программист и технический консультант. Помогай с написанием кода, отладкой, архитектурой и техническими вопросами. Всегда давай полные, рабочие примеры кода с комментариями. Используй современные best practices и следуй принципам clean code.`,
  
  image: `Ты - эксперт по созданию изображений. Когда пользователь просит создать изображение, генерируй его с помощью доступных инструментов. Описывай процесс создания и давай рекомендации по улучшению промптов для лучших результатов.`,
};

// Получить системный промт для модели
function getSystemPrompt(modelId: string): string {
  const model = vseGptModels.flatMap(group => group.options).find(m => m.id === modelId);
  const type = model?.type || 'text';
  return systemPrompts[type as keyof typeof systemPrompts] || systemPrompts.text;
}

// Получить тип модели
function getModelType(modelId: string): string {
  const model = vseGptModels.flatMap(group => group.options).find(m => m.id === modelId);
  return model?.type || 'text';
}

// Проверить, является ли модель изображением
function isImageModel(modelId: string): boolean {
  return getModelType(modelId) === 'image';
}

const defaultParams = {
  model: 'openai/gpt-4o',
  temperature: 0.7,
  top_p: 1,
  max_tokens: 2048,
  system: '',
};

// Функция для рендера контента сообщения (текст или изображение)
function renderMessageContent(content: string, token?: string) {
  console.log('renderMessageContent input:', content);
  
  // Ищем ПОЛНЫЙ URL (включая параметры)
  const imageUrlMatch = content.match(/https?:\/\/[^\s]+/i);
  
  console.log('imageUrlMatch:', imageUrlMatch);
  
  if (imageUrlMatch) {
    const originalImageUrl = imageUrlMatch[0];
    console.log('Found image URL:', originalImageUrl);
    
    // Используем прокси-endpoint для получения изображения
    const proxyImageUrl = `/api/chat/image-proxy?image_url=${encodeURIComponent(originalImageUrl)}`;
    console.log('Proxy image URL:', proxyImageUrl);
    
    // Убираем URL из текста и оставляем только описание
    const textContent = content.replace(originalImageUrl, '').replace(/🖼️ Изображение создано!\n\n?/g, '').trim();
    console.log('Text content after removing URL:', textContent);
    
    // Компонент для загрузки изображения с авторизацией
    const ImageWithAuth = () => {
      const [imageSrc, setImageSrc] = React.useState<string>('');
      const [loading, setLoading] = React.useState(true);
      const [error, setError] = React.useState(false);
      
      React.useEffect(() => {
        if (!token) {
          setError(true);
          setLoading(false);
          return;
        }
        
        // Загружаем изображение через fetch с авторизацией
        fetch(proxyImageUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          return response.blob();
        })
        .then(blob => {
          const url = URL.createObjectURL(blob);
          setImageSrc(url);
          setLoading(false);
        })
        .catch(error => {
          console.error('Ошибка загрузки изображения:', error);
          setError(true);
          setLoading(false);
        });
      }, [proxyImageUrl, token]);
      
      if (loading) {
        return (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin size="large" />
            <div style={{ marginTop: 8, color: '#666' }}>Загрузка изображения...</div>
          </div>
        );
      }
      
      if (error) {
        return (
          <div style={{ textAlign: 'center', padding: '20px', color: '#ff4d4f' }}>
            <div>Ошибка загрузки изображения</div>
            <div style={{ fontSize: '12px', marginTop: 4 }}>Проверьте авторизацию</div>
          </div>
        );
      }
      
      return (
        <img 
          src={imageSrc} 
          alt="Сгенерированное изображение" 
          style={{ 
            maxWidth: '100%', 
            maxHeight: '400px', 
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            border: '1px solid #e0e0e0'
          }} 
          onError={() => {
            console.error('Ошибка отображения изображения');
            setError(true);
          }}
        />
      );
    };
    
    return (
      <div style={{ width: '100%' }}>
        {textContent && (
          <div style={{ marginBottom: 8 }}>
            <pre style={{ margin: 0, fontFamily: 'inherit', whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'none', border: 'none', padding: 0 }}>{textContent}</pre>
          </div>
        )}
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <ImageWithAuth />
        </div>
      </div>
    );
  }
  
  console.log('No image URL found, treating as text');
  // Обычный текстовый контент
  return (
    <pre style={{ margin: 0, fontFamily: 'inherit', whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'none', border: 'none', padding: 0 }}>{content}</pre>
  );
}

const VseGptChat: React.FC<{ token: string }> = ({ token }) => {
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newChatModal, setNewChatModal] = useState(false);
  const [newChatParams, setNewChatParams] = useState<any>(defaultParams);
  const [balance, setBalance] = useState<any>(null);
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [form] = Form.useForm();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Получение чатов
  useEffect(() => {
    (async () => {
      try {
        const data = await getChats(token);
        setChats(Array.isArray(data) ? data : []);
      } catch (e) {
        antdMessage.error('Ошибка загрузки чатов');
      }
    })();
  }, [token]);

  // Получение баланса и доступных моделей
  useEffect(() => {
    (async () => {
      try {
        const [balanceData, modelsData] = await Promise.all([
          getBalance(token).catch(() => null),
          getAvailableModels(token).catch(() => [])
        ]);
        setBalance(balanceData);
        setAvailableModels(Array.isArray(modelsData) ? modelsData : []);
      } catch (e) {
        console.error('Ошибка загрузки баланса или моделей:', e);
      }
    })();
  }, [token]);

  // Получение истории выбранного чата
  useEffect(() => {
    if (!selectedChat) return;
    (async () => {
      try {
        const data = await getChatHistory(token, selectedChat.id || selectedChat.session_id);
        console.log('getChatHistory raw data:', data);
        setMessages(Array.isArray(data) ? data : []);
      } catch (e) {
        setMessages([]);
        antdMessage.error('Ошибка загрузки истории чата');
      }
    })();
  }, [selectedChat, token]);

  // Скролл к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedChat]);

  // Создание нового чата
  const handleCreateChat = async () => {
    try {
      const chat = await createChat(token, newChatParams);
      setChats(prev => [chat, ...prev]);
      setSelectedChat(chat);
      setNewChatModal(false);
      setNewChatParams(defaultParams);
      antdMessage.success('Чат создан');
    } catch (e) {
      antdMessage.error('Ошибка создания чата');
    }
  };

  // Отправка сообщения
  const handleSend = async () => {
    if (!input.trim() || !selectedChat) return;
    setLoading(true);
    const userMsg = { id: Date.now().toString(), role: 'user', content: safeContent(input) };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    
    try {
      const modelId = selectedChat.model || defaultParams.model;
      const isImage = isImageModel(modelId);
      
      let params: any;
      
      if (isImage) {
        // Специальный формат для изображений
        params = {
          model: modelId,
          messages: [
            { role: 'user', content: input }
          ],
          temperature: selectedChat.temperature || defaultParams.temperature,
          top_p: selectedChat.top_p || defaultParams.top_p,
          max_tokens: selectedChat.max_tokens || defaultParams.max_tokens,
          system: selectedChat.system || getSystemPrompt(modelId),
          session_id: selectedChat.id || selectedChat.session_id,
        };
      } else {
        // Обычный формат для текстовых моделей
        params = {
          model: modelId,
          messages: [
            ...messages.filter((m: any) => m.role === 'user' || m.role === 'assistant'),
            { role: 'user', content: input }
          ],
          temperature: selectedChat.temperature || defaultParams.temperature,
          top_p: selectedChat.top_p || defaultParams.top_p,
          max_tokens: selectedChat.max_tokens || defaultParams.max_tokens,
          system: selectedChat.system || getSystemPrompt(modelId),
          session_id: selectedChat.id || selectedChat.session_id,
        };
      }
      
      const data = await sendMessage(token, params);
      console.log('sendMessage response:', data);
      
      let content = '[invalid content]';
      if (isImage) {
        // Для изображений ищем URL в ответе
        if (data.choices?.[0]?.message?.content) {
          content = data.choices[0].message.content;
          // Если в ответе есть URL изображения, добавляем его
          if (typeof content === 'string' && content.includes('http')) {
            content = `🖼️ Изображение создано!\n\n${content}`;
          }
        }
      } else {
        // Для текстовых моделей обычная обработка
        if (typeof data.choices?.[0]?.message?.content === 'string') {
          content = data.choices[0].message.content;
        }
      }
      
      const botMsg = { id: (Date.now() + 1).toString(), role: 'assistant', content: safeContent(content) };
      setMessages(prev => [...prev, botMsg]);
    } catch (e: any) {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: safeContent(e.message || 'Ошибка при получении ответа от бота.') }]);
      antdMessage.error(e.message || 'Ошибка при получении ответа от бота.');
    }
    setLoading(false);
  };

  // Удаление чата
  const handleDeleteChat = async (chat: any) => {
    try {
      await deleteChat(token, chat.id || chat.session_id);
      setChats(prev => prev.filter(c => (c.id || c.session_id) !== (chat.id || chat.session_id)));
      if (selectedChat && (selectedChat.id || selectedChat.session_id) === (chat.id || chat.session_id)) {
        setSelectedChat(null);
        setMessages([]);
      }
      antdMessage.success('Чат удалён');
    } catch (e) {
      antdMessage.error('Ошибка удаления чата');
    }
  };

  // Обновление параметров чата
  const handleUpdateChat = async (values: any) => {
    try {
      const updated = await updateChat(token, selectedChat.id || selectedChat.session_id, values);
      setChats(prev => prev.map(c => (c.id || c.session_id) === (updated.id || updated.session_id) ? updated : c));
      setSelectedChat(updated);
      setSettingsOpen(false);
      antdMessage.success('Параметры чата обновлены');
    } catch (e) {
      antdMessage.error('Ошибка обновления чата');
    }
  };

  // Только валидные сообщения для рендера
  const safeMessages = messages
    .filter((m: any) => {
      const valid = m && (typeof m.id === 'string' || typeof m.id === 'number') && (typeof m.content === 'string');
      if (!valid) {
        console.error('Invalid message skipped:', m);
      }
      return valid;
    })
    .map((m: any, idx: number) => {
      const safe = safeContent(m.content);
      if (typeof m.content !== 'string') {
        console.error('Non-string content in message:', m, 'typeof:', typeof m.content, 'safeContent:', safe);
      }
      return {
        ...m,
        content: safe
      };
    });

  // Логируем все сообщения для отладки
  useEffect(() => {
    console.log('All messages:', messages);
    safeMessages.forEach((msg, idx) => {
      console.log(`safeMessages[${idx}]:`, msg, 'typeof content:', typeof msg.content);
    });
    if (messages.some((m: any) => typeof m.content !== 'string')) {
      console.error('Messages with non-string content:', messages);
    }
  }, [messages, safeMessages]);

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#e9ecf1' }}>
      {/* Сайдбар */}
      <div style={{ width: 340, background: '#f7f8fa', color: '#23272f', display: 'flex', flexDirection: 'column', height: '100vh', borderRight: '1px solid #e0e0e0', position: 'relative', zIndex: 2, boxShadow: '2px 0 8px #e0e0e033' }}>
        <div style={{ padding: '24px 24px 0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Title level={4} style={{ color: '#23272f', margin: 0, letterSpacing: 1 }}>Чаты</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setNewChatModal(true)} style={{ background: '#FCB813', color: '#222', border: 'none', borderRadius: 8, fontWeight: 600 }} />
        </div>
        <Divider style={{ background: '#e0e0e0', margin: '12px 0' }} />
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 0 16px' }}>
          <List
            itemLayout="horizontal"
            dataSource={chats}
            renderItem={chat => (
              <Card
                key={chat.id || chat.session_id}
                style={{ marginBottom: 14, background: selectedChat && (selectedChat.id || selectedChat.session_id) === (chat.id || chat.session_id) ? '#fffbe6' : '#f7f8fa', color: '#23272f', border: selectedChat && (selectedChat.id || selectedChat.session_id) === (chat.id || chat.session_id) ? '2px solid #FCB813' : '1px solid #e0e0e0', cursor: 'pointer', borderRadius: 10, boxShadow: selectedChat && (selectedChat.id || selectedChat.session_id) === (chat.id || chat.session_id) ? '0 2px 12px #FCB81333' : 'none', transition: 'all 0.2s' }}
                onClick={() => setSelectedChat(chat)}
                bodyStyle={{ padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}
                actions={[
                  <Popconfirm title="Удалить чат?" onConfirm={e => { e?.stopPropagation(); handleDeleteChat(chat); }} onCancel={e => e?.stopPropagation()} okText="Да" cancelText="Нет">
                    <DeleteOutlined style={{ color: '#d4380d' }} onClick={e => e.stopPropagation()} />
                  </Popconfirm>,
                  <SettingOutlined style={{ color: '#1890ff' }} onClick={e => { e.stopPropagation(); setSelectedChat(chat); setSettingsOpen(true); }} />
                ]}
              >
                <Avatar size={40} style={{ background: '#FCB813', color: '#222', fontWeight: 700 }}>
                  {typeof chat.avatar === 'string' || typeof chat.avatar === 'number' ? chat.avatar : ''}
                </Avatar>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#23272f', fontSize: 16 }}>{safeContent(chat.title || chat.name || 'Без названия')}</div>
                  <div style={{ color: '#888', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{safeContent(chat.model)}</div>
                </div>
              </Card>
            )}
          />
        </div>
      </div>
      {/* Основная часть — чат */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', height: '100vh', background: '#fff' }}>
        {/* Заголовок чата и настройки */}
        <div style={{ padding: '32px 32px 0 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Title level={4} style={{ color: '#23272f', marginBottom: 24, flex: 1 }}>{safeContent(selectedChat?.title || selectedChat?.name || 'Без названия')}</Title>
          {balance && (
            <div style={{ fontSize: 12, color: '#666', textAlign: 'right' }}>
              <div>Баланс VseGPT:</div>
              <div style={{ fontWeight: 600, color: '#1890ff' }}>
                {balance.credits || balance.balance || 'N/A'}
              </div>
            </div>
          )}
          <Button icon={<SettingOutlined />} onClick={() => setSettingsOpen(true)} />
        </div>
        {/* Сообщения и поле ввода */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 32px 0 32px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {safeMessages.map((msg: any, idx: number) => {
            const safe = safeContent(msg.content);
            console.log(`render msg[${idx}]`, msg, 'typeof content:', typeof msg.content, 'safe:', safe);
            return (
              <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <Card style={{ maxWidth: '60%', background: msg.role === 'user' ? '#FCB813' : '#e6e8ea', color: '#23272f', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', marginBottom: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', fontSize: 17, fontWeight: 500 }} bodyStyle={{ padding: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                    {msg.role === 'user' ? <Avatar icon={<UserOutlined />} style={{ background: '#FCB813', color: '#23272f' }} /> : <Avatar icon={<RobotOutlined />} style={{ background: '#e6e8ea', color: '#23272f' }} />}
                    <div style={{ width: '100%' }}>
                      {renderMessageContent(safe, token)}
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0 0 8px', color: '#888', fontSize: 17 }}>
              <Spin size="small" />
              <span>Бот думает...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
          {/* Окно ввода закреплено внизу области сообщений */}
          <div style={{ background: '#fff', borderTop: '1px solid #eee', padding: '16px 0 0 0', display: 'flex', alignItems: 'center', gap: 16, marginTop: 'auto' }}>
            <TextArea
              value={input}
              onChange={e => setInput(e.target.value)}
              onPressEnter={e => { if (!e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Введите сообщение..."
              autoSize={{ minRows: 1, maxRows: 4 }}
              style={{ flex: 1, borderRadius: 8, fontSize: 16, background: '#f8f9fa', color: '#23272f', border: '1px solid #FCB813', boxShadow: '0 2px 8px #FCB81311' }}
              disabled={loading || !selectedChat}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              style={{ height: 48, width: 56, fontSize: 22, background: '#FCB813', color: '#222', border: 'none', borderRadius: 8, boxShadow: '0 2px 8px #FCB81322' }}
              disabled={loading || !input.trim() || !selectedChat}
            />
          </div>
        </div>
      </div>
      {/* Модальное окно создания чата */}
      <Modal
        open={newChatModal}
        title="Создать новый чат"
        onCancel={() => setNewChatModal(false)}
        onOk={handleCreateChat}
        okText="Создать"
        cancelText="Отмена"
      >
        <Form layout="vertical" form={form} initialValues={newChatParams} onValuesChange={(_, all) => setNewChatParams(all)}>
          <Form.Item label="Название чата" name="title">
            <Input placeholder="Без названия" />
          </Form.Item>
          <Form.Item label="Модель" name="model" rules={[{ required: true, message: 'Выберите модель' }]}> 
            <Select
              options={vseGptModels.map(group => ({
                label: group.label,
                options: group.options.map(m => ({ label: m.name, value: m.id }))
              }))}
              showSearch
              optionFilterProp="label"
              onChange={(value) => {
                const systemPrompt = getSystemPrompt(value);
                form.setFieldsValue({ system: systemPrompt });
                setNewChatParams((prev: any) => ({ ...prev, model: value, system: systemPrompt }));
              }}
            />
          </Form.Item>
          <Form.Item label="System prompt" name="system">
            <Input.TextArea 
              placeholder="Инструкции для бота (автоматически подбирается по типу модели)" 
              rows={4}
            />
          </Form.Item>
          <Form.Item label="Температура" name="temperature">
            <Slider min={0} max={2} step={0.01} tooltip={{ open: true }} />
          </Form.Item>
          <Form.Item label="Top_p" name="top_p">
            <Slider min={0} max={1} step={0.01} tooltip={{ open: true }} />
          </Form.Item>
          <Form.Item label="Max tokens" name="max_tokens">
            <Input type="number" min={1} max={4096} />
          </Form.Item>
        </Form>
      </Modal>
      {/* Модальное окно настроек чата */}
      <Modal
        open={settingsOpen}
        title="Настройки чата"
        onCancel={() => setSettingsOpen(false)}
        onOk={() => form.submit()}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Form layout="vertical" form={form} initialValues={selectedChat || {}} onFinish={handleUpdateChat}>
          <Form.Item label="Название чата" name="title">
            <Input placeholder="Без названия" />
          </Form.Item>
          <Form.Item label="Модель" name="model" rules={[{ required: true, message: 'Выберите модель' }]}> 
            <Select
              options={vseGptModels.map(group => ({
                label: group.label,
                options: group.options.map(m => ({ label: m.name, value: m.id }))
              }))}
              showSearch
              optionFilterProp="label"
              onChange={(value) => {
                const systemPrompt = getSystemPrompt(value);
                form.setFieldsValue({ system: systemPrompt });
              }}
            />
          </Form.Item>
          <Form.Item label="System prompt" name="system">
            <Input.TextArea 
              placeholder="Инструкции для бота (автоматически подбирается по типу модели)" 
              rows={4}
            />
          </Form.Item>
          <Form.Item label="Температура" name="temperature">
            <Slider min={0} max={2} step={0.01} tooltip={{ open: true }} />
          </Form.Item>
          <Form.Item label="Top_p" name="top_p">
            <Slider min={0} max={1} step={0.01} tooltip={{ open: true }} />
          </Form.Item>
          <Form.Item label="Max tokens" name="max_tokens">
            <Input type="number" min={1} max={4096} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default VseGptChat; 