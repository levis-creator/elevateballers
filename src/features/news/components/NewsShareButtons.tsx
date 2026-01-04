import { Share2, Mail } from 'lucide-react';
import './NewsShareButtons.css';

interface NewsShareButtonsProps {
  url: string;
  title: string;
  variant?: 'compact' | 'full';
}

/**
 * NewsShareButtons component - Reusable share buttons with Lucide icons
 * Provides social sharing functionality for news articles
 * Matches the stm-post-meta-bottom design pattern
 */
export default function NewsShareButtons({ 
  url, 
  title, 
  variant = 'compact' 
}: NewsShareButtonsProps) {
  return (
    <div className="stm-post-meta-bottom normal_font clearfix">
      <div className="stm_post_tags"></div>
      <div className="stm-share-this-wrapp">
        <span>share</span>
        <span className="stm-share-btn-wrapp">
          <div className="addtoany_share_save_container addtoany_content addtoany_content_bottom">
            <div className="a2a_kit a2a_kit_size_32 addtoany_list" data-a2a-url={url} data-a2a-title={title} style={{ lineHeight: '32px' }}>
              <a 
                className="a2a_button_facebook" 
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
                title="Facebook"
                rel="nofollow noopener"
                target="_blank"
              >
                <span className="a2a_svg a2a_s__default a2a_s_facebook" style={{ backgroundColor: 'rgb(8, 102, 255)' }}>
                  <Share2 size={20} strokeWidth={2.5} color="#fff" />
                </span>
                <span className="a2a_label">Facebook</span>
              </a>
              <a 
                className="a2a_button_mastodon" 
                href={`https://mastodon.social/share?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`}
                title="Mastodon"
                rel="nofollow noopener"
                target="_blank"
              >
                <span className="a2a_svg a2a_s__default a2a_s_mastodon" style={{ backgroundColor: 'rgb(99, 100, 255)' }}>
                  <Share2 size={20} strokeWidth={2.5} color="#fff" />
                </span>
                <span className="a2a_label">Mastodon</span>
              </a>
              <a 
                className="a2a_button_email" 
                href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`}
                title="Email"
                rel="nofollow noopener"
                target="_blank"
              >
                <span className="a2a_svg a2a_s__default a2a_s_email" style={{ backgroundColor: 'rgb(136, 137, 144)' }}>
                  <Mail size={20} strokeWidth={2.5} color="#fff" />
                </span>
                <span className="a2a_label">Email</span>
              </a>
              <a 
                className="a2a_dd addtoany_share_save addtoany_share" 
                href={`https://www.addtoany.com/share#url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`}
              >
                <span className="a2a_svg a2a_s__default a2a_s_a2a" style={{ backgroundColor: 'rgb(1, 102, 255)' }}>
                  <svg focusable="false" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="20" height="20">
                    <g fill="#FFF">
                      <path d="M14 7h4v18h-4z"></path>
                      <path d="M7 14h18v4H7z"></path>
                    </g>
                  </svg>
                </span>
                <span className="a2a_label a2a_localize" data-a2a-localize="inner,Share">Share</span>
              </a>
            </div>
          </div>
        </span>
      </div>
    </div>
  );
}

