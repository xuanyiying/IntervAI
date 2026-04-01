// 配置文件
const config = {
  // API配置
  api: {
    openai: {
      endpoint: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      max_tokens: 1000
    }
  },
  
  // 语音识别配置
  speechRecognition: {
    lang: 'zh-CN',
    continuous: true,
    interimResults: true
  },
  
  // 语音合成配置
  speechSynthesis: {
    lang: 'zh-CN',
    rate: 1,
    pitch: 1,
    volume: 1
  },
  
  // UI配置
  ui: {
    defaultOpacity: 0.9,
    minOpacity: 0.5,
    maxOpacity: 1
  },
  
  // 响应时间配置
  responseTime: {
    timeout: 10000 // 10秒超时
  }
};

export default config;