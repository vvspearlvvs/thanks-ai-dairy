import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Heart, Sparkles, Send, Key, CheckCircle, Loader2 } from 'lucide-react';

type Emotion = '행복' | '기쁨' | '뿌듯' | '편안' | '피곤' | '우울';

interface GratitudeEntry {
  self: string;
  others: string;
  situation: string;
  emotion: Emotion;
}

const emotionConfig = {
  '행복': { color: 'happy', icon: '😊', theme: 'warm' },
  '기쁨': { color: 'joy', icon: '😄', theme: 'warm' },
  '뿌듯': { color: 'proud', icon: '😌', theme: 'success' },
  '편안': { color: 'calm', icon: '😌', theme: 'calm' },
  '피곤': { color: 'tired', icon: '😴', theme: 'neutral' },
  '우울': { color: 'sad', icon: '😔', theme: 'melancholy' }
};

export const GratitudeDiary = () => {
  const [apiKey, setApiKey] = useState('');
  const [tempApiKey, setTempApiKey] = useState('');
  const [showApiInput, setShowApiInput] = useState(false);
  const [entry, setEntry] = useState<GratitudeEntry>({
    self: '',
    others: '',
    situation: '',
    emotion: '행복'
  });
  const [feedback, setFeedback] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const stored = localStorage.getItem('gemini-api-key');
    if (stored) {
      setApiKey(stored);
    } else {
      setShowApiInput(true);
    }
  }, []);

  const saveApiKey = () => {
    if (!tempApiKey.trim()) {
      toast({
        title: "API 키를 입력해주세요",
        description: "Gemini API 키가 필요합니다.",
        variant: "destructive"
      });
      return;
    }
    localStorage.setItem('gemini-api-key', tempApiKey);
    setApiKey(tempApiKey);
    setShowApiInput(false);
    toast({
      title: "API 키가 저장되었습니다",
      description: "이제 감사일기를 작성할 수 있습니다.",
    });
  };

  const generatePrompt = (entry: GratitudeEntry): string => {
    const isPositive = ['행복', '기쁨', '뿌듯'].includes(entry.emotion);
    
    return `너는 정서 심리 코치이자 감사일기 리플렉션 전문가야.

사용자의 감사 항목들:
1. 나에 대한 감사: "${entry.self}"
2. 타인에 대한 감사: "${entry.others}"  
3. 상황에 대한 감사: "${entry.situation}"

현재 감정: ${entry.emotion}

${isPositive ? `
감정이 긍정적이므로:
- 각 항목에 대해 공감하며 감정의 유래를 해석해줘 (가치, 선택, 노력 관점에서)
- 이 감정이 지속될 수 있도록 응원하는 메시지를 포함해줘
- 마지막은 반드시 밝고 긍정적인 정서로 마무리해줘
` : `
감정이 힘든 상태이므로:
- 각 항목에 대해 깊은 공감을 표현해줘
- 현재 감정을 이해하며 리프레이밍을 도와줘
- 자기 성찰을 돕는 부드러운 질문을 포함해줘
- 마지막은 진심 있는 위로와 회복 메시지로 마무리해줘
`}

응답 형식:
각 항목에 대해 1문장씩, 총 3줄로 답변해줘.
각 문장은 50~90자 사이로 작성하고, 문체는 자연스럽고 따뜻하게 일기 코치처럼 작성해줘.
번호 없이 각 줄만 작성해줘.`;
  };

  const generateFeedback = async () => {
    if (!apiKey) {
      toast({
        title: "API 키가 필요합니다",
        description: "설정에서 Gemini API 키를 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    if (!entry.self.trim() || !entry.others.trim() || !entry.situation.trim()) {
      toast({
        title: "모든 항목을 입력해주세요",
        description: "감사한 일 3가지를 모두 작성해주세요.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setFeedback([]);

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: generatePrompt(entry)
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error('API 요청이 실패했습니다');
      }

      const data = await response.json();
      const feedbackText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      if (feedbackText) {
        const feedbackLines = feedbackText.trim().split('\n').filter(line => line.trim() !== '');
        setFeedback(feedbackLines.slice(0, 3)); // 최대 3줄만
        
        toast({
          title: "피드백이 생성되었습니다",
          description: "AI 코치의 따뜻한 피드백을 확인해보세요.",
        });
      } else {
        throw new Error('피드백 생성에 실패했습니다');
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "오류가 발생했습니다",
        description: "API 키를 확인하거나 잠시 후 다시 시도해주세요.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEntry({
      self: '',
      others: '',
      situation: '',
      emotion: '행복'
    });
    setFeedback([]);
  };

  const currentTheme = emotionConfig[entry.emotion];

  return (
    <div className="min-h-screen bg-gradient-reflection p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="flex items-center justify-center gap-3">
            <Heart className="w-8 h-8 text-primary animate-gentle-pulse" />
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-warm bg-clip-text text-transparent">
              감사일기
            </h1>
            <Sparkles className="w-8 h-8 text-primary animate-float" />
          </div>
          <p className="text-muted-foreground text-lg">
            매일의 감사한 순간들을 기록하고, AI 코치와 함께 마음을 돌아보세요
          </p>
        </div>

        {/* API Key Section */}
        <Card className="p-6 shadow-warm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              <Label className="text-lg font-semibold">Gemini API 설정</Label>
            </div>
            {apiKey && !showApiInput && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">저장됨</span>
              </div>
            )}
          </div>
          
          {(showApiInput || !apiKey) ? (
            <div className="space-y-4">
              <Input
                type="password"
                placeholder="Gemini 2.0 Flash API 키를 입력하세요"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                className="transition-all duration-300 focus:shadow-soft"
              />
              <div className="flex gap-2">
                <Button onClick={saveApiKey} variant="emotion" className="flex-1">
                  저장하기
                </Button>
                {apiKey && (
                  <Button 
                    onClick={() => setShowApiInput(false)} 
                    variant="outline"
                  >
                    취소
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <Button 
              onClick={() => setShowApiInput(true)} 
              variant="outline" 
              className="w-full"
            >
              API 키 변경
            </Button>
          )}
        </Card>

        {/* Emotion Selection */}
        <Card className="p-6 shadow-warm">
          <Label className="text-lg font-semibold mb-4 block">오늘의 기분</Label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {(Object.keys(emotionConfig) as Emotion[]).map((emotion) => (
              <Button
                key={emotion}
                onClick={() => setEntry(prev => ({ ...prev, emotion }))}
                variant={entry.emotion === emotion ? "emotion" : "outline"}
                className={`h-16 flex-col gap-1 transition-all duration-300 ${
                  entry.emotion === emotion ? 'ring-2 ring-primary shadow-emotion' : ''
                }`}
              >
                <span className="text-2xl">{emotionConfig[emotion].icon}</span>
                <span className="text-xs">{emotion}</span>
              </Button>
            ))}
          </div>
        </Card>

        {/* Gratitude Entries */}
        <Card className="p-6 shadow-warm">
          <Label className="text-lg font-semibold mb-6 block">오늘 감사한 일 3가지</Label>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="self" className="text-primary font-medium">
                1. 나에 대한 감사
              </Label>
              <Textarea
                id="self"
                placeholder="나 자신에게 감사한 일을 적어보세요... (50자 내외)"
                value={entry.self}
                onChange={(e) => setEntry(prev => ({ ...prev, self: e.target.value }))}
                className="transition-all duration-300 focus:shadow-soft resize-none"
                rows={2}
                maxLength={60}
              />
              <div className="text-right text-xs text-muted-foreground">
                {entry.self.length}/60
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="others" className="text-primary font-medium">
                2. 타인에 대한 감사
              </Label>
              <Textarea
                id="others"
                placeholder="다른 사람에게 감사한 일을 적어보세요... (50자 내외)"
                value={entry.others}
                onChange={(e) => setEntry(prev => ({ ...prev, others: e.target.value }))}
                className="transition-all duration-300 focus:shadow-soft resize-none"
                rows={2}
                maxLength={60}
              />
              <div className="text-right text-xs text-muted-foreground">
                {entry.others.length}/60
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="situation" className="text-primary font-medium">
                3. 상황에 대한 감사
              </Label>
              <Textarea
                id="situation"
                placeholder="상황이나 환경에 감사한 일을 적어보세요... (50자 내외)"
                value={entry.situation}
                onChange={(e) => setEntry(prev => ({ ...prev, situation: e.target.value }))}
                className="transition-all duration-300 focus:shadow-soft resize-none"
                rows={2}
                maxLength={60}
              />
              <div className="text-right text-xs text-muted-foreground">
                {entry.situation.length}/60
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button 
              onClick={generateFeedback}
              disabled={isLoading || !apiKey}
              variant="emotion"
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI 코치가 생각 중...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  피드백 받기
                </>
              )}
            </Button>
            <Button onClick={resetForm} variant="outline">
              초기화
            </Button>
          </div>
        </Card>

        {/* AI Feedback */}
        {feedback.length > 0 && (
          <Card className="p-6 shadow-emotion animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl">{currentTheme.icon}</div>
              <Label className="text-lg font-semibold text-primary">
                AI 코치의 피드백
              </Label>
            </div>
            <div className="space-y-4">
              {feedback.map((line, index) => (
                <div 
                  key={index}
                  className="p-4 bg-accent/30 rounded-lg border-l-4 border-primary animate-fade-in"
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <p className="text-foreground leading-relaxed font-medium">
                    {index + 1}. {line}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};