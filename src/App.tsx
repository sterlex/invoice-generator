import React, { useState } from 'react';
import { Layout, Typography, Button } from 'antd';
import InvoicePreview from './components/InvoicePreview';
import SettingsForm from './components/SettingsForm';
import { useInvoiceStore } from './store/invoiceStore';
import { Receipt, Coffee } from 'lucide-react';

const { Header, Content } = Layout;
const { Title } = Typography;

function App() {
  const { currentInvoice } = useInvoiceStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <Layout className="min-h-screen">
      <Header className="site-header">
        <div className="header-content">
          <div className="header-title">
            <Receipt className="header-icon" />
            <Title level={3} style={{ margin: 0, color: '#808080', fontWeight: 600 }}>
              Générateur de Factures
            </Title>
          </div>
          <Button
            type="primary"
            icon={<Coffee className="header-icon-small" />}
            href="https://www.buymeacoffee.com"
            target="_blank"
            rel="noopener noreferrer"
            className="coffee-button"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#FFDD00',
              color: '#000',
              border: 'none',
              height: '40px',
              borderRadius: '8px',
              padding: '0 16px',
            }}
          >
            Buy me a coffee
          </Button>
        </div>
      </Header>
      
      <Content className="site-content">
        <div className="content-wrapper">
          <InvoicePreview 
            invoice={currentInvoice || {
              number: '',
              issueDate: new Date(),
              dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              paymentTerms: 30,
              company: {
                name: '',
                vatNumber: '',
                address: {
                  street: '',
                  postalCode: '',
                  city: '',
                },
                contact: {
                  phone: '',
                  email: '',
                  website: '',
                },
              },
              client: {
                name: '',
                billingAddress: {
                  street: '',
                  postalCode: '',
                  city: '',
                },
                contact: {
                  name: '',
                  phone: '',
                  email: '',
                },
                clientNumber: '',
              },
              items: [],
              status: 'draft',
              footerFields: [
                { id: '1', label: 'Nom de l\'entreprise', value: '' },
                { id: '2', label: 'Adresse', value: '' },
                { id: '3', label: 'PATENTE', value: '' },
                { id: '4', label: 'TEL', value: '' },
                { id: '5', label: 'ICE', value: '' }
              ]
            }}
            onSettingsClick={() => setIsSettingsOpen(true)} 
          />
        </div>
      </Content>

      <SettingsForm
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </Layout>
  );
}

export default App;