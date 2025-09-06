import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { useGratitudeEntries, type Emotion, type GratitudeEntry } from '@/hooks/useGratitudeEntries';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar, Heart, Trash2, Edit, ArrowLeft } from 'lucide-react';

const emotionConfig = {
  '행복': { color: 'bg-red-100 text-red-800', icon: '🥰' },
  '기쁨': { color: 'bg-teal-100 text-teal-800', icon: '🥳' },
  '뿌듯': { color: 'bg-blue-100 text-blue-800', icon: '😄' },
  '편안': { color: 'bg-green-100 text-green-800', icon: '😉' },
  '피곤': { color: 'bg-yellow-100 text-yellow-800', icon: '😴' },
  '우울': { color: 'bg-purple-100 text-purple-800', icon: '😢' }
};

interface DiaryListProps {
  onBack: () => void;
  onEdit: (date: string) => void;
}

export const DiaryList = ({ onBack, onEdit }: DiaryListProps) => {
  const { entries, deleteEntry } = useGratitudeEntries();
  const [selectedEntry, setSelectedEntry] = useState<GratitudeEntry | null>(null);

  const handleDelete = async (entryId: string, date: string) => {
    if (confirm(`${date}의 일기를 삭제하시겠습니까?`)) {
      try {
        await deleteEntry(entryId);
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
  };

  const handleViewDetails = (entry: GratitudeEntry) => {
    setSelectedEntry(entry);
  };

  const handleCloseDetails = () => {
    setSelectedEntry(null);
  };

  if (entries.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center mb-8">
              <Button variant="ghost" onClick={onBack} className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                뒤로가기
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">감사 일기 목록</h1>
            </div>
            
            <Card className="p-12 text-center">
              <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-600 mb-2">아직 작성된 일기가 없습니다</h2>
              <p className="text-gray-500 mb-6">첫 번째 감사 일기를 작성해보세요!</p>
              <Button onClick={onBack}>
                일기 작성하러 가기
              </Button>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (selectedEntry) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center mb-6">
              <Button variant="ghost" onClick={handleCloseDetails} className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                목록으로
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">일기 상세보기</h1>
            </div>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {format(parseISO(selectedEntry.date), 'yyyy년 MM월 dd일 EEEE', { locale: ko })}
                  </h2>
                  <Badge className={`${emotionConfig[selectedEntry.emotion].color} text-sm`}>
                    {emotionConfig[selectedEntry.emotion].icon} {selectedEntry.emotion}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(selectedEntry.date)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    수정
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(selectedEntry.id, selectedEntry.date)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    삭제
                  </Button>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">오늘 요약</h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                    {selectedEntry.summary}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">감사 내용</h3>
                  <div className="space-y-4">
                    {selectedEntry.items.map((item, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg border">
                        <h4 className="font-medium text-gray-900 mb-2">{item.title}</h4>
                        <p className="text-gray-700 whitespace-pre-line">{item.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <Button variant="ghost" onClick={onBack} className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                뒤로가기
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">감사 일기 목록</h1>
            </div>
            <Badge variant="secondary" className="text-sm">
              총 {entries.length}개의 일기
            </Badge>
          </div>

          <div className="space-y-4">
            {entries.map((entry) => (
              <Card key={entry.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <h2 className="text-xl font-semibold text-gray-900">
                        {format(parseISO(entry.date), 'yyyy년 MM월 dd일 EEEE', { locale: ko })}
                      </h2>
                      <Badge className={`${emotionConfig[entry.emotion].color} text-sm`}>
                        {emotionConfig[entry.emotion].icon} {entry.emotion}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {entry.summary}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {format(parseISO(entry.created_at), 'MM/dd HH:mm')}
                      </span>
                      <span>{entry.items.length}개의 감사 항목</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(entry)}
                    >
                      자세히 보기
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(entry.date)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      수정
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(entry.id, entry.date)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
