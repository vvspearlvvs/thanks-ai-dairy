import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGratitudeEntries, Emotion, GratitudeEntry } from '../hooks/useGratitudeEntries';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

const emotionConfig = {
  '행복': { color: '#FF6B6B', icon: '🥰' },
  '기쁨': { color: '#4ECDC4', icon: '🥳' },
  '뿌듯': { color: '#45B7D1', icon: '😄' },
  '편안': { color: '#96CEB4', icon: '😉' },
  '피곤': { color: '#FFEAA7', icon: '😴' },
  '우울': { color: '#DDA0DD', icon: '😢' }
};

interface DiaryListProps {
  onBack: () => void;
  onEdit: (date: string) => void;
}

export const DiaryList = ({ onBack, onEdit }: DiaryListProps) => {
  const { entries, deleteEntry } = useGratitudeEntries();
  const [selectedEntry, setSelectedEntry] = useState<GratitudeEntry | null>(null);

  const handleDelete = async (entryId: string, date: string) => {
    Alert.alert(
      '삭제 확인',
      `${date}의 일기를 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEntry(entryId);
              Alert.alert('성공', '일기가 삭제되었습니다.');
            } catch (error) {
              Alert.alert('오류', '삭제 중 오류가 발생했습니다.');
            }
          }
        }
      ]
    );
  };

  const handleViewDetails = (entry: GratitudeEntry) => {
    setSelectedEntry(entry);
  };

  const handleCloseDetails = () => {
    setSelectedEntry(null);
  };

  const renderEntry = ({ item }: { item: GratitudeEntry }) => (
    <View style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <View style={styles.entryInfo}>
          <Text style={styles.entryDate}>
            {format(parseISO(item.date), 'yyyy년 MM월 dd일 EEEE', { locale: ko })}
          </Text>
          <View style={[styles.emotionBadge, { backgroundColor: emotionConfig[item.emotion].color }]}>
            <Text style={styles.emotionText}>
              {emotionConfig[item.emotion].icon} {item.emotion}
            </Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.entrySummary} numberOfLines={2}>
        {item.summary}
      </Text>
      
      <View style={styles.entryFooter}>
        <Text style={styles.entryMeta}>
          {format(parseISO(item.created_at), 'MM/dd HH:mm')} • {item.items.length}개 항목
        </Text>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleViewDetails(item)}
          >
            <Text style={styles.actionButtonText}>자세히</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onEdit(item.date)}
          >
            <Text style={styles.actionButtonText}>수정</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(item.id, item.date)}
          >
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>삭제</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (entries.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonText}>← 뒤로가기</Text>
            </TouchableOpacity>
            <Text style={styles.title}>감사 일기 목록</Text>
          </View>
          
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>��</Text>
            <Text style={styles.emptyTitle}>아직 작성된 일기가 없습니다</Text>
            <Text style={styles.emptySubtitle}>첫 번째 감사 일기를 작성해보세요!</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={onBack}>
              <Text style={styles.emptyButtonText}>일기 작성하러 가기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (selectedEntry) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleCloseDetails}>
              <Text style={styles.backButtonText}>← 목록으로</Text>
            </TouchableOpacity>
            <Text style={styles.title}>일기 상세보기</Text>
          </View>

          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailDate}>
                {format(parseISO(selectedEntry.date), 'yyyy년 MM월 dd일 EEEE', { locale: ko })}
              </Text>
              <View style={[styles.emotionBadge, { backgroundColor: emotionConfig[selectedEntry.emotion].color }]}>
                <Text style={styles.emotionText}>
                  {emotionConfig[selectedEntry.emotion].icon} {selectedEntry.emotion}
                </Text>
              </View>
            </View>

            <View style={styles.detailActions}>
              <TouchableOpacity
                style={styles.detailActionButton}
                onPress={() => onEdit(selectedEntry.date)}
              >
                <Text style={styles.detailActionButtonText}>✏️ 수정</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.detailActionButton, styles.deleteButton]}
                onPress={() => handleDelete(selectedEntry.id, selectedEntry.date)}
              >
                <Text style={[styles.detailActionButtonText, styles.deleteButtonText]}>🗑️ 삭제</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.detailContent}>
              <Text style={styles.detailSectionTitle}>오늘의 요약</Text>
              <Text style={styles.detailSummary}>{selectedEntry.summary}</Text>

              <Text style={styles.detailSectionTitle}>감사한 것들</Text>
              {selectedEntry.items.map((item, index) => (
                <View key={index} style={styles.detailItem}>
                  <Text style={styles.detailItemTitle}>{item.title}</Text>
                  <Text style={styles.detailItemContent}>{item.content}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← 뒤로가기</Text>
          </TouchableOpacity>
          <Text style={styles.title}>감사 일기 목록</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{entries.length}개</Text>
          </View>
        </View>

        <FlatList
          data={entries}
          renderItem={renderEntry}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      </View>
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
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  backButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  countBadge: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  countText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: 20,
  },
  entryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  entryHeader: {
    marginBottom: 8,
  },
  entryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  emotionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  emotionText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  entrySummary: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 12,
    lineHeight: 20,
  },
  entryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryMeta: {
    fontSize: 12,
    color: '#adb5bd',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#495057',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#ff6b6b',
  },
  deleteButtonText: {
    color: 'white',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#adb5bd',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  detailCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailHeader: {
    marginBottom: 16,
  },
  detailDate: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  detailActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  detailActionButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  detailActionButtonText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '600',
  },
  detailContent: {
    gap: 16,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  detailSummary: {
    fontSize: 16,
    color: '#495057',
    lineHeight: 24,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
  },
  detailItem: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
  },
  detailItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  detailItemContent: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
});
