import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { ClassItem, StudyMaterialItem } from '../types';

export const BUCKET_NAME = 'study-materials';

// ==========================================
// CLASSES API
// ==========================================
export async function fetchClasses(): Promise<ClassItem[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching classes from Supabase:', error);
    throw error;
  }

  return data || [];
}

export async function createClass(name: string, description?: string): Promise<ClassItem> {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local to save classes.'
    );
  }

  const { data, error } = await supabase
    .from('classes')
    .insert([{ name: name.trim(), description: description?.trim() || null }])
    .select()
    .single();

  if (error) {
    console.error('Error creating class:', error);
    throw error;
  }

  return data;
}

export async function deleteClass(id: string): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase.from('classes').delete().eq('id', id);
  if (error) {
    console.error('Error deleting class:', error);
    throw error;
  }
}

// ==========================================
// STUDY MATERIALS API
// ==========================================
export async function fetchStudyMaterials(classId?: string): Promise<StudyMaterialItem[]> {
  if (!isSupabaseConfigured || !classId) {
    return [];
  }

  let query = supabase
    .from('study_materials')
    .select('*')
    .order('created_at', { ascending: false });

  if (classId) {
    query = query.eq('class_id', classId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching study materials from Supabase:', error);
    throw error;
  }

  return data || [];
}

export async function uploadStudyMaterial(
  file: File,
  classId: string,
  extractedText?: string
): Promise<StudyMaterialItem> {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local to upload materials.'
    );
  }

  // 1. Upload binary file directly to Supabase Storage bucket 'study-materials'
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${classId}/${Date.now()}_${cleanName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Supabase Storage upload error:', uploadError);
    throw new Error(`Failed to upload to bucket '${BUCKET_NAME}': ${uploadError.message}`);
  }

  // 2. Retrieve the public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  const publicUrl = urlData?.publicUrl || '';

  // 3. Insert record into study_materials table
  const insertPayload: Record<string, any> = {
    class_id: classId,
    file_name: file.name,
    file_url: publicUrl,
  };

  if (extractedText !== undefined) {
    insertPayload.extracted_text = extractedText;
  }

  let { data, error: dbError } = await supabase
    .from('study_materials')
    .insert([insertPayload])
    .select()
    .single();

  // Gracefully handle if extracted_text column is not yet present in Supabase table
  if (dbError && dbError.message?.toLowerCase().includes('extracted_text')) {
    console.warn(
      'Notice: extracted_text column not yet created in Supabase. Inserting without it. Run supabase_schema.sql to persist extracted text.',
      dbError
    );
    delete insertPayload.extracted_text;
    const retry = await supabase
      .from('study_materials')
      .insert([insertPayload])
      .select()
      .single();
    data = retry.data;
    dbError = retry.error;
  }

  if (dbError) {
    console.error('Supabase database insert error:', dbError);
    // Cleanup uploaded storage file if db insert fails
    await supabase.storage.from(BUCKET_NAME).remove([filePath]).catch(() => {});
    throw dbError;
  }

  return data;
}

export async function deleteStudyMaterial(id: string, fileUrl?: string): Promise<void> {
  if (!isSupabaseConfigured) return;

  // If fileUrl is provided, attempt to parse and delete storage file
  if (fileUrl) {
    try {
      const urlParts = fileUrl.split(`/${BUCKET_NAME}/`);
      if (urlParts.length > 1) {
        const path = decodeURIComponent(urlParts[1]);
        await supabase.storage.from(BUCKET_NAME).remove([path]);
      }
    } catch (e) {
      console.warn('Storage file deletion warning:', e);
    }
  }

  const { error } = await supabase.from('study_materials').delete().eq('id', id);
  if (error) {
    console.error('Error deleting study material:', error);
    throw error;
  }
}
