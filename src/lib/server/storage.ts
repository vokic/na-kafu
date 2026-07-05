import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { generateToken } from '@/lib/data/tokens';
import { ApiError } from './http';

const BUCKET = 'invite-photos';
// Originals keep full EXIF (GPS, device, timestamps) as abuse/legal evidence — private
// bucket (service-role access only), purged together with the invite by the retention job.
const ORIGINALS_BUCKET = 'invite-originals';

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

export interface UploadedPhoto {
  /** Public URL of the cleaned (metadata-stripped, resized) copy. */
  url: string;
  /** Forensic record of the untouched original in the private bucket. */
  original: { path: string; sha256: string; size: number; mime: string };
}

// Lazy one-time bucket create; an "already exists" error is success. Kept private so the
// original (with EXIF) is never reachable from a public URL.
let originalsReady = false;
async function ensureOriginalsBucket(): Promise<void> {
  if (originalsReady) return;
  await supabaseAdmin().storage.createBucket(ORIGINALS_BUCKET, { public: false });
  originalsReady = true;
}

// Uploads a base64 data: URL: the original goes to the private evidence bucket, a cleaned
// re-encode to the public one. Random shared base name → not enumerable, and the retention
// job can purge both objects from the public URL alone.
export async function uploadPhotoFromDataUrl(dataUrl: string): Promise<UploadedPhoto | null> {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const contentType = match[1].toLowerCase();
  const ext = ALLOWED[contentType];
  if (!ext) throw new ApiError('INVALID', 'Dozvoljene su samo PNG, JPEG i WEBP slike.');

  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length > 6 * 1024 * 1024) throw new ApiError('INVALID', 'Slika je prevelika (max 6MB).');

  const sniffed = sniff(bytes);
  if (sniffed !== ext) throw new ApiError('INVALID', 'Format slike ne odgovara sadržaju.');

  // Public copy: re-encode drops ALL metadata (EXIF/GPS/XMP/ICC) and caps dimensions.
  // .rotate() first bakes the EXIF orientation into pixels — stripping the tag without it
  // would show portrait photos sideways. Fail-closed: a photo we can't decode is rejected,
  // never served raw (this is the privacy control, not an optimization).
  let cleaned: Buffer;
  try {
    cleaned = await sharp(bytes, { limitInputPixels: 30_000_000 })
      .rotate()
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new ApiError('INVALID', 'Slika ne može da se obradi.');
  }

  const base = generateToken(20);
  const sb = supabaseAdmin();

  await ensureOriginalsBucket();
  const originalPath = `${base}.${ext}`;
  const { error: origErr } = await sb.storage
    .from(ORIGINALS_BUCKET)
    .upload(originalPath, bytes, { contentType, upsert: false });
  if (origErr) throw new ApiError('SERVER', `Upload slike nije uspeo: ${origErr.message}`);

  const publicPath = `${base}.webp`;
  const { error } = await sb.storage
    .from(BUCKET)
    .upload(publicPath, cleaned, { contentType: 'image/webp', upsert: false });
  if (error) throw new ApiError('SERVER', `Upload slike nije uspeo: ${error.message}`);

  return {
    url: sb.storage.from(BUCKET).getPublicUrl(publicPath).data.publicUrl,
    original: {
      path: originalPath,
      sha256: createHash('sha256').update(bytes).digest('hex'),
      size: bytes.length,
      mime: contentType,
    },
  };
}
