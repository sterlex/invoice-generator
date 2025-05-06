export interface InvoiceSettings {
  template: {
    selectedColor: string;
    customColor?: string;
  };
  appearance: {
    borderColor: string;
    borderWidth: number;
  };
  watermark: {
    enabled: boolean;
    mosaic: boolean;
    type: 'text' | 'image';
    text: string;
    imageUrl: string;
    opacity: number;
    rotation: number;
    scale: number;
    tileSize: number;
    position: 'top-left' | 'top-right' | 'center' | 'bottom-left' | 'bottom-right';
    textColor: string;
  };
}

export const defaultSettings: InvoiceSettings = {
  template: {
    selectedColor: '#1677ff',
  },
  appearance: {
    borderColor: '#1677ff',
    borderWidth: 4,
  },
  watermark: {
    enabled: false,
    mosaic: false,
    type: 'text',
    text: 'CONFIDENTIAL',
    imageUrl: '',
    opacity: 0.2,
    rotation: -45,
    scale: 1,
    tileSize: 50,
    position: 'center',
    textColor: '#000000'
  }
};