import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary using process.env
if (process.env.CLOUDINARY_URL) {
  // Cloudinary automatically picks up CLOUDINARY_URL from env
} else if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export interface FileStorageService {
  upload(file: File, options?: { isTemp?: boolean }): Promise<string>;
  move(tempPath: string, finalPath: string): Promise<string>;
  delete(path: string): Promise<void>;
  rollbackMove(paths: string[]): Promise<void>;
}

export class DiskStorageService implements FileStorageService {
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

export class CloudinaryStorageService implements FileStorageService {
  async upload(file: File, options?: { isTemp?: boolean }): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new Promise((resolve, reject) => {
      const folderName = options?.isTemp ? 'jdevoto_temp' : 'jdevoto_products';
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folderName,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result?.secure_url) {
            resolve(result.secure_url);
          } else {
            reject(new Error("Cloudinary upload failed - no secure_url returned"));
          }
        }
      );
      uploadStream.end(buffer);
    });
  }

  async move(tempUrl: string, finalFolder: string = 'products'): Promise<string> {
    // If it's already a Cloudinary URL, keep it as is
    if (tempUrl.startsWith('http') || tempUrl.includes('cloudinary')) {
      return tempUrl;
    }
    // Fallback if local file
    const local = new DiskStorageService();
    return local.move(tempUrl, finalFolder);
  }

  async delete(urlPath: string): Promise<void> {
    if (urlPath.startsWith('http') || urlPath.includes('cloudinary')) {
      const parts = urlPath.split('/');
      const filenameWithExtension = parts.pop();
      const folder = parts.pop(); // e.g. jdevoto_products or jdevoto_temp
      if (filenameWithExtension && folder) {
        const publicId = `${folder}/${filenameWithExtension.split('.')[0]}`;
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (e) {
          console.error(`Failed to delete Cloudinary asset: ${publicId}`, e);
        }
      }
      return;
    }
    const local = new DiskStorageService();
    await local.delete(urlPath);
  }

  async rollbackMove(urlPaths: string[]): Promise<void> {
    for (const urlPath of urlPaths) {
      await this.delete(urlPath);
    }
  }
}

// Delegate pattern to expose LocalStorageService name without changing other files
export class LocalStorageService implements FileStorageService {
  private delegate: FileStorageService;

  constructor() {
    const useCloudinary = !!(process.env.CLOUDINARY_URL || process.env.CLOUDINARY_CLOUD_NAME);
    this.delegate = useCloudinary ? new CloudinaryStorageService() : new DiskStorageService();
  }

  async upload(file: File, options?: { isTemp?: boolean }): Promise<string> {
    return this.delegate.upload(file, options);
  }

  async move(tempUrl: string, finalFolder: string = 'products'): Promise<string> {
    return this.delegate.move(tempUrl, finalFolder);
  }

  async delete(path: string): Promise<void> {
    return this.delegate.delete(path);
  }

  async rollbackMove(paths: string[]): Promise<void> {
    return this.delegate.rollbackMove(paths);
  }
}
