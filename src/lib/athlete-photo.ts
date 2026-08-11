/**
 * 선수 사진 클라이언트 전처리 — 대회 접수폼 공용.
 *
 * lineup 업로드 API 는 4MB 제한(Vercel 서버리스 4.5MB)이라 원본을 그대로 올리면
 * 요즘 폰 사진은 그대로 걸린다. 업로드 전에 최대 변 1600px / JPEG q0.85 로 줄여
 * 정상 케이스가 1MB 미만이 되게 한다.
 *
 * 브라우저 API(canvas, createImageBitmap)를 쓰므로 클라이언트 컴포넌트에서만 호출할 것.
 */

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
/** 리사이즈 후 최대 변 길이 (px) */
const MAX_IMAGE_SIDE = 1600;
const JPEG_QUALITY = 0.85;

async function loadImageSource(file: File): Promise<{
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
}> {
  if (typeof createImageBitmap === "function") {
    try {
      // EXIF 회전 정보를 반영해 디코딩 (모바일 세로 사진 대응)
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close(),
      };
    } catch {
      // 폴백으로 진행
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("이미지를 읽을 수 없습니다."));
      el.src = url;
    });
    return {
      source: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      cleanup: () => URL.revokeObjectURL(url),
    };
  } catch (err) {
    URL.revokeObjectURL(url);
    throw err;
  }
}

/** 최대 변 1600px / JPEG q0.85 로 축소해 업로드 용량(4MB 제한)을 맞춘다. */
export async function resizeToJpeg(file: File): Promise<Blob> {
  const { source, width, height, cleanup } = await loadImageSource(file);
  try {
    if (!width || !height) throw new Error("이미지 크기를 확인할 수 없습니다.");
    const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(width, height));
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("이 브라우저에서는 사진 처리를 지원하지 않습니다.");
    ctx.drawImage(source, 0, 0, w, h);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
    );
    if (!blob) throw new Error("사진 변환에 실패했습니다.");
    return blob;
  } finally {
    cleanup();
  }
}
