import React, { useEffect, useState, useRef } from "react";
import { getArticles, addArticle, getSuppliers, searchSuppliers, deleteArticle, updateSupplierEmail, whoisCheck, searchEmailPerplexity, deleteSupplier, updateSupplierEmailValidated, createRequest, addArticleToRequest, removeArticleFromRequest, getRequests, getArticlesByRequest } from "../api/api";
import { useAuth } from "../context/AuthContext";
import SupplierRow from "./SupplierRow";
import { Table, Button, Input, Space, message, Spin, Typography, Form, Card, Tooltip, Modal, Select } from "antd";
import { SearchOutlined, PlusOutlined, ReloadOutlined, MailOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { Resizable } from 'react-resizable';
import 'react-resizable/css/styles.css';
import EmailDialog from "./EmailDialog";
import { LoadingOutlined } from '@ant-design/icons';
import Papa from "papaparse";

const { Title } = Typography;

interface ArticleTableProps {
  activeRequestId: number | null;
  requests: any[];
  setRequests: React.Dispatch<React.SetStateAction<any[]>>;
}

const ArticleTable: React.FC<ArticleTableProps> = ({ activeRequestId, requests, setRequests }) => {
  const { token } = useAuth();
  const [articles, setArticles] = useState<any[]>([]);
  const [newCode, setNewCode] = useState("");
  const [suppliers, setSuppliers] = useState<{ [key: number]: any[] }>({});
  const [loading, setLoading] = useState(false);
  const [supLoading, setSupLoading] = useState<{ [key: number]: boolean }>({});
  const [editingEmail, setEditingEmail] = useState<{ [key: number]: boolean }>({});
  const [manualEmails, setManualEmails] = useState<{ [key: number]: string }>({});
  const [emailDialogSupplier, setEmailDialogSupplier] = useState<any>(null);
  // Изменить ширину столбцов
  const [supplierColWidths, setSupplierColWidths] = useState({
    name: 140,
    website: 110,
    email: 160,
    country: 120,
    emailAction: 100,
  });
  const [emailSearchLoading, setEmailSearchLoading] = useState<{ [key: number]: boolean }>({});
  const [whoisStatus, setWhoisStatus] = useState<{ [key: string]: 'valid' | 'invalid' | 'checking' | undefined }>({});
  // 1. Кнопка массовой проверки whois
  const handleWhoisCheckAll = async (articleId: number) => {
    let list = suppliers[articleId] || [];
    // Удаляем дубликаты по website (оставляем первую запись для каждого сайта)
    const seen = new Set<string>();
    const uniqueSuppliers: typeof list = [];
    const duplicatesToDelete: typeof list = [];
    for (const supplier of list) {
      if (!supplier.website) {
        uniqueSuppliers.push(supplier);
        continue;
      }
      if (seen.has(supplier.website)) {
        duplicatesToDelete.push(supplier);
      } else {
        seen.add(supplier.website);
        uniqueSuppliers.push(supplier);
      }
    }
    // Удаляем дубликаты из базы
    if (duplicatesToDelete.length > 0 && token) {
      await Promise.all(
        duplicatesToDelete.map(supplier => supplier.id && deleteSupplier(supplier.id))
      );
      setSuppliers(prev => ({ ...prev, [articleId]: uniqueSuppliers }));
      list = uniqueSuppliers;
    }
    for (const supplier of list) {
      if (supplier.website) {
        const res = await whoisCheck([supplier.website]);
        const isValid = res.valid && res.valid.includes(supplier.website);
        if (!isValid && token && supplier.id) {
          // Удаляем из БД и из suppliers
          await deleteSupplier(supplier.id);
          setSuppliers(prev => {
            const arr = Array.isArray(prev[articleId]) ? [...prev[articleId]] : [];
            return { ...prev, [articleId]: arr.filter(s => s.id !== supplier.id) };
          });
        } else {
          // Обновляем статус только если сайт валиден
          handleWhoisCheck(supplier.website);
        }
      }
    }
  };
  // 2. Кнопка массовой валидации email
  const [invalidEmails, setInvalidEmails] = useState<{ [key: number]: boolean }>({});
  // Изменить функцию handleValidateAllEmails так, чтобы она валидировала все email всех компаний всех артикулов
  const handleValidateAllEmails = async () => {
    if (!currentArticleId) return;
    const list = suppliers[currentArticleId] || [];
    const patchPromises = list.map(async supplier => {
      const email = supplier.email || "";
      const valid = typeof email === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
      if (token && supplier.id) {
        await updateSupplierEmailValidated(supplier.id, valid);
      }
    });
    await Promise.all(patchPromises);
    // После обновления — получить актуальных поставщиков
    if (token) {
      const found = await getSuppliers(currentArticleId);
      setSuppliers(prev => ({ ...prev, [currentArticleId]: found }));
    }
  };
  const [currentArticleId, setCurrentArticleId] = useState<number | null>(null);
  // --- Invoice -> Request ---
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestNumber, setRequestNumber] = useState("");
  const [creatingRequest, setCreatingRequest] = useState(false);
  const [sourceRequestIds, setSourceRequestIds] = useState<number[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // Автогенерация номера запроса
  const generateRequestNumber = () => {
    const now = new Date();
    return `ВЭД-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;
  };

  // При открытии модалки — автозаполнять номер
  useEffect(() => {
    if (showRequestModal) {
      setRequestNumber(generateRequestNumber());
    }
  }, [showRequestModal]);

  // useEffect для загрузки состояния из localStorage
  useEffect(() => {
    const saved = localStorage.getItem('whoisStatus');
    if (saved) {
      try {
        setWhoisStatus(JSON.parse(saved));
      } catch {}
    }
  }, []);
  // useEffect для сохранения состояния в localStorage
  useEffect(() => {
    localStorage.setItem('whoisStatus', JSON.stringify(whoisStatus));
  }, [whoisStatus]);

  const handleResize = (dataIndex: string) => (e: any, { size }: any) => {
    setSupplierColWidths((prev) => ({ ...prev, [dataIndex]: size.width }));
  };

  const ResizableTitle = (props: any) => {
    const { onResize, width, ...restProps } = props;
    if (!width) return <th {...restProps} />;
    return (
      <Resizable width={width} height={0} handle={<span className="react-resizable-handle" />} onResize={onResize} draggableOpts={{ enableUserSelectHack: false }}>
        <th {...restProps} style={{ ...restProps.style, whiteSpace: 'nowrap' }} />
      </Resizable>
    );
  };

  // Состояние: для каких артикулов уже была проверка
  const [checkedArticles, setCheckedArticles] = useState<{ [id: number]: boolean }>({});

  // useEffect для автоматической проверки при первой загрузке
  useEffect(() => {
    if (token) {
      setLoading(true);
      getArticles()
        .then(async data => {
          if (Array.isArray(data)) {
            // Фильтрация по инвойсу, если задан
            let filtered;
            if (activeRequestId) {
              filtered = data.filter((a: any) => a.request_id === activeRequestId);
            } else {
              filtered = data.filter((a: any) => !a.request_id);
            }
            setArticles(filtered);
            // Автоматически подгружаем поставщиков для всех артикулов (без валидации)
            const allSuppliers: { [key: number]: any[] } = {};
            await Promise.all(
              filtered.map(async (article: any) => {
                try {
                  let found = await getSuppliers(article.id);
                  allSuppliers[article.id] = found;
                } catch {
                  allSuppliers[article.id] = [];
                }
              })
            );
            setSuppliers(allSuppliers);
          } else {
            setArticles([]);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [token, activeRequestId]);

  const handleAdd = async () => {
    if (token && newCode) {
      try {
        await addArticle(newCode);
        // После добавления — всегда обновлять список с сервера (чтобы подтянуть существующий артикул)
        const newArticles = await getArticles();
        setArticles(Array.isArray(newArticles) ? newArticles.filter((a: any) => !a.request_id) : []);
        setNewCode("");
        message.success("Артикул добавлен");
      } catch {
        message.error("Ошибка добавления артикула");
      }
    }
  };

  // Сброс флага checkedArticles при изменении состава компаний (например, после поиска поставщиков)
  const handleSearchSuppliers = async (articleId: number) => {
    if (!token || !articleId) {
      message.error("Ошибка: некорректный articleId или отсутствует токен");
      return;
    }
    setSupLoading((prev) => ({ ...prev, [articleId]: true }));
    try {
      await searchSuppliers(articleId);
      let found = await getSuppliers(articleId);
      
      // Проверяем только если ещё не было
      if (!checkedArticles[articleId]) {
        // Удаляем дубликаты и проверяем whois только при первом поиске
        found = await removeSupplierDuplicates(articleId, found);
        setSuppliers(prev => ({ ...prev, [articleId]: found }));
        await checkAllWhois(found, articleId);
        setCheckedArticles(prev => ({ ...prev, [articleId]: true }));
      } else {
        setSuppliers(prev => ({ ...prev, [articleId]: found }));
      }
      
      message.success("Поставщики найдены");
    } catch {
      message.error("Ошибка поиска поставщиков");
    } finally {
      setSupLoading((prev) => ({ ...prev, [articleId]: false }));
    }
  };

  // Удаляем дубликаты по website и возвращаем уникальных, а дубликаты удаляем из базы
  const removeSupplierDuplicates = async (articleId: number, list: any[]) => {
    if (!token) return list;
    const seen = new Set<string>();
    const uniqueSuppliers: typeof list = [];
    const duplicatesToDelete: typeof list = [];
    for (const supplier of list) {
      if (!supplier.website) {
        uniqueSuppliers.push(supplier);
        continue;
      }
      if (seen.has(supplier.website)) {
        duplicatesToDelete.push(supplier);
      } else {
        seen.add(supplier.website);
        uniqueSuppliers.push(supplier);
      }
    }
    if (duplicatesToDelete.length > 0) {
      await Promise.all(
        duplicatesToDelete.map(supplier => supplier.id && deleteSupplier(supplier.id))
      );
    }
    return uniqueSuppliers;
  };

  // Массoвая проверка whois для всех компаний
  const checkAllWhois = async (suppliersList: any[], articleId?: number) => {
    for (const supplier of suppliersList) {
      if (supplier.website) {
        const res = await whoisCheck([supplier.website]);
        const isValid = res.valid && res.valid.includes(supplier.website);
        if (!isValid && token && supplier.id && articleId) {
          // Удаляем из БД и из suppliers
          await deleteSupplier(supplier.id);
          setSuppliers(prev => {
            const arr = Array.isArray(prev[articleId]) ? [...prev[articleId]] : [];
            return { ...prev, [articleId]: arr.filter(s => s.id !== supplier.id) };
          });
        } else {
          // Обновляем статус только если сайт валиден
          handleWhoisCheck(supplier.website);
        }
      }
    }
  };

  // handleShowSuppliers: просто загружаем поставщиков без валидации
  const handleShowSuppliers = async (articleId: number) => {
    if (token) {
      setSupLoading((prev) => ({ ...prev, [articleId]: true }));
      try {
        let found = await getSuppliers(articleId);
        setSuppliers(prev => ({ ...prev, [articleId]: found }));
      } catch {
        message.error("Ошибка загрузки поставщиков");
      } finally {
        setSupLoading((prev) => ({ ...prev, [articleId]: false }));
      }
    }
  };

  const handleDelete = async (articleId: number) => {
    if (!token) return;
    if (activeRequestId) {
      // Если выбран инвойс — просто убрать артикул из инвойса
      await removeArticleFromRequest(activeRequestId, articleId);
      setArticles(articles.filter((a) => a.id !== articleId));
      message.success("Артикул убран из инвойса");
    } else {
      // Если "Все артикулы" — полностью удалить артикул из базы (НЕ трогать request_id у других артикулов)
      await deleteArticle(articleId);
      setArticles(articles.filter((a) => a.id !== articleId));
      message.success("Артикул удалён");
    }
  };

  const handleEmailSearch = async (supplier: any, articleId: number) => {
    setEmailSearchLoading((prev) => ({ ...prev, [supplier.id]: true }));
    try {
      const res = await searchEmailPerplexity(supplier.name, supplier.website, supplier.country || "");
      const email = res.email || "";
      if (email) {
        if (token && supplier.id && typeof email === 'string') {
          // Оптимистично обновляем suppliers на фронте
          setSuppliers(prev => {
            const arr = Array.isArray(prev[articleId]) ? [...prev[articleId]] : [];
            const updated = arr.map((s) =>
              String(s.id) === String(supplier.id) ? { ...s, email } : s
            );
            return { ...prev, [articleId]: updated };
          });
          setEditingEmail((prev) => ({ ...prev, [supplier.id]: false }));

          // Сохраняем в базу данных
          await updateSupplierEmail(supplier.id, email);

          message.success(`Email найден: ${email}`);
        } else {
          message.error("Ошибка: некорректные данные для обновления email");
        }
      } else {
        message.info("Email не найден через Perplexity");
      }
    } catch {
      message.error("Ошибка поиска email через Perplexity");
    } finally {
      setEmailSearchLoading((prev) => ({ ...prev, [supplier.id]: false }));
    }
  };

  const handleManualEmailSave = async (supplier: any, articleId: number) => {
    const email = manualEmails[supplier.id];
    if (email && token && supplier.id && typeof email === 'string') {
      try {
        // Оптимистично обновляем suppliers на фронте
        setSuppliers(prev => {
          const arr = Array.isArray(prev[articleId]) ? [...prev[articleId]] : [];
          const updated = arr.map((s) =>
            String(s.id) === String(supplier.id) ? { ...s, email } : s
          );
          return { ...prev, [articleId]: updated };
        });
        setEditingEmail((prev) => ({ ...prev, [supplier.id]: false }));
        setManualEmails((prev) => ({ ...prev, [supplier.id]: "" }));

        // Сохраняем в базу данных
        await updateSupplierEmail(supplier.id, email);

        message.success(`Email сохранен: ${email}`);
      } catch {
        message.error("Ошибка сохранения email");
      }
    }
  };

  const handleWhoisCheck = async (website: string) => {
    setWhoisStatus(prev => ({ ...prev, [website]: 'checking' }));
    try {
      const res = await whoisCheck([website]);
      if (res.valid && res.valid.includes(website)) {
        setWhoisStatus(prev => ({ ...prev, [website]: 'valid' }));
      } else {
        setWhoisStatus(prev => ({ ...prev, [website]: 'invalid' }));
      }
    } catch {
      setWhoisStatus(prev => ({ ...prev, [website]: 'invalid' }));
    }
  };

  const handleRemoveSupplier = async (articleId: number, supplierId: number) => {
    if (!token) return;
    setSuppliers(prev => {
      const arr = Array.isArray(prev[articleId]) ? [...prev[articleId]] : [];
      const updated = arr.filter((s) => s.id !== supplierId);
      const newSuppliers = { ...prev, [articleId]: updated };
      if (updated.length === 0 && currentArticleId === articleId) {
        setCurrentArticleId(null);
      }
      return newSuppliers;
    });
    try {
      await deleteSupplier(supplierId);
      message.success("Поставщик удалён");
    } catch {
      // Откатить, если ошибка
      setSuppliers(prev => {
        const arr = Array.isArray(prev[articleId]) ? [...prev[articleId]] : [];
        return { ...prev, [articleId]: arr };
      });
      message.error("Ошибка удаления поставщика");
    }
  };

  const supplierColumns: ColumnsType<any> = [
    {
      title: <span style={{ textAlign: 'center', width: '100%' }}>Компания</span>,
      dataIndex: "name",
      key: "name",
      width: supplierColWidths.name,
      ellipsis: false,
      sorter: (a, b) => a.name.localeCompare(b.name),
      showSorterTooltip: false,
      render: (text: string) => (
        <div style={{ 
          whiteSpace: 'pre-line', 
          wordBreak: 'break-word', 
          maxWidth: supplierColWidths.name,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          textAlign: 'center'
        }}>
          {text}
        </div>
      ),
      onHeaderCell: (col: any) => ({ width: supplierColWidths.name, onResize: handleResize('name') }),
    },
    {
      title: <span style={{ textAlign: 'center', width: '100%' }}>Сайт</span>,
      dataIndex: "website",
      key: "website",
      width: supplierColWidths.website,
      ellipsis: false,
      sorter: (a, b) => (a.website || '').localeCompare(b.website || ''),
      showSorterTooltip: false,
      render: (text: string, supplier: any) => (
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <Button
            type="default"
            href={text}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              width: 90,
              minWidth: 90,
              padding: 0,
              border: whoisStatus[supplier.website] === 'valid' ? '2px solid #52c41a' : undefined,
              boxShadow: whoisStatus[supplier.website] === 'valid' ? '0 0 0 2px #b7eb8f' : undefined
            }}
          >
            Сайт
          </Button>
        </div>
      ),
      onHeaderCell: (col: any) => ({ width: supplierColWidths.website, onResize: handleResize('website') }),
    },
    {
      title: <span style={{ textAlign: 'center', width: '100%' }}>Email</span>,
      dataIndex: "email",
      key: "email",
      width: supplierColWidths.email,
      ellipsis: false,
      sorter: (a, b) => (a.email || '').localeCompare(b.email || ''),
      showSorterTooltip: false,
      render: (_: string, supplier: any, idx: number) => {
        if (!supplier.id) {
          return (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              width: '100%',
              color: '#888' 
            }}>
              Нет данных
            </div>
          );
        }
        if (supplier.email) {
          return (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              width: '100%'
            }}>
              <a href={`mailto:${supplier.email}`}>{supplier.email}</a>
            </div>
          );
        }
        if (editingEmail[supplier.id]) {
          return (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              <Input
                size="small"
                value={manualEmails[supplier.id] || ""}
                onChange={e => setManualEmails(prev => ({ ...prev, [supplier.id]: e.target.value }))}
                style={{ width: 90 }}
                placeholder="Введите email"
              />
              <Button size="small" type="primary" onClick={() => handleManualEmailSave(supplier, currentArticleId || 0)}>OK</Button>
              <Button size="small" onClick={() => setEditingEmail(prev => ({ ...prev, [supplier.id]: false }))}>Отмена</Button>
            </div>
          );
        }
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <Tooltip title="Поиск email">
              <Button
                size="small"
                icon={<SearchOutlined />}
                loading={emailSearchLoading[supplier.id]}
                onClick={() => handleEmailSearch(supplier, currentArticleId || 0)}
              >
                Поиск email
              </Button>
            </Tooltip>
            <Tooltip title="Внести email вручную">
              <Button
                size="small"
                icon={<PlusOutlined />}
                onClick={() => setEditingEmail(prev => ({ ...prev, [supplier.id]: true }))}
              >
                Внести email
              </Button>
            </Tooltip>
          </div>
        );
      },
      onHeaderCell: (col: any) => ({ width: supplierColWidths.email, onResize: handleResize('email') }),
    },
    {
      title: <span style={{ textAlign: 'center', width: '100%' }}>Страна</span>,
      dataIndex: "country",
      key: "country",
      width: supplierColWidths.country,
      ellipsis: false,
      sorter: (a, b) => (a.country || '').localeCompare(b.country || ''),
      showSorterTooltip: false,
      render: (text: string) => (
        <div style={{
          whiteSpace: 'pre-line', 
          wordBreak: 'break-word', 
          maxWidth: supplierColWidths.country,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          textAlign: 'center'
        }}>
          {text}
        </div>
      ),
      onHeaderCell: (col: any) => ({ width: supplierColWidths.country, onResize: handleResize('country') }),
    },
    {
      title: <span style={{ textAlign: 'center', width: '100%' }}>Письмо</span>,
      key: "emailAction",
      width: supplierColWidths.emailAction,
      sorter: false,
      showSorterTooltip: false,
      render: (_: any, supplier: any) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <Button icon={<MailOutlined />} onClick={() => setEmailDialogSupplier(supplier)}>
            Письмо
          </Button>
        </div>
      ),
      onHeaderCell: (col: any) => ({ width: supplierColWidths.emailAction, onResize: handleResize('emailAction') }),
    },
    {
      title: <span style={{ textAlign: 'center', width: '100%' }}>Удаление</span>,
      key: "deleteSupplier",
      width: 60,
      sorter: false,
      showSorterTooltip: false,
      render: (_: any, supplier: any) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <Button danger size="small" onClick={() => handleRemoveSupplier(currentArticleId || 0, supplier.id)}>
            Удалить
          </Button>
        </div>
      ),
      onHeaderCell: (col: any) => ({ width: 60, onResize: handleResize('deleteSupplier') }),
    },
  ];

  // Получить все артикулы, которые сейчас отображаются в таблице (для создания инвойса)
  const articlesToAdd = articles.filter(a => selectedRowKeys.includes(a.id));

  // Создание инвойса из текущих артикулов
  const handleCreateRequest = async () => {
    if (!token || !requestNumber || articlesToAdd.length === 0) return;
    setCreatingRequest(true);
    try {
      // 1. Создать запрос
      const request = await createRequest(requestNumber);
      // 2. Привязать выбранные артикулы
      await Promise.all(
        articlesToAdd.map((a: any) => addArticleToRequest(request.id, a.id))
      );
      message.success("Запрос создан и артикулы добавлены!");
      setShowRequestModal(false);
      setRequestNumber("");
      setSelectedRowKeys([]);
      
      // Обновляем список артикулов и запросов
      const [newArticles, newRequests] = await Promise.all([
        getArticles(),
        getRequests()
      ]);
      
      // Фильтруем артикулы, которые не привязаны к запросам
      const filteredArticles = Array.isArray(newArticles) ? newArticles.filter((a: any) => !a.request_id) : [];
      setArticles(filteredArticles);
      setRequests(Array.isArray(newRequests) ? newRequests : []);
    } catch (e: any) {
      if (e && e.message && e.message.includes('UNIQUE constraint failed: requests.number')) {
        message.error('Запрос с таким номером уже существует!');
      } else {
        message.error("Ошибка создания запроса");
      }
    } finally {
      setCreatingRequest(false);
    }
  };

  // Удаление артикула из инвойса
  const handleRemoveFromRequest = async (articleId: number) => {
    if (!token || !activeRequestId) return;
    try {
      await removeArticleFromRequest(activeRequestId, articleId);
      message.success("Артикул убран из инвойса");
      // Обновить список артикулов (убрать из текущего инвойса)
      setArticles(prev => prev.filter(a => a.id !== articleId));
    } catch {
      message.error("Ошибка удаления артикула из инвойса");
    }
  };

  // Импорт артикулов из CSV
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      message.error('Файл не выбран');
      console.log('handleImport: файл не выбран');
      return;
    }
    if (!token) {
      message.error('Нет авторизации');
      console.log('handleImport: нет токена');
      return;
    }
    message.loading({ content: 'Импортируем...', key: 'import' });
    console.log('handleImport: начинаем импорт', file.name);
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: async (results) => {
        console.log('handleImport: результат парсинга', results);
        const codes = results.data.map((row: any) => Array.isArray(row) ? row[0] : row);
        const filtered = codes.filter((code: any) => typeof code === 'string' && code.trim());
        if (filtered.length === 0) {
          message.error({ content: 'В файле нет валидных артикулов', key: 'import' });
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }
        try {
          const addResults = await Promise.allSettled(filtered.map((code: string) => addArticle(code.trim())));
          console.log('handleImport: результаты добавления', addResults);
          // После импорта — обновить список артикулов
          const updatedArticles = await getArticles();
          setArticles(Array.isArray(updatedArticles) ? updatedArticles.filter((a: any) => !a.request_id) : []);
          message.success({ content: `Артикулы импортированы: ${filtered.length}`, key: 'import' });
        } catch (err) {
          message.error({ content: 'Ошибка при добавлении артикулов', key: 'import' });
          console.error('handleImport: ошибка при добавлении артикулов', err);
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
      error: (err) => {
        message.error({ content: 'Ошибка импорта файла', key: 'import' });
        console.error('handleImport: ошибка парсинга', err);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    });
  };

  // Автоматическая ширина для столбца "Страна"
  useEffect(() => {
    // Собираем все страны из suppliers
    const allCountries: string[] = [];
    Object.values(suppliers).forEach(supList => {
      supList.forEach(sup => {
        if (sup.country && typeof sup.country === 'string') {
          allCountries.push(sup.country);
        }
      });
    });
    if (allCountries.length > 0) {
      const maxLen = Math.max(...allCountries.map(c => c.length));
      // Примерно 10px на символ + запас, максимум как на 12 символов
      const width = Math.max(80, Math.min(152, maxLen * 10 + 32));
      setSupplierColWidths(prev => ({ ...prev, country: width }));
    }
  }, [suppliers]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', minHeight: '100vh', width: '100%' }}>
      <Card style={{ marginBottom: 32, width: '100%', maxWidth: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
            {activeRequestId ? 
              requests.find(r => r.id === activeRequestId)?.number || 'Запрос ВЭД' 
              : 'Все артикулы'
            }
          </Title>
        </div>
        {/* Кнопка создания запроса */}
        {!activeRequestId && articlesToAdd.length > 0 && (
          <Button type="primary" style={{ marginBottom: 16 }} onClick={() => setShowRequestModal(true)}>
            Создать запрос из этих артикулов
          </Button>
        )}
        <Modal
          open={showRequestModal}
          title="Создать запрос"
          onCancel={() => setShowRequestModal(false)}
          onOk={handleCreateRequest}
          confirmLoading={creatingRequest}
          okText="Создать"
          cancelText="Отмена"
        >
          <Input
            placeholder="Введите номер запроса"
            value={requestNumber}
            onChange={e => setRequestNumber(e.target.value)}
            onPressEnter={handleCreateRequest}
            disabled={creatingRequest}
          />
        </Modal>
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder="Введите артикул"
            value={newCode}
            onChange={e => setNewCode(e.target.value)}
            onPressEnter={handleAdd}
            style={{ width: 200 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Добавить
          </Button>
          <label style={{ marginLeft: 12 }}>
            <Button>Импорт CSV</Button>
            <input ref={fileInputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImport} />
          </label>
        </Space>
        <Spin spinning={loading} tip="Загрузка...">
          <Table
            className="article-table"
            dataSource={Array.isArray(articles) ? articles : []}
            rowKey="id"
            pagination={false}
            bordered
            scroll={{ x: 500 }}
            rowSelection={!activeRequestId ? {
              selectedRowKeys,
              onChange: setSelectedRowKeys,
              preserveSelectedRowKeys: true,
            } : undefined}
            columns={[
              {
                title: "Артикул",
                dataIndex: "code",
                key: "code",
                width: 200,
                ellipsis: true,
                render: (text, article) => (
                  <span style={{
                    background: suppliers[article.id] && suppliers[article.id].length > 0 ? '#d6f5d6' : undefined,
                    borderRadius: 4,
                    padding: '2px 8px',
                    display: 'inline-block',
                    transition: 'background 0.3s',
                  }}>{text}</span>
                ),
                sorter: (a, b) => (a.code || '').localeCompare(b.code || ''),
                showSorterTooltip: false,
              },
              {
                title: "Поставщики",
                key: "actions",
                width: 400,
                render: (_, article) => (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }} className="action-buttons">
                    <Button
                      type="primary"
                      size="large"
                      style={{ minWidth: 200, fontWeight: 600 }}
                      icon={suppliers[article.id] && suppliers[article.id].length > 0 ? <ReloadOutlined /> : <SearchOutlined />}
                      loading={supLoading[article.id]}
                      onClick={() => handleSearchSuppliers(article.id)}
                    >
                      Найти поставщиков
                    </Button>
                    {/* Кнопка удалить только если не выбран запрос */}
                    {!activeRequestId && (
                      <Button danger onClick={() => handleDelete(article.id)}>
                        Удалить
                      </Button>
                    )}
                    {/* Кнопка убрать из запроса */}
                    {activeRequestId && (
                      <Button danger onClick={() => handleRemoveFromRequest(article.id)}>
                        Убрать из запроса
                      </Button>
                    )}
                  </div>
                ),
                sorter: false,
                showSorterTooltip: false,
              },
            ]}
            rowClassName={(record) => suppliers[record.id] && suppliers[record.id].length > 0 ? 'article-has-suppliers' : ''}
            expandable={{
              expandedRowRender: (article) => (
                <div style={{ padding: 0 }}>
                  {suppliers[article.id] && suppliers[article.id].length > 0 ? (
                    <Table
                      dataSource={Array.isArray(suppliers[article.id]) ? suppliers[article.id] : []}
                      rowKey="id"
                      pagination={false}
                      size="small"
                      columns={supplierColumns}
                      components={{ header: { cell: ResizableTitle } }}
                      scroll={{ x: Object.values(supplierColWidths).reduce((a, b) => a + b, 0) + 50 }}
                      bordered
                      style={{ minWidth: Object.values(supplierColWidths).reduce((a, b) => a + b, 0) + 50, background: '#fff', borderRadius: 8 }}
                    />
                  ) : (
                    <span style={{ color: "#888" }}>Нет данных</span>
                  )}
                </div>
              ),
              onExpand: (expanded, article) => {
                if (expanded && !suppliers[article.id]) {
                  handleShowSuppliers(article.id);
                }
                setCurrentArticleId(expanded ? article.id : null);
              },
            }}
          />
        </Spin>
        {emailDialogSupplier && (
          <EmailDialog supplier={emailDialogSupplier} onClose={() => setEmailDialogSupplier(null)} />
        )}
        <style>{`
.react-resizable-handle {
  display: none !important;
}
.article-has-suppliers td {
  background: #d6f5d6 !important;
  transition: background 0.3s;
}
`}</style>
      </Card>
    </div>
  );
};

export default ArticleTable;