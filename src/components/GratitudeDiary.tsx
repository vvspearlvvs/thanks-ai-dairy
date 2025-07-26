import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Heart, Sparkles, Send, Key, CheckCircle, Loader2, Calendar, BarChart3, List, Plus, ArrowLeft, Trash2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';

type Emotion = '행복' | '기쁨' | '뿌듯' | '편안' | '피곤' | '우울';

interface GratitudeEntry {
  id: string;
  date: string;
  self: string;
  others: string;
  situation: string;
  emotion: Emotion;
  feedback: string[];
  createdAt: number;
}

interface MonthlyReport {
  totalEntries: number;
  emotionDistribution: Record<Emotion, number>;
  topEmotions: Emotion[];
  positiveRate: number;
  topKeywords: string[];
  summary: string;
}

const emotionConfig = {
  '행복': { color: 'happy', icon: '😊', theme: 'warm' },
  '기쁨': { color: 'joy', icon: '😄', theme: 'warm' },
  '뿌듯': { color: 'proud', icon: '😌', theme: 'success' },
  '편안': { color: 'calm', icon: '😌', theme: 'calm' },
  '피곤': { color: 'tired', icon: '😴', theme: 'neutral' },
  '우울': { color: 'sad', icon: '😔', theme: 'melancholy' }
};

type ViewMode = 'diary' | 'list' | 'report';

export const GratitudeDiary = () => {
  const [apiKey, setApiKey] = useState('');
  const [tempApiKey, setTempApiKey] = useState('');
  const [showApiInput, setShowApiInput] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [viewMode, setViewMode] = useState<ViewMode>('diary');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  
  const [entry, setEntry] = useState<Omit<GratitudeEntry, 'id' | 'date' | 'feedback' | 'createdAt'>>({
    self: '',
    others: '',
    situation: '',
    emotion: '행복'
  });
  
  const [feedback, setFeedback] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [entries, setEntries] = useState<GratitudeEntry[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const stored = localStorage.getItem('gemini-api-key');
    if (stored) {
      setApiKey(stored);
    } else {
      setShowApiInput(true);
    }
    
    // 저장된 일기 불러오기
    const savedEntries = localStorage.getItem('gratitude-entries');
    if (savedEntries) {
      setEntries(JSON.parse(savedEntries));
    }
  }, []);

  // 일기 저장 함수
  const saveEntries = (newEntries: GratitudeEntry[]) => {
    setEntries(newEntries);
    localStorage.setItem('gratitude-entries', JSON.stringify(newEntries));
  };

  // 선택된 날짜의 일기 확인
  const existingEntry = entries.find(e => e.date === selectedDate);

  // 선택된 날짜가 변경되면 기존 일기 불러오기
  useEffect(() => {
    if (existingEntry) {
      setEntry({
        self: existingEntry.self,
        others: existingEntry.others,
        situation: existingEntry.situation,
        emotion: existingEntry.emotion
      });
      setFeedback(existingEntry.feedback);
    } else {
      resetForm();
    }
  }, [selectedDate, existingEntry]);

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

  const generatePrompt = (entry: Omit<GratitudeEntry, 'id' | 'date' | 'feedback' | 'createdAt'>, emotion: Emotion): string => {
    const isPositive = ['행복', '기쁨', '뿌듯'].includes(emotion);
    const isNeutral = emotion === '편안';
    
    let emotionGuidance = '';
    if (isPositive) {
      emotionGuidance = `
감정이 긍정적이므로:
- 각 항목에 대해 공감하며 감정의 원천을 해석해줘 (가치, 선택, 노력 관점에서)
- 이 감정이 지속될 수 있도록 응원하는 메시지를 포함해줘
- 마지막은 반드시 밝고 긍정적인 정서로 마무리해줘`;
    } else if (isNeutral) {
      emotionGuidance = `
감정이 편안한 상태이므로:
- 현재 상태를 수용하고 정서 유지를 지지해줘
- 자기 돌봄과 마음의 평화를 권유해줘
- 차분하고 부드러운 말투로 마무리해줘`;
    } else {
      emotionGuidance = `
감정이 힘든 상태이므로:
- 각 항목에 대해 깊은 공감을 표현해줘
- 현재 감정을 이해하며 리프레이밍을 도와줘
- 자기 성찰을 돕는 부드러운 질문을 포함해줘
- 마지막은 진심 있는 위로와 회복 메시지로 마무리해줘`;
    }
    
    return `너는 정서 심리 코치이자 감사일기 리플렉션 전문가야.

사용자의 감사 항목들:
1. 나에 대한 감사: "${entry.self}"
2. 타인에 대한 감사: "${entry.others}"  
3. 상황에 대한 감사: "${entry.situation}"

현재 감정: ${emotion}

${emotionGuidance}

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
              text: generatePrompt(entry, entry.emotion)
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
        const finalFeedback = feedbackLines.slice(0, 3); // 최대 3줄만
        setFeedback(finalFeedback);
        
        // 일기 저장
        const newEntry: GratitudeEntry = {
          id: Date.now().toString(),
          date: selectedDate,
          ...entry,
          feedback: finalFeedback,
          createdAt: Date.now()
        };

        const updatedEntries = existingEntry 
          ? entries.map(e => e.date === selectedDate ? newEntry : e)
          : [...entries, newEntry];
        
        saveEntries(updatedEntries);
        
        toast({
          title: "일기가 저장되었습니다",
          description: "AI 코치의 따뜻한 피드백과 함께 일기가 저장되었어요.",
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

  const deleteEntry = () => {
    if (!existingEntry) return;
    
    const updatedEntries = entries.filter(e => e.date !== selectedDate);
    saveEntries(updatedEntries);
    resetForm();
    
    toast({
      title: "일기가 삭제되었습니다",
      description: "선택한 날짜의 일기가 삭제되었어요.",
    });
  };

  // 월간 리포트 생성
  const generateMonthlyReport = (): MonthlyReport => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const startDate = startOfMonth(new Date(year, month - 1));
    const endDate = endOfMonth(new Date(year, month - 1));
    
    const monthEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate && entryDate <= endDate;
    });

    const emotionDistribution: Record<Emotion, number> = {
      '행복': 0, '기쁨': 0, '뿌듯': 0, '편안': 0, '피곤': 0, '우울': 0
    };

    monthEntries.forEach(entry => {
      emotionDistribution[entry.emotion]++;
    });

    const totalEntries = monthEntries.length;
    const positiveEmotions = ['행복', '기쁨', '뿌듯'] as Emotion[];
    const positiveCount = positiveEmotions.reduce((sum, emotion) => sum + emotionDistribution[emotion], 0);
    const positiveRate = totalEntries > 0 ? Math.round((positiveCount / totalEntries) * 100) : 0;

    const topEmotions = Object.entries(emotionDistribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([emotion]) => emotion as Emotion);

    // 키워드 분석
    const keywordCount: Record<string, number> = {};
    monthEntries.forEach(entry => {
      const text = `${entry.self} ${entry.others} ${entry.situation}`;
      const words = text.split(/\s+/).filter(word => word.length > 1);
      words.forEach(word => {
        keywordCount[word] = (keywordCount[word] || 0) + 1;
      });
    });

    const topKeywords = Object.entries(keywordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([keyword]) => keyword);

    const summary = totalEntries > 0 
      ? `이번 달, 당신은 ${totalEntries}일의 감사일기를 기록했고, ${positiveRate}%의 날에 긍정적인 감정을 느꼈어요.`
      : '이번 달에는 아직 감사일기를 기록하지 않았어요.';

    return {
      totalEntries,
      emotionDistribution,
      topEmotions,
      positiveRate,
      topKeywords,
      summary
    };
  };

  const currentTheme = emotionConfig[entry.emotion];
  const monthlyReport = generateMonthlyReport();

  return (
    <div className="min-h-screen bg-gradient-reflection p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
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
            작고 사소하지만 행복하고 감사했던 순간들을 기록하고, AI 코치와 함께 감정을 돌아보세요
          </p>
        </div>

        {/* Navigation */}
        <div className="flex justify-center gap-2">
          <Button
            onClick={() => setViewMode('diary')}
            variant={viewMode === 'diary' ? 'emotion' : 'outline'}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            일기 작성
          </Button>
          <Button
            onClick={() => setViewMode('list')}
            variant={viewMode === 'list' ? 'emotion' : 'outline'}
            className="flex items-center gap-2"
          >
            <List className="w-4 h-4" />
            일기 목록
          </Button>
          <Button
            onClick={() => setViewMode('report')}
            variant={viewMode === 'report' ? 'emotion' : 'outline'}
            className="flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            월간 리포트
          </Button>
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

        {/* Main Content */}
        {viewMode === 'diary' && (
          <>
            {/* Date Selection */}
            <Card className="p-6 shadow-warm">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-primary" />
                <Label className="text-lg font-semibold">날짜 선택</Label>
              </div>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="transition-all duration-300 focus:shadow-soft"
              />
              {existingEntry && (
                <div className="mt-3 p-3 bg-accent/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    이 날짜에는 이미 일기가 작성되어 있습니다. 수정하시겠어요?
                  </p>
                </div>
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
                    placeholder="스스로에게 감사했던 일을 적어보세요... (50자 내외)"
                    value={entry.self}
                    onChange={(e) => setEntry(prev => ({ ...prev, self: e.target.value }))}
                    className="transition-all duration-300 focus:shadow-soft resize-none"
                    rows={2}
                    maxLength={50}
                  />
                  <div className="text-right text-xs text-muted-foreground">
                    {entry.self.length}/50
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="others" className="text-primary font-medium">
                    2. 타인에 대한 감사
                  </Label>
                  <Textarea
                    id="others"
                    placeholder="다른 사람에게 감사했던 일을 적어보세요... (50자 내외)"
                    value={entry.others}
                    onChange={(e) => setEntry(prev => ({ ...prev, others: e.target.value }))}
                    className="transition-all duration-300 focus:shadow-soft resize-none"
                    rows={2}
                    maxLength={50}
                  />
                  <div className="text-right text-xs text-muted-foreground">
                    {entry.others.length}/50
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="situation" className="text-primary font-medium">
                    3. 상황에 대한 감사
                  </Label>
                  <Textarea
                    id="situation"
                    placeholder="상황이나 환경에 감사했던 일을 적어보세요... (50자 내외)"
                    value={entry.situation}
                    onChange={(e) => setEntry(prev => ({ ...prev, situation: e.target.value }))}
                    className="transition-all duration-300 focus:shadow-soft resize-none"
                    rows={2}
                    maxLength={50}
                  />
                  <div className="text-right text-xs text-muted-foreground">
                    {entry.situation.length}/50
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
                       {existingEntry ? '수정하기' : '피드백 받기'}
                     </>
                   )}
                 </Button>
                 <Button onClick={resetForm} variant="outline">
                   초기화
                 </Button>
                 {existingEntry && (
                   <Button onClick={deleteEntry} variant="destructive">
                     <Trash2 className="w-4 h-4" />
                   </Button>
                 )}
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
          </>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <Card className="p-6 shadow-warm">
            <Label className="text-lg font-semibold mb-6 block">감사일기 목록</Label>
            {entries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                아직 작성된 일기가 없어요. 첫 번째 감사일기를 작성해보세요!
              </div>
            ) : (
              <div className="space-y-4">
                                 {entries
                   .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                   .map((entry) => (
                     <div 
                       key={entry.id} 
                       className="p-4 border rounded-lg hover:shadow-soft transition-all cursor-pointer"
                       onClick={() => {
                         setSelectedDate(entry.date);
                         setViewMode('diary');
                       }}
                     >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{emotionConfig[entry.emotion].icon}</span>
                          <span className="font-medium">{entry.emotion}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(entry.date), 'yyyy년 MM월 dd일', { locale: ko })}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p><strong>나:</strong> {entry.self}</p>
                        <p><strong>타인:</strong> {entry.others}</p>
                        <p><strong>상황:</strong> {entry.situation}</p>
                      </div>
                      {entry.feedback.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-muted-foreground mb-2">AI 코치 피드백:</p>
                          <div className="space-y-1">
                            {entry.feedback.map((line, index) => (
                              <p key={index} className="text-xs text-foreground">
                                {index + 1}. {line}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </Card>
        )}

        {/* Report View */}
        {viewMode === 'report' && (
          <Card className="p-6 shadow-warm">
            <div className="flex items-center justify-between mb-6">
              <Label className="text-lg font-semibold">월간 감정 리포트</Label>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-auto"
              />
            </div>
            
            {monthlyReport.totalEntries === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {format(new Date(selectedMonth + '-01'), 'yyyy년 MM월', { locale: ko })}에는 아직 감사일기가 없어요.
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary */}
                <div className="p-4 bg-accent/30 rounded-lg">
                  <p className="text-foreground font-medium">{monthlyReport.summary}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-card rounded-lg border">
                    <div className="text-2xl font-bold text-primary">{monthlyReport.totalEntries}</div>
                    <div className="text-sm text-muted-foreground">총 기록일</div>
                  </div>
                  <div className="text-center p-4 bg-card rounded-lg border">
                    <div className="text-2xl font-bold text-green-600">{monthlyReport.positiveRate}%</div>
                    <div className="text-sm text-muted-foreground">긍정률</div>
                  </div>
                  <div className="text-center p-4 bg-card rounded-lg border">
                    <div className="text-2xl font-bold text-blue-600">
                      {monthlyReport.topEmotions[0] ? emotionConfig[monthlyReport.topEmotions[0]].icon : '-'}
                    </div>
                    <div className="text-sm text-muted-foreground">주요 감정</div>
                  </div>
                  <div className="text-center p-4 bg-card rounded-lg border">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round(monthlyReport.totalEntries / 30 * 100)}%
                    </div>
                    <div className="text-sm text-muted-foreground">기록률</div>
                  </div>
                </div>

                                 {/* Emotion Distribution */}
                 <div>
                   <Label className="text-lg font-semibold mb-4 block">감정 분포</Label>
                   <div className="space-y-2">
                     {(Object.keys(emotionConfig) as Emotion[]).map((emotion) => {
                       const count = monthlyReport.emotionDistribution[emotion];
                       const percentage = monthlyReport.totalEntries > 0 
                         ? Math.round((count / monthlyReport.totalEntries) * 100) 
                         : 0;
                       
                       return (
                         <div key={emotion} className="flex items-center gap-3">
                           <span className="text-2xl">{emotionConfig[emotion].icon}</span>
                           <span className="flex-1 font-medium">{emotion}</span>
                           <div className="flex-1 bg-muted rounded-full h-2">
                             <div 
                               className="bg-primary h-2 rounded-full transition-all duration-300"
                               style={{ width: `${percentage}%` }}
                             />
                           </div>
                           <span className="text-sm text-muted-foreground w-12 text-right">
                             {count}일
                           </span>
                         </div>
                       );
                     })}
                   </div>
                 </div>

                 {/* Top Keywords */}
                 {monthlyReport.topKeywords.length > 0 && (
                   <div>
                     <Label className="text-lg font-semibold mb-4 block">자주 감사했던 키워드</Label>
                     <div className="flex flex-wrap gap-2">
                       {monthlyReport.topKeywords.map((keyword, index) => (
                         <span 
                           key={keyword}
                           className="px-3 py-1 bg-accent/50 rounded-full text-sm font-medium text-foreground"
                         >
                           {keyword}
                         </span>
                       ))}
                     </div>
                   </div>
                 )}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};