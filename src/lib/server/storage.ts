import { supabaseAdmin } from '@/lib/supabase/admin';
import { generateToken } from '@/lib/data/tokens';
import { ApiError } from './http';

const BUCKET = 'invite-photos';

// Allowed raster types only. SVG is excluded on purpose: it can carry script and would be
// stored XSS when served from the public bucket on its direct URL.
const ALLOWED: Record<string, 'png' | 'jpg' | 'webp'> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

// Verify the actual file bytes match the claimed type (the MIME in a data: URL is
// attacker-controlled — the client re-encode can be bypassed by POSTing directly).
function sniff(bytes: Buffer): 'png' | 'jpg' | 'webp' | null {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'png';
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpg';
  if (
    bytes.length >= 12 &&
    bytes.toString('ascii', 0, 4) === 'RIFF' &&
    bytes.toString('ascii', 8, 12) === 'WEBP'
  )
    return 'webp';
  return null;
}

// Uploads a base64 data: URL to Supabase Storage and returns the public URL.
// Random filename → not enumerable. Object is deleted with the invite at 24h (retention job).
export async function uploadPhotoFromDataUrl(dataUrl: string): Promise<string | null> {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const contentType = match[1].toLowerCase();
  const ext = ALLOWED[contentType];
  if (!ext) throw new ApiError('INVALID', 'Dozvoljene su samo PNG, JPEG i WEBP slike.');

  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length > 6 * 1024 * 1024) throw new ApiError('INVALID', 'Slika je prevelika (max 6MB).');

  const sniffed = sniff(bytes);
  if (sniffed !== ext) throw new ApiError('INVALID', 'Format slike ne odgovara sadržaju.');

  const path = `${generateToken(20)}.${ext}`;

  const sb = supabaseAdmin();
  const { error } = await sb.storage.from(BUCKET).upload(path, bytes, { contentType, upsert: false });
  if (error) throw new ApiError('SERVER', `Upload slike nije uspeo: ${error.message}`);

  return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
