import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export interface FileStorageService {
  upload(file: File, options?: { isTemp?: boolean }): Promise<string>;
  move(tempPath: string, finalPath: string): Promise<string>;
  delete(path: string): Promise<void>;
  rollbackMove(paths: string[]): Promise<void>;
}

export class LocalStorageService implements FileStorageService {
  private tempDir: string;
  private productsDir: string;

  constructor() {
    this.tempDir = path.join(process.cwd(), 'storage', 'temp');
    this.productsDir = path.join(process.cwd(), 'storage', 'products');
  }

  private async ensureDir(dirPath: string) {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  async upload(file: File, options?: { isTemp?: boolean }): Promise<string> {
    const isTemp = options?.isTemp ?? true;
    const targetDir = isTemp ? this.tempDir : this.productsDir;
    
    await this.ensureDir(targetDir);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uuid = crypto.randomUUID();
    const extension = this.getExtensionFromMime(file.type);
    const fileName = `${uuid}${extension}`;
    
    const filePath = path.join(targetDir, fileName);
    await fs.writeFile(filePath, buffer);

    const urlPath = isTemp ? `/api/files/temp/${fileName}` : `/api/files/products/${fileName}`;
    return urlPath;
  }

  async move(tempUrl: string, finalFolder: string = 'products'): Promise<string> {
    const fileName = tempUrl.split('/').pop();
    if (!fileName) throw new Error("Invalid temp URL");

    const tempPath = path.join(this.tempDir, fileName);
    const finalDir = path.join(process.cwd(), 'storage', finalFolder);
    await this.ensureDir(finalDir);

    const finalPath = path.join(finalDir, fileName);

    await fs.rename(tempPath, finalPath);

    return `/api/files/${finalFolder}/${fileName}`;
  }

  async delete(urlPath: string): Promise<void> {
    const parts = urlPath.split('/');
    const fileName = parts.pop();
    const folder = parts.pop(); // 'temp' or 'products'

    if (!fileName || !folder) return;

    const baseDir = folder === 'temp' ? this.tempDir : this.productsDir;
    const filePath = path.join(baseDir, fileName);

    try {
      await fs.unlink(filePath);
    } catch (e) {
      console.error(`Failed to delete file: ${filePath}`, e);
    }
  }

  async rollbackMove(urlPaths: string[]): Promise<void> {
    for (const urlPath of urlPaths) {
      await this.delete(urlPath);
    }
  }

  private getExtensionFromMime(mimeType: string): string {
    switch (mimeType) {
      case 'image/jpeg': return '.jpg';
      case 'image/png': return '.png';
      case 'image/webp': return '.webp';
      case 'image/gif': return '.gif';
      default: return '';
    }
  }
}
