
-- Enums
CREATE TYPE public.mood_t AS ENUM (
  'tender','restless','quiet','luminous','heavy',
  'hopeful','unsettled','still','wistful','warm'
);
CREATE TYPE public.poem_status_t AS ENUM ('draft','saved');

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile delete" ON public.profiles FOR DELETE USING (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- settings
CREATE TABLE public.settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  silence_mode BOOLEAN NOT NULL DEFAULT false,
  notifications_enabled BOOLEAN NOT NULL DEFAULT false,
  dark_mode BOOLEAN NOT NULL DEFAULT false,
  emotional_checkins_enabled BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own settings select" ON public.settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own settings insert" ON public.settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own settings update" ON public.settings FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own settings delete" ON public.settings FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER settings_updated_at BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- poems
CREATE TABLE public.poems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL DEFAULT '',
  status public.poem_status_t NOT NULL DEFAULT 'draft',
  word_count INTEGER NOT NULL DEFAULT 0,
  mood public.mood_t,
  ai_reflection TEXT,
  highlighted_line TEXT,
  day_tag TEXT,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  lock_hash TEXT,
  favorite BOOLEAN NOT NULL DEFAULT false,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_opened_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.poems TO authenticated;
GRANT ALL ON public.poems TO service_role;
ALTER TABLE public.poems ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own poems select" ON public.poems FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own poems insert" ON public.poems FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own poems update" ON public.poems FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own poems delete" ON public.poems FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX poems_user_idx ON public.poems(user_id);
CREATE INDEX poems_user_favorite_idx ON public.poems(user_id, favorite);
CREATE INDEX poems_user_archived_idx ON public.poems(user_id, archived);
CREATE INDEX poems_user_deleted_idx ON public.poems(user_id, deleted_at);
CREATE INDEX poems_user_status_idx ON public.poems(user_id, status);
CREATE INDEX poems_user_created_idx ON public.poems(user_id, created_at DESC);
CREATE INDEX poems_user_opened_idx ON public.poems(user_id, last_opened_at DESC);

-- Auto-create profile + settings on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.settings (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
