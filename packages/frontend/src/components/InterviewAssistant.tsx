import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, Typography, Space, Input, Slider, message, Tooltip } from 'antd';
import { 
  AudioOutlined, 
  StopOutlined, 
  PlayCircleOutlined, 
  PauseCircleOutlined, 
  VolumeUpOutlined, 
  VolumeDownOutlined, 
  LoadingOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Title, Text, Paragraph } = Typography;

interface InterviewAssistantProps {
  jobDescription?: string;
  resumeText?: string;
  onClose?: () => void;
}

const InterviewAssistant: React.FC<InterviewAssistantProps> = ({
  jobDescription,
  resumeText,
  onClose
}) => {
  const { t } = useTranslation();
  
  // 状态管理
  const [isListening, setIsListening] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [confidence, setConfidence] = useState<'high' | 'medium' | 'low'>('medium');
  const [relatedSkills, setRelatedSkills] = useState<string[]>([]);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [tips, setTips] = useState<string[]>([]);
  const [volume, setVolume] = useState(1);
  const [rate, setRate] = useState(1);
  const [opacity, setOpacity] = useState(0.9);
  
  // 引用
  const speechRecognitionRef = useRef<any>(null);
  const speechSynthesisRef = useRef<any>(null);
  const recognitionResultRef = useRef('');
  
  // 初始化语音识别
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      speechRecognitionRef.current = new SpeechRecognition();
      speechRecognitionRef.current.continuous = true;
      speechRecognitionRef.current.interimResults = true;
      speechRecognitionRef.current.lang = 'zh-CN';
      
      speechRecognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        recognitionResultRef.current = finalTranscript || interimTranscript;
        setQuestion(recognitionResultRef.current);
      };
      
      speechRecognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      speechRecognitionRef.current.onend = () => {
        if (isListening) {
          // 自动重启识别
          speechRecognitionRef.current.start();
        }
      };
    } else {
      message.error(t('interview.voice_recognition_not_supported'));
    }
    
    return () => {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
    };
  }, [isListening, t]);
  
  // 开始/停止语音识别
  const toggleListening = async () => {
    if (!speechRecognitionRef.current) {
      message.error(t('interview.voice_recognition_not_supported'));
      return;
    }
    
    if (isListening) {
      speechRecognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        await speechRecognitionRef.current.start();
        setIsListening(true);
        message.success(t('interview.voice_recognition_started'));
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        message.error(t('interview.microphone_denied'));
      }
    }
  };
  
  // 生成答案
  const generateAnswer = async () => {
    if (!question.trim()) {
      message.warning(t('interview.question_required'));
      return;
    }
    
    setIsGenerating(true);
    setAnswer('');
    
    try {
      // 模拟API调用
      // 实际项目中应该调用后端的interview-assistant技能
      const response = await fetch('/api/ai/skill/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          skillName: 'interview-assistant',
          inputs: {
            question: question,
            jobDescription: jobDescription,
            resumeText: resumeText,
            interviewType: 'technical',
            language: 'zh-CN'
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate answer');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // 模拟流式输出
        const fullAnswer = data.data.answer;
        let currentIndex = 0;
        
        const interval = setInterval(() => {
          if (currentIndex < fullAnswer.length) {
            setAnswer(prev => prev + fullAnswer[currentIndex]);
            currentIndex++;
          } else {
            clearInterval(interval);
            setConfidence(data.data.confidence);
            setRelatedSkills(data.data.relatedSkills);
            setEstimatedTime(data.data.estimatedTime);
            setTips(data.data.tips);
            setIsGenerating(false);
          }
        }, 50);
      } else {
        throw new Error(data.error.message);
      }
    } catch (error) {
      console.error('Error generating answer:', error);
      message.error(t('interview.answer_generation_failed'));
      setIsGenerating(false);
    }
  };
  
  // 语音朗读
  const toggleSpeech = () => {
    if (!answer) {
      message.warning(t('interview.no_answer_to_speak'));
      return;
    }
    
    if (speechSynthesisRef.current && speechSynthesisRef.current.speaking) {
      speechSynthesisRef.current.pause();
      setIsPlaying(false);
    } else {
      if (speechSynthesisRef.current && speechSynthesisRef.current.paused) {
        speechSynthesisRef.current.resume();
      } else {
        speechSynthesisRef.current = new SpeechSynthesisUtterance(answer);
        speechSynthesisRef.current.lang = 'zh-CN';
        speechSynthesisRef.current.rate = rate;
        speechSynthesisRef.current.volume = volume;
        
        speechSynthesisRef.current.onend = () => {
          setIsPlaying(false);
        };
        
        window.speechSynthesis.speak(speechSynthesisRef.current);
      }
      setIsPlaying(true);
    }
  };
  
  // 停止语音朗读
  const stopSpeech = () => {
    if (speechSynthesisRef.current) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };
  
  return (
    <div 
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: 400,
        zIndex: 1000,
        opacity: opacity
      }}
    >
      <Card 
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text strong>{t('interview.assistant_title')}</Text>
            <Space>
              <Slider 
                min={0.5} 
                max={1} 
                step={0.1} 
                value={opacity} 
                onChange={setOpacity}
                tooltip={{ title: t('interview.opacity') }}
              />
              <Button 
                type="text" 
                icon={<CloseOutlined />} 
                onClick={onClose}
              />
            </Space>
          </div>
        }
        style={{ borderRadius: 8 }}
      >
        {/* 问题识别区域 */}
        <div style={{ marginBottom: 16 }}>
          <Text strong>{t('interview.question')}:</Text>
          <Input.TextArea 
            rows={3} 
            value={question} 
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t('interview.question_placeholder')}
            disabled={isListening}
          />
          <div style={{ marginTop: 8, textAlign: 'center' }}>
            <Button
              shape="circle"
              icon={isListening ? <StopOutlined /> : <AudioOutlined />}
              size="large"
              style={{ 
                width: '48px', 
                height: '48px',
                backgroundColor: isListening ? '#f5222d' : '#1890ff'
              }}
              onClick={toggleListening}
            />
            <Text style={{ marginLeft: 8 }}>
              {isListening ? t('interview.listening') : t('interview.not_listening')}
            </Text>
          </div>
        </div>
        
        {/* 答案生成区域 */}
        <div style={{ marginBottom: 16 }}>
          <Text strong>{t('interview.answer')}:</Text>
          <div 
            style={{
              border: '1px solid #d9d9d9',
              borderRadius: 4,
              padding: 12,
              minHeight: 100,
              maxHeight: 200,
              overflowY: 'auto',
              backgroundColor: '#f9f9f9'
            }}
          >
            {isGenerating ? (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <LoadingOutlined style={{ marginRight: 8 }} />
                <Text>{t('interview.generating_answer')}</Text>
              </div>
            ) : (
              <Paragraph>{answer || t('interview.no_answer_yet')}</Paragraph>
            )}
          </div>
          
          {answer && (
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">
                {t('interview.confidence')}: {t(`interview.confidence_${confidence}`)}
              </Text>
              {relatedSkills.length > 0 && (
                <div style={{ marginTop: 4 }}>
                  <Text type="secondary">
                    {t('interview.related_skills')}: {relatedSkills.join(', ')}
                  </Text>
                </div>
              )}
              {tips.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" strong>{t('interview.tips')}:</Text>
                  <ul style={{ marginTop: 4, marginBottom: 0 }}>
                    {tips.map((tip, index) => (
                      <li key={index} style={{ marginBottom: 2 }}>
                        <Text type="secondary">{tip}</Text>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* 控制按钮 */}
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Button 
            type="primary" 
            onClick={generateAnswer}
            disabled={isGenerating || !question.trim()}
            loading={isGenerating}
          >
            {t('interview.generate_answer')}
          </Button>
          
          <Space>
            <Tooltip title={t('interview.speech_rate')}>
              <div style={{ width: 100 }}>
                <Slider 
                  min={0.5} 
                  max={2} 
                  step={0.1} 
                  value={rate} 
                  onChange={setRate}
                />
              </div>
            </Tooltip>
            <Tooltip title={t('interview.volume')}>
              <Space>
                <VolumeDownOutlined />
                <Slider 
                  min={0} 
                  max={1} 
                  step={0.1} 
                  value={volume} 
                  onChange={setVolume}
                  style={{ width: 80 }}
                />
                <VolumeUpOutlined />
              </Space>
            </Tooltip>
            <Button
              icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={toggleSpeech}
              disabled={!answer}
            />
            <Button
              icon={<StopOutlined />}
              onClick={stopSpeech}
              disabled={!isPlaying}
            />
          </Space>
        </Space>
      </Card>
    </div>
  );
};

export default InterviewAssistant;