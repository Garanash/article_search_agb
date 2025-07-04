import React, { useState } from "react";
import EmailDialog from "./EmailDialog";
import { Button } from "antd";
import { MailOutlined } from "@ant-design/icons";

const SupplierRow: React.FC<{ supplier: any }> = ({ supplier }) => {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <tr>
        <td colSpan={2} style={{ paddingLeft: 40 }}>
          {supplier.name} | {supplier.website} | {supplier.email} | {supplier.country}
          <Button icon={<MailOutlined />} onClick={() => setShowDialog(true)}>
            Отправить письмо
          </Button>
        </td>
      </tr>
      {showDialog && <EmailDialog supplier={supplier} onClose={() => setShowDialog(false)} />}
    </>
  );
};

export default SupplierRow; 