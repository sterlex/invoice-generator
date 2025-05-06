import React, { useState } from 'react';
import { Drawer, Form, Radio, Space, Typography, Button, Input, Upload, Switch, Slider, Card, message, Select, Collapse } from 'antd';
import { HexColorPicker } from 'react-colorful';
import { useSettingsStore } from '../store/settingsStore';
import type { InvoiceSettings } from '../types/settings';
import { Settings, Upload as UploadIcon } from 'lucide-react';

const { Title } = Typography;
const { Panel } = Collapse;

interface SettingsFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsForm: React.FC<SettingsFormProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useSettingsStore();
  const [form] = Form.useForm();
  const [showCustomColor, setShowCustomColor] = useState(false);
  const [showTextColor, setShowTextColor] = useState(false);

  const handleSubmit = (values: InvoiceSettings) => {
    updateSettings(values);
    onClose();
  };

  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('You can only upload image files!');
      return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Image must be smaller than 2MB!');
      return false;
    }
    return true;
  };

  const handleImageUpload = async (file: File) => {
    if (!beforeUpload(file)) {
      return false;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        form.setFieldsValue({
          watermark: {
            ...form.getFieldValue('watermark'),
            imageUrl: e.target.result
          }
        });
        form.validateFields(['watermark']);
      }
    };
    reader.readAsDataURL(file);
    return false;
  };

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

  const renderWatermarkPreview = () => {
    const values = form.getFieldsValue();
    if (!values.watermark?.enabled) return null;

    const positionStyle = getWatermarkPosition(values.watermark.position);
    const watermarkStyle: React.CSSProperties = {
      position: 'absolute',
      ...positionStyle,
      transform: `${positionStyle.transform} rotate(${values.watermark.rotation}deg) scale(${values.watermark.scale})`,
      opacity: values.watermark.opacity,
      pointerEvents: 'none',
      userSelect: 'none',
      zIndex: 1000,
    };

    if (values.watermark.mosaic) {
      const tileSize = values.watermark.tileSize;
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

        if (values.watermark.type === 'text') {
          content = (
            <div style={{ 
              fontSize: `${tileSize / 4}px`, 
              fontWeight: 'bold', 
              color: values.watermark.textColor 
            }}>
              {values.watermark.text || 'Preview Text'}
            </div>
          );
        } else if (values.watermark.type === 'image' && values.watermark.imageUrl) {
          content = (
            <img
              src={values.watermark.imageUrl}
              alt="Watermark"
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          );
        }

        if (content) {
          mosaicItems.push(<div key={i} style={tileStyle}>{content}</div>);
        }
      }

      return <div style={{ ...watermarkStyle, width: `${containerWidth}px`, height: `${containerHeight}px` }}>
        {mosaicItems}
      </div>;
    }

    if (values.watermark.type === 'text') {
      return (
        <div
          style={{
            ...watermarkStyle,
            fontSize: '24px',
            fontWeight: 'bold',
            color: values.watermark.textColor,
          }}
        >
          {values.watermark.text || 'Preview Text'}
        </div>
      );
    } else if (values.watermark.type === 'image' && values.watermark.imageUrl) {
      return (
        <img
          src={values.watermark.imageUrl}
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
    <Drawer
      open={isOpen}
      onClose={onClose}
      width={400}
      title={
        <Space>
          <Settings size={20} />
          <Title level={4} style={{ margin: 0 }}>Paramètres</Title>
        </Space>
      }
      footer={
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Annuler</Button>
          <Button type="primary" onClick={() => form.submit()}>
            Enregistrer
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={settings}
        onFinish={handleSubmit}
        className="settings-form"
        onValuesChange={() => {
          form.validateFields();
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button
            style={{ width: '100%' }}
            onClick={() => setShowCustomColor(!showCustomColor)}
          >
            Border Color {showCustomColor ? '▼' : '▶'}
          </Button>
          {showCustomColor && (
            <Form.Item name={['appearance', 'borderColor']}>
              <HexColorPicker style={{ width: '100%' }} />
            </Form.Item>
          )}
        </Space>

        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) => {
            return prevValues.watermark?.enabled !== currentValues.watermark?.enabled;
          }}
        >
          {({ getFieldValue }) => (
            <Collapse>
              <Panel
                header={
                  <Space>
                    <span>Watermark</span>
                    <Form.Item 
                      name={['watermark', 'enabled']} 
                      valuePropName="checked"
                      style={{ margin: 0 }}
                    >
                      <Switch size="small" />
                    </Form.Item>
                  </Space>
                }
                key="watermark"
              >
                {getFieldValue(['watermark', 'enabled']) && (
                  <>
                    <div style={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 100,
                      background: '#fff',
                      padding: '8px 0',
                      marginBottom: '16px',
                    }}>
                      <Card 
                        size="small" 
                        className="watermark-preview"
                        style={{ 
                          height: 200,
                          position: 'relative',
                          overflow: 'hidden',
                          background: '#f5f5f5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <div style={{ 
                          position: 'absolute', 
                          inset: 0,
                          background: 'repeating-linear-gradient(45deg, #e0e0e0 0, #e0e0e0 10px, #f5f5f5 10px, #f5f5f5 20px)'
                        }} />
                        {renderWatermarkPreview()}
                      </Card>
                    </div>

                    <Form.Item name={['watermark', 'position']} label="Position">
                      <Select>
                        <Select.Option value="top-left">Top Left</Select.Option>
                        <Select.Option value="top-right">Top Right</Select.Option>
                        <Select.Option value="center">Center</Select.Option>
                        <Select.Option value="bottom-left">Bottom Left</Select.Option>
                        <Select.Option value="bottom-right">Bottom Right</Select.Option>
                      </Select>
                    </Form.Item>

                    <Form.Item name={['watermark', 'mosaic']} label="Mosaic Pattern" valuePropName="checked">
                      <Switch checkedChildren="On" unCheckedChildren="Off" />
                    </Form.Item>

                    <Form.Item
                      noStyle
                      shouldUpdate={(prevValues, currentValues) =>
                        prevValues.watermark?.mosaic !== currentValues.watermark?.mosaic
                      }
                    >
                      {({ getFieldValue }) =>
                        getFieldValue(['watermark', 'mosaic']) && (
                          <Form.Item name={['watermark', 'tileSize']} label="Tile Size">
                            <Slider
                              min={20}
                              max={100}
                              step={10}
                              marks={{
                                20: 'Small',
                                60: 'Medium',
                                100: 'Large'
                              }}
                            />
                          </Form.Item>
                        )
                      }
                    </Form.Item>

                    <Form.Item name={['watermark', 'type']}>
                      <Radio.Group>
                        <Radio value="text">Text</Radio>
                        <Radio value="image">Image</Radio>
                      </Radio.Group>
                    </Form.Item>

                    <Form.Item
                      noStyle
                      shouldUpdate={(prevValues, currentValues) =>
                        prevValues.watermark?.type !== currentValues.watermark?.type
                      }
                    >
                      {({ getFieldValue }) =>
                        getFieldValue(['watermark', 'type']) === 'text' ? (
                          <>
                            <Form.Item name={['watermark', 'text']} label="Watermark Text">
                              <Input placeholder="Enter watermark text" />
                            </Form.Item>
                            <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
                              <Button
                                style={{ width: '100%' }}
                                onClick={() => setShowTextColor(!showTextColor)}
                              >
                                Text Color {showTextColor ? '▼' : '▶'}
                              </Button>
                              {showTextColor && (
                                <Form.Item name={['watermark', 'textColor']}>
                                  <HexColorPicker style={{ width: '100%' }} />
                                </Form.Item>
                              )}
                            </Space>
                          </>
                        ) : (
                          <Form.Item name={['watermark', 'imageUrl']} label="Watermark Image">
                            <Upload.Dragger
                              accept="image/*"
                              customRequest={({ file }) => handleImageUpload(file as File)}
                              showUploadList={false}
                            >
                              <p className="ant-upload-drag-icon">
                                <UploadIcon size={24} />
                              </p>
                              <p className="ant-upload-text">
                                Click or drag image to upload
                              </p>
                            </Upload.Dragger>
                          </Form.Item>
                        )
                      }
                    </Form.Item>

                    <Form.Item name={['watermark', 'opacity']} label="Opacity">
                      <Slider
                        min={0}
                        max={1}
                        step={0.1}
                        marks={{
                          0: '0%',
                          0.5: '50%',
                          1: '100%'
                        }}
                      />
                    </Form.Item>

                    <Form.Item name={['watermark', 'rotation']} label="Rotation">
                      <Slider
                        min={-180}
                        max={180}
                        marks={{
                          '-180': '-180°',
                          0: '0°',
                          180: '180°'
                        }}
                      />
                    </Form.Item>

                    <Form.Item name={['watermark', 'scale']} label="Scale">
                      <Slider
                        min={0.1}
                        max={2}
                        step={0.1}
                        marks={{
                          0.1: '10%',
                          1: '100%',
                          2: '200%'
                        }}
                      />
                    </Form.Item>
                  </>
                )}
              </Panel>
            </Collapse>
          )}
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default SettingsForm;