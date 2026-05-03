import sanitize from 'sanitize-html';
import type { IOptions } from 'sanitize-html';

const TRUSTED_IFRAME_PREFIXES = [
  'https://www.youtube.com/embed/',
  'https://player.vimeo.com/video/',
];

const SANITIZE_CONFIG: IOptions = {
  allowedTags: [
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
    // Video embeds (validated below)
    'iframe',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height'],
    iframe: ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen'],
    '*': [
      'class',
      'style',
      'colspan',
      'rowspan',
      'data-video-id',
      'data-platform',
      'data-video-url',
    ],
  },
  allowedSchemes: ['http', 'https', 'data', 'mailto', 'tel'],
  allowProtocolRelative: false,
  exclusiveFilter: (frame) => {
    if (frame.tag !== 'iframe') return false;
    const src = frame.attribs?.src || '';
    return !TRUSTED_IFRAME_PREFIXES.some((prefix) => src.startsWith(prefix));
  },
  transformTags: {
    a: (tagName, attribs) => {
      if (attribs.target === '_blank') {
        return {
          tagName,
          attribs: {
            ...attribs,
            rel: attribs.rel || 'noopener noreferrer',
          },
        };
      }
      return { tagName, attribs };
    },
    // Ensure every rich-text image has a non-empty alt. Quill lets editors
    // insert images without filling in alt text — those would render as
    // <img src="..."> with no alt at all, which fails accessibility/SEO
    // audits. Fall back to a generic descriptor so the page never ships
    // a missing-alt image; admins should still write meaningful alt text
    // for proper SEO when inserting images.
    img: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        alt: attribs.alt && attribs.alt.trim() ? attribs.alt : 'Content image',
      },
    }),
  },
};

/**
 * Sanitize an HTML string produced by the Quill rich-text editor.
 * Strips scripts, event handlers, and untrusted iframes while preserving
 * all formatting, tables, images, and YouTube/Vimeo embeds.
 */
export function sanitizeHtml(dirty: string): string {
  return sanitize(dirty, SANITIZE_CONFIG);
}
