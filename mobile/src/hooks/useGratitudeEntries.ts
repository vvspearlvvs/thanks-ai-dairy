import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GratitudeEntry, GratitudeItem, Emotion } from '../types';

export const useGratitudeEntries = () => {
  const [entries, setEntries] = useState<GratitudeEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // AsyncStorage에서 데이터 가져오기
  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('gratitude-entries');
      if (stored) {
        setEntries(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  }, []);

  const saveEntries = useCallback(async (newEntries: GratitudeEntry[]) => {
    try {
      await AsyncStorage.setItem('gratitude-entries', JSON.stringify(newEntries));
      setEntries(newEntries);
    } catch (error) {
      console.error('Error saving entries:', error);
    }
  }, []);

  const saveEntry = useCallback(async (
    date: string,
    emotion: Emotion,
    summary: string,
    items: Omit<GratitudeItem, 'id' | 'order_index'>[]
  ) => {
    setLoading(true);
    try {
      const newEntry: GratitudeEntry = {
        id: Date.now().toString(),
        date,
        emotion,
        summary,
        created_at: new Date().toISOString(),
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

      await saveEntries(newEntries);
    } catch (error) {
      console.error('Error saving entry:', error);
    } finally {
      setLoading(false);
    }
  }, [entries, saveEntries]);

  const deleteEntry = useCallback(async (entryId: string) => {
    try {
      const newEntries = entries.filter(entry => entry.id !== entryId);
      await saveEntries(newEntries);
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  }, [entries, saveEntries]);

  const getEntryByDate = useCallback((date: string) => {
    return entries.find(entry => entry.date === date);
  }, [entries]);

  const getEntriesByMonth = useCallback((yearMonth: string) => {
    return entries.filter(entry => entry.date.startsWith(yearMonth));
  }, [entries]);

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
