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
  created_at: string;
  items: GratitudeItem[];
}

export interface GratitudeItemInput {
  id: string;
  title: string;
  inputs: string[];
}

export type ViewMode = 'diary' | 'list' | 'report';
