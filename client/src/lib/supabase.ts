import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wtykoitqlndqyglpogux.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Função para upload de imagens
export async function uploadImage(file: File, bucket: string, path: string) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw error;
  }

  // Obter URL pública
  const { data: publicData } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return {
    path: data.path,
    url: publicData.publicUrl
  };
}

// Função para deletar imagens
export async function deleteImage(bucket: string, path: string) {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    throw error;
  }
}