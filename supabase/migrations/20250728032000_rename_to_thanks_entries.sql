-- 테이블명을 gratitude_entries에서 thanks_entries로 변경
ALTER TABLE public.gratitude_entries RENAME TO thanks_entries;

-- 인덱스명도 변경
DROP INDEX IF EXISTS idx_gratitude_entries_user_date;
DROP INDEX IF EXISTS idx_gratitude_entries_date;

CREATE INDEX idx_thanks_entries_user_date ON public.thanks_entries(user_id, date);
CREATE INDEX idx_thanks_entries_date ON public.thanks_entries(date);

-- 트리거명도 변경
DROP TRIGGER IF EXISTS update_gratitude_entries_updated_at ON public.thanks_entries;
CREATE TRIGGER update_thanks_entries_updated_at
    BEFORE UPDATE ON public.thanks_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- RLS 정책들도 새 테이블명으로 변경
DROP POLICY IF EXISTS "Users can view their own entries" ON public.thanks_entries;
DROP POLICY IF EXISTS "Users can create their own entries" ON public.thanks_entries;
DROP POLICY IF EXISTS "Users can update their own entries" ON public.thanks_entries;
DROP POLICY IF EXISTS "Users can delete their own entries" ON public.thanks_entries;

CREATE POLICY "Users can view their own entries" 
ON public.thanks_entries 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own entries" 
ON public.thanks_entries 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own entries" 
ON public.thanks_entries 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own entries" 
ON public.thanks_entries 
FOR DELETE 
USING (auth.uid() = user_id); 