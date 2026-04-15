import { supabase } from './supabase';

/** 한글/공백/특수문자 → _, 확장자 유지. Storage path-safe filename. */
export function safeFilename(name: string): string {
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';
  const cleanedBase = base.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_');
  return `${cleanedBase || 'file'}${ext}`;
}

/** Storage 버킷에 파일 업로드하고 public URL 반환. */
export async function uploadToBucket(
  bucket: string,
  file: File,
): Promise<{ url: string; path: string } | { error: string }> {
  const path = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${safeFilename(file.name)}`;
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, { cacheControl: '3600', upsert: false });
  if (uploadError) return { error: uploadError.message };

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: urlData.publicUrl, path };
}

/** 여러 파일을 순차 업로드. 하나라도 실패하면 즉시 중단하고 에러 반환. */
export async function uploadFilesToBucket(
  bucket: string,
  files: File[],
): Promise<{ urls: string[] } | { error: string; uploadedUrls: string[] }> {
  const urls: string[] = [];
  for (const file of files) {
    const result = await uploadToBucket(bucket, file);
    if ('error' in result) {
      return { error: result.error, uploadedUrls: urls };
    }
    urls.push(result.url);
  }
  return { urls };
}

/** public URL에서 bucket 내부 path 추출. 삭제 시 사용. */
export function extractStoragePath(publicUrl: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(publicUrl.slice(idx + marker.length));
}

/** 여러 public URL 일괄 삭제. 외부 URL(다른 도메인)은 무시. */
export async function deleteFromBucket(bucket: string, publicUrls: string[]): Promise<void> {
  const paths = publicUrls
    .map((u) => extractStoragePath(u, bucket))
    .filter((p): p is string => p !== null);
  if (paths.length === 0) return;
  await supabase.storage.from(bucket).remove(paths);
}
