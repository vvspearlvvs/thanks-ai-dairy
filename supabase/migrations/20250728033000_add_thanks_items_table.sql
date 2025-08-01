-- 감사 항목을 저장하기 위한 새로운 테이블 생성
CREATE TABLE public.thanks_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID NOT NULL REFERENCES public.thanks_entries(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Row Level Security 활성화
ALTER TABLE public.thanks_items ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 일기의 항목만 볼 수 있음
CREATE POLICY "Users can view their own items" 
ON public.thanks_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.thanks_entries 
    WHERE thanks_entries.id = thanks_items.entry_id 
    AND thanks_entries.user_id = auth.uid()
  )
);

-- 사용자는 자신의 일기의 항목만 생성할 수 있음
CREATE POLICY "Users can create their own items" 
ON public.thanks_items 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.thanks_entries 
    WHERE thanks_entries.id = thanks_items.entry_id 
    AND thanks_entries.user_id = auth.uid()
  )
);

-- 사용자는 자신의 일기의 항목만 수정할 수 있음
CREATE POLICY "Users can update their own items" 
ON public.thanks_items 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.thanks_entries 
    WHERE thanks_entries.id = thanks_items.entry_id 
    AND thanks_entries.user_id = auth.uid()
  )
);

-- 사용자는 자신의 일기의 항목만 삭제할 수 있음
CREATE POLICY "Users can delete their own items" 
ON public.thanks_items 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.thanks_entries 
    WHERE thanks_entries.id = thanks_items.entry_id 
    AND thanks_entries.user_id = auth.uid()
  )
);

-- updated_at 자동 업데이트 트리거 생성
CREATE TRIGGER update_thanks_items_updated_at
    BEFORE UPDATE ON public.thanks_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 성능을 위한 인덱스
CREATE INDEX idx_thanks_items_entry_id ON public.thanks_items(entry_id);
CREATE INDEX idx_thanks_items_order_index ON public.thanks_items(order_index);

-- 기존 thanks_entries 테이블에서 불필요한 컬럼들 제거 (선택사항)
-- ALTER TABLE public.thanks_entries DROP COLUMN IF EXISTS self;
-- ALTER TABLE public.thanks_entries DROP COLUMN IF EXISTS others;
-- ALTER TABLE public.thanks_entries DROP COLUMN IF EXISTS situation; 