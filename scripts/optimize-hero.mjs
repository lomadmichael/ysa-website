// 메인·10주년 hero 이미지 재인코딩 + blur placeholder 생성
// - MozJPEG q75, 너비 1920px cap
// - 16px blur base64 → 콘솔에 출력 (각 HeroSection에 복붙)
import sharp from 'sharp';
import { writeFileSync, statSync, renameSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const TARGETS = [
  { file: 'public/images/hero_03.jpg', label: '메인 HeroSection' },
  { file: 'public/images/hero_02.jpg', label: '10주년 FestivalHero' },
];

for (const { file, label } of TARGETS) {
  const inputPath = join(root, file);
  const before = statSync(inputPath).size;

  const optimized = await sharp(inputPath)
    .resize({ width: 1920, withoutEnlargement: true })
    .jpeg({ quality: 75, mozjpeg: true, chromaSubsampling: '4:2:0' })
    .toBuffer();

  const tmpPath = inputPath + '.tmp';
  writeFileSync(tmpPath, optimized);
  renameSync(tmpPath, inputPath);

  const blurBuf = await sharp(optimized)
    .resize({ width: 16 })
    .jpeg({ quality: 40 })
    .toBuffer();
  const blurDataURL = `data:image/jpeg;base64,${blurBuf.toString('base64')}`;

  console.log(`\n=== ${label} (${file}) ===`);
  console.log(`${(before / 1024).toFixed(1)}KB → ${(optimized.length / 1024).toFixed(1)}KB (-${(100 - (optimized.length / before) * 100).toFixed(1)}%)`);
  console.log('blurDataURL:');
  console.log(blurDataURL);
}
