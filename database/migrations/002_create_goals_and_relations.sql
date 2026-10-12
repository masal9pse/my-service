-- 002_create_goals_and_relations.sql
-- 目標（goals）テーブルの作成と、todos テーブルとのリレーション設定

-- 1. goals（目標）テーブルの作成
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    deadline DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. 既存 todos テーブルに外部キーを追加
-- 目標との紐付け (goal_id)
ALTER TABLE public.todos 
ADD COLUMN IF NOT EXISTS goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE;

-- 作成者との直接紐付け (user_id: 認可・検索高速化用)
ALTER TABLE public.todos 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. インデックス作成（検索パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_goal_id ON public.todos(goal_id);
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON public.todos(user_id);
