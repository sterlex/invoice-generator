import React, { useState, useRef } from 'react';
import { Invoice, InvoiceItem } from '../types/invoice';
import { SaveOutlined, PlusOutlined, DeleteOutlined, DownloadOutlined, EyeOutlined, UploadOutlined, PhoneOutlined, InboxOutlined, PrinterOutlined } from '@ant-design/icons';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import PDFPreviewModal from './PDFPreviewModal';
import InvoicePreviewPDF from './InvoicePreviewPDF';
import SignaturePad from './SignaturePad';
import { Card, Button, Input, Select, Table, Space, message, Typography, Divider, DatePicker, Switch, Empty } from 'antd';
import { PenLine, Settings } from 'lucide-react';
import dayjs from 'dayjs';
import { useSettingsStore } from '../store/settingsStore';

const { Text, Title } = Typography;

interface InvoicePreviewProps {
  invoice: Invoice;
  onUpdate?: (invoice: Invoice) => void;
  onSettingsClick: () => void;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({ 
  invoice: initialInvoice, 
  onUpdate,
  onSettingsClick 
}) => {
  const [invoice, setInvoice] = useState<Invoice>(initialInvoice);
  const [isEditing, setIsEditing] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isSingleDate, setIsSingleDate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { settings } = useSettingsStore();

  const getWatermarkPosition = (position: string): React.CSSProperties => {
    switch (position) {
      case 'top-left':
        return { top: '10%', left: '10%', transform: 'translate(-50%, -50%)' };
      case 'top-right':
        return { top: '10%', right: '10%', transform: 'translate(50%, -50%)' };
      case 'bottom-left':
        return { bottom: '10%', left: '10%', transform: 'translate(-50%, 50%)' };
      case 'bottom-right':
        return { bottom: '10%', right: '10%', transform: 'translate(50%, 50%)' };
      default:
        return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
  };

  const renderWatermark = () => {
    if (!settings.watermark.enabled) return null;

    const positionStyle = getWatermarkPosition(settings.watermark.position);
    const watermarkStyle: React.CSSProperties = {
      position: 'absolute',
      ...positionStyle,
      transform: `${positionStyle.transform} rotate(${settings.watermark.rotation}deg) scale(${settings.watermark.scale})`,
      opacity: settings.watermark.opacity,
      pointerEvents: 'none',
      userSelect: 'none',
      zIndex: 1000,
    };

    if (settings.watermark.mosaic) {
      const tileSize = settings.watermark.tileSize;
      const containerWidth = 500;
      const containerHeight = 500;
      const numTilesX = Math.ceil(containerWidth / tileSize);
      const numTilesY = Math.ceil(containerHeight / tileSize);

      const mosaicItems: JSX.Element[] = [];

      for (let i = 0; i < numTilesX * numTilesY; i++) {
        const x = (i % numTilesX) * tileSize - containerWidth / 2;
        const y = Math.floor(i / numTilesX) * tileSize - containerHeight / 2;

        const tileStyle: React.CSSProperties = {
          position: 'absolute',
          left: `${x}px`,
          top: `${y}px`,
          width: `${tileSize}px`,
          height: `${tileSize}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        };

        let content: JSX.Element | null = null;

        if (settings.watermark.type === 'text') {
          content = (
            <div style={{ 
              fontSize: `${tileSize / 4}px`, 
              fontWeight: 'bold', 
              color: settings.watermark.textColor 
            }}>
              {settings.watermark.text}
            </div>
          );
        } else if (settings.watermark.type === 'image' && settings.watermark.imageUrl) {
          content = (
            <img
              src={settings.watermark.imageUrl}
              alt="Watermark"
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          );
        }

        if (content) {
          mosaicItems.push(<div key={i} style={tileStyle}>{content}</div>);
        }
      }

      return (
        <div style={{ 
          ...watermarkStyle, 
          width: `${containerWidth}px`, 
          height: `${containerHeight}px`,
          transform: `${positionStyle.transform} rotate(${settings.watermark.rotation}deg) scale(${settings.watermark.scale})`,
        }}>
          {mosaicItems}
        </div>
      );
    }

    if (settings.watermark.type === 'text') {
      return (
        <div
          style={{
            ...watermarkStyle,
            fontSize: '48px',
            fontWeight: 'bold',
            color: settings.watermark.textColor,
          }}
        >
          {settings.watermark.text}
        </div>
      );
    } else if (settings.watermark.type === 'image' && settings.watermark.imageUrl) {
      return (
        <img
          src={settings.watermark.imageUrl}
          alt="Watermark"
          style={{
            ...watermarkStyle,
            maxWidth: '50%',
            maxHeight: '50%',
            objectFit: 'contain',
          }}
        />
      );
    }

    return null;
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      message.error('Le fichier est trop volumineux. La taille maximale est de 5MB.');
      return;
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      message.error('Type de fichier non autorisé. Utilisez JPG, PNG ou GIF.');
      return;
    }

    const url = URL.createObjectURL(file);
    setInvoice(prev => ({
      ...prev,
      company: {
        ...prev.company,
        logo: {
          url,
          position: 'left'
        }
      }
    }));
  };

  const removeLogo = () => {
    if (invoice.company.logo?.url) {
      URL.revokeObjectURL(invoice.company.logo.url);
    }
    setInvoice(prev => ({
      ...prev,
      company: {
        ...prev.company,
        logo: undefined
      }
    }));
  };

  const calculateSubtotal = (items: InvoiceItem[]) => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const calculateTax = (items: InvoiceItem[]) => {
    return items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unitPrice;
      return sum + (itemTotal * (item.vatRate / 100));
    }, 0);
  };

  const calculateTotal = (items: InvoiceItem[]) => {
    const subtotal = calculateSubtotal(items);
    const tax = calculateTax(items);
    return subtotal + tax;
  };

  const handleCompanyChange = (field: string, value: string) => {
    setInvoice(prev => ({
      ...prev,
      company: {
        ...prev.company,
        [field]: value
      }
    }));
  };

  const handleCompanyAddressChange = (field: string, value: string) => {
    setInvoice(prev => ({
      ...prev,
      company: {
        ...prev.company,
        address: {
          ...prev.company.address,
          [field]: value
        }
      }
    }));
  };

  const handleCompanyContactChange = (field: string, value: string) => {
    setInvoice(prev => ({
      ...prev,
      company: {
        ...prev.company,
        contact: {
          ...prev.company.contact,
          [field]: value
        }
      }
    }));
  };

  const handleClientChange = (field: string, value: string) => {
    setInvoice(prev => ({
      ...prev,
      client: {
        ...prev.client,
        [field]: value
      }
    }));
  };

  const handleClientAddressChange = (field: string, value: string) => {
    setInvoice(prev => ({
      ...prev,
      client: {
        ...prev.client,
        billingAddress: {
          ...prev.client.billingAddress,
          [field]: value
        }
      }
    }));
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleFooterFieldChange = (id: string, field: 'label' | 'value', newValue: string) => {
    setInvoice(prev => ({
      ...prev,
      footerFields: prev.footerFields.map(f => 
        f.id === id ? { ...f, [field]: newValue } : f
      )
    }));
  };

  const addFooterField = () => {
    setInvoice(prev => ({
      ...prev,
      footerFields: [
        ...prev.footerFields,
        { 
          id: Math.random().toString(36).substr(2, 9),
          label: '',
          value: ''
        }
      ]
    }));
  };

  const removeFooterField = (id: string) => {
    setInvoice(prev => ({
      ...prev,
      footerFields: prev.footerFields.filter(f => f.id !== id)
    }));
  };

  const addItem = () => {
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, {
        description: '',
        quantity: 1,
        unit: 'unité',
        unitPrice: 0,
        vatRate: 20
      }]
    }));
  };

  const removeItem = (index: number) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    setIsEditing(false);
    if (onUpdate) {
      onUpdate(invoice);
    }
    message.success('Facture enregistrée avec succès');
  };

  const handlePreview = () => {
    setIsPreviewModalOpen(true);
  };

  const handlePrint = async () => {
    try {
      setIsGeneratingPDF(true);
      const pdfBlob = await generateInvoicePDF({
        invoice,
        elementId: 'invoice-preview'
      });
      
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      const printWindow = window.open(pdfUrl);
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          URL.revokeObjectURL(pdfUrl);
        };
      } else {
        message.error('Le blocage des popups empêche l\'impression. Veuillez autoriser les popups pour ce site.');
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Erreur lors de l\'impression');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      
      const pdfBlob = await generateInvoicePDF({
        invoice,
        elementId: 'invoice-preview'
      });

      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Facture_${invoice.number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setIsPreviewModalOpen(false);
      message.success('PDF généré avec succès');
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Erreur lors de la génération du PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDateChange = (date: dayjs.Dayjs | null) => {
    if (date) {
      setInvoice(prev => ({
        ...prev,
        issueDate: date.toDate(),
        dueDate: date.add(30, 'day').toDate()
      }));
    }
  };

  const handleSignatureSave = (signatureData: string) => {
    setInvoice(prev => ({
      ...prev,
      signature: signatureData
    }));
    message.success('Signature enregistrée avec succès');
  };

  const removeSignature = () => {
    setInvoice(prev => ({
      ...prev,
      signature: undefined
    }));
    message.success('Signature supprimée');
  };

  const columns = [
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text: string, record: InvoiceItem, index: number) => (
        <Input
          value={text}
          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
          placeholder="Description"
        />
      ),
    },
    {
      title: 'Quantité',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      render: (text: number, record: InvoiceItem, index: number) => (
        <Input
          type="number"
          value={text}
          onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
          min={0}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Prix unitaire',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 150,
      render: (text: number, record: InvoiceItem, index: number) => (
        <Input
          type="number"
          value={text}
          onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))}
          min={0}
          addonAfter="DH"
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'TVA',
      dataIndex: 'vatRate',
      key: 'vatRate',
      width: 120,
      render: (text: number, record: InvoiceItem, index: number) => (
        <Select
          value={text}
          onChange={(value) => handleItemChange(index, 'vatRate', value)}
          style={{ width: '100%' }}
        >
          <Select.Option value={0}>0%</Select.Option>
          <Select.Option value={20}>20%</Select.Option>
          <Select.Option value={10}>10%</Select.Option>
          <Select.Option value={5.5}>5.5%</Select.Option>
          <Select.Option value={2.1}>2.1%</Select.Option>
        </Select>
      ),
    },
    {
      title: 'Montant',
      key: 'amount',
      width: 120,
      render: (_: any, record: InvoiceItem) => (
        <Text>{(record.quantity * record.unitPrice).toFixed(2)} DH</Text>
      ),
    },
    {
      title: '',
      key: 'action',
      width: 60,
      render: (_: any, record: InvoiceItem, index: number) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeItem(index)}
        />
      ),
    },
  ];

  return (
    <>
      <div style={{ 
        position: 'sticky', 
        top: 72, 
        zIndex: 10,
        background: 'white',
        padding: '16px 24px',
        borderBottom: '1px solid #f0f0f0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        transition: 'box-shadow 0.3s ease',
      }}>
        <Space>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
            Enregistrer
          </Button>
          <Button icon={<EyeOutlined />} onClick={handlePreview}>
            Aperçu
          </Button>
          <Button 
            icon={<DownloadOutlined />} 
            onClick={handleDownloadPDF}
            loading={isGeneratingPDF}
          >
            {isGeneratingPDF ? 'Génération...' : 'Télécharger PDF'}
          </Button>
          <Button 
            icon={<PrinterOutlined />} 
            onClick={handlePrint}
            loading={isGeneratingPDF}
          >
            Imprimer
          </Button>
          <Button
            icon={<Settings className="header-icon-small" />}
            onClick={onSettingsClick}
          >
            Paramètres
          </Button>
        </Space>
      </div>

      <Card 
        className="invoice-preview" 
        id="invoice-preview"
        style={{
          border: `${settings.appearance.borderWidth}px solid ${settings.appearance.borderColor}`,
          borderRadius: '4px',
          margin: '24px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {renderWatermark()}
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Space direction="vertical">
              <div className="logo-upload" onClick={() => fileInputRef.current?.click()}>
                {invoice.company.logo?.url ? (
                  <div className="logo-preview">
                    <img src={invoice.company.logo.url} alt={invoice.company.name} />
                    <div className="logo-preview-overlay">
                      <Button type="primary" danger onClick={removeLogo}>
                        Supprimer
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <UploadOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                    <Text>Ajoutez le logo de votre entreprise</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      JPG, PNG ou GIF • Max 5MB
                    </Text>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  onChange={handleLogoUpload}
                  style={{ display: 'none' }}
                />
              </div>

              <Space direction="vertical">
                <Input
                  size="large"
                  value={invoice.company.name}
                  onChange={(e) => handleCompanyChange('name', e.target.value)}
                  placeholder="Le nom de votre société"
                />
                <Input
                  value={invoice.company.address.street}
                  onChange={(e) => handleCompanyAddressChange('street', e.target.value)}
                  placeholder="L'adresse de votre société"
                />
                <Space>
                  <Input
                    value={invoice.company.address.postalCode}
                    onChange={(e) => handleCompanyAddressChange('postalCode', e.target.value)}
                    placeholder="Code postal"
                    style={{ width: 120 }}
                  />
                  <Input
                    value={invoice.company.address.city}
                    onChange={(e) => handleCompanyAddressChange('city', e.target.value)}
                    placeholder="Ville"
                  />
                </Space>
                <Input
                  prefix={<PhoneOutlined />}
                  value={invoice.company.contact.phone}
                  onChange={(e) => handleCompanyContactChange('phone', e.target.value)}
                  placeholder="Téléphone"
                />
                <Input
                  value={invoice.company.contact.email}
                  onChange={(e) => handleCompanyContactChange('email', e.target.value)}
                  placeholder="Email"
                  type="email"
                />
                <Input
                  value={invoice.company.vatNumber}
                  onChange={(e) => handleCompanyChange('vatNumber', e.target.value)}
                  placeholder="N° TVA"
                />
              </Space>
            </Space>

            <Space direction="vertical" align="end">
              <Input
                size="large"
                value={invoice.title || "FACTURE"}
                onChange={(e) => setInvoice(prev => ({ ...prev, title: e.target.value }))}
                style={{ 
                  fontSize: '24px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  border: 'none',
                  padding: '4px 8px',
                  width: '200px'
                }}
                placeholder="Titre du document"
              />
              <Space direction="vertical">
                <Input
                  value={invoice.number}
                  onChange={(e) => setInvoice(prev => ({ ...prev, number: e.target.value }))}
                  placeholder="N° de facture"
                  style={{ width: 200 }}
                />
                
                <div style={{ marginBottom: 16 }}>
                  <Space align="center">
                    <Switch
                      checked={isSingleDate}
                      onChange={setIsSingleDate}
                      size="small"
                    />
                    <Text type="secondary">Utiliser une seule date</Text>
                  </Space>
                </div>

                {isSingleDate ? (
                  <DatePicker
                    value={dayjs(invoice.issueDate)}
                    onChange={handleDateChange}
                    format="DD/MM/YYYY"
                    style={{ width: 200 }}
                    placeholder="Date de facture"
                  />
                ) : (
                  <>
                    <DatePicker
                      value={dayjs(invoice.issueDate)}
                      onChange={(date) => date && setInvoice(prev => ({
                        ...prev,
                        issueDate: date.toDate()
                      }))}
                      format="DD/MM/YYYY"
                      style={{ width: 200 }}
                      placeholder="Date d'émission"
                    />
                    <DatePicker
                      value={dayjs(invoice.dueDate)}
                      onChange={(date) => date && setInvoice(prev => ({
                        ...prev,
                        dueDate: date.toDate()
                      }))}
                      format="DD/MM/YYYY"
                      style={{ width: 200 }}
                      placeholder="Date d'échéance"
                    />
                  </>
                )}
              </Space>
            </Space>
          </div>

          <Divider />

          <Card title="Facturer à:" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input
                size="large"
                value={invoice.client.name}
                onChange={(e) => handleClientChange('name', e.target.value)}
                placeholder="Nom du client"
              />
              <Input
                value={invoice.client.billingAddress.street}
                onChange={(e) => handleClientAddressChange('street', e.target.value)}
                placeholder="Adresse de facturation"
              />
              <Space>
                <Input
                  value={invoice.client.billingAddress.postalCode}
                  onChange={(e) => handleClientAddressChange('postalCode', e.target.value)}
                  placeholder="Code postal"
                  style={{ width: 120 }}
                />
                <Input
                  value={invoice.client.billingAddress.city}
                  onChange={(e) => handleClientAddressChange('city', e.target.value)}
                  placeholder="Ville"
                />
              </Space>
            </Space>
          </Card>

          <Table
            columns={columns}
            dataSource={invoice.items}
            pagination={false}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Aucun article ajouté"
                >
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    onClick={addItem}
                  >
                    Ajouter un article
                  </Button>
                </Empty>
              )
            }}
            footer={() => (
              invoice.items.length > 0 && (
                <Button 
                  type="dashed" 
                  icon={<PlusOutlined />} 
                  onClick={addItem}
                  block
                >
                  Ajouter un article
                </Button>
              )
            )}
          />

          <Card size="small" style={{ width: 300, marginLeft: 'auto' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Sous-total:</Text>
                <Text>{calculateSubtotal(invoice.items).toFixed(2)} DH</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>TVA:</Text>
                <Text>{calculateTax(invoice.items).toFixed(2)} DH</Text>
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text strong>Total:</Text>
                <Text strong>{calculateTotal(invoice.items).toFixed(2)} DH</Text>
              </div>
            </Space>
          </Card>

          <Divider />
          <div style={{ textAlign: 'center' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                type="dashed" 
                icon={<PlusOutlined />} 
                onClick={addFooterField}
              >
                Ajouter un champ
              </Button>
              <Space direction="vertical" style={{ width: '100%' }}>
                {invoice.footerFields.map((field) => (
                  <Space key={field.id} align="baseline">
                    <Input
                      value={field.label}
                      onChange={(e) => handleFooterFieldChange(field.id, 'label', e.target.value)}
                      placeholder="Libellé"
                      style={{ width: 200 }}
                    />
                    <Input
                      value={field.value}
                      onChange={(e) => handleFooterFieldChange(field.id, 'value', e.target.value)}
                      placeholder="Valeur"
                      style={{ width: 400 }}
                    />
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeFooterField(field.id)}
                    />
                  </Space>
                ))}
              </Space>
            </Space>
          </div>

          <Divider />
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
            {invoice.signature ? (
              <div className="signature-preview">
                <img src={invoice.signature} alt="Signature" />
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  className="remove-signature"
                  onClick={removeSignature}
                />
              </div>
            ) : (
              <Button
                type="dashed"
                icon={<PenLine />}
                onClick={() => setIsSignatureModalOpen(true)}
              >
                Ajouter une signature
              </Button>
            )}
          </div>
        </Space>
      </Card>

      <PDFPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        onDownload={handleDownloadPDF}
      >
        <InvoicePreviewPDF invoice={invoice} />
      </PDFPreviewModal>

      <SignaturePad
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSave={handleSignatureSave}
      />
    </>
  );
};

export default InvoicePreview;