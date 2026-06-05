import { supabaseAdmin } from '@/lib/supabase/admin';
import { generateToken } from '@/lib/data/tokens';
import { ApiError } from './http';

const BUCKET = 'invite-photos';

// Uploads a base64 data: URL to Supabase Storage and returns the public URL.
// Random filename → not enumerable. Object is deleted with the invite at 24h (retention job).
export async function uploadPhotoFromDataUrl(dataUrl: string): Promise<string | null> {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const contentType = match[1];
  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length > 6 * 1024 * 1024) throw new ApiError('INVALID', 'Slika je prevelika (max 6MB).');

  const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
  const path = `${generateToken(20)}.${ext}`;

  const sb = supabaseAdmin();
  const { error } = await sb.storage.from(BUCKET).upload(path, bytes, { contentType, upsert: false });
  if (error) throw new ApiError('SERVER', `Upload slike nije uspeo: ${error.message}`);

  return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
