import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, writeFile, access } from 'fs/promises';
import { extname, join, resolve } from 'path';
const sharp: typeof import('sharp').default = require('sharp');
import { ImageInputDto } from './image-input.dto';

export const getUploadsDir = () => resolve(process.env.UPLOADS_DIR || join(process.cwd(), 'uploads'));

export async function storeUpload(userId: string, file: Express.Multer.File, kind: 'images' | 'avatars' | 'evidence') {
  if (!file?.buffer?.length) throw new BadRequestException('Selecciona un archivo.');
  if (!/^[a-zA-Z0-9-]+$/.test(userId)) throw new BadRequestException('Usuario no válido.');
  let buffer: Buffer;
  let extension = 'webp';
  let width: number | undefined;
  let height: number | undefined;
  const originalExtension = extname(file.originalname).toLowerCase();
  if (kind === 'evidence' && originalExtension === '.pdf') {
    if (file.mimetype !== 'application/pdf' || file.buffer.subarray(0, 5).toString() !== '%PDF-' || !file.buffer.subarray(-1024).includes(Buffer.from('%%EOF'))) {
      throw new BadRequestException('El archivo no es un PDF válido.');
    }
    buffer = file.buffer;
    extension = 'pdf';
  } else {
    if (file.size > 5 * 1024 * 1024) throw new BadRequestException('La imagen no debe exceder 5 MB.');
    try {
      const input = sharp(file.buffer, { limitInputPixels: 24_000_000, failOn: 'warning' });
      const metadata = await input.metadata();
      const formats: Record<string, string[]> = { jpeg: ['.jpg', '.jpeg'], png: ['.png'], webp: ['.webp'] };
      if (!formats[metadata.format || '']?.includes(originalExtension) || file.mimetype !== `image/${metadata.format}`) throw new Error('format');
      if (!metadata.width || !metadata.height || Math.min(metadata.width, metadata.height) < 32 || Math.max(metadata.width, metadata.height) > 8000 || (metadata.pages || 1) > 1) throw new Error('dimensions');
      const result = await input.rotate().resize({ width: kind === 'avatars' ? 512 : 2000, height: kind === 'avatars' ? 512 : 2000, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer({ resolveWithObject: true });
      buffer = result.data;
      width = result.info.width;
      height = result.info.height;
    } catch {
      throw new BadRequestException('Usa una imagen JPG, PNG o WebP válida, sin animación, entre 32 y 8000 píxeles por lado y de hasta 24 megapíxeles.');
    }
  }
  const directory = join(getUploadsDir(), kind, userId);
  await mkdir(directory, { recursive: true });
  const filename = `${randomUUID()}.${extension}`;
  await writeFile(join(directory, filename), buffer, { flag: 'wx' });
  return { url: `/uploads/${kind}/${userId}/${filename}`, filename: file.originalname, size: buffer.length, mimetype: extension === 'pdf' ? 'application/pdf' : 'image/webp', width, height };
}

// Existing external images remain editable; new publications must use owned uploads.
export async function normalizeImages(userId: string, dto: { images?: ImageInputDto[]; imageUrls?: string[] }, existing: Array<{ imageUrl: string; isIllustrative?: boolean }> = []) {
  if (dto.images !== undefined && dto.imageUrls !== undefined) throw new BadRequestException('Envía solo una lista de imágenes.');
  const images = dto.images ?? dto.imageUrls?.map(imageUrl => ({ imageUrl, isIllustrative: existing.find(image => image.imageUrl === imageUrl)?.isIllustrative || false }));
  if (images === undefined) return undefined;
  if (images.length > 6) throw new BadRequestException('Puedes publicar hasta 6 imágenes.');
  for (const image of images) {
    if (existing.some(old => old.imageUrl === image.imageUrl)) continue;
    const prefix = `/uploads/images/${userId}/`;
    if (!image.imageUrl.startsWith(prefix) || !/^[a-f0-9-]{36}\.webp$/.test(image.imageUrl.slice(prefix.length))) throw new BadRequestException('Sube tus imágenes desde el selector de archivos.');
    try { await access(join(getUploadsDir(), image.imageUrl.slice('/uploads/'.length))); }
    catch { throw new BadRequestException('La imagen ya no está disponible. Vuelve a subirla.'); }
  }
  return images.map(image => ({ imageUrl: image.imageUrl, isIllustrative: image.isIllustrative ?? false }));
}
