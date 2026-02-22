import React, { useState, useEffect } from 'react';
import {
  Card,
  List,
  Button,
  Upload,
  Typography,
  Space,
  Modal,
  Input,
  message,
  Tag,
  Avatar,
} from 'antd';
import {
  PlusOutlined,
  PlayCircleOutlined,
  CheckOutlined,
  DeleteOutlined,
  CustomerServiceOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import { upload } from '../services/upload-service';

const { Title, Text } = Typography;

interface Voice {
  id: string;
  name: string;
  voiceType: string;
  style?: string;
  avatarUrl?: string;
  sampleUrl?: string;
  voiceCode: string;
}

interface VoiceManagerProps {
  onSelect: (voiceId: string) => void;
  selectedVoiceId?: string;
}

const VoiceManager: React.FC<VoiceManagerProps> = ({
  onSelect,
  selectedVoiceId,
}) => {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [newVoiceName, setNewVoiceName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);

  useEffect(() => {
    fetchVoices();
  }, []);

  const fetchVoices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await axios.get('/api/v1/voices', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVoices(response.data);
    } catch (err) {
      console.error('Failed to fetch voices:', err);
      message.error('Failed to load voices');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (fileList.length === 0 || !newVoiceName) {
      message.warning('Please provide a name and an audio file');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('audio', fileList[0].originFileObj);
      formData.append('name', newVoiceName);

      await upload('/voices/clone', formData);

      message.success('Voice cloned successfully');
      setIsUploadModalVisible(false);
      setNewVoiceName('');
      setFileList([]);
      fetchVoices();
    } catch (err) {
      console.error('Failed to clone voice:', err);
      message.error('Failed to clone voice');
    } finally {
      setUploading(false);
    }
  };

  const deleteVoice = async (id: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      await axios.delete(`/api/v1/voices/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success('Voice deleted');
      fetchVoices();
    } catch (err) {
      console.error('Failed to delete voice:', err);
      message.error('Failed to delete voice');
    }
  };

  const playSample = (url?: string) => {
    if (!url) {
      message.info('No sample available for this voice');
      return;
    }
    const audio = new Audio(url);
    audio.play();
  };

  return (
    <div className="voice-manager">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          Interviewer Voice
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsUploadModalVisible(true)}
        >
          Clone My Voice
        </Button>
      </div>

      <List
        grid={{ gutter: 16, xs: 1, sm: 2, md: 3 }}
        dataSource={voices}
        loading={loading}
        renderItem={(voice) => (
          <List.Item>
            <Card
              hoverable
              className={`voice-card ${selectedVoiceId === voice.id ? 'selected' : ''}`}
              style={{
                borderRadius: 16,
                border:
                  selectedVoiceId === voice.id
                    ? '2px solid #1890ff'
                    : '1px solid #f0f0f0',
                position: 'relative',
              }}
              actions={[
                <Button
                  type="text"
                  icon={<PlayCircleOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    playSample(voice.sampleUrl);
                  }}
                >
                  Preview
                </Button>,
                <Button
                  type="primary"
                  ghost={selectedVoiceId !== voice.id}
                  icon={selectedVoiceId === voice.id ? <CheckOutlined /> : null}
                  onClick={() => onSelect(voice.id)}
                >
                  {selectedVoiceId === voice.id ? 'Selected' : 'Select'}
                </Button>,
                voice.voiceType === 'CLONED' && (
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteVoice(voice.id);
                    }}
                  />
                ),
              ]}
            >
              <Card.Meta
                avatar={
                  <Avatar
                    icon={<CustomerServiceOutlined />}
                    src={voice.avatarUrl}
                    style={{
                      backgroundColor:
                        voice.voiceType === 'DEFAULT' ? '#1890ff' : '#52c41a',
                    }}
                  />
                }
                title={voice.name}
                description={
                  <Space direction="vertical" size={0}>
                    <Text type="secondary">{voice.style || 'Balanced'}</Text>
                    <Tag
                      color={voice.voiceType === 'DEFAULT' ? 'blue' : 'green'}
                    >
                      {voice.voiceType === 'DEFAULT' ? 'System' : 'Custom'}
                    </Tag>
                  </Space>
                }
              />
            </Card>
          </List.Item>
        )}
      />

      <Modal
        title="Clone Your Voice"
        open={isUploadModalVisible}
        onOk={handleUpload}
        onCancel={() => setIsUploadModalVisible(false)}
        confirmLoading={uploading}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={20}>
          <div>
            <Text strong>Voice Name</Text>
            <Input
              placeholder="e.g. My Professional Voice"
              value={newVoiceName}
              onChange={(e) => setNewVoiceName(e.target.value)}
              style={{ marginTop: 8 }}
            />
          </div>
          <div>
            <Text strong>Upload Sample (30-60s WAV/MP3)</Text>
            <Upload
              beforeUpload={() => false}
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList.slice(-1))}
              accept="audio/*"
              style={{ marginTop: 8, display: 'block' }}
            >
              <Button icon={<PlusOutlined />}>Select Audio File</Button>
            </Upload>
          </div>
          <Text type="secondary" className="text-xs">
            Your voice sample will be processed by Alibaba Bailian to create a
            high-quality clone. Ensure the recording is clear and has minimal
            background noise.
          </Text>
        </Space>
      </Modal>

      <style>{`
        .voice-card {
          transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
        }
        .voice-card.selected {
          background: #e6f7ff;
        }
        .voice-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
};

export default VoiceManager;
