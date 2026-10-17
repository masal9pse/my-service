-- database/migrations/nickname_to_goals.sql
-- goals テーブルに nickname（目標ごとのペルソナ名）カラムを追加（必須）

-- 1. nickname カラムをデフォルト値付きで NOT NULL 追加
ALTER TABLE public.goals 
ADD COLUMN IF NOT EXISTS nickname TEXT NOT NULL DEFAULT '蛇博士1';

-- 2. アプリケーション層で必須入力を担保するため、新規挿入時のDBデフォルト値を解除
ALTER TABLE public.goals 
ALTER COLUMN nickname DROP DEFAULT;
