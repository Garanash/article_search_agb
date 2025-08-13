import React, { useState, useEffect } from 'react';
import { Card, List, Typography, Badge, Space, Button, Tooltip } from 'antd';
import { FileTextOutlined, DollarOutlined, CalendarOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  date: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  supplier: string;
  description: string;
}

interface InvoiceSidebarProps {
  onInvoiceSelect?: (invoice: InvoiceData) => void;
  selectedInvoiceId?: string;
}

const InvoiceSidebar: React.FC<InvoiceSidebarProps> = ({ 
  onInvoiceSelect, 
  selectedInvoiceId 
}) => {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState(false);

  // Загрузка данных (имитация)
  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      // Имитация загрузки данных
      const mockInvoices: InvoiceData[] = [
        {
          id: 'INV-001',
          invoiceNumber: 'INV-2024-001',
          date: '2024-01-15',
          amount: 125000,
          currency: 'USD',
          status: 'paid',
          supplier: 'ООО "Поставщик А"',
          description: 'Поставка буровых коронок HQ 60.3мм'
        },
        {
          id: 'INV-002',
          invoiceNumber: 'INV-2024-002',
          date: '2024-02-10',
          amount: 89000,
          currency: 'USD',
          status: 'pending',
          supplier: 'ООО "Поставщик Б"',
          description: 'Поставка башмаков HWT 60.3мм'
        },
        {
          id: 'INV-003',
          invoiceNumber: 'INV-2024-003',
          date: '2024-03-05',
          amount: 156000,
          currency: 'USD',
          status: 'overdue',
          supplier: 'ООО "Поставщик В"',
          description: 'Поставка расширителей HWE 60.3мм'
        },
        {
          id: 'INV-004',
          invoiceNumber: 'INV-2024-004',
          date: '2024-03-20',
          amount: 75000,
          currency: 'USD',
          status: 'pending',
          supplier: 'ООО "Поставщик Г"',
          description: 'Поставка матриц для коронок'
        },
        {
          id: 'INV-005',
          invoiceNumber: 'INV-2024-005',
          date: '2024-04-01',
          amount: 203000,
          currency: 'USD',
          status: 'paid',
          supplier: 'ООО "Поставщик Д"',
          description: 'Поставка комплектующих для бурового инструмента'
        }
      ];
      setInvoices(mockInvoices);
    } catch (error) {
      console.error('Ошибка при загрузке инвойсов:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'processing';
      case 'overdue':
        return 'error';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Оплачен';
      case 'pending':
        return 'Ожидает оплаты';
      case 'overdue':
        return 'Просрочен';
      case 'cancelled':
        return 'Отменен';
      default:
        return status;
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleInvoiceClick = (invoice: InvoiceData) => {
    if (onInvoiceSelect) {
      onInvoiceSelect(invoice);
    }
  };

  return (
    <div className="invoice-sidebar" style={{ width: '300px', height: '100%' }}>
      <Card 
        title={
          <Space>
            <FileTextOutlined style={{ color: '#1890ff' }} />
            <span>Вилны инвойсы</span>
          </Space>
        }
        size="small"
        style={{ height: '100%' }}
        extra={
          <Tooltip title="Обновить список">
            <Button 
              type="text" 
              size="small" 
              icon={<EyeOutlined />}
              onClick={loadInvoices}
            />
          </Tooltip>
        }
      >
        <List
          dataSource={invoices}
          loading={loading}
          size="small"
          renderItem={(invoice) => (
            <List.Item
              className={`invoice-item ${selectedInvoiceId === invoice.id ? 'active' : ''}`}
              onClick={() => handleInvoiceClick(invoice)}
              style={{ 
                cursor: 'pointer',
                padding: '12px',
                marginBottom: '8px',
                borderRadius: '6px',
                border: '1px solid #e9ecef',
                backgroundColor: selectedInvoiceId === invoice.id ? '#f0f8ff' : '#ffffff',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ width: '100%' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '8px'
                }}>
                  <div className="invoice-number" style={{ 
                    fontWeight: 600, 
                    color: '#262626',
                    fontSize: '13px'
                  }}>
                    {invoice.invoiceNumber}
                  </div>
                  <Badge 
                    status={getStatusColor(invoice.status) as any}
                    text={
                      <Text style={{ 
                        fontSize: '11px', 
                        color: '#8c8c8c',
                        fontWeight: 500
                      }}>
                        {getStatusText(invoice.status)}
                      </Text>
                    }
                  />
                </div>
                
                <div style={{ 
                  fontSize: '12px', 
                  color: '#8c8c8c',
                  marginBottom: '6px',
                  lineHeight: 1.3
                }}>
                  {invoice.description}
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center'
                }}>
                  <div style={{ 
                    fontSize: '11px', 
                    color: '#8c8c8c',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <CalendarOutlined style={{ fontSize: '10px' }} />
                    {dayjs(invoice.date).format('DD.MM.YYYY')}
                  </div>
                  
                  <div className="invoice-amount" style={{ 
                    fontWeight: 600, 
                    color: '#52c41a',
                    fontSize: '13px'
                  }}>
                    {formatAmount(invoice.amount, invoice.currency)}
                  </div>
                </div>
                
                <div style={{ 
                  fontSize: '11px', 
                  color: '#8c8c8c',
                  marginTop: '4px',
                  fontStyle: 'italic'
                }}>
                  {invoice.supplier}
                </div>
              </div>
            </List.Item>
          )}
          locale={{
            emptyText: (
              <div style={{ 
                textAlign: 'center', 
                padding: '20px 0',
                color: '#8c8c8c'
              }}>
                <FileTextOutlined style={{ 
                  fontSize: '24px', 
                  color: '#d9d9d9', 
                  marginBottom: '8px' 
                }} />
                <div>Инвойсы не найдены</div>
              </div>
            )
          }}
        />
      </Card>
    </div>
  );
};

export default InvoiceSidebar;
