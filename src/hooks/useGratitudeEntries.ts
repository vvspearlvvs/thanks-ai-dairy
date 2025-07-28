import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type Emotion = '행복' | '기쁨' | '뿌듯' | '편안' | '피곤' | '우울';

export interface GratitudeEntry {
  id: string;
  date: string;
  self: string;
  others: string;
  situation: string;
  emotion: Emotion;
  summary: string;
  createdAt: string;
  user_id: string;
}

export const useGratitudeEntries = () => {
  const [entries, setEntries] = useState<GratitudeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // 일기 목록 조회
  const fetchEntries = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('thanks_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        throw error;
      }

      const formattedEntries: GratitudeEntry[] = data.map(entry => ({
        id: entry.id,
        date: entry.date,
        self: entry.self,
        others: entry.others,
        situation: entry.situation,
        emotion: entry.emotion as Emotion,
        summary: entry.summary,
        createdAt: entry.created_at,
        user_id: entry.user_id
      }));

      setEntries(formattedEntries);
    } catch (error) {
      console.error('Error fetching entries:', error);
      toast({
        title: "일기 조회 실패",
        description: "일기를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // 일기 저장 (새로 생성 또는 업데이트)
  const saveEntry = async (entryData: Omit<GratitudeEntry, 'id' | 'createdAt' | 'user_id'>) => {
    if (!user) return null;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('thanks_entries')
        .upsert({
          user_id: user.id,
          date: entryData.date,
          self: entryData.self,
          others: entryData.others,
          situation: entryData.situation,
          emotion: entryData.emotion,
          summary: entryData.summary
        }, {
          onConflict: 'user_id,date'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      const formattedEntry: GratitudeEntry = {
        id: data.id,
        date: data.date,
        self: data.self,
        others: data.others,
        situation: data.situation,
        emotion: data.emotion as Emotion,
        summary: data.summary,
        createdAt: data.created_at,
        user_id: data.user_id
      };

      // 로컬 상태 업데이트
      setEntries(prev => {
        const existingIndex = prev.findIndex(e => e.date === entryData.date);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = formattedEntry;
          return updated;
        } else {
          return [formattedEntry, ...prev].sort((a, b) => b.date.localeCompare(a.date));
        }
      });

      toast({
        title: "일기가 저장되었습니다",
        description: "감사일기가 성공적으로 저장되었어요.",
      });

      return formattedEntry;
    } catch (error) {
      console.error('Error saving entry:', error);
      toast({
        title: "일기 저장 실패",
        description: "일기를 저장하는 중 오류가 발생했습니다.",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 일기 삭제
  const deleteEntry = async (date: string) => {
    if (!user) return false;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('thanks_entries')
        .delete()
        .eq('user_id', user.id)
        .eq('date', date);

      if (error) {
        throw error;
      }

      // 로컬 상태 업데이트
      setEntries(prev => prev.filter(e => e.date !== date));

      toast({
        title: "일기가 삭제되었습니다",
        description: "선택한 날짜의 일기가 삭제되었어요.",
      });

      return true;
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        title: "일기 삭제 실패",
        description: "일기를 삭제하는 중 오류가 발생했습니다.",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 특정 날짜의 일기 조회
  const getEntryByDate = (date: string) => {
    return entries.find(entry => entry.date === date);
  };

  // 특정 월의 일기들 조회
  const getEntriesByMonth = (year: number, month: number) => {
    const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
    return entries.filter(entry => entry.date.startsWith(monthStr));
  };

  // 사용자가 로그인할 때 일기 목록 조회
  useEffect(() => {
    if (user) {
      fetchEntries();
    } else {
      setEntries([]);
    }
  }, [user]);

  return {
    entries,
    loading,
    saveEntry,
    deleteEntry,
    getEntryByDate,
    getEntriesByMonth,
    refetch: fetchEntries
  };
};