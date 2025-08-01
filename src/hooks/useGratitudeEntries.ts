import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
  user_id: string;
  items: GratitudeItem[];
}

export const useGratitudeEntries = () => {
  const [entries, setEntries] = useState<GratitudeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // 일기 목록 조회 (감사 항목 포함)
  const fetchEntries = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // 먼저 감사 일기 엔트리들을 조회
      const { data: entriesData, error: entriesError } = await supabase
        .from('thanks_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (entriesError) {
        throw entriesError;
      }

      // 각 엔트리에 대한 감사 항목들을 조회
      const entriesWithItems = await Promise.all(
        entriesData.map(async (entry) => {
          const { data: itemsData, error: itemsError } = await supabase
            .from('thanks_items')
            .select('*')
            .eq('entry_id', entry.id)
            .order('order_index', { ascending: true });

          if (itemsError) {
            console.error('Error fetching items:', itemsError);
            return null;
          }

          return {
            id: entry.id,
            date: entry.date,
            emotion: entry.emotion as Emotion,
            summary: entry.summary,
            createdAt: entry.created_at,
            user_id: entry.user_id,
            items: itemsData || []
          };
        })
      );

      const validEntries = entriesWithItems.filter(Boolean) as GratitudeEntry[];
      setEntries(validEntries);
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
  const saveEntry = async (entryData: {
    date: string;
    emotion: Emotion;
    summary: string;
    items: { title: string; content: string; order_index: number }[];
  }) => {
    if (!user) return null;

    setLoading(true);
    try {
      // 1. 감사 일기 엔트리 저장/업데이트
      const { data: savedEntry, error: entryError } = await supabase
        .from('thanks_entries')
        .upsert({
          user_id: user.id,
          date: entryData.date,
          emotion: entryData.emotion,
          summary: entryData.summary
        }, {
          onConflict: 'user_id,date'
        })
        .select()
        .single();

      if (entryError) {
        throw entryError;
      }

      // 2. 기존 감사 항목들 삭제
      const { error: deleteError } = await supabase
        .from('thanks_items')
        .delete()
        .eq('entry_id', savedEntry.id);

      if (deleteError) {
        console.error('Error deleting existing items:', deleteError);
      }

      // 3. 새로운 감사 항목들 저장
      if (entryData.items.length > 0) {
        const itemsToInsert = entryData.items.map(item => ({
          entry_id: savedEntry.id,
          title: item.title,
          content: item.content,
          order_index: item.order_index
        }));

        const { error: itemsError } = await supabase
          .from('thanks_items')
          .insert(itemsToInsert);

        if (itemsError) {
          throw itemsError;
        }
      }

      // 4. 저장된 데이터 조회
      const { data: savedItems, error: itemsError } = await supabase
        .from('thanks_items')
        .select('*')
        .eq('entry_id', savedEntry.id)
        .order('order_index', { ascending: true });

      if (itemsError) {
        throw itemsError;
      }

      const formattedEntry: GratitudeEntry = {
        id: savedEntry.id,
        date: savedEntry.date,
        emotion: savedEntry.emotion as Emotion,
        summary: savedEntry.summary,
        createdAt: savedEntry.created_at,
        user_id: savedEntry.user_id,
        items: savedItems || []
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