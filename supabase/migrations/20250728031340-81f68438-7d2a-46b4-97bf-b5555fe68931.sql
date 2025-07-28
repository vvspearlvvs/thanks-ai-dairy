-- 감사일기를 위한 테이블 생성
CREATE TABLE public.gratitude_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  self TEXT NOT NULL,
  others TEXT NOT NULL,
  situation TEXT NOT NULL,
  emotion TEXT NOT NULL CHECK (emotion IN ('행복', '기쁨', '뿌듯', '편안', '피곤', '우울')),
  summary TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Row Level Security 활성화
ALTER TABLE public.gratitude_entries ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 일기만 볼 수 있음
CREATE POLICY "Users can view their own entries" 
ON public.gratitude_entries 
FOR SELECT 
USING (auth.uid() = user_id);

-- 사용자는 자신의 일기만 생성할 수 있음
CREATE POLICY "Users can create their own entries" 
ON public.gratitude_entries 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 일기만 수정할 수 있음
CREATE POLICY "Users can update their own entries" 
ON public.gratitude_entries 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 사용자는 자신의 일기만 삭제할 수 있음
CREATE POLICY "Users can delete their own entries" 
ON public.gratitude_entries 
FOR DELETE 
USING (auth.uid() = user_id);

-- updated_at 자동 업데이트를 위한 함수 생성
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 자동 업데이트 트리거 생성
CREATE TRIGGER update_gratitude_entries_updated_at
    BEFORE UPDATE ON public.gratitude_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 날짜별 조회 성능을 위한 인덱스
CREATE INDEX idx_gratitude_entries_user_date ON public.gratitude_entries(user_id, date);
CREATE INDEX idx_gratitude_entries_date ON public.gratitude_entries(date);