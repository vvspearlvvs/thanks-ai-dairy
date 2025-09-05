import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type Emotion = '행복' | '기쁨' | '뿌듯' | '편안' | '피곤' | '우울';

export interface GratitudeItem {
  id: string;
  title: string;
  content: string;
  order_index: number;
}

export interface GratitudeEntry {
  id: string;
  date: string;
  emotion: Emotion;
  summary: string;
  createdAt: string;
  items: GratitudeItem[];
}

export const useGratitudeEntries = () => {
  const [entries, setEntries] = useState<GratitudeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // 로컬 스토리지에서 데이터 가져오기
  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = () => {
    try {
      const stored = localStorage.getItem('gratitude-entries');
      if (stored) {
        setEntries(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  };

  const saveEntries = (newEntries: GratitudeEntry[]) => {
    try {
      localStorage.setItem('gratitude-entries', JSON.stringify(newEntries));
      setEntries(newEntries);
    } catch (error) {
      console.error('Error saving entries:', error);
      toast({
        title: "오류",
        description: "데이터 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const saveEntry = async (date: string, emotion: Emotion, summary: string, items: Omit<GratitudeItem, 'id' | 'order_index'>[]) => {
    setLoading(true);
    try {
      const newEntry: GratitudeEntry = {
        id: Date.now().toString(),
        date,
        emotion,
        summary,
        createdAt: new Date().toISOString(),
        items: items.map((item, index) => ({
          ...item,
          id: `${Date.now()}-${index}`,
          order_index: index,
        })),
      };

      const existingIndex = entries.findIndex(entry => entry.date === date);
      let newEntries;
      
      if (existingIndex >= 0) {
        newEntries = [...entries];
        newEntries[existingIndex] = newEntry;
      } else {
        newEntries = [newEntry, ...entries];
      }

      saveEntries(newEntries);
      toast({
        title: "성공",
        description: "감사 일기가 저장되었습니다!",
      });
    } catch (error) {
      console.error('Error saving entry:', error);
      toast({
        title: "오류",
        description: "저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async (entryId: string) => {
    try {
      const newEntries = entries.filter(entry => entry.id !== entryId);
      saveEntries(newEntries);
      toast({
        title: "성공",
        description: "일기가 삭제되었습니다.",
      });
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        title: "오류",
        description: "삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const getEntryByDate = (date: string) => {
    return entries.find(entry => entry.date === date);
  };

  const getEntriesByMonth = (yearMonth: string) => {
    return entries.filter(entry => entry.date.startsWith(yearMonth));
  };

  return {
    entries,
    loading,
    saveEntry,
    deleteEntry,
    getEntryByDate,
    getEntriesByMonth,
    refreshEntries: loadEntries,
  };
};
