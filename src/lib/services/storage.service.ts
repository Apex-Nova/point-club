import { supabase } from '../supabase';

const BUCKET = 'thumbnails';

function dataURLtoBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png';
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export async function uploadThumbnail(drawingId: string, dataUrl: string): Promise<string> {
  const blob = dataURLtoBlob(dataUrl);
  const path = `${drawingId}.png`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    upsert: true,
    contentType: 'image/png',
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  // Cache-bust the URL so the dashboard always shows the latest thumbnail
  return `${data.publicUrl}?t=${Date.now()}`;
}

export async function deleteThumbnail(drawingId: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([`${drawingId}.png`]);
}
