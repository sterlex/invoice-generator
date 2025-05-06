import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Invoice, InvoiceItem } from '../types/invoice';
import { Typography, Space, Table, Card, Divider, Empty } from 'antd';
import { useSettingsStore } from '../store/settingsStore';

const { Text, Title } = Typography;

interface InvoicePreviewPDFProps {
  invoice: Invoice;
}

const InvoicePreviewPDF: React.FC<InvoicePreviewPDFProps> = ({ invoice }) => {
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

  const columns = [
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => (
        <Text style={{ color: '#1f2937' }}>{text}</Text>
      ),
    },
    {
      title: 'Quantité',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: (quantity: number) => (
        <Text style={{ color: '#1f2937' }}>{quantity}</Text>
      ),
    },
    {
      title: 'Prix unitaire',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 120,
      render: (price: number) => (
        <Text style={{ color: '#1f2937' }}>{price.toFixed(2)} DH</Text>
      ),
    },
    {
      title: 'TVA',
      dataIndex: 'vatRate',
      key: 'vatRate',
      width: 80,
      render: (rate: number) => (
        <Text style={{ color: '#1f2937' }}>{rate}%</Text>
      ),
    },
    {
      title: 'Montant',
      key: 'amount',
      width: 120,
      render: (record: InvoiceItem) => (
        <Text strong style={{ color: '#1f2937' }}>
          {(record.quantity * record.unitPrice).toFixed(2)} DH
        </Text>
      ),
    },
  ];

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

  return (
    <div 
      style={{ 
        padding: '40px',
        background: 'white',
        border: `${settings.appearance.borderWidth}px solid ${settings.appearance.borderColor}`,
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {renderWatermark()}
      <Space direction="vertical" style={{ width: '100%' }} size={32}>
        {/* Header Section */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          padding: '24px',
          background: '#f8fafc',
          borderRadius: '8px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <Space direction="vertical" size={4}>
            {invoice.company.logo?.url && (
              <img 
                src={invoice.company.logo.url} 
                alt={invoice.company.name}
                style={{ 
                  height: 64, 
                  objectFit: 'contain',
                  marginBottom: '16px'
                }}
              />
            )}
            <Title level={4} style={{ margin: 0, color: '#1f2937' }}>
              {invoice.company.name}
            </Title>
            <Space direction="vertical" size={2} style={{ color: '#4b5563' }}>
              <Text>{invoice.company.address.street}</Text>
              <Text>{invoice.company.address.postalCode} {invoice.company.address.city}</Text>
              <Text>{invoice.company.contact.phone}</Text>
              <Text>{invoice.company.contact.email}</Text>
              <Text>TVA: {invoice.company.vatNumber}</Text>
            </Space>
          </Space>
          
          <Space direction="vertical" align="end">
            <Title level={2} style={{ 
              margin: 0, 
              color: settings.appearance.borderColor,
              fontSize: '32px',
              letterSpacing: '0.025em'
            }}>
              {invoice.title || "FACTURE"}
            </Title>
            <Space direction="vertical" size={2} style={{ marginTop: '16px', color: '#4b5563' }}>
              <Text strong>N° {invoice.number}</Text>
              <Text>Date: {format(invoice.issueDate, 'dd/MM/yyyy')}</Text>
              <Text>Échéance: {format(invoice.dueDate, 'dd/MM/yyyy')}</Text>
            </Space>
          </Space>
        </div>

        {/* Client Information */}
        <Card 
          title={
            <Text strong style={{ fontSize: '16px', color: '#1f2937' }}>
              Facturer à:
            </Text>
          }
          style={{ 
            borderRadius: '8px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}
        >
          <Space direction="vertical" size={2} style={{ color: '#4b5563' }}>
            <Text strong style={{ fontSize: '16px', color: '#1f2937' }}>
              {invoice.client.name}
            </Text>
            <Text>{invoice.client.billingAddress.street}</Text>
            <Text>
              {invoice.client.billingAddress.postalCode} {invoice.client.billingAddress.city}
            </Text>
          </Space>
        </Card>

        {/* Items Table */}
        <Table
          columns={columns}
          dataSource={invoice.items}
          pagination={false}
          size="middle"
          style={{ 
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Aucun article"
              />
            )
          }}
        />

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Card 
            size="small" 
            style={{ 
              width: 300,
              borderRadius: '8px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}>
                <Text>Sous-total:</Text>
                <Text>{calculateSubtotal(invoice.items).toFixed(2)} DH</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}>
                <Text>TVA:</Text>
                <Text>{calculateTax(invoice.items).toFixed(2)} DH</Text>
              </div>
              <Divider style={{ margin: '12px 0', borderColor: '#e5e7eb' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text strong style={{ color: '#1f2937', fontSize: '16px' }}>Total:</Text>
                <Text strong style={{ color: settings.appearance.borderColor, fontSize: '16px' }}>
                  {calculateTotal(invoice.items).toFixed(2)} DH
                </Text>
              </div>
            </Space>
          </Card>
        </div>

        {/* Footer Fields */}
        <Divider style={{ borderColor: '#e5e7eb' }} />
        <div style={{ textAlign: 'center', padding: '24px', background: '#f8fafc', borderRadius: '8px' }}>
          <Space split={<Divider type="vertical" style={{ borderColor: '#d1d5db' }} />} wrap>
            {invoice.footerFields.map((field) => (
              <Text key={field.id} style={{ color: '#4b5563' }}>
                {field.label && `${field.label} : `}{field.value}
              </Text>
            ))}
          </Space>
        </div>

        {/* Signature */}
        {invoice.signature && (
          <div style={{ 
            marginTop: 24, 
            textAlign: 'right',
            padding: '16px',
            background: '#f8fafc',
            borderRadius: '8px',
            display: 'inline-block',
            marginLeft: 'auto'
          }}>
            <img 
              src={invoice.signature} 
              alt="Signature" 
              style={{ 
                maxWidth: 200, 
                height: 'auto',
                display: 'block'
              }}
            />
          </div>
        )}
      </Space>
    </div>
  );
};

export default InvoicePreviewPDF;