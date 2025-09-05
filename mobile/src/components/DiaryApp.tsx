import React, { useState } from 'react';
import { GratitudeDiary } from './GratitudeDiary';
import { DiaryList } from './DiaryList';

type ViewMode = 'diary' | 'list';

export const DiaryApp = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('diary');
  const [selectedDate, setSelectedDate] = useState<string>('');

  const handleShowList = () => {
    setViewMode('list');
  };

  const handleBackToDiary = () => {
    setViewMode('diary');
  };

  const handleEditEntry = (date: string) => {
    setSelectedDate(date);
    setViewMode('diary');
  };

  if (viewMode === 'list') {
    return (
      <DiaryList 
        onBack={handleBackToDiary}
        onEdit={handleEditEntry}
      />
    );
  }

  return (
    <GratitudeDiary 
      onShowList={handleShowList}
    />
  );
};
