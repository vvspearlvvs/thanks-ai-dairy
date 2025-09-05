import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useGratitudeEntries, type Emotion, type GratitudeEntry } from '@/hooks/useGratitudeEntries';
import { Heart, Sparkles, Send, Key, CheckCircle, Loader2, Calendar, BarChart3, List, Plus, ArrowLeft, Trash2 } from 'lucide-react';
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
  const { entries, loading: entriesLoading, saveEntry, deleteEntry: deleteEntryFromDB, getEntryByDate, getEntriesByMonth } = useGratitudeEntries();
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
      // 새 일기인 경우 기본값으로 초기화
      setEntry({
        emotion: '행복',
        summary: ''
      });
      setGratitudeItems([
        { id: '1', title: '나에 대한 감사', inputs: [''] },
        { id: '2', title: '타인에 대한 감사', inputs: [''] },
        { id: '3', title: '상황에 대한 감사', inputs: [''] }
      ]);
    }
  }, [selectedDate, existingEntry]);

  const handleSave = async () => {
    if (!entry.summary.trim()) {
      alert('요약을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const itemsToSave = gratitudeItems
        .filter(item => item.inputs.some(input => input.trim()))
        .map(item => ({
          title: item.title,
          content: item.inputs.filter(input => input.trim()).join('\n')
        }));

      await saveEntry(selectedDate, entry.emotion, entry.summary, itemsToSave);
      alert('감사 일기가 저장되었습니다!');
    } catch (error) {
      alert('저장 중 오류가 발생했습니다.');
      console.error('Save error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingEntry) return;

    if (confirm('이 날짜의 일기를 삭제하시겠습니까?')) {
      try {
        await deleteEntryFromDB(existingEntry.id);
        alert('일기가 삭제되었습니다.');
      } catch (error) {
        alert('삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const addInputField = (itemId: string) => {
    setGratitudeItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, inputs: [...item.inputs, ''] }
          : item
      )
    );
  };

  const removeInputField = (itemId: string, inputIndex: number) => {
    setGratitudeItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, inputs: item.inputs.filter((_, index) => index !== inputIndex) }
          : item
      )
    );
  };

  const updateInput = (itemId: string, inputIndex: number, value: string) => {
    setGratitudeItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { 
              ...item, 
              inputs: item.inputs.map((input, index) => 
                index === inputIndex ? value : input
              )
            }
          : item
      )
    );
  };

  if (entriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">감사 일기</h1>
            <p className="text-lg text-gray-600 mb-4">
              {format(new Date(selectedDate), 'yyyy년 MM월 dd일 EEEE', { locale: ko })}
            </p>
          </div>

          {/* 감정 선택 */}
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">오늘의 감정</h2>
            <div className="grid grid-cols-3 gap-4">
              {(Object.keys(emotionConfig) as Emotion[]).map((emotion) => (
                <Button
                  key={emotion}
                  variant={entry.emotion === emotion ? "default" : "outline"}
                  className={`h-20 flex flex-col items-center justify-center ${
                    entry.emotion === emotion ? 'bg-primary text-primary-foreground' : ''
                  }`}
                  onClick={() => setEntry(prev => ({ ...prev, emotion }))}
                >
                  <span className="text-2xl mb-1">{emotionConfig[emotion].icon}</span>
                  <span className="text-sm">{emotion}</span>
                </Button>
              ))}
            </div>
          </Card>

          {/* 요약 입력 */}
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">오늘의 요약</h2>
            <Textarea
              value={entry.summary}
              onChange={(e) => setEntry(prev => ({ ...prev, summary: e.target.value }))}
              placeholder="오늘 하루를 요약해보세요..."
              className="min-h-[100px]"
            />
          </Card>

          {/* 감사 항목들 */}
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">감사한 것들</h2>
            {gratitudeItems.map((item) => (
              <div key={item.id} className="mb-6 last:mb-0">
                <h3 className="text-lg font-medium mb-3">{item.title}</h3>
                {item.inputs.map((input, inputIndex) => (
                  <div key={inputIndex} className="flex gap-2 mb-2">
                    <Textarea
                      value={input}
                      onChange={(e) => updateInput(item.id, inputIndex, e.target.value)}
                      placeholder={`${item.title}에 대해 작성해보세요...`}
                      className="flex-1 min-h-[60px]"
                    />
                    {item.inputs.length > 1 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeInputField(item.id, inputIndex)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addInputField(item.id)}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  추가
                </Button>
              </div>
            ))}
          </Card>

          {/* 저장/삭제 버튼 */}
          <div className="flex gap-4 justify-center">
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="px-8 py-3"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Heart className="h-4 w-4 mr-2" />
                  저장하기
                </>
              )}
            </Button>

            {existingEntry && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="px-8 py-3"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                삭제하기
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
