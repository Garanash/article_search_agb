import React, { useEffect, useState } from "react";
import { getEmailTemplates, sendEmail } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { Modal, Form, Input, Select, Button, message, Space } from "antd";

// Адаптивные стили для диалога email
const emailDialogStyles = {
  modal: {
    maxWidth: "600px",
    width: "90vw",
  },
  
  title: {
    fontSize: "18px",
    fontWeight: 600,
  },
  
  form: {
    marginTop: "16px",
  },
  
  formItem: {
    marginBottom: "16px",
  },
  
  input: {
    width: "100%",
  },
  
  select: {
    width: "100%",
  },
  
  button: {
    height: "40px",
    fontSize: "16px",
  },
};

const EmailDialog: React.FC<{ supplier: any; onClose: () => void }> = ({ supplier, onClose }) => {
  const { token } = useAuth();
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [sender, setSender] = useState("");
  const [password, setPassword] = useState("");
  const [smtp, setSmtp] = useState("");
  const [port, setPort] = useState(587);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) getEmailTemplates(token).then(setTemplates);
  }, [token]);

  const handleSend = async () => {
    if (token && selectedTemplate) {
      setLoading(true);
      try {
        await sendEmail(
          token,
          sender,
          password,
          supplier.email,
          selectedTemplate.subject,
          selectedTemplate.body,
          smtp,
          port
        );
        message.success("Письмо отправлено!");
        onClose();
      } catch {
        message.error("Ошибка отправки");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Modal
      open={true}
      title={`Отправка письма: ${supplier.name}`}
      onCancel={onClose}
      onOk={handleSend}
      okText="Отправить"
      confirmLoading={loading}
      cancelText="Отмена"
      style={emailDialogStyles.modal}
    >
      <Form layout="vertical" style={emailDialogStyles.form}>
        <Form.Item label="Ваш email" style={emailDialogStyles.formItem}>
          <Input 
            value={sender} 
            onChange={e => setSender(e.target.value)} 
            style={emailDialogStyles.input}
          />
        </Form.Item>
        <Form.Item label="Пароль" style={emailDialogStyles.formItem}>
          <Input.Password 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            style={emailDialogStyles.input}
          />
        </Form.Item>
        <Form.Item label="SMTP сервер" style={emailDialogStyles.formItem}>
          <Input 
            value={smtp} 
            onChange={e => setSmtp(e.target.value)} 
            style={emailDialogStyles.input}
          />
        </Form.Item>
        <Form.Item label="Порт" style={emailDialogStyles.formItem}>
          <Input 
            type="number" 
            value={port} 
            onChange={e => setPort(Number(e.target.value))} 
            style={emailDialogStyles.input}
          />
        </Form.Item>
        <Form.Item label="Шаблон письма" style={emailDialogStyles.formItem}>
          <Select
            placeholder="Выберите шаблон"
            onChange={id => setSelectedTemplate(templates.find(t => t.id === id))}
            value={selectedTemplate?.id}
            style={emailDialogStyles.select}
          >
            {templates.map(t => (
              <Select.Option key={t.id} value={t.id}>
                {t.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EmailDialog; 