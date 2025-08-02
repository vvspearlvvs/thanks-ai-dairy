import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useGratitudeEntries, type Emotion, type GratitudeEntry } from '@/hooks/useGratitudeEntries';
import { Heart, Sparkles, Send, Key, CheckCircle, Loader2, Calendar, BarChart3, List, Plus, ArrowLeft, Trash2, LogOut, User, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';

interface MonthlyReport {
  totalEntries: number;
  emotionDistribution: Record<Emotion, number>;
  topEmotions: Emotion[];
  positiveRate: number;
  summary: string;
}

interface GratitudeItem {
  id: string;
  title: string;
  inputs: string[];
}

const emotionConfig = {
  '행복': { color: 'happy', icon: '🥰', theme: 'warm' },
  '기쁨': { color: 'joy', icon: '🥳', theme: 'joy' },
  '뿌듯': { color: 'proud', icon: '😄', theme: 'success' },
  '편안': { color: 'calm', icon: '😉', theme: 'calm' },
  '피곤': { color: 'tired', icon: '😴', theme: 'neutral' },
  '우울': { color: 'sad', icon: '😢', theme: 'melancholy' }
};

type ViewMode = 'diary' | 'list' | 'report';

export const GratitudeDiary = () => {
  const { user, signOut } = useAuth();
  const { entries, loading: entriesLoading, saveEntry, deleteEntry: deleteEntryFromDB, getEntryByDate, getEntriesByMonth } = useGratitudeEntries();
  const [apiKey, setApiKey] = useState('');
  const [tempApiKey, setTempApiKey] = useState('');
  const [showApiInput, setShowApiInput] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [viewMode, setViewMode] = useState<ViewMode>('diary');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  
  const [entry, setEntry] = useState<{
    emotion: Emotion;
    summary: string;
  }>({
    emotion: '행복',
    summary: ''
  });

  // 동적 감사 항목 관리 - 각 항목마다 여러 입력창
  const [gratitudeItems, setGratitudeItems] = useState<GratitudeItem[]>([
    { id: '1', title: '나에 대한 감사', inputs: [''] },
    { id: '2', title: '타인에 대한 감사', inputs: [''] },
    { id: '3', title: '상황에 대한 감사', inputs: [''] }
  ]);

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

  // 선택된 날짜의 일기 확인
  const existingEntry = getEntryByDate(selectedDate);

  // 선택된 날짜가 변경되면 기존 일기 불러오기
  useEffect(() => {
    if (existingEntry) {
      setEntry({
        emotion: existingEntry.emotion,
        summary: existingEntry.summary || ''
      });
      
      // 기존 데이터를 동적 항목으로 변환
      const defaultTitles = ['나에 대한 감사', '타인에 대한 감사', '상황에 대한 감사'];
      const itemsWithData = existingEntry.items.map((item, index) => ({
        id: (index + 1).toString(),
        title: item.title || defaultTitles[index] || `감사한 일 ${index + 1}`,
        inputs: [item.content]
      }));

      // 기본 3개 항목이 없으면 추가
      while (itemsWithData.length < 3) {
        itemsWithData.push({
          id: (itemsWithData.length + 1).toString(),
          title: defaultTitles[itemsWithData.length] || `감사한 일 ${itemsWithData.length + 1}`,
          inputs: ['']
        });
      }

      setGratitudeItems(itemsWithData);
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

  // 특정 항목에 입력창 추가
  const addInputToItem = (itemId: string) => {
    setGratitudeItems(prev => 
      prev.map(item => {
        if (item.id === itemId && item.inputs.length < 4) {
          return { ...item, inputs: [...item.inputs, ''] };
        }
        return item;
      })
    );
  };

  // 특정 항목에서 입력창 삭제
  const removeInputFromItem = (itemId: string, inputIndex: number) => {
    setGratitudeItems(prev => 
      prev.map(item => {
        if (item.id === itemId && item.inputs.length > 1) {
          const newInputs = item.inputs.filter((_, index) => index !== inputIndex);
          return { ...item, inputs: newInputs };
        }
        return item;
      })
    );
  };

  // 특정 항목의 특정 입력창 내용 업데이트
  const updateItemInput = (itemId: string, inputIndex: number, content: string) => {
    setGratitudeItems(prev => 
      prev.map(item => {
        if (item.id === itemId) {
          const newInputs = [...item.inputs];
          newInputs[inputIndex] = content;
          return { ...item, inputs: newInputs };
        }
        return item;
      })
    );
  };

  const generateSummaryPrompt = (items: GratitudeItem[], emotion: Emotion): string => {
    const itemsText = items.map((item, index) => {
      const filledInputs = item.inputs.filter(input => input.trim());
      if (filledInputs.length === 0) return null;
      
      const inputsText = filledInputs.map((input, inputIndex) => 
        `  ${inputIndex + 1}. ${input}`
      ).join('\n');
      
      return `- ${item.title}:\n${inputsText}`;
    }).filter(Boolean).join('\n');

    return `당신은 감정에 섬세하게 반응하는 고급 핵심 요약 전문가입니다.

사용자는 하루 동안 다음 정보를 기록했습니다:
${itemsText}
- 감정: ${emotion} (하루의 전반적인 정서: 행복, 뿌듯, 기쁨, 편안, 피곤, 우울 중 하나)

당신의 역할은 이 정보를 바탕으로, **사용자의 하루를 1문장(40자 내외)**으로 요약하는 것입니다.

---

## ✅ 반드시 반영할 요소:

1. **가장 많이 입력한 감사 항목**에 대해 집중적으로 요약할 것
2. **실제로 일어난 일 또는 구체적인 행동 또는 인물**을 요약 안에 포함시킬 것  
3. 그 일이 사용자의 하루에 어떤 **의미**였는지를 **간접적으로 묘사**할 것  
4. 감정은 직접 언급하지 말고, 문장의 어조·단어·뉘앙스를 통해 **정서적으로 암시**할 것  
5. 문장은 반드시 **40자 내외, 1문장**, 느낌표/의문문/말줄임표 없이 작성  
6. 말투는 **밝고 긍정적이면서 따뜻하게** 유머는 **유쾌하고 솔직하게**, **희망적인 미래를 암시**할 것  
7. 감정이 '피곤', '우울'일 경우 → **왜 그 감정이 들었을지 심리적으로 추론**하고,  
   → 그걸 **감정에 빠지지 않고 조용히 받아들이는 어조로** 표현  
8. 감정이 '행복', '뿌듯', '기쁨'일 경우 → **그 감정이 형성된 가치/행동/선택**을 중심으로 묘사하고,  
   → **잔잔한 응원이나 자기 확신의 톤**을 담을 것

번호나 기호 없이 한 줄로만 작성해줘.`;
  };

  const handleSave = async () => {
    if (!apiKey) {
      toast({
        title: "API 키가 필요합니다",
        description: "설정에서 Gemini API 키를 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    // 각 항목에서 최소 하나의 입력이 있는지 확인
    const hasValidInputs = gratitudeItems.every(item => 
      item.inputs.some(input => input.trim())
    );

    if (!hasValidInputs) {
      toast({
        title: "모든 항목을 입력해주세요",
        description: "각 항목에서 최소 하나의 감사한 일을 작성해주세요.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // 1. 한줄 일기 생성
      const summaryResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: generateSummaryPrompt(gratitudeItems, entry.emotion)
            }]
          }]
        })
      });

      if (!summaryResponse.ok) {
        throw new Error('한줄 일기 생성에 실패했습니다');
      }

      const summaryData = await summaryResponse.json();
      const summaryText = summaryData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      if (!summaryText) {
        throw new Error('한줄 일기 생성에 실패했습니다');
      }

      const summary = summaryText.trim();
      setEntry(prev => ({ ...prev, summary }));

      // 2. 감사 항목들을 데이터베이스 형식으로 변환
      const itemsToSave = gratitudeItems.flatMap((item, itemIndex) =>
        item.inputs
          .filter(input => input.trim()) // 빈 입력 제외
          .map((input, inputIndex) => ({
            title: item.title,
            content: input,
            order_index: itemIndex * 10 + inputIndex // 순서 관리
          }))
      );

      // 3. Supabase에 일기 저장
      const savedEntry = await saveEntry({
        date: selectedDate,
        emotion: entry.emotion,
        summary,
        items: itemsToSave
      });

      if (savedEntry) {
        // 저장 성공시 토스트는 hook에서 처리됨
        // 로컬 상태는 자동으로 업데이트됨
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
      emotion: '행복',
      summary: ''
    });
    setGratitudeItems([
      { id: '1', title: '나에 대한 감사', inputs: [''] },
      { id: '2', title: '타인에 대한 감사', inputs: [''] },
      { id: '3', title: '상황에 대한 감사', inputs: [''] }
    ]);
  };

  const deleteEntry = async () => {
    if (!existingEntry) return;
    
    const success = await deleteEntryFromDB(selectedDate);
    if (success) {
      resetForm();
    }
  };

  // 월간 리포트 생성
  const generateMonthlyReport = (): MonthlyReport => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const monthEntries = getEntriesByMonth(year, month);

    const emotionDistribution: Record<Emotion, number> = {
      '행복': 0, '기쁨': 0, '뿌듯': 0, '편안': 0, '피곤': 0, '우울': 0
    };

    monthEntries.forEach(entry => {
      emotionDistribution[entry.emotion]++;
    });

    const totalEntries = monthEntries.length;
    const positiveEmotions = ['행복', '기쁨'] as Emotion[];
    const positiveCount = positiveEmotions.reduce((sum, emotion) => sum + emotionDistribution[emotion], 0);
    const positiveRate = totalEntries > 0 ? Math.round((positiveCount / totalEntries) * 100) : 0;

    const topEmotions = Object.entries(emotionDistribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([emotion]) => emotion as Emotion);

    const summary = totalEntries > 0 
      ? `이번 달, 당신은 ${totalEntries}일의 감사일기를 기록했고, ${positiveRate}%의 날에 긍정적인 감정을 느꼈어요.`
      : '이번 달에는 아직 감사일기를 기록하지 않았어요.';

    return {
      totalEntries,
      emotionDistribution,
      topEmotions,
      positiveRate,
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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">{user?.email}</span>
            </div>
            <Button 
              onClick={signOut} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              로그아웃
            </Button>
          </div>
          
          <div className="flex items-center justify-center gap-3">
            <Heart className="w-8 h-8 text-primary animate-gentle-pulse" />
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-warm bg-clip-text text-transparent">
              감사일기
            </h1>
            <Sparkles className="w-8 h-8 text-primary animate-float" />
          </div>
          <p className="text-muted-foreground text-lg">
            작고 사소하지만 행복하고 감사했던 순간들을 기록하면, AI가 한줄 일기를 작성해줍니다.
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

            {/* Dynamic Gratitude Entries */}
            <Card className="p-6 shadow-warm">
              <Label className="text-lg font-semibold mb-6 block">오늘 감사한 일들</Label>
              
              <div className="space-y-6">
                {gratitudeItems.map((item, itemIndex) => (
                  <div key={item.id} className="space-y-3">
                    <Label className="text-primary font-medium text-lg">
                      {itemIndex + 1}. {item.title}
                    </Label>
                    
                    <div className="space-y-3">
                      {item.inputs.map((input, inputIndex) => (
                        <div key={inputIndex} className="flex items-start gap-2">
                          <div className="flex-1">
                            <Input
                              placeholder="감사했던 일을 한 줄로 적어보세요... (50자 내외)"
                              value={input}
                              onChange={(e) => updateItemInput(item.id, inputIndex, e.target.value)}
                              className="transition-all duration-300 focus:shadow-soft"
                              maxLength={50}
                            />
                            <div className="text-right text-xs text-muted-foreground mt-1">
                              {input.length}/50
                            </div>
                          </div>
                          
                          {inputIndex === item.inputs.length - 1 && item.inputs.length < 4 && (
                            <Button
                              onClick={() => addInputToItem(item.id)}
                              variant="outline"
                              size="sm"
                              className="h-10 w-10 p-0 flex-shrink-0"
                              title="입력창 추가"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          )}
                          
                          {inputIndex > 0 && (
                            <Button
                              onClick={() => removeInputFromItem(item.id, inputIndex)}
                              variant="ghost"
                              size="sm"
                              className="h-10 w-10 p-0 text-muted-foreground hover:text-destructive flex-shrink-0"
                              title="입력창 삭제"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <Button 
                  onClick={handleSave}
                  disabled={isLoading || entriesLoading || !apiKey}
                  variant="emotion"
                  className="flex-1"
                >
                  {(isLoading || entriesLoading) ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      저장 중...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      {existingEntry ? '수정하기' : '저장하기'}
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

            {/* AI Summary */}
            {entry.summary && (
              <Card className="p-6 shadow-gentle animate-fade-in">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-2xl">📝</div>
                  <Label className="text-lg font-semibold text-primary">
                    한줄 일기 요약
                  </Label>
                </div>
                <div className="p-4 bg-accent/20 rounded-lg border-l-4 border-accent animate-fade-in">
                  <p className="text-foreground leading-relaxed font-medium">
                    {entry.summary}
                  </p>
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
                      {entry.summary ? (
                        <div className="space-y-1 text-sm">
                          <p className="text-foreground font-medium">{entry.summary}</p>
                        </div>
                      ) : (
                        <div className="space-y-1 text-sm">
                          {entry.items.map((item, index) => (
                            <p key={index}><strong>{item.title}:</strong> {item.content}</p>
                          ))}
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
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};