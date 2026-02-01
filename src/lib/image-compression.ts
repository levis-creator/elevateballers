/**
 * Image Compression Utility
 * Handles server-side image compression using Sharp
 */

// Lazy-load Sharp to handle cases where it might not be installed
let sharpModule: typeof import('sharp').default | null = null;

async function getSharp() {
  if (!sharpModule) {
    try {
      const sharpImport = await import('sharp');
      sharpModule = sharpImport.default;
    } catch (error) {
      console.warn('Sharp not available. Image compression will be limited.');
      return null;
    }
  }
  return sharpModule;
}

export interface CompressionOptions {
  maxWidthOrHeight?: number;
  quality?: number;
  maxSizeMB?: number;
  mimeType?: string;
}

export interface CompressionResult {
  buffer: Buffer;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  width?: number;
  height?: number;
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidthOrHeight: 1920,
  quality: 0.8,
  maxSizeMB: 5,
  mimeType: 'image/jpeg',
};

/**
 * Check if file needs compression
 */
export function shouldCompress(
  fileSize: number,
  mimeType: string,
  maxSizeMB?: number
): boolean {
  const maxBytes = (maxSizeMB || DEFAULT_OPTIONS.maxSizeMB) * 1024 * 1024;
  
  // Only compress images
  if (!mimeType.startsWith('image/')) {
    return false;
  }
  
  // Compress if file exceeds size limit
  return fileSize > maxBytes;
}

/**
 * Compress an image buffer
 * @param buffer - Image buffer
 * @param options - Compression options
 * @returns Compression result with buffer and statistics
 */
export async function compressImage(
  buffer: Buffer,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const originalSize = buffer.length;
  
  // Get Sharp module
  const sharp = await getSharp();
  if (!sharp) {
    // If Sharp is not available, return original buffer
    return {
      buffer,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 0,
    };
  }
  
  try {
    // Get image metadata
    const metadata = await sharp(buffer).metadata();
    const currentWidth = metadata.width || 0;
    const currentHeight = metadata.height || 0;
    
    // Determine if resizing is needed
    const needsResize = 
      currentWidth > opts.maxWidthOrHeight || 
      currentHeight > opts.maxWidthOrHeight;
    
    // Start with the image
    let pipeline = sharp(buffer);
    
    // Resize if needed (maintain aspect ratio)
    if (needsResize) {
      pipeline = pipeline.resize(opts.maxWidthOrHeight, opts.maxWidthOrHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }
    
    // Apply compression based on format
    const format = getImageFormat(opts.mimeType || metadata.format || 'jpeg');
    
    let compressedBuffer: Buffer;
    
    switch (format) {
      case 'jpeg':
      case 'jpg':
        compressedBuffer = await pipeline
          .jpeg({ quality: Math.round(opts.quality * 100) })
          .toBuffer();
        break;
      case 'png':
        compressedBuffer = await pipeline
          .png({ quality: Math.round(opts.quality * 100), compressionLevel: 9 })
          .toBuffer();
        break;
      case 'webp':
        compressedBuffer = await pipeline
          .webp({ quality: Math.round(opts.quality * 100) })
          .toBuffer();
        break;
      case 'gif':
        // GIF compression is limited, convert to PNG if possible
        compressedBuffer = await pipeline
          .png({ quality: Math.round(opts.quality * 100) })
          .toBuffer();
        break;
      default:
        // Default to JPEG
        compressedBuffer = await pipeline
          .jpeg({ quality: Math.round(opts.quality * 100) })
          .toBuffer();
    }
    
    const compressedSize = compressedBuffer.length;
    const compressionRatio = originalSize > 0
      ? ((originalSize - compressedSize) / originalSize) * 100
      : 0;
    
    // Get final dimensions
    const finalMetadata = await sharp(compressedBuffer).metadata();
    
    return {
      buffer: compressedBuffer,
      originalSize,
      compressedSize,
      compressionRatio: Math.round(compressionRatio * 100) / 100, // Round to 2 decimal places
      width: finalMetadata.width || undefined,
      height: finalMetadata.height || undefined,
    };
  } catch (error: any) {
    console.error('Error compressing image:', error);
    // If compression fails, return original buffer
    return {
      buffer,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 0,
    };
  }
}

/**
 * Get image format from MIME type
 */
function getImageFormat(mimeType: string): 'jpeg' | 'png' | 'webp' | 'gif' {
  const normalized = mimeType.toLowerCase();
  
  if (normalized.includes('jpeg') || normalized.includes('jpg')) {
    return 'jpeg';
  }
  if (normalized.includes('png')) {
    return 'png';
  }
  if (normalized.includes('webp')) {
    return 'webp';
  }
  if (normalized.includes('gif')) {
    return 'gif';
  }
  
  // Default to JPEG
  return 'jpeg';
}

/**
 * Calculate compression statistics
 */
export function getCompressionStats(
  originalSize: number,
  compressedSize: number
): {
  compressionRatio: number;
  sizeReduction: number;
  sizeReductionPercent: number;
} {
  const sizeReduction = originalSize - compressedSize;
  const compressionRatio = originalSize > 0
    ? ((originalSize - compressedSize) / originalSize) * 100
    : 0;
  
  return {
    compressionRatio: Math.round(compressionRatio * 100) / 100,
    sizeReduction,
    sizeReductionPercent: Math.round(compressionRatio * 100) / 100,
  };
}
