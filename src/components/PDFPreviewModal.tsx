import React from 'react';
import { Modal, Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  children: React.ReactNode;
}

const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({
  isOpen,
  onClose,
  onDownload,
  children
}) => {
  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      width={1000}
      title="Aperçu de la facture"
      footer={[
        <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={onDownload}>
          Télécharger
        </Button>,
        <Button key="close" onClick={onClose}>
          Fermer
        </Button>
      ]}
    >
      <div style={{ maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
        {children}
      </div>
    </Modal>
  );
};

export default PDFPreviewModal;