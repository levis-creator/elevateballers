/**
 * Quill Video Embed Module
 * Supports YouTube, Vimeo, and other video platforms
 * WordPress-like embedding capabilities
 */

import Quill from 'quill';

const BlockEmbed = Quill.import('blots/block/embed');

/**
 * Base Video Embed class with common functionality
 */
abstract class BaseVideoEmbed extends BlockEmbed {
  static className = 'ql-video-embed';
  static platformName: string;

  abstract getEmbedUrl(videoId: string): string;
  abstract extractVideoId(url: string): string;

  static create(value: { id: string; url?: string; platform?: string }) {
    const node = super.create();
    const videoId = value.id || (this as any).extractVideoId(value.url || '');
    
    if (!videoId) {
      return node;
    }

    // Set attributes
    node.setAttribute('data-video-id', videoId);
    node.setAttribute('data-platform', value.platform || (this as any).platformName);
    node.setAttribute('data-video-url', value.url || '');
    
    // Add both base class and platform-specific class individually
    // This avoids DOMTokenList error with space-separated class names
    node.classList.add('ql-video-embed');
    if ((this as any).className && (this as any).className !== BaseVideoEmbed.className) {
      node.classList.add((this as any).className);
    }
    
    // Create responsive iframe wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'video-embed-wrapper';
    wrapper.style.cssText = `
      position: relative;
      padding-bottom: 56.25%;
      height: 0;
      overflow: hidden;
      max-width: 100%;
      margin: 1.5rem 0;
      border-radius: 8px;
      background: #000;
    `;

    const iframe = document.createElement('iframe');
    iframe.setAttribute('src', (this as any).getEmbedUrl(videoId));
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
    iframe.setAttribute('allowfullscreen', 'true');
    iframe.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    `;

    wrapper.appendChild(iframe);
    node.appendChild(wrapper);

    return node;
  }

  static value(node: HTMLElement) {
    const videoId = node.getAttribute('data-video-id');
    const url = node.getAttribute('data-video-url') || '';
    const platform = node.getAttribute('data-platform') || '';
    return { id: videoId, url, platform };
  }
}

/**
 * YouTube Video Embed
 */
class YouTubeVideo extends BaseVideoEmbed {
  static blotName = 'youtube';
  static tagName = 'div';
  static className = 'ql-youtube-video';
  static platformName = 'youtube';

  static getEmbedUrl(videoId: string): string {
    return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
  }

  static extractVideoId(url: string): string {
    if (!url) return '';

    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    // If it's already just an ID (11 characters)
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
      return url;
    }

    return '';
  }
}

/**
 * Vimeo Video Embed
 */
class VimeoVideo extends BaseVideoEmbed {
  static blotName = 'vimeo';
  static tagName = 'div';
  static className = 'ql-vimeo-video';
  static platformName = 'vimeo';

  static getEmbedUrl(videoId: string): string {
    return `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0`;
  }

  static extractVideoId(url: string): string {
    if (!url) return '';

    const patterns = [
      /(?:vimeo\.com\/)(\d+)/,
      /(?:vimeo\.com\/video\/)(\d+)/,
      /(?:player\.vimeo\.com\/video\/)(\d+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    // If it's already just a number
    if (/^\d+$/.test(url)) {
      return url;
    }

    return '';
  }
}

/**
 * Video Embed Handler - Unified handler for all video platforms
 */
class VideoEmbedHandler {
  quill: any;
  options: any;

  constructor(quill: any, options: any) {
    this.quill = quill;
    this.options = options;
    this.attach();
  }

  attach() {
    try {
      const toolbar = this.quill.getModule('toolbar');
      if (!toolbar) {
        console.error('Toolbar module not found');
        return;
      }
      
      // Override the handlers that were set as empty functions
      toolbar.addHandler('youtube', () => this.handleVideo('youtube'));
      toolbar.addHandler('vimeo', () => this.handleVideo('vimeo'));
      
      // Debug log
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.log('Video embed handlers attached:', {
          youtube: typeof toolbar.handlers?.youtube === 'function',
          vimeo: typeof toolbar.handlers?.vimeo === 'function'
        });
      }
    } catch (error) {
      console.error('Failed to attach video embed handlers:', error);
    }
  }

  handleVideo(platform: 'youtube' | 'vimeo') {
    try {
      const platformName = platform === 'youtube' ? 'YouTube' : 'Vimeo';
      const url = prompt(`Enter ${platformName} URL or Video ID:`);
      if (!url || !url.trim()) return;

      let videoId: string;

      if (platform === 'youtube') {
        videoId = YouTubeVideo.extractVideoId(url.trim());
      } else {
        videoId = VimeoVideo.extractVideoId(url.trim());
      }

      if (!videoId) {
        alert(`Invalid ${platformName} URL. Please enter a valid ${platformName} video URL or ID.\n\nExamples:\n- https://www.youtube.com/watch?v=VIDEO_ID\n- https://youtu.be/VIDEO_ID\n- VIDEO_ID`);
        return;
      }

      // Check if the blot is registered
      const Quill = (this.quill.constructor as any);
      const Parchment = Quill.import('parchment');
      const BlotRegistry = Parchment?.registry;
      
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.log('Checking blot registration:', {
          platform,
          blotName: platform,
          registered: !!BlotRegistry?.query(platform),
          quillBlots: Object.keys(Quill.import('blots/embed') || {})
        });
      }

      // Get current selection or use end of document
      let index: number;
      const range = this.quill.getSelection(true);
      
      if (range && range.index !== null) {
        index = range.index;
      } else {
        // Insert at the end
        index = Math.max(0, this.quill.getLength() - 1);
      }

      // Prepare the embed value
      const embedValue = { id: videoId, url: url.trim(), platform };
      
      // Use Quill's standard insertEmbed method
      // This will work if the blot is properly registered
      this.quill.insertEmbed(index, platform, embedValue, 'user');
      
      // Move cursor after the embed
      this.quill.setSelection(index + 1, 'api');
      
      // Debug log
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.log(`${platformName} video embedded successfully:`, { videoId, url: url.trim(), index, embedValue });
      }
    } catch (error: any) {
      console.error(`Error embedding ${platform} video:`, error);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        quill: !!this.quill,
        platform
      });
      alert(`Failed to embed ${platform === 'youtube' ? 'YouTube' : 'Vimeo'} video.\n\nError: ${error?.message || 'Unknown error'}\n\nPlease check the console for more details.`);
    }
  }
}

// Register the video blots
// Note: This will be called when the module is imported
// Make sure this happens before Quill instances are created
if (typeof window !== 'undefined') {
  try {
    // Try to get Quill from window if available, otherwise it will be registered when Quill is imported
    const QuillGlobal = (window as any).Quill || Quill;
    if (QuillGlobal && QuillGlobal.register) {
      QuillGlobal.register(YouTubeVideo, true);
      QuillGlobal.register(VimeoVideo, true);
    }
  } catch (e) {
    // Quill might not be available yet, that's okay
    // It will be registered when the module is imported in NewsEditor
  }
}

// Also register directly (this will work when Quill is imported)
Quill.register(YouTubeVideo, true);
Quill.register(VimeoVideo, true);

export { YouTubeVideo, VimeoVideo, VideoEmbedHandler };

