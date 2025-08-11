import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Tabs, Table, Button, Upload, message, Statistic, Spin, Space, Typography, Avatar, Tag, Select, Modal, Badge, Tooltip, DatePicker, Input, Form, Progress, Calendar, ConfigProvider, Divider } from 'antd';
import { UploadOutlined, DownloadOutlined, DatabaseOutlined, CalendarOutlined, TeamOutlined, FileTextOutlined, CustomerServiceOutlined, UserOutlined, CheckCircleOutlined, ClockCircleOutlined, MessageOutlined, ExclamationCircleOutlined, EditOutlined, PlusOutlined, CloseCircleOutlined, BarChartOutlined, DeleteOutlined, FileExcelOutlined, PhoneOutlined, CopyOutlined } from '@ant-design/icons';
import { getAdminMetrics, exportTableCsv, importTableCsv } from '../api/adminApi';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import ru_RU from 'antd/lib/locale/ru_RU';
import 'dayjs/locale/ru';
dayjs.locale('ru');
// @ts-ignore
import ReactECharts from 'echarts-for-react';
import { apiClient } from '../api/api';

dayjs.extend(isBetween);

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

const TABLES = [
  { key: 'users', label: 'Пользователи' },
  { key: 'articles', label: 'Артикулы' },
  { key: 'suppliers', label: 'Поставщики' },
  { key: 'requests', label: 'Запросы' },
  { key: 'analytics', label: 'Аналитика' },
  { key: 'bots', label: 'Боты' },
  { key: 'support_messages', label: 'Сообщения поддержки' },
  { key: 'tickets', label: 'Тикеты' },
  { key: 'events', label: 'События' },
  { key: 'documents', label: 'Документы' },
  { key: 'email_templates', label: 'Email шаблоны' },
];

interface SupportTicket {
  id: number;
  user_id: number;
  title: string;
  description: string;
  department?: string;
  status: string;
  priority: string;
  assigned_to?: number;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  closed_at?: string;
  first_response_at?: string;
  estimated_resolution?: string;
  user_username: string;
  assigned_admin_username?: string;
}

interface SupportEvent {
  id: number;
  ticket_id?: number | null;
  event_type: string;
  title: string;
  description?: string;
  event_date: string;
  is_completed: boolean;
  created_at: string;
  start_date?: string;
  end_date?: string;
  for_user?: number;
}

interface SupportAnalytics {
  total_tickets: number;
  open_tickets: number;
  closed_tickets: number;
  in_progress_tickets: number;
  resolved_tickets: number;
  average_response_time_hours?: number;
  average_resolution_time_hours?: number;
  tickets_by_department: Record<string, number>;
  tickets_by_priority: Record<string, number>;
  tickets_by_status: Record<string, number>;
}

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
  patronymic?: string;
  department?: string;
  position?: string;
  phone?: string;
}

// Универсальная функция очистки данных для Table
function cleanTableValue(val: any): string {
  if (val == null) return '';
  if (typeof val === 'string' || typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    if (val.$$typeof) return '[Элемент]';
    if (Array.isArray(val)) {
      // Приводим каждый элемент к строке, затем объединяем в одну строку
      return val.map(v => cleanTableValue(v)).join(', ');
    }
    // Рекурсивно очищаем все поля объекта
    const cleanedObj: any = {};
    for (const k in val) {
      cleanedObj[k] = cleanTableValue(val[k]);
    }
    return JSON.stringify(cleanedObj);
  }
  return String(val);
}
function cleanTableData(data: any[]): any[] {
  return data.map(row => {
    const cleaned: any = {};
    for (const key in row) {
      cleaned[key] = cleanTableValue(row[key]);
    }
    return cleaned;
  });
}

const AdminDashboard: React.FC = () => {
  const { isAdmin, user, token } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTable, setActiveTable] = useState('users');
  const [csvLoading, setCsvLoading] = useState(false);

  // Состояния для поддержки
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [events, setEvents] = useState<SupportEvent[]>([]);
  const [analytics, setAnalytics] = useState<SupportAnalytics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketModalVisible, setTicketModalVisible] = useState(false);
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SupportEvent | null>(null);
  const [form] = Form.useForm();
  const [eventForm] = Form.useForm();
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [calendarDate, setCalendarDate] = useState<dayjs.Dayjs | null>(null);
  const [calendarForm] = Form.useForm();
  const [tableData, setTableData] = useState<any[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addRowData, setAddRowData] = useState<any>({});
  const [importFormat, setImportFormat] = useState<'csv' | 'xlsx' | 'json'>('csv');
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx' | 'json'>('csv');
  const [selectedCalendarEvent, setSelectedCalendarEvent] = useState<SupportEvent | null>(null);
  const [calendarEventModalVisible, setCalendarEventModalVisible] = useState(false);

  // --- Новый блок: управление пользователями, ролями и департаментами ---
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [departmentModalVisible, setDepartmentModalVisible] = useState(false);
  const [userForm] = Form.useForm();
  const [roleForm] = Form.useForm();
  const [departmentForm] = Form.useForm();
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const [availableDepartments, setAvailableDepartments] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [userEditData, setUserEditData] = useState<any | null>(null);
  const [roleEditData, setRoleEditData] = useState<any | null>(null);
  const [departmentEditData, setDepartmentEditData] = useState<any | null>(null);
  const [userPasswords, setUserPasswords] = useState<{[key: number]: string}>({});

  // --- Новости ---
  const [news, setNews] = useState<any[]>([]);
  const [newsModalVisible, setNewsModalVisible] = useState(false);
  const [newsForm] = Form.useForm();
  const [newsImage, setNewsImage] = useState<string | undefined>(undefined);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsEditData, setNewsEditData] = useState<any | null>(null);

  const fetchNews = async () => {
    setNewsLoading(true);
    try {
      const res = await apiClient.get('/api/users/news');
      const data = res.data;
      setNews(data);
    } catch (e) {
      message.error('Ошибка загрузки новостей');
    } finally {
      setNewsLoading(false);
    }
  };

  const fetchAvailableData = async () => {
    try {
      const res = await apiClient.get('/api/users/available-data');
      const data = res.data;
      setAvailableRoles(data.roles);
      setAvailableDepartments(data.departments);
    } catch (e) {
      message.error('Ошибка загрузки доступных данных');
    }
  };

  const fetchRolesAndDepartments = async () => {
    try {
      const res = await apiClient.get('/api/users/roles-and-departments');
      const data = res.data;
      setRoles(data.roles);
      setDepartments(data.departments);
    } catch (e) {
      message.error('Ошибка загрузки ролей и департаментов');
    }
  };

  useEffect(() => { 
    fetchNews(); 
    fetchAvailableData();
    fetchRolesAndDepartments();
  }, []);

  const handleNewsImage = async (info: any) => {
    if (info.file.status === 'done' || info.file.originFileObj) {
      const file = info.file.originFileObj || info.file;
      
      // Проверяем размер файла (максимум 10MB)
      if (file.size > 10 * 1024 * 1024) {
        message.error('Файл слишком большой. Максимальный размер: 10MB');
        return;
      }
      
      // Проверяем тип файла
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        message.error('Недопустимый формат файла. Разрешены: JPEG, PNG, GIF, WebP, BMP, TIFF, SVG');
        return;
      }
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const res = await apiClient.post('/api/users/news/upload-image', formData);
        
        if (res.status >= 200 && res.status < 300) {
          setNewsImage(res.data.image_url);
          message.success('Изображение загружено');
        } else {
          message.error(res.data?.error || 'Ошибка загрузки изображения');
        }
      } catch (e) {
        console.error('Ошибка загрузки изображения:', e);
        message.error('Ошибка загрузки изображения');
      }
    }
  };

  const handleNewsEdit = (newsItem: any) => {
    setNewsEditData(newsItem);
    newsForm.setFieldsValue({
      title: newsItem.title,
      text: newsItem.text
    });
    setNewsImage(newsItem.image_url);
    setNewsModalVisible(true);
  };

  const handleNewsAdd = async () => {
    try {
      const values = await newsForm.validateFields();
      const newsData = {
        title: values.title,
        text: values.text,
        image_url: newsImage || null
      };
      
      if (newsEditData) {
        // Обновление
        const res = await apiClient.put(`/api/users/news/${newsEditData.id}`, newsData);
        
        if (res.status >= 200 && res.status < 300) {
          message.success('Новость обновлена!');
          setNewsModalVisible(false);
          newsForm.resetFields();
          setNewsImage(undefined);
          setNewsEditData(null);
          fetchNews();
        } else {
          const errorData = res.data;
          message.error(errorData.detail || 'Ошибка обновления новости');
        }
      } else {
        // Добавление
        const res = await apiClient.post('/api/users/news', newsData);
        
        if (res.status >= 200 && res.status < 300) {
          message.success('Новость добавлена!');
          setNewsModalVisible(false);
          newsForm.resetFields();
          setNewsImage(undefined);
          setNewsEditData(null);
          fetchNews();
        } else {
          const errorData = res.data;
          message.error(errorData.detail || 'Ошибка добавления новости');
        }
      }
    } catch (e) {
      console.error('Ошибка сохранения новости:', e);
      message.error('Ошибка сохранения новости');
    }
  };

  const handleNewsDelete = async (newsId: number) => {
    try {
      await apiClient.delete(`/api/users/news/${newsId}`);
      message.success('Новость удалена');
      fetchNews();
    } catch (e) {
      message.error('Ошибка удаления новости');
    }
  };

  const canCreateForOthers = [
    'admin',
    'директор',
    'ceo',
    'ceo'
  ].includes((user?.role || '').toLowerCase());

  useEffect(() => {
    if (!isAdmin) {
      message.error('Доступ только для администраторов');
      setLoading(false);
      return;
    }

    getAdminMetrics()
      .then(setMetrics)
      .catch((error) => {
        console.error('Error loading admin metrics:', error);
        if (error.response?.status === 401) {
          message.error('Ошибка авторизации. Пожалуйста, войдите в систему.');
        } else if (error.response?.status === 403) {
          message.error('Доступ запрещен. Требуются права администратора.');
        } else {
          message.error('Ошибка загрузки данных');
        }
      })
      .finally(() => setLoading(false));

    // Загружаем данные поддержки
    let isMounted = true;
    const loadAll = async () => {
      await Promise.all([
        loadTickets(isMounted),
        loadEvents(isMounted),
        loadAnalytics(isMounted),
        loadUsers(isMounted)
      ]);
    };
    loadAll();
    return () => { isMounted = false; };
  }, [isAdmin]);

  // Функции загрузки данных поддержки
  const loadTickets = async (isMounted = true) => {
    setTicketsLoading(true);
    try {
      const response = await apiClient.get('/api/support_tickets/');
      if (!isMounted) return;
      if (response.status >= 200 && response.status < 300) {
        if (isMounted) setTickets(response.data);
      } else {
        if (isMounted) message.error('Ошибка загрузки обращений');
      }
    } catch (error) {
      if (isMounted) {
        console.error('Ошибка загрузки обращений:', error);
        message.error('Ошибка при загрузке обращений');
      }
    } finally {
      if (isMounted) setTicketsLoading(false);
    }
  };

  const loadEvents = async (isMounted = true) => {
    try {
      const response = await apiClient.get('/api/support_tickets/calendar/events');
      if (!isMounted) return;
      if (response.status >= 200 && response.status < 300) {
        if (isMounted) setEvents(response.data);
      }
    } catch (error) {
      if (isMounted) console.error('Ошибка загрузки событий:', error);
    }
  };

  const loadAnalytics = async (isMounted = true) => {
    try {
      const response = await apiClient.get('/api/support_tickets/analytics/overview');
      if (!isMounted) return;
      if (response.status >= 200 && response.status < 300) {
        if (isMounted) setAnalytics(response.data);
      }
    } catch (error) {
      if (isMounted) console.error('Ошибка загрузки аналитики:', error);
    }
  };

  const loadUsers = async (isMounted = true) => {
    try {
      const response = await apiClient.get('/api/users/users');
      if (!isMounted) return;
      if (response.status >= 200 && response.status < 300) {
        if (isMounted) setUsers(response.data);
      } else {
        if (isMounted) message.error('Ошибка загрузки пользователей');
      }
    } catch (error) {
      if (isMounted) {
        console.error('Ошибка загрузки пользователей:', error);
        message.error('Ошибка при загрузке пользователей');
      }
    }
  };

  // Функции для работы с пользователями
  const handleUserAdd = async () => {
    try {
      const values = await userForm.validateFields();
      
      const userData = {
        username: "", // Логин будет сгенерирован на сервере
        email: values.email,
        role: values.role,
        department: values.department,
        position: values.position,
        phone: values.phone,
        first_name: values.first_name,
        last_name: values.last_name,
        patronymic: values.patronymic
      };
      
      const res = await apiClient.post('/api/users/', userData);
      
      if (res.status >= 200 && res.status < 300) {
        const data = res.data;
        
        // Показываем подробное сообщение с паролем и инструкциями
        Modal.success({
          title: 'Пользователь создан успешно!',
          content: (
            <div>
              <p><strong>Логин:</strong> <span style={{ color: '#1890ff', fontWeight: 'bold' }}>{data.username}</span></p>
              <p><strong>Email:</strong> {data.email}</p>
              <p><strong>ФИО:</strong> {data.last_name} {data.first_name} {data.patronymic}</p>
              <p><strong>Роль:</strong> {data.role}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                <p style={{ margin: 0 }}><strong>Сгенерированный пароль:</strong></p>
                <span style={{ color: '#1890ff', fontWeight: 'bold', fontSize: '16px' }}>{data.generated_password}</span>
                <Tooltip title="Копировать пароль">
                  <Button 
                    type="text" 
                    icon={<CopyOutlined />} 
                    size="small"
                    onClick={() => copyPasswordToClipboard(data.generated_password)}
                  />
                </Tooltip>
              </div>
              <Divider />
              <div style={{ backgroundColor: '#f6ffed', padding: '12px', borderRadius: '6px', marginTop: '12px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#52c41a' }}>📋 Инструкции для администратора:</h4>
                <ol style={{ margin: 0, paddingLeft: '20px' }}>
                  <li><strong>Сохраните пароль</strong> - он показывается только один раз</li>
                  <li><strong>Передайте логин и пароль пользователю</strong> безопасным способом</li>
                  <li><strong>Предупредите пользователя</strong>, что при первом входе потребуется сменить пароль</li>
                </ol>
              </div>
              <div style={{ backgroundColor: '#fff7e6', padding: '12px', borderRadius: '6px', marginTop: '12px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#fa8c16' }}>⚠️ Важно для пользователя:</h4>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  <li>Войти с логином: <strong>{data.username}</strong></li>
                  <li>Использовать пароль: <strong>{data.generated_password}</strong></li>
                  <li>Сменить пароль при первом входе (автоматически)</li>
                  <li>Использовать новый пароль для дальнейших входов</li>
                </ul>
              </div>
            </div>
          ),
          width: 600,
          okText: 'Понятно',
          onOk: () => {
            message.success('Данные пользователя сохранены. Не забудьте передать логин и пароль!');
          }
        });
        
        setUserModalVisible(false);
        userForm.resetFields();
        setUserEditData(null);
        // Обновляем список пользователей
        loadUsers();
      } else {
        const errorData = res.data;
        message.error(errorData.detail || 'Ошибка создания пользователя');
      }
    } catch (e) {
      console.error('Ошибка создания пользователя:', e);
      message.error('Ошибка создания пользователя');
    }
  };

  // Функция копирования пароля в буфер обмена
  const copyPasswordToClipboard = (password: string) => {
    navigator.clipboard.writeText(password).then(() => {
      message.success('Пароль скопирован в буфер обмена');
    }).catch(() => {
      message.error('Не удалось скопировать пароль');
    });
  };

  // Функция генерации нового пароля
  const handleGeneratePassword = async (userId: number) => {
    try {
      const res = await apiClient.post(`/api/users/${userId}/generate-password`);
      
      if (res.status >= 200 && res.status < 300) {
        const data = res.data;
        // Сохраняем пароль в состоянии
        setUserPasswords(prev => ({
          ...prev,
          [userId]: data.new_password
        }));
        
        // Показываем подробное сообщение с инструкциями
        Modal.success({
          title: 'Новый пароль сгенерирован',
          content: (
            <div>
              <p><strong>Пользователь:</strong> {data.username}</p>
              <p><strong>Email:</strong> {data.email}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <p style={{ margin: 0 }}><strong>Новый пароль:</strong></p>
                <span style={{ color: '#1890ff', fontWeight: 'bold', fontSize: '16px' }}>{data.new_password}</span>
                <Tooltip title="Копировать пароль">
                  <Button 
                    type="text" 
                    icon={<CopyOutlined />} 
                    size="small"
                    onClick={() => copyPasswordToClipboard(data.new_password)}
                  />
                </Tooltip>
              </div>
              <Divider />
              <div style={{ backgroundColor: '#f6ffed', padding: '12px', borderRadius: '6px', marginTop: '12px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#52c41a' }}>📋 Инструкции для администратора:</h4>
                <ol style={{ margin: 0, paddingLeft: '20px' }}>
                  <li><strong>Сохраните пароль</strong> - он показывается только один раз</li>
                  <li><strong>Передайте пароль пользователю</strong> безопасным способом</li>
                  <li><strong>Предупредите пользователя</strong>, что при первом входе потребуется сменить пароль</li>
                </ol>
              </div>
              <div style={{ backgroundColor: '#fff7e6', padding: '12px', borderRadius: '6px', marginTop: '12px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#fa8c16' }}>⚠️ Важно для пользователя:</h4>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  <li>Войти с новым паролем</li>
                  <li>Сменить пароль при первом входе (автоматически)</li>
                  <li>Использовать новый пароль для дальнейших входов</li>
                </ul>
              </div>
            </div>
          ),
          width: 600,
          okText: 'Понятно',
          onOk: () => {
            message.success('Пароль сохранен в памяти. Не забудьте передать его пользователю!');
          }
        });
        
        // Обновляем список пользователей
        loadUsers();
      } else {
        const errorData = res.data;
        message.error(errorData.detail || 'Ошибка генерации пароля');
      }
    } catch (e) {
      console.error('Ошибка генерации пароля:', e);
      message.error('Ошибка генерации пароля');
    }
  };

  // Функция получения информации о пользователе
  const handleUserInfo = async (userId: number) => {
    try {
      // Находим пользователя в текущем списке
      const user = users.find(u => u.id === userId);
      if (!user) {
        message.error('Пользователь не найден');
        return;
      }

      // Получаем информацию о пароле
      const res = await apiClient.get(`/api/users/${userId}/password`);
      
      let passwordInfo = "Информация о пароле недоступна";
      let hashedPassword = "";
      let forcePasswordChange = false;
      
      if (res.status >= 200 && res.status < 300) {
        const data = res.data;
        passwordInfo = data.message;
        hashedPassword = data.hashed_password;
        forcePasswordChange = data.force_password_change;
      }

      // Проверяем, есть ли сохраненный пароль
      const savedPassword = userPasswords[userId];
      if (savedPassword) {
        passwordInfo = `Последний сгенерированный пароль: ${savedPassword}`;
      }

      // Показываем полную информацию о пользователе
      Modal.info({
        title: 'Информация о пользователе',
        content: (
          <div>
            <p><strong>ID:</strong> {user.id}</p>
            <p><strong>Логин:</strong> {user.username}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>ФИО:</strong> {user.last_name} {user.first_name} {user.patronymic}</p>
            <p><strong>Роль:</strong> {user.role}</p>
            <p><strong>Департамент:</strong> {user.department || 'Не указан'}</p>
            <p><strong>Должность:</strong> {user.position || 'Не указана'}</p>
            <p><strong>Телефон:</strong> {user.phone || 'Не указан'}</p>
            <p><strong>Пароль:</strong> {passwordInfo}</p>
            {hashedPassword && (
              <p><strong>Зашифрованный пароль:</strong> <code style={{ fontSize: '10px', wordBreak: 'break-all' }}>{hashedPassword}</code></p>
            )}
            {forcePasswordChange && (
              <p><strong>Статус пароля:</strong> <Tag color="#FCB813">Требуется смена пароля</Tag></p>
            )}
            <p style={{ marginTop: '16px', color: '#666', fontSize: '12px' }}>
              💡 Для генерации нового пароля используйте кнопку "Новый пароль"
            </p>
          </div>
        ),
        width: 600,
      });
    } catch (e) {
      console.error('Ошибка получения информации:', e);
      message.error('Ошибка получения информации о пользователе');
    }
  };

  // Функция попытки расшифровки пароля
  const handleDecryptPassword = async (userId: number) => {
    try {
      const res = await apiClient.get(`/api/users/${userId}/password/decrypt`);
      
      if (res.status >= 200 && res.status < 300) {
        const data = res.data;
        Modal.info({
          title: 'Информация о пароле',
          content: (
            <div>
              <p><strong>Пользователь:</strong> {data.username}</p>
              <p><strong>Email:</strong> {data.email}</p>
              <p><strong>Статус:</strong> {data.password_status}</p>
              <p><strong>Сообщение:</strong> {data.message}</p>
              <p><strong>Рекомендация:</strong> {data.suggestion}</p>
              {data.hashed_password && (
                <p><strong>Зашифрованный пароль:</strong> <code style={{ fontSize: '10px', wordBreak: 'break-all' }}>{data.hashed_password}</code></p>
              )}
              <p style={{ marginTop: '16px', color: '#666', fontSize: '12px' }}>
                🔒 Пароли защищены с помощью bcrypt и не могут быть расшифрованы
              </p>
            </div>
          ),
          width: 600,
        });
      } else {
        const errorData = res.data;
        message.error(errorData.detail || 'Ошибка расшифровки пароля');
      }
    } catch (e) {
      console.error('Ошибка расшифровки пароля:', e);
      message.error('Ошибка расшифровки пароля');
    }
  };

  // Функции для работы с ролями
  const handleRoleAdd = async () => {
    try {
      const values = await roleForm.validateFields();
      
      const roleData = {
        name: values.name,
        description: values.description,
        permissions: values.permissions || []
      };
      
      const res = await apiClient.post('/api/users/roles', roleData);
      
      if (res.status >= 200 && res.status < 300) {
        message.success('Роль создана!');
        setRoleModalVisible(false);
        roleForm.resetFields();
        setRoleEditData(null);
        fetchRolesAndDepartments();
      } else {
        const errorData = res.data;
        message.error(errorData.detail || 'Ошибка создания роли');
      }
    } catch (e) {
      console.error('Ошибка создания роли:', e);
      message.error('Ошибка создания роли');
    }
  };

  // Функции для работы с департаментами
  const handleDepartmentAdd = async () => {
    try {
      const values = await departmentForm.validateFields();
      
      const departmentData = {
        name: values.name,
        description: values.description,
        manager_id: values.manager_id
      };
      
      const res = await apiClient.post('/api/users/departments', departmentData);
      
      if (res.status >= 200 && res.status < 300) {
        message.success('Департамент создан!');
        setDepartmentModalVisible(false);
        departmentForm.resetFields();
        setDepartmentEditData(null);
        fetchRolesAndDepartments();
      } else {
        const errorData = res.data;
        message.error(errorData.detail || 'Ошибка создания департамента');
      }
    } catch (e) {
      console.error('Ошибка создания департамента:', e);
      message.error('Ошибка создания департамента');
    }
  };

  // Функции для работы с тикетами
  const closeTicket = async (ticketId: number) => {
    try {
      const response = await apiClient.post(`/api/support_tickets/${ticketId}/close`);

      if (response.status >= 200 && response.status < 300) {
        message.success('Обращение закрыто');
        loadTickets();
        loadAnalytics();
      } else {
        message.error('Ошибка при закрытии обращения');
      }
    } catch (error) {
      console.error('Ошибка закрытия обращения:', error);
      message.error('Ошибка при закрытии обращения');
    }
  };

  const updateTicket = async (ticketId: number, updates: any) => {
    try {
      const response = await apiClient.put(`/api/support_tickets/${ticketId}`, updates);

      if (response.status >= 200 && response.status < 300) {
        message.success('Обращение обновлено');
        loadTickets();
        loadAnalytics();
        setTicketModalVisible(false);
      } else {
        message.error('Ошибка при обновлении обращения');
      }
    } catch (error) {
      console.error('Ошибка обновления обращения:', error);
      message.error('Ошибка при обновлении обращения');
    }
  };

  const createEvent = async (ticketId: number, eventData: any) => {
    try {
      const response = await apiClient.post(`/api/support_tickets/${ticketId}/events`, eventData);

      if (response.status >= 200 && response.status < 300) {
        message.success('Событие создано');
        loadEvents();
        setEventModalVisible(false);
        eventForm.resetFields();
      } else {
        message.error('Ошибка при создании события');
      }
    } catch (error) {
      console.error('Ошибка создания события:', error);
      message.error('Ошибка при создании события');
    }
  };

  const updateEvent = async (eventId: number, updates: any) => {
    try {
      const response = await apiClient.put(`/api/support_tickets/events/${eventId}`, updates);

      if (response.status >= 200 && response.status < 300) {
        message.success('Событие обновлено');
        loadEvents();
        setEventModalVisible(false);
      } else {
        message.error('Ошибка при обновлении события');
      }
    } catch (error) {
      console.error('Ошибка обновления события:', error);
      message.error('Ошибка при обновлении события');
    }
  };

  // Вспомогательные функции
  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('DD.MM.YYYY HH:mm');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'red';
      case 'in_progress': return '#FCB813';
      case 'resolved': return 'green';
      case 'closed': return 'gray';
      default: return 'blue';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'green';
      case 'medium': return '#FCB813';
      case 'high': return 'red';
      case 'urgent': return 'purple';
      default: return 'blue';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'Открыто';
      case 'in_progress': return 'В работе';
      case 'resolved': return 'Решено';
      case 'closed': return 'Закрыто';
      default: return status;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'low': return 'Низкий';
      case 'medium': return 'Средний';
      case 'high': return 'Высокий';
      case 'urgent': return 'Срочный';
      default: return priority;
    }
  };

  const handleTicketEdit = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    form.setFieldsValue({
      title: ticket.title,
      description: ticket.description,
      department: ticket.department,
      status: ticket.status,
      priority: ticket.priority,
      assigned_to: ticket.assigned_to,
      estimated_resolution: ticket.estimated_resolution ? dayjs(ticket.estimated_resolution) : null
    });
    setTicketModalVisible(true);
  };

  const handleEventCreate = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setSelectedEvent(null);
    eventForm.resetFields();
    setEventModalVisible(true);
  };

  const handleEventEdit = (event: SupportEvent) => {
    setSelectedEvent(event);
    eventForm.setFieldsValue({
      event_type: event.event_type,
      title: event.title,
      description: event.description,
      event_date: dayjs(event.event_date),
      is_completed: event.is_completed
    });
    setEventModalVisible(true);
  };

  const onFinishTicket = (values: any) => {
    if (selectedTicket) {
      const updates = {
        ...values,
        estimated_resolution: values.estimated_resolution?.toISOString()
      };
      updateTicket(selectedTicket.id, updates);
    }
  };

  const onFinishEvent = (values: any) => {
    const forUserId = canCreateForOthers ? values.for_user : user!.id;
    if (selectedEvent) {
      updateEvent(selectedEvent.id, {
        ...values,
        for_user: forUserId,
        event_date: values.event_date.toISOString()
      });
    } else if (selectedTicket) {
      createEvent(selectedTicket.id, {
        ...values,
        for_user: forUserId,
        event_date: values.event_date.toISOString()
      });
    }
  };

  const handleCalendarSelect = (value: dayjs.Dayjs) => {
    setCalendarDate(value);
    calendarForm.resetFields();
    calendarForm.setFieldsValue({
      start_date: value,
      end_date: value,
      event_type: 'reminder',
    });
    setCalendarModalVisible(true);
  };

  const onFinishCalendarEvent = async (values: any) => {
    const forUserId = canCreateForOthers ? values.for_user : user!.id;
    try {
      const response = await apiClient.post('/api/support_tickets/0/events', {
        ...values,
        for_user: forUserId,
        start_date: values.start_date.toISOString(),
        end_date: values.end_date.toISOString(),
      });
      if (response.status >= 200 && response.status < 300) {
        message.success('Событие запланировано');
        setCalendarModalVisible(false);
        loadEvents();
      } else {
        message.error('Ошибка при создании события');
      }
    } catch (error) {
      message.error('Ошибка при создании события');
    }
  };

  // Функция для проверки, попадает ли день в диапазон события
  const isInEventRange = (date: dayjs.Dayjs, event: SupportEvent) => {
    if (event.start_date && event.end_date) {
      return date.isBetween(dayjs(event.start_date).startOf('day'), dayjs(event.end_date).endOf('day'), null, '[]');
    }
    if (event.start_date) {
      return date.isSame(dayjs(event.start_date), 'day');
    }
    if (event.event_date) {
      return date.isSame(dayjs(event.event_date), 'day');
    }
    return false;
  };

  // Обновлённый dateCellRender для отображения событий и подсветки диапазона
  const dateCellRender = (value: dayjs.Dayjs) => {
    const dayEvents = events.filter(event => isInEventRange(value, event));
    if (dayEvents.length === 0) return null;
    return (
      <Tooltip
        title={
          <div>
            {dayEvents.map(ev => (
              <div key={ev.id} style={{ fontWeight: 500, marginBottom: 2 }}>
                {ev.title}
              </div>
            ))}
          </div>
        }
        placement="top"
      >
        <div style={{ minHeight: 24, cursor: 'pointer' }}>
          {dayEvents.map(ev => (
            <div
              key={ev.id}
              style={{
                background: '#e6f7ff',
                borderRadius: 4,
                marginBottom: 2,
                padding: '0 4px',
                color: '#1890ff',
                fontSize: 12,
                fontWeight: 500,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              onClick={e => {
                e.stopPropagation();
                setSelectedCalendarEvent(ev);
                setCalendarEventModalVisible(true);
              }}
            >
              {ev.title}
            </div>
          ))}
        </div>
      </Tooltip>
    );
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: 'Заголовок',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <Text strong>{safeString(text)}</Text>,
    },
    {
      title: 'Пользователь',
      dataIndex: 'user_username',
      key: 'user_username',
      render: (text: string) => (
        <Space>
          <Avatar icon={<UserOutlined />} size="small" />
          {safeString(text)}
        </Space>
      ),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {safeString(getStatusText(status))}
        </Tag>
      ),
    },
    {
      title: 'Приоритет',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>
          {safeString(getPriorityText(priority))}
        </Tag>
      ),
    },
    {
      title: 'Департамент',
      dataIndex: 'department',
      key: 'department',
      render: (department: string) => department ? (
        <Tag color="blue">{safeString(department)}</Tag>
      ) : '-',
    },
    {
      title: 'Создано',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => safeString(formatDate(date)),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: SupportTicket) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleTicketEdit(record)}
          >
            Редактировать
          </Button>
          <Button
            type="link"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => handleEventCreate(record)}
          >
            Событие
          </Button>
          {record.status !== 'closed' && (
            <Button
              type="link"
              size="small"
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => closeTicket(record.id)}
            >
              Закрыть
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const handleExport = async () => {
    setCsvLoading(true);
    try {
      const blob = await exportTableCsv(activeTable);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeTable}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (e) {
      message.error('Ошибка экспорта CSV');
    } finally {
      setCsvLoading(false);
    }
  };

  const handleReloadTickets = () => { loadTickets(); };

  // Получение данных выбранной таблицы
  const fetchTableData = async (table: string) => {
    setTableLoading(true);
    try {
      const response = await apiClient.get(`/api/admin/table/${table}`);
      if (response.status >= 200 && response.status < 300) {
        setTableData(response.data);
      } else {
        setTableData([]);
        message.error('Ошибка загрузки данных таблицы');
      }
    } catch (e) {
      setTableData([]);
      message.error('Ошибка загрузки данных таблицы');
    } finally {
      setTableLoading(false);
    }
  };

  // Загружать таблицу при выборе
  useEffect(() => {
    fetchTableData(activeTable);
  }, [activeTable]);

  // После импорта CSV обновлять таблицу
  const handleImportCSV = async (file: any) => {
    setCsvLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await apiClient.post(`/admin/import_csv/${activeTable}`, formData);
      message.success('Импорт завершён');
      fetchTableData(activeTable);
    } catch (e) {
      message.error('Ошибка импорта CSV');
    } finally {
      setCsvLoading(false);
    }
  };
  const handleImportExcel = async (file: any) => {
    setCsvLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await apiClient.post(`/api/admin/import_xlsx/${activeTable}`, formData);
      message.success('Импорт завершён');
      fetchTableData(activeTable);
    } catch (e) {
      message.error('Ошибка импорта Excel');
    } finally {
      setCsvLoading(false);
    }
  };
  const handleImportJSON = async (file: any) => {
    setCsvLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await apiClient.post(`/api/admin/import_json/${activeTable}`, formData);
      message.success('Импорт завершён');
      fetchTableData(activeTable);
    } catch (e) {
      message.error('Ошибка импорта JSON');
    } finally {
      setCsvLoading(false);
    }
  };

  // Экспорт CSV (проверяю правильный эндпоинт)
  const handleExportCSV = async () => {
    setCsvLoading(true);
    try {
      const res = await apiClient.get(`/admin/export_csv/${activeTable}`);
      if (res.status < 200 || res.status >= 300) throw new Error('Ошибка экспорта');
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeTable}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (e) {
      message.error('Ошибка экспорта CSV');
    } finally {
      setCsvLoading(false);
    }
  };

  // Удаление строки
  const handleDeleteRow = async (row: any) => {
    try {
      await apiClient.delete(`/api/admin/table/${activeTable}/${row.id || row._id}`);
      message.success('Строка удалена');
      fetchTableData(activeTable);
    } catch (e) {
      message.error('Ошибка удаления строки');
    }
  };

  // Добавление строки
  const handleAddRow = async (values: any) => {
    try {
      await apiClient.post(`/api/admin/table/${activeTable}`, values);
      message.success('Строка добавлена');
      setAddModalVisible(false);
      setAddRowData({});
      fetchTableData(activeTable);
    } catch (e) {
      message.error('Ошибка добавления строки');
    }
  };

  // Экспорт в разные форматы
  const handleExportFormat = async (format: 'csv' | 'xlsx' | 'json') => {
    setCsvLoading(true);
    try {
      const res = await apiClient.get(`/api/admin/export_${format}/${activeTable}`);
      if (res.status < 200 || res.status >= 300) throw new Error('Ошибка экспорта');
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeTable}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (e) {
      message.error('Ошибка экспорта');
    } finally {
      setCsvLoading(false);
    }
  };

  // Импорт в разных форматах
  const handleImportFormat = async (file: any) => {
    setCsvLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await apiClient.post(`/api/admin/import_${importFormat}/${activeTable}`, formData);
      message.success('Импорт завершён');
      fetchTableData(activeTable);
    } catch (e) {
      message.error('Ошибка импорта');
    } finally {
      setCsvLoading(false);
    }
  };

  // --- Новый блок: формирование колонок и данных для универсальной таблицы ---
  // Очищаем значения до строк
  // Формируем колонки для универсальной таблицы ТОЛЬКО на основе очищенных данных
  const cleanedTableData = cleanTableData(tableData);

  // Проверяем, есть ли поле actions в данных
  const hasActionsField = tableData.length > 0 && Object.keys(tableData[0]).includes('actions');

  const universalTableColumns = tableData.length > 0
    ? [
        ...Object.keys(tableData[0])
          .filter(key => key !== 'actions') // убираем конфликт
          .map(key => ({
            title: key,
            dataIndex: key,
            key,
            render: (value: any) => value
          })),
        {
          title: 'Действия',
          key: 'actions',
          width: 120,
          render: (_: any, row: any) => (
            <Space>
              <Button icon={<PlusOutlined />} size="small" onClick={() => { setAddRowData({}); setAddModalVisible(true); }} />
              <Button icon={<DeleteOutlined />} size="small" danger onClick={() => handleDeleteRow(row)} />
            </Space>
          )
        }
      ]
    : [];

  // Моковые данные для круговой диаграммы поставщиков по странам
  const supplierCountries = [
    { country: 'Россия', value: 40 },
    { country: 'Китай', value: 25 },
    { country: 'Германия', value: 15 },
    { country: 'США', value: 10 },
    { country: 'Индия', value: 5 },
    { country: 'Другое', value: 5 },
  ];

  const pieOptions = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        name: 'Поставщики',
        type: 'pie',
        radius: '70%',
        data: supplierCountries.map(item => ({ value: item.value, name: item.country })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          formatter: '{b}: {d}%'
        }
      }
    ]
  };

  // Очистка данных tickets для Table (исключаем React-элементы)
  function cleanRowForAntdTable(row: any) {
    const cleaned: any = {};
    for (const key in row) {
      const val = row[key];
      if (val && typeof val === 'object' && (val.$$typeof || (Array.isArray(val) && val.some((v: any) => v && v.$$typeof)))) {
        cleaned[key] = '[Элемент]';
      } else {
        cleaned[key] = val;
      }
    }
    return cleaned;
  }
  const cleanedTickets = cleanTableData(tickets);

  // Универсальная функция для безопасного вывода значений в JSX
  function safeString(val: any) {
    if (val == null) return '';
    if (typeof val === 'string' || typeof val === 'number') return val;
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <h2>Доступ запрещен</h2>
        <p>Эта страница доступна только администраторам.</p>
      </div>
    );
  }

  if (loading) return <Spin size="large" style={{ marginTop: 100 }} />;

  return (
    <>
      {/* ВИДЖЕТЫ: Календарь и Новости */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="Календарь событий" extra={<CalendarOutlined />}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={() => {
                  setCalendarDate(dayjs());
                  calendarForm.resetFields();
                  calendarForm.setFieldsValue({
                    start_date: dayjs(),
                    end_date: dayjs(),
                    event_type: 'reminder',
                  });
                  setCalendarModalVisible(true);
                }}
              >
                Добавить событие
              </Button>
            </div>
            <Calendar
              dateCellRender={dateCellRender}
              style={{ backgroundColor: 'white' }}
              onSelect={handleCalendarSelect}
              fullscreen={false}
              mode="month"
              headerRender={({ value, onChange }) => (
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    style={{ marginRight: 16 }}
                    onClick={() => {
                      setCalendarDate(dayjs());
                      calendarForm.resetFields();
                      calendarForm.setFieldsValue({
                        start_date: dayjs(),
                        end_date: dayjs(),
                        event_type: 'reminder',
                      });
                      setCalendarModalVisible(true);
                    }}
                  >
                    Добавить событие
                  </Button>
                  {/* стандартные контролы выбора месяца/года */}
                  <div style={{ flex: 1 }}>
                    <DatePicker
                      picker="month"
                      allowClear={false}
                      value={value}
                      onChange={date => date && onChange(date)}
                      style={{ width: 140 }}
                      format="MMMM YYYY"
                      locale={ru_RU.DatePicker}
                    />
                  </div>
                </div>
              )}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title={
            <Space>
              <BarChartOutlined /> Новости
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setNewsModalVisible(true)}>
                Добавить новость
              </Button>
            </Space>
          }>
            {newsLoading ? (
              <div style={{ textAlign: 'center', marginTop: '100px' }}>
                <Spin size="large" />
                <div style={{ marginTop: '16px' }}>Загрузка новостей...</div>
              </div>
            ) : news.length === 0 ? (
              <Text type="secondary">Новостей пока нет</Text>
            ) : (
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                {news.map((n, idx) => (
                  <Card key={idx} type="inner" title={safeString(n.title)} style={{ width: '100%' }}>
                    {n.image_url && (
                      <div style={{ marginBottom: 12 }}>
                        <img 
                          src={`http://localhost:8000${n.image_url}`} 
                          alt="news" 
                          style={{ maxWidth: 200, maxHeight: 150, objectFit: 'cover', borderRadius: 4 }}
                          onError={(e) => {
                            console.error('Ошибка загрузки изображения:', n.image_url);
                            e.currentTarget.style.display = 'none';
                            message.error('Ошибка загрузки изображения новости');
                          }}
                          onLoad={() => {
                            console.log('Изображение новости успешно загружено:', n.image_url);
                          }}
                        />
                      </div>
                    )}
                    <div>{safeString(n.text)}</div>
                    <Space style={{ marginTop: 8 }}>
                      <Button type="link" onClick={() => handleNewsEdit(n)}>Редактировать</Button>
                      <Button type="link" danger onClick={() => handleNewsDelete(n.id)}>Удалить новость</Button>
                    </Space>
                  </Card>
                ))}
              </Space>
            )}
          </Card>
        </Col>
      </Row>
      <Modal
        title={newsEditData ? "Редактировать новость" : "Добавить новость"}
        open={newsModalVisible}
        onCancel={() => {
          setNewsModalVisible(false);
          setNewsEditData(null);
          setNewsImage(undefined);
          newsForm.resetFields();
        }}
        onOk={() => handleNewsAdd()}
        okText={newsEditData ? "Сохранить" : "Добавить"}
        cancelText="Отмена"
      >
        <Form form={newsForm} layout="vertical">
          <Form.Item name="title" label="Заголовок" rules={[{ required: true, message: 'Введите заголовок' }]}> 
            <Input />
          </Form.Item>
          <Form.Item name="text" label="Новость" rules={[{ required: true, message: 'Введите текст новости' }]}> 
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item label="Картинка">
            <Upload showUploadList={false} beforeUpload={() => false} onChange={handleNewsImage} accept="image/*">
              <Button icon={<UploadOutlined />}>Выбрать файл</Button>
            </Upload>
            {newsImage && (
              <div style={{ marginTop: 8 }}>
                <img 
                  src={`http://localhost:8000${newsImage}`} 
                  alt="preview" 
                  style={{ maxWidth: 120, maxHeight: 90, objectFit: 'cover', borderRadius: 4 }}
                  onError={(e) => {
                    console.error('Ошибка загрузки предварительного просмотра:', newsImage);
                    e.currentTarget.style.display = 'none';
                    message.error('Ошибка загрузки изображения');
                  }}
                  onLoad={() => {
                    console.log('Изображение успешно загружено:', newsImage);
                  }}
                />
              </div>
            )}
          </Form.Item>
        </Form>
      </Modal>
      <div style={{ padding: 24 }}>
        <h2>Админ-дэшборд</h2>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={4}><Card><Statistic title="Пользователи" value={metrics?.users || 0} prefix={<TeamOutlined />} /></Card></Col>
          <Col span={4}><Card><Statistic title="Артикулы" value={metrics?.articles || 0} prefix={<FileTextOutlined />} /></Card></Col>
          <Col span={4}><Card><Statistic title="Поставщики" value={metrics?.suppliers || 0} prefix={<DatabaseOutlined />} /></Card></Col>
          <Col span={4}><Card><Statistic title="Тикеты" value={metrics?.tickets || 0} prefix={<DatabaseOutlined />} /></Card></Col>
          <Col span={4}><Card><Statistic title="События" value={metrics?.events || 0} prefix={<CalendarOutlined />} /></Card></Col>
        </Row>

        {/* Tabs без Таблицы (CSV) */}
        <Tabs defaultActiveKey="tickets">
          <TabPane tab="Обращения" key="tickets">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  <CustomerServiceOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                  Управление обращениями
                </Title>
              </div>
              <Button onClick={handleReloadTickets} type="primary">
                Обновить
              </Button>
            </div>
            {ticketsLoading ? (
              <div style={{ textAlign: 'center', marginTop: '100px' }}>
                <Spin size="large" />
                <div style={{ marginTop: '16px' }}>Загрузка обращений...</div>
              </div>
            ) : (
              <Table
                dataSource={cleanedTickets}
                columns={columns}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                expandable={{
                  expandedRowRender: (record) => (
                    <div style={{ padding: '16px' }}>
                      <Text strong>Описание:</Text>
                      <div style={{ marginTop: '8px', whiteSpace: 'pre-wrap' }}>
                        {safeString(record.description)}
                      </div>
                      {record.assigned_admin_username && (
                        <div style={{ marginTop: '8px' }}>
                          <Text strong>Назначен:</Text> {safeString(record.assigned_admin_username)}
                        </div>
                      )}
                      {record.estimated_resolution && (
                        <div style={{ marginTop: '8px' }}>
                          <Text strong>Ожидаемое решение:</Text> {safeString(formatDate(record.estimated_resolution))}
                        </div>
                      )}
                    </div>
                  ),
                }}
              />
            )}
          </TabPane>
          <TabPane tab="Управление" key="management">
            <div style={{ marginBottom: 24 }}>
              <Title level={4}>
                <TeamOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                Управление пользователями, ролями и департаментами
              </Title>
            </div>
            
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <Card 
                  title="Пользователи" 
                  extra={
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setUserModalVisible(true)}>
                      Добавить пользователя
                    </Button>
                  }
                >
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <UserOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
                    <div>Управление пользователями системы</div>
                    <div style={{ marginTop: '8px', color: '#666' }}>
                      Создание, редактирование и удаление пользователей
                    </div>
                  </div>
                </Card>
              </Col>
              
              <Col span={8}>
                <Card 
                  title="Роли" 
                  extra={
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setRoleModalVisible(true)}>
                      Добавить роль
                    </Button>
                  }
                >
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <CheckCircleOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
                    <div>Управление ролями и правами</div>
                    <div style={{ marginTop: '8px', color: '#666' }}>
                      Создание ролей и назначение разрешений
                    </div>
                  </div>
                </Card>
              </Col>
              
              <Col span={8}>
                <Card 
                  title="Департаменты" 
                  extra={
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setDepartmentModalVisible(true)}>
                      Добавить департамент
                    </Button>
                  }
                >
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <DatabaseOutlined style={{ fontSize: '48px', color: '#faad14', marginBottom: '16px' }} />
                    <div>Управление департаментами</div>
                    <div style={{ marginTop: '8px', color: '#666' }}>
                      Создание и настройка организационной структуры
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>

            {/* Списки существующих данных */}
            <Row gutter={16}>
              <Col span={24}>
                <Card title="Пользователи системы" style={{ marginBottom: 16 }}>
                  <Table
                    dataSource={users}
                    columns={[
                      { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
                      { title: 'Логин', dataIndex: 'username', key: 'username' },
                      { title: 'Email', dataIndex: 'email', key: 'email' },
                      { title: 'ФИО', key: 'full_name', render: (_, record) => (
                        <span>
                          {record.last_name} {record.first_name} {record.patronymic}
                        </span>
                      )},
                      { title: 'Роль', dataIndex: 'role', key: 'role' },
                      { title: 'Департамент', dataIndex: 'department', key: 'department' },
                      { title: 'Должность', dataIndex: 'position', key: 'position' },
                      { title: 'Телефон', dataIndex: 'phone', key: 'phone' },
                      { 
                        title: 'Действия', 
                        key: 'actions',
                        render: (_, record) => (
                          <Space>
                            <Button 
                              type="primary" 
                              size="small"
                              onClick={() => handleGeneratePassword(record.id)}
                            >
                              Новый пароль
                            </Button>
                            <Button 
                              type="default" 
                              size="small"
                              onClick={() => handleUserInfo(record.id)}
                            >
                              Инфо
                            </Button>
                            <Button 
                              type="dashed" 
                              size="small"
                              onClick={() => handleDecryptPassword(record.id)}
                            >
                              Расшифровать
                            </Button>
                          </Space>
                        )
                      }
                    ]}
                    pagination={{ pageSize: 10 }}
                    size="small"
                    rowKey="id"
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Card title="Существующие роли">
                  <Table
                    dataSource={roles}
                    columns={[
                      { title: 'Название', dataIndex: 'name', key: 'name' },
                      { title: 'Описание', dataIndex: 'description', key: 'description' },
                      { 
                        title: 'Разрешения', 
                        dataIndex: 'permissions', 
                        key: 'permissions',
                        render: (permissions: string[]) => (
                          <div>
                            {permissions.map((perm, idx) => (
                              <Tag key={idx} color="blue" style={{ marginBottom: 4 }}>{perm}</Tag>
                            ))}
                          </div>
                        )
                      }
                    ]}
                    pagination={false}
                    size="small"
                  />
                </Card>
              </Col>
              
              <Col span={12}>
                <Card title="Существующие департаменты">
                  <Table
                    dataSource={departments}
                    columns={[
                      { title: 'Название', dataIndex: 'name', key: 'name' },
                      { title: 'Описание', dataIndex: 'description', key: 'description' },
                      { 
                        title: 'Руководитель', 
                        dataIndex: 'manager_id', 
                        key: 'manager_id',
                        render: (managerId: number) => managerId ? `ID: ${managerId}` : 'Не назначен'
                      }
                    ]}
                    pagination={false}
                    size="small"
                  />
                </Card>
              </Col>
            </Row>
          </TabPane>
          <TabPane tab="Аналитика поддержки" key="support_analytics">
            {analytics && (
              <div>
                <Row gutter={16} style={{ marginBottom: '24px' }}>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="Всего обращений"
                        value={analytics.total_tickets}
                        prefix={<MessageOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="Открытых"
                        value={analytics.open_tickets}
                        prefix={<ExclamationCircleOutlined />}
                        valueStyle={{ color: '#cf1322' }}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="Закрытых"
                        value={analytics.closed_tickets}
                        prefix={<CheckCircleOutlined />}
                        valueStyle={{ color: '#3f8600' }}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="В работе"
                        value={analytics.in_progress_tickets}
                        prefix={<ClockCircleOutlined />}
                        valueStyle={{ color: '#faad14' }}
                      />
                    </Card>
                  </Col>
                </Row>

                <Row gutter={16} style={{ marginBottom: '24px' }}>
                  <Col span={12}>
                    <Card title="По департаментам">
                      {Object.entries(analytics.tickets_by_department).map(([dept, count]) => (
                        <div key={dept} style={{ marginBottom: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <Text>{safeString(dept)}</Text>
                            <Text>{safeString(count)}</Text>
                          </div>
                          <Progress
                            percent={Math.round((Number(count) / analytics.total_tickets) * 100)}
                            size="small"
                            showInfo={false}
                          />
                        </div>
                      ))}
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card title="По приоритетам">
                      {Object.entries(analytics.tickets_by_priority).map(([priority, count]) => (
                        <div key={priority} style={{ marginBottom: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <Text>{safeString(getPriorityText(priority))}</Text>
                            <Text>{safeString(count)}</Text>
                          </div>
                          <Progress
                            percent={Math.round((Number(count) / analytics.total_tickets) * 100)}
                            size="small"
                            showInfo={false}
                            strokeColor={getPriorityColor(priority)}
                          />
                        </div>
                      ))}
                    </Card>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Card title="Время реагирования">
                      <Statistic
                        title="Среднее время ответа"
                        value={analytics.average_response_time_hours || 0}
                        suffix="часов"
                        precision={1}
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card title="Время решения">
                      <Statistic
                        title="Среднее время решения"
                        value={analytics.average_resolution_time_hours || 0}
                        suffix="часов"
                        precision={1}
                      />
                    </Card>
                  </Col>
                </Row>
              </div>
            )}
          </TabPane>
        </Tabs>

        {/* Новый отдельный блок для Таблицы (CSV) */}
        <Card style={{ marginTop: 32 }} title="Таблицы (CSV, Excel, JSON)">
          <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
            <Col>
              <select value={activeTable} onChange={e => setActiveTable(e.target.value)}>
                {TABLES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </Col>
            <Col>
              <Button icon={<FileTextOutlined />} loading={csvLoading} onClick={handleExportCSV}>Экспорт CSV</Button>
            </Col>
            <Col>
              <Button icon={<FileExcelOutlined />} loading={csvLoading} onClick={() => handleExportFormat('xlsx')}>Экспорт Excel</Button>
            </Col>
            <Col>
              <Button icon={<FileTextOutlined />} loading={csvLoading} onClick={() => handleExportFormat('json')}>Экспорт JSON</Button>
            </Col>
            <Col>
              <Upload beforeUpload={file => { handleImportCSV(file); return false; }} showUploadList={false} accept={'.csv'}>
                <Button icon={<UploadOutlined />} loading={csvLoading}>Импорт CSV</Button>
              </Upload>
            </Col>
            <Col>
              <Upload beforeUpload={file => { handleImportExcel(file); return false; }} showUploadList={false} accept={'.xlsx'}>
                <Button icon={<UploadOutlined />} loading={csvLoading}>Импорт Excel</Button>
              </Upload>
            </Col>
            <Col>
              <Upload beforeUpload={file => { handleImportJSON(file); return false; }} showUploadList={false} accept={'.json'}>
                <Button icon={<UploadOutlined />} loading={csvLoading}>Импорт JSON</Button>
              </Upload>
            </Col>
            <Col>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => { setAddRowData({}); setAddModalVisible(true); }}>Добавить строку</Button>
            </Col>
          </Row>
          <Table
            dataSource={cleanedTableData}
            loading={tableLoading}
            rowKey={row => row.id || row._id || JSON.stringify(row)}
            columns={universalTableColumns}
            pagination={{ pageSize: 10 }}
            size="small"
            scroll={{ x: 'max-content' }}
          />
          <Modal
            title="Добавить строку"
            open={addModalVisible}
            onCancel={() => setAddModalVisible(false)}
            onOk={() => handleAddRow(addRowData)}
          >
            {tableData.length > 0 ? Object.keys(tableData[0]).map(key => (
              <div key={key} style={{ marginBottom: 8 }}>
                <span>{key}: </span>
                <Input value={typeof addRowData[key] === 'string' || typeof addRowData[key] === 'number' ? addRowData[key] : JSON.stringify(addRowData[key] || '')} onChange={e => setAddRowData({ ...addRowData, [key]: e.target.value })} />
              </div>
            )) : <div>Нет данных для структуры строки</div>}
          </Modal>
        </Card>

        {/* Круговая диаграмма временно убрана для диагностики ошибки React */}

        {/* Модальное окно редактирования обращения */}
        <Modal
          title="Редактировать обращение"
          open={ticketModalVisible}
          onCancel={() => setTicketModalVisible(false)}
          footer={null}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinishTicket}
          >
            <Form.Item
              name="title"
              label="Заголовок"
              rules={[{ required: true, message: 'Введите заголовок' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="description"
              label="Описание"
              rules={[{ required: true, message: 'Введите описание' }]}
            >
              <TextArea rows={4} />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="department" label="Департамент">
                  <Select placeholder="Выберите департамент">
                    <Option value="software">Разработка ПО</Option>
                    <Option value="sysadmin">Системный администратор</Option>
                    <Option value="logistics">Логистика</Option>
                    <Option value="general">Общие вопросы</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="priority" label="Приоритет">
                  <Select placeholder="Выберите приоритет">
                    <Option value="low">Низкий</Option>
                    <Option value="medium">Средний</Option>
                    <Option value="high">Высокий</Option>
                    <Option value="urgent">Срочный</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="status" label="Статус">
                  <Select placeholder="Выберите статус">
                    <Option value="open">Открыто</Option>
                    <Option value="in_progress">В работе</Option>
                    <Option value="resolved">Решено</Option>
                    <Option value="closed">Закрыто</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="assigned_to" label="Назначить">
                  <Select placeholder="Выберите администратора">
                    {users.filter(u => u.role === 'admin').map(user => (
                      <Option key={user.id} value={user.id}>{user.username}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="estimated_resolution" label="Ожидаемое время решения">
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  Сохранить
                </Button>
                <Button onClick={() => setTicketModalVisible(false)}>
                  Отмена
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Модальное окно создания/редактирования события */}
        <Modal
          title={selectedEvent ? "Редактировать событие" : "Создать событие"}
          open={eventModalVisible}
          onCancel={() => setEventModalVisible(false)}
          footer={null}
          width={500}
        >
          <Form
            form={eventForm}
            layout="vertical"
            onFinish={onFinishEvent}
          >
            <Form.Item
              name="event_type"
              label="Тип события"
              rules={[{ required: true, message: 'Выберите тип события' }]}
            >
              <Select placeholder="Выберите тип события">
                <Option value="deadline">Дедлайн</Option>
                <Option value="reminder">Напоминание</Option>
                <Option value="milestone">Веха</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="title"
              label="Заголовок"
              rules={[{ required: true, message: 'Введите заголовок' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="description"
              label="Описание"
            >
              <TextArea rows={3} />
            </Form.Item>

            <Form.Item
              name="event_date"
              label="Дата события"
              rules={[{ required: true, message: 'Выберите дату' }]}
            >
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>

            {selectedEvent && (
              <Form.Item name="is_completed" label="Выполнено" valuePropName="checked">
                <Select>
                  <Option value={true}>Да</Option>
                  <Option value={false}>Нет</Option>
                </Select>
              </Form.Item>
            )}

            {canCreateForOthers && (
              <Form.Item
                name="for_user"
                label="Сотрудник"
                rules={[{ required: true, message: 'Выберите сотрудника' }]}
              >
                <Select
                  showSearch
                  placeholder="Выберите сотрудника"
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    String(option?.children).toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {users.map(u => (
                    <Option key={u.id} value={u.id}>
                      {u.username} ({u.role})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            )}

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  {selectedEvent ? 'Обновить' : 'Создать'}
                </Button>
                <Button onClick={() => setEventModalVisible(false)}>
                  Отмена
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Модальное окно планирования события из календаря */}
        <Modal
          title="Запланировать событие"
          open={calendarModalVisible}
          onCancel={() => setCalendarModalVisible(false)}
          footer={null}
          width={500}
        >
          <Form
            form={calendarForm}
            layout="vertical"
            onFinish={onFinishCalendarEvent}
          >
            <Form.Item name="event_type" label="Тип события" rules={[{ required: true, message: 'Выберите тип события' }]}> 
              <Select>
                <Option value="deadline">Дедлайн</Option>
                <Option value="reminder">Напоминание</Option>
                <Option value="milestone">Веха</Option>
              </Select>
            </Form.Item>
            <Form.Item name="title" label="Заголовок" rules={[{ required: true, message: 'Введите заголовок' }]}> 
              <Input />
            </Form.Item>
            <Form.Item name="description" label="Описание"> 
              <TextArea rows={3} />
            </Form.Item>
            <Form.Item label="Начало события" name="start_date" rules={[{ required: true, message: 'Выберите дату начала' }]}> 
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Конец события" name="end_date" rules={[{ required: true, message: 'Выберите дату окончания' }]}> 
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
            {canCreateForOthers && (
              <Form.Item
                name="for_user"
                label="Сотрудник"
                rules={[{ required: true, message: 'Выберите сотрудника' }]}
              >
                <Select
                  showSearch
                  placeholder="Выберите сотрудника"
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    String(option?.children).toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {users.map(u => (
                    <Option key={u.id} value={u.id}>
                      {u.username} ({u.role})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            )}
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">Запланировать</Button>
                <Button onClick={() => setCalendarModalVisible(false)}>Отмена</Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Модальное окно просмотра события календаря */}
        <Modal
          title={safeString(selectedCalendarEvent?.title) || 'Событие'}
          open={calendarEventModalVisible}
          onCancel={() => setCalendarEventModalVisible(false)}
          footer={null}
          width={500}
        >
          <div style={{ marginBottom: 12 }}>
            <b>Период:</b> {selectedCalendarEvent?.start_date ? dayjs(selectedCalendarEvent.start_date).format('DD.MM.YYYY HH:mm') : ''}
            {selectedCalendarEvent?.end_date ? ` — ${dayjs(selectedCalendarEvent.end_date).format('DD.MM.YYYY HH:mm')}` : ''}
          </div>
          <div style={{ marginBottom: 12 }}>
            <b>Тип:</b> {selectedCalendarEvent?.event_type === 'deadline' ? 'Дедлайн' : selectedCalendarEvent?.event_type === 'reminder' ? 'Напоминание' : 'Веха'}
          </div>
          <div style={{ marginBottom: 12 }}>
            <b>Описание:</b>
            <div style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}>{safeString(selectedCalendarEvent?.description) || '—'}</div>
          </div>
          {selectedCalendarEvent?.is_completed && (
            <div style={{ color: '#52c41a', fontWeight: 500 }}>Выполнено</div>
          )}
        </Modal>

        {/* Модальное окно создания пользователя */}
        <Modal
          title="Создать нового пользователя"
          open={userModalVisible}
          onCancel={() => {
            setUserModalVisible(false);
            setUserEditData(null);
            userForm.resetFields();
          }}
          onOk={() => handleUserAdd()}
          okText="Создать"
          cancelText="Отмена"
          width={600}
        >
          <Form form={userForm} layout="vertical">
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="last_name" label="Фамилия" rules={[{ required: true, message: 'Введите фамилию' }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="first_name" label="Имя" rules={[{ required: true, message: 'Введите имя' }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="patronymic" label="Отчество">
                  <Input />
                </Form.Item>
              </Col>
            </Row>
            
            <Form.Item name="email" label="Email" rules={[
              { required: true, message: 'Введите email' },
              { type: 'email', message: 'Введите корректный email' }
            ]}>
              <Input />
            </Form.Item>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="role" label="Роль" rules={[{ required: true, message: 'Выберите роль' }]}>
                  <Select placeholder="Выберите роль">
                    {availableRoles.map(role => (
                      <Option key={role.value} value={role.value}>{role.label}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="department" label="Департамент">
                  <Select placeholder="Выберите департамент" allowClear>
                    {availableDepartments.map(dept => (
                      <Option key={dept.value} value={dept.value}>{dept.label}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="position" label="Должность">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="phone" label="Телефон">
                  <Input />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>

        {/* Модальное окно создания роли */}
        <Modal
          title="Создать новую роль"
          open={roleModalVisible}
          onCancel={() => {
            setRoleModalVisible(false);
            setRoleEditData(null);
            roleForm.resetFields();
          }}
          onOk={() => handleRoleAdd()}
          okText="Создать"
          cancelText="Отмена"
          width={500}
        >
          <Form form={roleForm} layout="vertical">
            <Form.Item name="name" label="Название роли" rules={[{ required: true, message: 'Введите название роли' }]}>
              <Input />
            </Form.Item>
            
            <Form.Item name="description" label="Описание">
              <TextArea rows={3} />
            </Form.Item>
            
            <Form.Item name="permissions" label="Разрешения">
              <Select mode="multiple" placeholder="Выберите разрешения" allowClear>
                <Option value="read_own_data">Чтение своих данных</Option>
                <Option value="create_requests">Создание запросов</Option>
                <Option value="read_department_data">Чтение данных департамента</Option>
                <Option value="approve_documents">Согласование документов</Option>
                <Option value="manage_users">Управление пользователями</Option>
                <Option value="view_analytics">Просмотр аналитики</Option>
                <Option value="all">Все разрешения</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>

        {/* Модальное окно создания департамента */}
        <Modal
          title="Создать новый департамент"
          open={departmentModalVisible}
          onCancel={() => {
            setDepartmentModalVisible(false);
            setDepartmentEditData(null);
            departmentForm.resetFields();
          }}
          onOk={() => handleDepartmentAdd()}
          okText="Создать"
          cancelText="Отмена"
          width={500}
        >
          <Form form={departmentForm} layout="vertical">
            <Form.Item name="name" label="Название департамента" rules={[{ required: true, message: 'Введите название департамента' }]}>
              <Input />
            </Form.Item>
            
            <Form.Item name="description" label="Описание">
              <TextArea rows={3} />
            </Form.Item>
            
            <Form.Item name="manager_id" label="Руководитель">
              <Select placeholder="Выберите руководителя" allowClear>
                {users.map(user => (
                  <Option key={user.id} value={user.id}>{user.username} ({user.role})</Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </>
  );
};

export default AdminDashboard; 