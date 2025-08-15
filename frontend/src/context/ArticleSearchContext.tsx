import React, { createContext, useContext, useState, useEffect } from 'react';
import { message } from 'antd';
import { apiClient } from '../api/api';

type Article = {
  id: number;
  code: string;
  name: string;
  supplier: string;
};

type Invoice = {
  id: number;
  number: string;
  created_at: string;
  article_count: number;
  articles: Article[];
};

type ArticleSearchContextType = {
  selectedInvoice: Invoice | null;
  invoices: Invoice[];
  articles: Article[];
  loading: boolean;
  searchArticles: (query: string) => Promise<void>;
  addToInvoice: (article: Article) => void;
  createInvoice: (articles: Article[]) => Promise<void>;
  selectInvoice: (invoice: Invoice | null) => void;
  fetchInvoices: () => Promise<void>;
};

const ArticleSearchContext = createContext<ArticleSearchContextType | undefined>(undefined);

export const ArticleSearchProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      // TODO: заменить на реальный API запрос
      const mockInvoices: Invoice[] = [
        { 
          id: 1, 
          number: 'ВЭД-20230815-ABC123', 
          created_at: '2023-08-15T10:30:00', 
          article_count: 3,
          articles: []
        },
      ];
      setInvoices(mockInvoices);
    } catch (error) {
      message.error('Ошибка при загрузке инвойсов');
    } finally {
      setLoading(false);
    }
  };

  const searchArticles = async (query: string) => {
    if (!query.trim()) {
      message.warning('Введите артикул для поиска');
      return;
    }
    
    setLoading(true);
    try {
      // TODO: заменить на реальный API запрос
      const mockData: Article[] = [
        { id: 1, code: query, name: `Товар ${query}`, supplier: 'Поставщик 1' },
      ];
      setArticles(mockData);
    } catch (error) {
      message.error('Ошибка при поиске артикулов');
    } finally {
      setLoading(false);
    }
  };

  const addToInvoice = (article: Article) => {
    setArticles(prev => [...prev, article]);
  };

  const createInvoice = async (articles: Article[]) => {
    if (articles.length === 0) {
      message.warning('Выберите хотя бы один артикул');
      return;
    }
    
    setLoading(true);
    try {
      // TODO: заменить на реальный API запрос
      const newInvoice: Invoice = {
        id: Date.now(),
        number: `ВЭД-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.random().toString(36).substring(2,8).toUpperCase()}`,
        created_at: new Date().toISOString(),
        article_count: articles.length,
        articles
      };
      
      setInvoices(prev => [newInvoice, ...prev]);
      message.success(`Инвойс ${newInvoice.number} создан`);
    } catch (error) {
      message.error('Ошибка при создании инвойса');
    } finally {
      setLoading(false);
    }
  };

  const selectInvoice = (invoice: Invoice | null) => {
    setSelectedInvoice(invoice);
    // TODO: загрузить артикулы для выбранного инвойса
  };

  return (
    <ArticleSearchContext.Provider 
      value={{
        selectedInvoice,
        invoices,
        articles,
        loading,
        searchArticles,
        addToInvoice,
        createInvoice,
        selectInvoice,
        fetchInvoices
      }}
    >
      {children}
    </ArticleSearchContext.Provider>
  );
};

export const useArticleSearch = () => {
  const context = useContext(ArticleSearchContext);
  if (!context) {
    throw new Error('useArticleSearch must be used within ArticleSearchProvider');
  }
  return context;
};
