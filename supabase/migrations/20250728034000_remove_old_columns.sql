-- 기존 thanks_entries 테이블에서 불필요한 컬럼들 제거
-- 기존 데이터는 모두 지워도 되므로 안전하게 제거

-- 기존 데이터 삭제 (모든 데이터 초기화)
DELETE FROM public.thanks_items;
DELETE FROM public.thanks_entries;

-- 기존 컬럼들 제거
ALTER TABLE public.thanks_entries DROP COLUMN IF EXISTS self;
ALTER TABLE public.thanks_entries DROP COLUMN IF EXISTS others;
ALTER TABLE public.thanks_entries DROP COLUMN IF EXISTS situation;

-- 테이블 구조 확인을 위한 주석
-- 이제 thanks_entries 테이블은 다음 구조를 가집니다:
-- id UUID PRIMARY KEY
-- user_id UUID REFERENCES auth.users(id)
-- date DATE NOT NULL
-- emotion TEXT NOT NULL
-- summary TEXT NOT NULL DEFAULT ''
-- created_at TIMESTAMP WITH TIME ZONE
-- updated_at TIMESTAMP WITH TIME ZONE
-- UNIQUE(user_id, date) 