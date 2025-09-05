export interface GratitudeItem {
  title: string;
  content: string;
}

export interface SummaryRequest {
  emotion: string;
  items: GratitudeItem[];
}

export class GeminiService {
  private apiKey: string;

  constructor() {
    // 환경변수에서 API 키 읽어오기
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('GEMINI_API_KEY가 환경변수에 설정되지 않았습니다.');
    }
  }

  getApiKey(): string {
    return this.apiKey;
  }

  isApiKeySet(): boolean {
    return !!this.apiKey;
  }

  async generateSummary(request: SummaryRequest): Promise<string> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY가 환경변수에 설정되지 않았습니다. .env 파일을 확인해주세요.');
    }

    const prompt = this.buildPrompt(request);
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 100,
            topP: 0.8,
            topK: 40
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('API 응답 형식이 올바르지 않습니다.');
      }

      const summary = data.candidates[0].content.parts[0].text.trim();
      
      // 40자 내외로 제한
      if (summary.length > 50) {
        return summary.substring(0, 47) + '...';
      }
      
      return summary;
    } catch (error) {
      console.error('요약 생성 실패:', error);
      throw new Error('요약 생성에 실패했습니다. API 키를 확인해주세요.');
    }
  }

  private buildPrompt(request: SummaryRequest): string {
    const { emotion, items } = request;
    
    const gratitudeText = items
      .filter(item => item.content.trim())
      .map(item => `- ${item.title}: ${item.content}`)
      .join('\n');

    return `당신은 감정에 섬세하게 반응하는 고급 감성 작가입니다.

사용자는 하루 동안 다음 정보를 기록했습니다:
- 나에 대한 감사: ${items.find(item => item.title.includes('나'))?.content}
- 타인에 대한 감사: ${items.find(item => item.title.includes('타인'))?.content}
- 상황에 대한 감사: ${items.find(item => item.title.includes('상황'))?.content} 
- 감정: ${emotion}

당신의 역할은 이 정보를 바탕으로, **사용자의 하루를 1문장(40자 내외)**으로 요약하는 것입니다.

## ✅ 반드시 반영할 요소:
1. **가장 많이 입력한 감사 항목**에 대해 집중적으로 요약할 것
2. 실제로 일어난 일 또는 구체적인 행동 또는 인물을 요약 안에 포함
3. 그 일이 사용자의 하루에 어떤 의미였는지를 간접적으로 묘사
4. 감정은 직접 언급하지 말고, 문장의 어조·단어·뉘앙스를 통해 정서적으로 암시
5. 문장은 반드시 40자 내외, 1문장, 느낌표/의문문/말줄임표 없이 작성
6. 말투는 밝고 긍정적이면서 따뜻하게, 유머는 유쾌하고 솔직하게, 희망적인 미래를 암시하도록

요약:`;
  }
}

export const geminiService = new GeminiService();
