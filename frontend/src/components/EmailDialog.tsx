import React, { useEffect, useState } from "react";
import { getEmailTemplates, sendEmail } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { Modal, Form, Input, Select, Button, message, Space } from "antd";

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
    >
      <Form layout="vertical">
        <Form.Item label="Ваш email">
          <Input value={sender} onChange={e => setSender(e.target.value)} />
        </Form.Item>
        <Form.Item label="Пароль">
          <Input.Password value={password} onChange={e => setPassword(e.target.value)} />
        </Form.Item>
        <Form.Item label="SMTP сервер">
          <Input value={smtp} onChange={e => setSmtp(e.target.value)} />
        </Form.Item>
        <Form.Item label="Порт">
          <Input type="number" value={port} onChange={e => setPort(Number(e.target.value))} />
        </Form.Item>
        <Form.Item label="Шаблон письма">
          <Select
            placeholder="Выберите шаблон"
            onChange={id => setSelectedTemplate(templates.find(t => t.id === id))}
            value={selectedTemplate?.id}
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