import DOMPurify from 'isomorphic-dompurify';

/**
 * Only allow iframes from trusted video hosts (YouTube / Vimeo).
 * Registered once at module load; DOMPurify hooks are global so this runs
 * for every sanitize() call automatically.
 */
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'IFRAME') {
    const src = node.getAttribute('src') ?? '';
    const trusted = [
      'https://www.youtube.com/embed/',
      'https://player.vimeo.com/video/',
    ];
    if (!trusted.some((prefix) => src.startsWith(prefix))) {
      node.parentNode?.removeChild(node);
    }
  }
});

const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    // Text structure
    'p', 'br', 'div', 'span', 'hr',
    // Headings
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // Inline formatting
    'strong', 'em', 'u', 's', 'sub', 'sup', 'code',
    // Block
    'blockquote', 'pre',
    // Lists
    'ul', 'ol', 'li',
    // Links & media
    'a', 'img',
    // Tables
    'table', 'thead', 'tbody', 'tr', 'td', 'th',
    // Video embeds (src validated by the hook above)
    'iframe',
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel',
    'src', 'alt', 'width', 'height',
    'class', 'style',
    'colspan', 'rowspan',
    // iframe attrs for video embeds
    'frameborder', 'allow', 'allowfullscreen',
    // Quill video embed data attrs
    'data-video-id', 'data-platform', 'data-video-url',
  ],
};

/**
 * Sanitize an HTML string produced by the Quill rich-text editor.
 * Strips scripts, event handlers, and untrusted iframes while preserving
 * all formatting, tables, images, and YouTube/Vimeo embeds.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, SANITIZE_CONFIG) as string;
}
