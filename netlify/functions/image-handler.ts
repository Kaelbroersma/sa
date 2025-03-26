import { Handler } from '@netlify/functions';
import sharp from 'sharp';
import fetch from 'node-fetch';

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
      width: w ? parseInt(w) : undefined,
      height: h ? parseInt(h) : undefined,
      quality: q ? parseInt(q) : 80,
      format: (f as ImageOptions['format']) || 'webp'
    };

    if (options.quality && (options.quality < 1 || options.quality > 100)) {
      options.quality = 80;
    }

    // Handle both absolute and relative URLs
    const fullUrl = url.startsWith('http') 
      ? url 
      : `${process.env.URL || 'http://localhost:8888'}${url}`;

    console.log('Fetching image:', {
      timestamp: new Date().toISOString(),
      url: fullUrl
    });

    const response = await fetch(fullUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let pipeline = sharp(buffer);
    const metadata = await pipeline.metadata();

    if (!options.width && !options.height) {
      options.width = Math.min(metadata.width || 1200, 1200);
    }

    if (options.width || options.height) {
      pipeline = pipeline.resize({
        width: options.width,
        height: options.height,
        withoutEnlargement: true,
        fit: 'inside'
      });
    }

    let processedImage: Buffer;

    switch (options.format) {
      case 'webp':
        processedImage = await pipeline.webp({ 
          quality: options.quality,
          effort: 4,
          nearLossless: true
        }).toBuffer();
        headers['Content-Type'] = 'image/webp';
        break;

      case 'png':
        processedImage = await pipeline.png({ 
          compressionLevel: 9,
          palette: true
        }).toBuffer();
        headers['Content-Type'] = 'image/png';
        break;

      default:
        processedImage = await pipeline.jpeg({ 
          quality: options.quality,
          progressive: true,
          optimizeScans: true
        }).toBuffer();
        headers['Content-Type'] = 'image/jpeg';
        break;
    }

    console.log('Image processed successfully:', {
      timestamp: new Date().toISOString(),
      format: options.format,
      width: options.width,
      height: options.height,
      quality: options.quality
    });

    return {
      statusCode: 200,
      headers,
      body: processedImage.toString('base64'),
      isBase64Encoded: true
    };

  } catch (error: any) {
    console.error('Error processing image:', {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack
    });

    try {
      // Create a simple fallback image
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