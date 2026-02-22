import React from 'react';
import { Card, Avatar, Tag, Space, Button, Typography } from 'antd';
import {
  UserOutlined,
  CheckCircleOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { InterviewerPersona } from '@/services/interview-service';

const { Text, Paragraph } = Typography;

interface PersonaSelectorProps {
  personas: InterviewerPersona[];
  selectedPersonaId?: string;
  onSelect: (personaId: string) => void;
  loading?: boolean;
}

const styleColors: Record<string, string> = {
  STRICT: '#f5222d',
  FRIENDLY: '#52c41a',
  TECHNICAL: '#1890ff',
  HR: '#722ed1',
  SUPPORTIVE: '#faad14',
  CHALLENGING: '#eb2f96',
};

const styleLabels: Record<string, string> = {
  STRICT: '严厉型',
  FRIENDLY: '友好型',
  TECHNICAL: '技术型',
  HR: 'HR型',
  SUPPORTIVE: '支持型',
  CHALLENGING: '挑战型',
};

export const PersonaSelector: React.FC<PersonaSelectorProps> = ({
  personas,
  selectedPersonaId,
  onSelect,
  loading,
}) => {
  const { t } = useTranslation();

  return (
    <div className="persona-selector">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {personas.map((persona) => {
          const isSelected = selectedPersonaId === persona.id;
          const styleColor = styleColors[persona.style] || '#d9d9d9';

          return (
            <Card
              key={persona.id}
              hoverable
              className={`transition-all ${
                isSelected
                  ? 'ring-2 ring-primary shadow-lg'
                  : 'hover:shadow-md'
              }`}
              onClick={() => onSelect(persona.id)}
              style={{
                borderColor: isSelected ? styleColor : undefined,
                cursor: 'pointer',
              }}
            >
              <div className="flex flex-col h-full">
                <div className="flex items-start justify-between mb-3">
                  <Space>
                    <Avatar
                      size={48}
                      src={persona.avatarUrl}
                      icon={<UserOutlined />}
                      style={{ backgroundColor: styleColor }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <Text strong className="text-base">
                          {persona.name}
                        </Text>
                        {persona.isDefault && (
                          <StarOutlined className="text-yellow-500 text-sm" />
                        )}
                      </div>
                      <Text type="secondary" className="text-xs">
                        {persona.company} · {persona.position}
                      </Text>
                    </div>
                  </Space>
                  {isSelected && (
                    <CheckCircleOutlined
                      className="text-xl"
                      style={{ color: styleColor }}
                    />
                  )}
                </div>

                <Tag color={styleColor} className="self-start mb-2">
                  {styleLabels[persona.style]}
                </Tag>

                <Paragraph
                  ellipsis={{ rows: 2 }}
                  className="text-sm mb-3 flex-grow"
                >
                  {persona.description}
                </Paragraph>

                <div className="flex flex-wrap gap-1">
                  {persona.traits.slice(0, 3).map((trait, index) => (
                    <Tag key={index} className="text-xs">
                      {trait}
                    </Tag>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <Text type="secondary" className="text-xs">
                    {t('interview.usage_count', {
                      count: persona.usageCount,
                    })}
                  </Text>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {selectedPersonaId && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <Text type="secondary">
            {t('interview.persona_selected_hint')}
          </Text>
        </div>
      )}
    </div>
  );
};
