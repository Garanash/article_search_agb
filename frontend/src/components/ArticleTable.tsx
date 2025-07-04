import React, { useEffect, useState } from "react";
import { getArticles, addArticle, getSuppliers, searchSuppliers, deleteArticle, updateSupplierEmail, whoisCheck, searchEmailPerplexity, deleteSupplier, updateSupplierEmailValidated } from "../api/api";
import { useAuth } from "../context/AuthContext";
import SupplierRow from "./SupplierRow";
import { Table, Button, Input, Space, message, Spin, Typography, Form, Card, Tooltip } from "antd";
import { SearchOutlined, PlusOutlined, ReloadOutlined, MailOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { Resizable } from 'react-resizable';
import 'react-resizable/css/styles.css';
import EmailDialog from "./EmailDialog";
import { LoadingOutlined } from '@ant-design/icons';

const { Title } = Typography;

const ArticleTable: React.FC = () => {
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
    const list = suppliers[articleId] || [];
    for (const supplier of list) {
      if (supplier.website) {
        const res = await whoisCheck([supplier.website]);
        const isValid = res.valid && res.valid.includes(supplier.website);
        if (!isValid && token && supplier.id) {
          // Удаляем из БД и из suppliers
          await deleteSupplier(token, supplier.id);
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
        await updateSupplierEmailValidated(token, supplier.id, valid);
      }
    });
    await Promise.all(patchPromises);
    // После обновления — получить актуальных поставщиков
    if (token) {
      const found = await getSuppliers(token, currentArticleId);
      setSuppliers(prev => ({ ...prev, [currentArticleId]: found }));
    }
  };
  const [currentArticleId, setCurrentArticleId] = useState<number | null>(null);

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

  useEffect(() => {
    if (token) {
      setLoading(true);
      getArticles(token)
        .then(async data => {
          if (Array.isArray(data)) {
            setArticles(data);
            // Автоматически подгружаем поставщиков для всех артикулов
            const allSuppliers: { [key: number]: any[] } = {};
            await Promise.all(
              data.map(async (article: any) => {
                try {
                  const found = await getSuppliers(token, article.id);
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
  }, [token]);

  const handleAdd = async () => {
    if (token && newCode) {
      try {
        const article = await addArticle(token, newCode);
        setArticles(Array.isArray(articles) ? [...articles, article] : [article]);
        setNewCode("");
        message.success("Артикул добавлен");
      } catch {
        message.error("Ошибка добавления артикула");
      }
    }
  };

  const handleSearchSuppliers = async (articleId: number) => {
    if (!token || !articleId) {
      message.error("Ошибка: некорректный articleId или отсутствует токен");
      return;
    }
    setSupLoading((prev) => ({ ...prev, [articleId]: true }));
    try {
      await searchSuppliers(token, articleId);
      const found = await getSuppliers(token, articleId);
      setSuppliers({ ...suppliers, [articleId]: found });
      message.success("Поставщики найдены");
    } catch {
      message.error("Ошибка поиска поставщиков");
    } finally {
      setSupLoading((prev) => ({ ...prev, [articleId]: false }));
    }
  };

  const handleShowSuppliers = async (articleId: number) => {
    if (token) {
      setSupLoading((prev) => ({ ...prev, [articleId]: true }));
      try {
        const found = await getSuppliers(token, articleId);
        setSuppliers({ ...suppliers, [articleId]: found });
      } catch {
        message.error("Ошибка загрузки поставщиков");
      } finally {
        setSupLoading((prev) => ({ ...prev, [articleId]: false }));
      }
    }
  };

  const handleDelete = async (articleId: number) => {
    if (token) {
      try {
        await deleteArticle(token, articleId);
        setArticles(articles.filter((a) => a.id !== articleId));
        message.success("Артикул удалён");
      } catch {
        message.error("Ошибка удаления артикула");
      }
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
          setTimeout(() => setSuppliers(prev => ({ ...prev })), 0);

          await updateSupplierEmail(token, supplier.id, email);

          // Через 1 секунду синхронизируем с сервером (чтобы email гарантированно сохранился)
          setTimeout(() => {
            (async () => {
              if (articleId) {
                const found = await getSuppliers(token, articleId);
                setSuppliers(prev => ({ ...prev, [articleId]: found }));
              }
            })();
          }, 1000);

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
        setTimeout(() => setSuppliers(prev => ({ ...prev })), 0);

        await updateSupplierEmail(token, supplier.id, email);

        // Через 1 секунду синхронизируем с сервером (чтобы email гарантированно сохранился)
        setTimeout(() => {
          (async () => {
            if (articleId) {
              const found = await getSuppliers(token, articleId);
              setSuppliers(prev => ({ ...prev, [articleId]: found }));
            }
          })();
        }, 1000);

        message.success("Email сохранён");
      } catch {
        message.error("Ошибка сохранения email");
      }
    } else {
      message.error("Ошибка: некорректные данные для сохранения email");
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
      await deleteSupplier(token, supplierId);
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
      title: "Компания",
      dataIndex: "name",
      key: "name",
      width: supplierColWidths.name,
      ellipsis: false,
      sorter: (a, b) => a.name.localeCompare(b.name),
      showSorterTooltip: false,
      render: (text: string) => <div style={{whiteSpace:'pre-line', wordBreak:'break-word', maxWidth:supplierColWidths.name}}>{text}</div>,
      onHeaderCell: (col: any) => ({ width: supplierColWidths.name, onResize: handleResize('name') }),
    },
    {
      title: (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span style={{ textAlign: 'center', width: '100%' }}>Сайт</span>
          <Button size="small" type="default" style={{ marginTop: 2, minWidth: 70, padding: '0 8px' }} onClick={() => handleWhoisCheckAll(currentArticleId || 0)}>
            whois all
          </Button>
        </div>
      ),
      dataIndex: "website",
      key: "website",
      width: supplierColWidths.website,
      ellipsis: false,
      sorter: (a, b) => (a.website || '').localeCompare(b.website || ''),
      showSorterTooltip: false,
      render: (text: string, supplier: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
          <Button
            type="default"
            href={text}
            target="_blank"
            rel="noopener noreferrer"
            style={{ width: 90, minWidth: 90, padding: 0 }}
          >
            Сайт
          </Button>
          <Button
            size="small"
            style={{
              width: 90,
              minWidth: 90,
              padding: 0,
              background:
                whoisStatus[supplier.website] === 'valid' ? '#d6f5d6' :
                whoisStatus[supplier.website] === 'invalid' ? '#ffd6d6' : undefined,
              borderColor:
                whoisStatus[supplier.website] === 'valid' ? '#52c41a' :
                whoisStatus[supplier.website] === 'invalid' ? '#ff4d4f' : undefined,
              color: whoisStatus[supplier.website] === 'valid' ? '#389e0d' :
                whoisStatus[supplier.website] === 'invalid' ? '#a8071a' : undefined
            }}
            onClick={() => handleWhoisCheck(supplier.website)}
            loading={whoisStatus[supplier.website] === 'checking'}
            disabled={whoisStatus[supplier.website] === 'checking'}
            icon={whoisStatus[supplier.website] === 'checking' ? <LoadingOutlined spin style={{ fontSize: 14 }} /> : null}
          >
            Whois
          </Button>
        </div>
      ),
      onHeaderCell: (col: any) => ({ width: supplierColWidths.website, onResize: handleResize('website') }),
    },
    {
      title: (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span style={{ textAlign: 'center', width: '100%' }}>Email</span>
          <Button size="small" type="default" style={{ marginTop: 2, minWidth: 70, padding: '0 8px' }} onClick={handleValidateAllEmails}>
            Валидация всех
          </Button>
        </div>
      ),
      dataIndex: "email",
      key: "email",
      width: supplierColWidths.email,
      ellipsis: false,
      sorter: (a, b) => (a.email || '').localeCompare(b.email || ''),
      showSorterTooltip: false,
      render: (_: string, supplier: any, idx: number) => {
        if (!supplier.id) {
          return <span style={{ color: '#888' }}>Нет данных</span>;
        }
        if (supplier.email) {
          const isInvalid = invalidEmails[supplier.id];
          return (
            <span>
              <a href={`mailto:${supplier.email}`} style={isInvalid ? { color: 'red', fontWeight: 600 } : {}}>{supplier.email}</a>
              {Boolean(supplier.email_validated) && <span style={{ marginLeft: 6 }}>✅</span>}
            </span>
          );
        }
        if (editingEmail[supplier.id]) {
          return (
            <div style={{ display: 'flex', gap: 4 }}>
              <Input
                size="small"
                value={manualEmails[supplier.id] || ""}
                onChange={e => setManualEmails(prev => ({ ...prev, [supplier.id]: e.target.value }))}
                style={{ width: 90 }}
                placeholder="Введите email"
              />
              <Button size="small" type="primary" onClick={() => handleManualEmailSave(supplier, supplier.article_id)}>OK</Button>
              <Button size="small" onClick={() => setEditingEmail(prev => ({ ...prev, [supplier.id]: false }))}>Отмена</Button>
            </div>
          );
        }
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Tooltip title="Поиск email">
              <Button
                size="small"
                icon={<SearchOutlined />}
                loading={emailSearchLoading[supplier.id]}
                onClick={() => handleEmailSearch(supplier, supplier.article_id)}
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
      title: "Страна",
      dataIndex: "country",
      key: "country",
      width: supplierColWidths.country,
      ellipsis: false,
      sorter: (a, b) => (a.country || '').localeCompare(b.country || ''),
      showSorterTooltip: false,
      render: (text: string) => <div style={{whiteSpace:'pre-line', wordBreak:'break-word', maxWidth:supplierColWidths.country}}>{text}</div>,
      onHeaderCell: (col: any) => ({ width: supplierColWidths.country, onResize: handleResize('country') }),
    },
    {
      title: "Письмо",
      key: "emailAction",
      width: supplierColWidths.emailAction,
      sorter: false,
      showSorterTooltip: false,
      render: (_: any, supplier: any) => (
        <Button icon={<MailOutlined />} onClick={() => setEmailDialogSupplier(supplier)}>
          Письмо
        </Button>
      ),
      onHeaderCell: (col: any) => ({ width: supplierColWidths.emailAction, onResize: handleResize('emailAction') }),
    },
    {
      title: "Удаление",
      key: "deleteSupplier",
      width: 60,
      sorter: false,
      showSorterTooltip: false,
      render: (_: any, supplier: any) => (
        <Button danger size="small" onClick={() => handleRemoveSupplier(supplier.article_id, supplier.id)}>
          Удалить
        </Button>
      ),
      onHeaderCell: (col: any) => ({ width: 60, onResize: handleResize('deleteSupplier') }),
    },
  ];

  return (
    <div style={{ display: 'flex', justifyContent: 'center', minHeight: '100vh' }}>
      <Card style={{ marginBottom: 32, maxWidth: 2200, minWidth: 1200 }}>
        <Title level={4}>Артикулы</Title>
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
        </Space>
        <Spin spinning={loading} tip="Загрузка...">
          <Table
            dataSource={Array.isArray(articles) ? articles : []}
            rowKey="id"
            pagination={false}
            bordered
            scroll={{ x: 500 }}
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
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
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
                    <Button danger onClick={() => handleDelete(article.id)}>
                      Удалить
                    </Button>
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