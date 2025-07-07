import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Badge,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Email as EmailIcon,
  Send as SendIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Group as GroupIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Web as WebIcon
} from '@mui/icons-material';

interface SupplierGrouping {
  supplier_email: string;
  supplier_name: string;
  supplier_website?: string;
  supplier_country?: string;
  articles: Array<{
    code: string;
    quantity: number;
    requests: number[];
  }>;
  requests: number[];
  total_articles: number;
}

interface EmailCampaign {
  id: number;
  name: string;
  supplier_email: string;
  supplier_name: string;
  supplier_website?: string;
  supplier_country?: string;
  status: string;
  subject: string;
  body: string;
  created_at: string;
  sent_at?: string;
  last_reply_at?: string;
  articles_count: number;
  messages_count: number;
}

interface Request {
  id: number;
  number: string;
  created_at: string;
}

const EmailCampaigns: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [selectedRequests, setSelectedRequests] = useState<number[]>([]);
  const [supplierGroups, setSupplierGroups] = useState<SupplierGrouping[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  
  // Диалоги
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierGrouping | null>(null);
  
  // Форма кампании
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    subject: '',
    body: '',
    article_ids: [] as number[]
  });

  useEffect(() => {
    fetchRequests();
    fetchCampaigns();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await axios.get('/api/requests/');
      setRequests(response.data);
    } catch (error) {
      console.error('Ошибка загрузки запросов:', error);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const response = await axios.get('/api/email-campaigns/');
      setCampaigns(response.data);
    } catch (error) {
      console.error('Ошибка загрузки кампаний:', error);
    }
  };

  const handleGroupSuppliers = async () => {
    if (selectedRequests.length === 0) {
      alert('Выберите хотя бы один запрос');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/email-campaigns/group-suppliers', {
        request_ids: selectedRequests
      });
      setSupplierGroups(response.data);
      setGroupDialogOpen(true);
    } catch (error) {
      console.error('Ошибка группировки поставщиков:', error);
      alert('Ошибка при группировке поставщиков');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!selectedSupplier) return;

    try {
      const response = await axios.post('/api/email-campaigns/', {
        name: campaignForm.name,
        supplier_email: selectedSupplier.supplier_email,
        supplier_name: selectedSupplier.supplier_name,
        supplier_website: selectedSupplier.supplier_website,
        supplier_country: selectedSupplier.supplier_country,
        subject: campaignForm.subject,
        body: campaignForm.body,
        article_ids: campaignForm.article_ids
      });

      setCampaigns([response.data, ...campaigns]);
      setCampaignDialogOpen(false);
      setSelectedSupplier(null);
      setCampaignForm({ name: '', subject: '', body: '', article_ids: [] });
    } catch (error) {
      console.error('Ошибка создания кампании:', error);
      alert('Ошибка при создании кампании');
    }
  };

  const handleSendCampaign = async (campaignId: number) => {
    try {
      await axios.post(`/api/email-campaigns/${campaignId}/send`);
      fetchCampaigns(); // Обновляем список
    } catch (error) {
      console.error('Ошибка отправки кампании:', error);
      alert('Ошибка при отправке кампании');
    }
  };

  const handleDeleteCampaign = async (campaignId: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту кампанию?')) return;

    try {
      await axios.delete(`/api/email-campaigns/${campaignId}`);
      setCampaigns(campaigns.filter(c => c.id !== campaignId));
    } catch (error) {
      console.error('Ошибка удаления кампании:', error);
      alert('Ошибка при удалении кампании');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default';
      case 'sent': return 'primary';
      case 'replied': return 'success';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Черновик';
      case 'sent': return 'Отправлено';
      case 'replied': return 'Получен ответ';
      default: return status;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Email Кампании
      </Typography>

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Группировка поставщиков" />
        <Tab label="Мои кампании" />
      </Tabs>

      {activeTab === 0 && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Выберите запросы для группировки поставщиков
              </Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2, mb: 2 }}>
                {requests.map((request) => (
                  <Card 
                    key={request.id}
                    variant={selectedRequests.includes(request.id) ? "elevation" : "outlined"}
                    sx={{ 
                      cursor: 'pointer',
                      backgroundColor: selectedRequests.includes(request.id) ? 'primary.light' : 'inherit'
                    }}
                    onClick={() => {
                      if (selectedRequests.includes(request.id)) {
                        setSelectedRequests(selectedRequests.filter(id => id !== request.id));
                      } else {
                        setSelectedRequests([...selectedRequests, request.id]);
                      }
                    }}
                  >
                    <CardContent>
                      <Typography variant="subtitle1">
                        Запрос #{request.number}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(request.created_at).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>

              <Button
                variant="contained"
                startIcon={<GroupIcon />}
                onClick={handleGroupSuppliers}
                disabled={selectedRequests.length === 0 || loading}
                sx={{ mt: 2 }}
              >
                {loading ? <CircularProgress size={20} /> : 'Группировать поставщиков'}
              </Button>
            </CardContent>
          </Card>
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          <Button
            variant="contained"
            startIcon={<EmailIcon />}
            onClick={() => setGroupDialogOpen(true)}
            sx={{ mb: 3 }}
          >
            Создать новую кампанию
          </Button>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 3 }}>
            {campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6">{campaign.name}</Typography>
                    <Chip 
                      label={getStatusText(campaign.status)} 
                      color={getStatusColor(campaign.status) as any}
                      size="small"
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      <BusinessIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                      {campaign.supplier_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <EmailIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                      {campaign.supplier_email}
                    </Typography>
                    {campaign.supplier_website && (
                      <Typography variant="body2" color="text.secondary">
                        <WebIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                        {campaign.supplier_website}
                      </Typography>
                    )}
                    {campaign.supplier_country && (
                      <Typography variant="body2" color="text.secondary">
                        <LocationIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                        {campaign.supplier_country}
                      </Typography>
                    )}
                  </Box>

                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <strong>Тема:</strong> {campaign.subject}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Артикулов: {campaign.articles_count} | Сообщений: {campaign.messages_count}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(campaign.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton size="small" color="primary">
                      <ViewIcon />
                    </IconButton>
                    <IconButton size="small" color="primary">
                      <EditIcon />
                    </IconButton>
                    {campaign.status === 'draft' && (
                      <IconButton 
                        size="small" 
                        color="success"
                        onClick={() => handleSendCampaign(campaign.id)}
                      >
                        <SendIcon />
                      </IconButton>
                    )}
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleDeleteCampaign(campaign.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      )}

      {/* Диалог группировки поставщиков */}
      <Dialog 
        open={groupDialogOpen} 
        onClose={() => setGroupDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Группировка поставщиков</DialogTitle>
        <DialogContent>
          {supplierGroups.length === 0 ? (
            <Alert severity="info">
              Поставщики с email адресами не найдены в выбранных запросах
            </Alert>
          ) : (
            <List>
              {supplierGroups.map((group, index) => (
                <ListItem key={index} divider>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6">{group.supplier_name}</Typography>
                        <Chip label={`${group.total_articles} арт.`} size="small" />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {group.supplier_email}
                        </Typography>
                        {group.supplier_website && (
                          <Typography variant="body2" color="text.secondary">
                            {group.supplier_website}
                          </Typography>
                        )}
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2">
                            <strong>Артикулы:</strong>
                          </Typography>
                          {group.articles.map((article, artIndex) => (
                            <Chip 
                              key={artIndex}
                              label={`${article.code} (${article.quantity})`}
                              size="small"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                        </Box>
                      </Box>
                    }
                  />
                  <Button
                    variant="contained"
                    startIcon={<EmailIcon />}
                    onClick={() => {
                      setSelectedSupplier(group);
                      setCampaignForm({
                        name: `Кампания для ${group.supplier_name}`,
                        subject: 'Запрос коммерческого предложения',
                        body: `Уважаемые коллеги!\n\nПросим предоставить коммерческое предложение на следующие позиции:\n\n${group.articles.map(a => `- ${a.code} (количество: ${a.quantity})`).join('\n')}\n\nС уважением,\nВаша компания`,
                        article_ids: []
                      });
                      setGroupDialogOpen(false);
                      setCampaignDialogOpen(true);
                    }}
                  >
                    Создать кампанию
                  </Button>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGroupDialogOpen(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>

      {/* Диалог создания кампании */}
      <Dialog 
        open={campaignDialogOpen} 
        onClose={() => setCampaignDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Создание Email кампании</DialogTitle>
        <DialogContent>
          {selectedSupplier && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Поставщик: {selectedSupplier.supplier_name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Email: {selectedSupplier.supplier_email}
              </Typography>
            </Box>
          )}

          <TextField
            fullWidth
            label="Название кампании"
            value={campaignForm.name}
            onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Тема письма"
            value={campaignForm.subject}
            onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Текст письма"
            multiline
            rows={8}
            value={campaignForm.body}
            onChange={(e) => setCampaignForm({ ...campaignForm, body: e.target.value })}
            sx={{ mb: 2 }}
          />

          {selectedSupplier && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Артикулы для включения в кампанию:
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Артикул</TableCell>
                      <TableCell>Количество</TableCell>
                      <TableCell>Запросы</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedSupplier.articles.map((article, index) => (
                      <TableRow key={index}>
                        <TableCell>{article.code}</TableCell>
                        <TableCell>{article.quantity}</TableCell>
                        <TableCell>
                          {article.requests.map(reqId => `#${reqId}`).join(', ')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCampaignDialogOpen(false)}>Отмена</Button>
          <Button 
            variant="contained" 
            onClick={handleCreateCampaign}
            disabled={!campaignForm.name || !campaignForm.subject || !campaignForm.body}
          >
            Создать кампанию
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmailCampaigns; 