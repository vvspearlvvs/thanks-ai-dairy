import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGratitudeEntries, Emotion, GratitudeItemInput } from '../hooks/useGratitudeEntries';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const emotionConfig = {
  '행복': { color: '#FF6B6B', icon: '🥰', theme: 'warm' },
  '기쁨': { color: '#4ECDC4', icon: '🥳', theme: 'joy' },
  '뿌듯': { color: '#45B7D1', icon: '😄', theme: 'success' },
  '편안': { color: '#96CEB4', icon: '😉', theme: 'calm' },
  '피곤': { color: '#FFEAA7', icon: '😴', theme: 'neutral' },
  '우울': { color: '#DDA0DD', icon: '😢', theme: 'melancholy' }
};

interface GratitudeDiaryProps {
  onShowList: () => void;
}

export const GratitudeDiary = ({ onShowList }: GratitudeDiaryProps) => {
  const { entries, loading: entriesLoading, saveEntry, deleteEntry: deleteEntryFromDB, getEntryByDate } = useGratitudeEntries();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  const [entry, setEntry] = useState<{
    emotion: Emotion;
  }>({
    emotion: '행복'
  });

  // 동적 감사 항목 관리
  const [gratitudeItems, setGratitudeItems] = useState<GratitudeItemInput[]>([
    { id: '1', title: '오늘도 잘했어, 나!', inputs: [''] },
    { id: '2', title: '타인 덕분에 빛난 하루', inputs: [''] },
    { id: '3', title: '이런 상황까지 고마워', inputs: [''] }
  ]);

  const [isLoading, setIsLoading] = useState(false);

  // 선택된 날짜의 일기 확인
  const existingEntry = getEntryByDate(selectedDate);

  // 선택된 날짜가 변경되면 기존 일기 불러오기
  useEffect(() => {
    if (existingEntry) {
      setEntry({
        emotion: existingEntry.emotion
      });
      
      // 기존 데이터를 동적 항목으로 변환
      const defaultTitles = ['오늘도 잘했어, 나!', '타인 덕분에 빛난 하루', '이런 상황까지 고마워'];
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
        emotion: '행복'
      });
      setGratitudeItems([
        { id: '1', title: '오늘도 잘했어, 나!', inputs: [''] },
        { id: '2', title: '타인 덕분에 빛난 하루', inputs: [''] },
        { id: '3', title: '이런 상황까지 고마워', inputs: [''] }
      ]);
    }
  }, [selectedDate, existingEntry]);

  const handleSave = async () => {
    // 감사 항목이 하나라도 입력되었는지 확인
    const hasContent = gratitudeItems.some(item => 
      item.inputs.some(input => input.trim())
    );

    if (!hasContent) {
      Alert.alert('알림', '감사한 내용을 하나 이상 입력해주세요.');
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

      // 요약을 자동으로 생성 (감사 항목들의 제목을 조합)
      const summary = itemsToSave.map(item => item.title).join(', ');

      await saveEntry(selectedDate, entry.emotion, summary, itemsToSave);
      Alert.alert('성공', '감사 일기가 저장되었습니다!');
    } catch (error) {
      Alert.alert('오류', '저장 중 오류가 발생했습니다.');
      console.error('Save error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingEntry) return;

    Alert.alert(
      '삭제 확인',
      '이 날짜의 일기를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEntryFromDB(existingEntry.id);
              Alert.alert('성공', '일기가 삭제되었습니다.');
            } catch (error) {
              Alert.alert('오류', '삭제 중 오류가 발생했습니다.');
            }
          }
        }
      ]
    );
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4ECDC4" />
        <Text style={styles.loadingText}>로딩 중...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.listButton} onPress={onShowList}>
            <Text style={styles.listButtonText}>📋 목록</Text>
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.date}>
              {format(new Date(selectedDate), 'yyyy년 MM월 dd일 EEEE', { locale: ko })}
            </Text>
          </View>
        </View>

        {/* 감정 선택 */}
        <View style={styles.emotionSection}>
          <Text style={styles.sectionTitle}>오늘 기분은 어땠어?</Text>
          <View style={styles.emotionGrid}>
            {(Object.keys(emotionConfig) as Emotion[]).map((emotion) => (
              <TouchableOpacity
                key={emotion}
                style={[
                  styles.emotionButton,
                  entry.emotion === emotion && styles.emotionButtonSelected
                ]}
                onPress={() => setEntry(prev => ({ ...prev, emotion }))}
              >
                <Text style={styles.emotionIcon}>{emotionConfig[emotion].icon}</Text>
                <Text style={[
                  styles.emotionText,
                  entry.emotion === emotion && styles.emotionTextSelected
                ]}>
                  {emotion}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 감사 항목들 */}
        <View style={styles.itemsSection}>
          {gratitudeItems.map((item) => (
            <View key={item.id} style={styles.itemContainer}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              {item.inputs.map((input, inputIndex) => (
                <View key={inputIndex} style={styles.inputRow}>
                  <TextInput
                    style={styles.itemInput}
                    value={input}
                    onChangeText={(text) => updateInput(item.id, inputIndex, text)}
                    placeholder={'오늘 감사했던 일에 대해 작성해보세요.'}
                    multiline
                  />
                  {item.inputs.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeInputField(item.id, inputIndex)}
                    >
                      <Text style={styles.removeButtonText}>삭제</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => addInputField(item.id)}
              >
                <Text style={styles.addButtonText}>+ 추가</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* 저장/삭제 버튼 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.disabledButton]}
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveButtonText}>💝 저장하기</Text>
            )}
          </TouchableOpacity>

          {existingEntry && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
            >
              <Text style={styles.deleteButtonText}>🗑️ 삭제하기</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  listButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginBottom: 20,
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  listButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  date: {
    fontSize: 18,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  emotionSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 16,
    textAlign: 'center',
  },
  emotionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  emotionButton: {
    width: '30%',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emotionButtonSelected: {
    borderColor: '#4ECDC4',
    backgroundColor: '#f0fdfa',
    transform: [{ scale: 1.05 }],
  },
  emotionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  emotionText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    fontWeight: '600',
  },
  emotionTextSelected: {
    color: '#4ECDC4',
    fontWeight: '700',
  },
  itemsSection: {
    marginBottom: 30,
  },
  itemContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemInput: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginRight: 12,
    textAlignVertical: 'top',
    minHeight: 80,
    fontWeight: '500',
  },
  removeButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  removeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    alignSelf: 'center',
    marginTop: 8,
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    gap: 16,
    marginBottom: 40,
  },
  saveButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  deleteButton: {
    backgroundColor: '#ff6b6b',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
  },
});
