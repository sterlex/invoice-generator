export interface Company {
  name: string;
  vatNumber: string;
  address: {
    street: string;
    postalCode: string;
    city: string;
  };
  contact: {
    phone: string;
    email: string;
    website: string;
  };
  logo?: {
    url: string;
    position: 'left' | 'center' | 'right';
  };
}

export interface Client {
  name: string;
  billingAddress: {
    street: string;
    postalCode: string;
    city: string;
  };
  shippingAddress?: {
    street: string;
    postalCode: string;
    city: string;
  };
  contact: {
    name: string;
    phone: string;
    email: string;
  };
  clientNumber: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatRate: 20 | 10 | 5.5 | 2.1 | 0;
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
  };
}

export interface FooterField {
  id: string;
  label: string;
  value: string;
}

export interface Invoice {
  number: string;
  issueDate: Date;
  dueDate: Date;
  paymentTerms: 30 | 45 | 60 | 'end-of-month';
  purchaseOrder?: string;
  company: Company;
  client: Client;
  items: InvoiceItem[];
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  footerFields: FooterField[];
  title?: string;
  signature?: string;
}