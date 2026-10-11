-- ==============================================================================
-- OSPEprep: Supabase Production Schema & Storage Setup
-- Copy and paste this entire script into your Supabase SQL Editor and click RUN
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create 'classes' Table
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create 'study_materials' Table with Foreign Key to 'classes' and extracted_text
CREATE TABLE IF NOT EXISTS public.study_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    extracted_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure extracted_text column is present if table was created previously
ALTER TABLE public.study_materials ADD COLUMN IF NOT EXISTS extracted_text TEXT;

-- Index for efficient querying by class
CREATE INDEX IF NOT EXISTS idx_study_materials_class_id ON public.study_materials(class_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies: Allow Read, Insert, and Delete for all users
DROP POLICY IF EXISTS "Public select classes" ON public.classes;
CREATE POLICY "Public select classes" ON public.classes
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert classes" ON public.classes;
CREATE POLICY "Public insert classes" ON public.classes
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public delete classes" ON public.classes;
CREATE POLICY "Public delete classes" ON public.classes
    FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public select study_materials" ON public.study_materials;
CREATE POLICY "Public select study_materials" ON public.study_materials
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert study_materials" ON public.study_materials;
CREATE POLICY "Public insert study_materials" ON public.study_materials
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public delete study_materials" ON public.study_materials;
CREATE POLICY "Public delete study_materials" ON public.study_materials
    FOR DELETE USING (true);

-- 6. Storage Bucket Configuration for 'study-materials'
INSERT INTO storage.buckets (id, name, public)
VALUES ('study-materials', 'study-materials', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies for 'study-materials' bucket (Public Read, Upload & Delete)
DROP POLICY IF EXISTS "Public Read study-materials" ON storage.objects;
CREATE POLICY "Public Read study-materials" ON storage.objects
    FOR SELECT USING (bucket_id = 'study-materials');

DROP POLICY IF EXISTS "Public Insert study-materials" ON storage.objects;
CREATE POLICY "Public Insert study-materials" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'study-materials');

DROP POLICY IF EXISTS "Public Delete study-materials" ON storage.objects;
CREATE POLICY "Public Delete study-materials" ON storage.objects
    FOR DELETE USING (bucket_id = 'study-materials');
