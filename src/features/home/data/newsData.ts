import type { NewsItem } from '../types';

/**
 * News items data for LatestNews component
 */
export const allNewsItems: NewsItem[] = [
  {
    id: 4017,
    title: 'Advance Basketball Crowned 2024 Elevate Ballers League Champions',
    date: 'January 6, 2025',
    category: 'Championships',
    image: 'images/IMG_0627-Enhanced-NR-min-350x250.jpg',
    url: 'https://elevateballers.com/2025/01/06/advance-basketball-crowned-2024-elevate-ballers-league-champions/',
    commentsCount: 1,
    format: 'standard',
    feature: true,
  },
  {
    id: 1616,
    title: 'Against All Odds',
    date: 'December 10, 2023',
    category: 'Championships',
    image: 'images/b3afc460-adfb-4fd9-a642-a304c729edcd-350x250.jpg',
    url: 'https://elevateballers.com/2023/12/10/arrowhead-debuts-new-signature-concession-items/',
    commentsCount: 0,
    format: 'standard',
    feature: false,
  },
  {
    id: 1608,
    title: 'Meet The Directors',
    date: 'December 9, 2023',
    category: 'Interviews',
    image: 'images/image-2-109-of-231-350x250.jpg',
    url: 'https://elevateballers.com/2023/12/09/meetthedirectors/',
    commentsCount: 0,
    format: 'video',
    feature: false,
  },
  {
    id: 1618,
    title: 'A Triumph of Talent :',
    date: 'November 20, 2023',
    category: 'Championships',
    image: 'images/IMG_0293-350x250.jpg',
    url: 'https://elevateballers.com/2023/11/20/what-we-learned-from-wednesdays-media-availability/',
    commentsCount: 0,
    format: 'standard',
    feature: false,
  },
  {
    id: 1624,
    title: 'Throwback night: ticket special',
    date: 'November 19, 2023',
    category: 'Interviews',
    image: 'images/IMG_0511-350x250.jpg',
    url: 'https://elevateballers.com/2023/11/19/post-game-interviews/',
    commentsCount: 0,
    format: 'standard',
    feature: false,
  },
  {
    id: 1622,
    title: 'The Power of Youth Development Through Basketball',
    date: 'July 21, 2022',
    category: 'Analysis',
    image: 'images/Basketball-metaphor-1-350x250.jpg',
    url: 'https://elevateballers.com/2022/07/21/the-power-of-youth-development-through-basketball/',
    commentsCount: 0,
    format: 'standard',
    feature: false,
  },
  {
    id: 1620,
    title: 'Latest on Player transfers for next season?',
    date: 'December 19, 2016',
    category: 'Championships',
    image: 'images/placeholder-350x250.gif',
    url: 'https://elevateballers.com/2016/12/19/which-new-player-will-draft-nfl-in-2016/',
    commentsCount: 0,
    format: 'standard',
    feature: false,
  },
];

/**
 * Filter news items by category
 */
export function filterNewsByCategory(items: NewsItem[], category: string): NewsItem[] {
  if (category === 'All') {
    return items;
  }
  return items.filter((item) => item.category === category);
}

