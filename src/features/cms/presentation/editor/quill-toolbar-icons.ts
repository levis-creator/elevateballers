/**
 * Custom toolbar icons for WordPress-like editor
 * Uses Lucide icon designs for YouTube, Vimeo, Table, and Horizontal Rule buttons
 * 
 * Note: These SVG paths match Lucide icon designs
 */

/**
 * Setup custom toolbar icons using Lucide
 */
export async function setupCustomToolbarIcons() {
  if (typeof window === 'undefined') return;

  try {
    // Import Quill dynamically
    const Quill = (await import('quill')).default;

    // Create SVG strings using Lucide icon designs
    // These match the Lucide icon library's design system
    const YouTubeIcon = `
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/>
        <path d="m10 15 5-3-5-3z"/>
      </svg>
    `;

    const VimeoIcon = `
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="5 3 19 12 5 21 5 3"/>
      </svg>
    `;

    const TableIcon = `
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 3v18"/>
        <rect width="18" height="18" x="3" y="3" rx="2"/>
        <path d="M3 9h18"/>
        <path d="M3 15h18"/>
      </svg>
    `;

    const HorizontalRuleIcon = `
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 12h14"/>
      </svg>
    `;

    // Register custom icons
    const icons = Quill.import('ui/icons');
    
    if (icons) {
      // Register icons - Quill expects the SVG string directly
      icons['youtube'] = YouTubeIcon;
      icons['vimeo'] = VimeoIcon;
      icons['table'] = TableIcon;
      icons['horizontal-rule'] = HorizontalRuleIcon;
      
      // Debug: Log to confirm icons are registered
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.log('Custom toolbar icons registered:', {
          youtube: !!icons['youtube'],
          vimeo: !!icons['vimeo'],
          table: !!icons['table'],
          'horizontal-rule': !!icons['horizontal-rule']
        });
      }
    } else {
      console.warn('Quill icons module not found');
    }
  } catch (error) {
    console.warn('Failed to setup custom toolbar icons:', error);
  }
}

