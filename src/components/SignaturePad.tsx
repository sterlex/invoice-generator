import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Modal, Button, Space, message } from 'antd';
import { PenLine, Eraser } from 'lucide-react';

interface SignaturePadProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signature: string) => void;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ isOpen, onClose, onSave }) => {
  const sigPadRef = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const handleClear = () => {
    if (sigPadRef.current) {
      sigPadRef.current.clear();
      setIsEmpty(true);
    }
  };

  const handleSave = () => {
    if (sigPadRef.current) {
      if (isEmpty) {
        message.error('Veuillez signer avant de sauvegarder');
        return;
      }
      const signatureData = sigPadRef.current.toDataURL('image/png');
      onSave(signatureData);
      onClose();
      handleClear();
    }
  };

  const handleBegin = () => {
    setIsEmpty(false);
  };

  return (
    <Modal
      open={isOpen}
      title="Signature numérique"
      onCancel={onClose}
      footer={null}
      width={800}
      destroyOnClose
      className="signature-modal"
    >
      <div className="signature-container">
        <div className="signature-pad-wrapper">
          <SignatureCanvas
            ref={sigPadRef}
            canvasProps={{
              className: 'signature-canvas',
              width: 700,
              height: 300,
            }}
            onBegin={handleBegin}
          />
        </div>
        <div className="signature-actions">
          <Space>
            <Button icon={<Eraser />} onClick={handleClear}>
              Effacer
            </Button>
            <Button type="primary" icon={<PenLine />} onClick={handleSave}>
              Sauvegarder
            </Button>
          </Space>
        </div>
      </div>
    </Modal>
  );
};

export default SignaturePad;