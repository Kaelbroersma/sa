import { Handler } from '@netlify/functions';
import sharp from 'sharp';

interface ImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
}

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Cache-Control': 'public, max-age=31536000, immutable'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  try {
    const { url, w, h, q, f } = event.queryStringParameters || {};
    
    if (!url) {
      throw new Error('No image URL provided');
    }

    const options: ImageOptions = {
      width: w 
        ? Math.floor(parseInt(w) * 0.5)  // 50% of specified width
        : (metadata.width ? Math.floor(metadata.width * 0.5) : undefined), // 50% of original width
      height: h 
        ? Math.floor(parseInt(h) * 0.5)  // 50% of specified height
        : (metadata.height ? Math.floor(metadata.height * 0.5) : undefined), // 50% of original height
      quality: q ? parseInt(q) : 80,
      format: (f as ImageOptions['format']) || 'webp'
    };

    if (options.quality && (options.quality < 1 || options.quality > 100)) {
      options.quality = 80;
    }

    const fullUrl = url.startsWith('/')
      ? `https://carnimore.netlify.app${url}`
      : url;
    
    // Use native fetch if available, otherwise import dynamically
    const fetchModule = typeof fetch !== 'undefined' 
      ? fetch 
      : (await import('node-fetch')).default;

    const response = await fetchModule(fullUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    // Use arrayBuffer instead of buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let pipeline = sharp(buffer);
    const metadata = await pipeline.metadata();

    if (!options.width && !options.height) {
      options.width = Math.min(metadata.width || 1200, 1200);
    }

    if (options.width || options.height) {
      pipeline = pipeline.resize(options.width, options.height, {
        withoutEnlargement: true,
        fit: 'inside'
      });
    }

    switch (options.format) {
      case 'webp':
        pipeline = pipeline.webp({ 
          quality: options.quality,
          effort: 6,
          nearLossless: true
        });
        headers['Content-Type'] = 'image/webp';
        break;

      case 'png':
        pipeline = pipeline.png({ 
          compressionLevel: 9,
          palette: true
        });
        headers['Content-Type'] = 'image/png';
        break;

      default:
        pipeline = pipeline.jpeg({ 
          quality: options.quality,
          progressive: true,
          optimizeScans: true
        });
        headers['Content-Type'] = 'image/jpeg';
        break;
    }

    const processedImage = await pipeline
      .rotate()
      .toBuffer();

    return {
      statusCode: 200,
      headers,
      body: processedImage.toString('base64'),
      isBase64Encoded: true
    };

  } catch (error: any) {
    console.error('Error processing image:', error);

    try {
      const fallbackImage = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      })
      .jpeg()
      .toBuffer();

      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'no-cache'
        },
        body: fallbackImage.toString('base64'),
        isBase64Encoded: true
      };
    } catch (fallbackError) {
      return {
        statusCode: 500,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Failed to process image',
          details: error.message
        })
      };
    }
  }
};