/**
 * Photos live on Cloudinary; the database only ever stores the URL.
 *
 * Uploads use an *unsigned* upload preset, so no secret is needed in the
 * browser. Delivery URLs get `f_auto,q_auto` and a width, so every page pulls
 * a photo no larger than it displays, in the lightest format the browser
 * accepts (AVIF/WebP).
 */

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const cloudinaryConfigured = Boolean(cloudName && uploadPreset);

interface UploadResponse {
  secure_url?: string;
  public_id?: string;
  error?: { message?: string };
}

/** Upload a file or blob and return its https URL. */
export async function uploadToCloudinary(file: Blob, folder: string, publicId?: string): Promise<string> {
  if (!cloudinaryConfigured) throw new Error('Cloudinary is not configured (VITE_CLOUDINARY_CLOUD_NAME / VITE_CLOUDINARY_UPLOAD_PRESET).');
  const body = new FormData();
  body.append('file', file);
  body.append('upload_preset', uploadPreset as string);
  body.append('folder', folder);
  if (publicId) body.append('public_id', publicId);
  const r = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body });
  const j = (await r.json()) as UploadResponse;
  if (!r.ok || !j.secure_url) throw new Error(j.error?.message || 'Cloudinary upload failed');
  return j.secure_url;
}

const UPLOAD_SEGMENT = /\/image\/upload\/(?!v\d+\/)(?=[^/]*[,_])[^/]+\//;

/**
 * A delivery URL sized for where it is shown. Non-Cloudinary URLs (the seed's
 * `/assets/*.jpg`, URLs the admin pasted) come back unchanged.
 */
export function cdn(url: string, width: number, extra = ''): string {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/image/upload/')) return url;
  const t = `f_auto,q_auto,c_limit,w_${Math.round(width)}${extra ? ',' + extra : ''}`;
  // Replace an existing transformation segment, or insert one after /upload/.
  if (UPLOAD_SEGMENT.test(url)) return url.replace(UPLOAD_SEGMENT, `/image/upload/${t}/`);
  return url.replace('/image/upload/', `/image/upload/${t}/`);
}
