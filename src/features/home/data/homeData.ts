import type { Match, PlayerOfTheWeek, Stat, PostSlide, TickerItem } from '../types';

/**
 * Static data for home feature components
 */

export const marqueeMatch: Match = {
  id: 'nexus-vs-advance',
  team1: {
    name: 'Nexus 360',
    logo: 'images/WhatsApp-Image-2025-04-30-at-23.38.29.jpeg',
    logoAlt: 'Nexus 360 logo',
  },
  team2: {
    name: 'Advance Hoops Mastery',
    logo: 'images/advance.jpg',
    logoAlt: 'Advance Hoops Mastery logo',
  },
  date: 'January 10, 2026',
  league: 'Elevate Ballers League',
  eventUrl: 'https://elevateballers.com/event/nexus-360-vs-advance-hoops-mastery/',
};

export const playerOfTheWeek: PlayerOfTheWeek = {
  name: 'Paul Angwenyi',
  image: 'images/IMG_9750-min-scaled.jpg',
  imageAlt: 'Paul Angwenyi - Player of the Week',
  description: `Paul Angwenyi cemented his status as the star of the 2024 Elevate Ballers League Finals, leading Advance Basketball to a dominant series sweep over Lokoz. The ball-dominant point guard dazzled with his flashy playstyle, reminiscent of LaMelo Ball, combining creativity and court vision to keep defenders on their heels. Angwenyi averaged an impressive 25 points and 7 assists across the three-game series, orchestrating Advance Basketball's offense with poise and flair. His performance not only secured the championship but also showcased his undeniable talent and ability to shine on the biggest stage.

Beyond the numbers, Paul Angwenyi's impact on the court was undeniable. His ability to control the tempo of the game and make clutch plays elevated Advance Basketball when it mattered most. Whether it was a no-look dime to a cutting teammate or a deep three to ignite the crowd, Angwenyi's flair for the dramatic left fans and opponents in awe. His leadership and composure under pressure were key factors in Advance Basketball's success, proving that he is not just a flashy player but a true floor general capable of guiding his team to victory.`,
  signature: '',
};

export const stats: Stat[] = [
  {
    id: 'matches',
    value: 130,
    label: 'matches played',
    icon: 'images/court.png',
    iconAlt: 'Basketball court icon',
  },
  {
    id: 'players',
    value: 265,
    label: 'players',
    icon: 'images/basketball-player.png',
    iconAlt: 'Basketball player icon',
  },
  {
    id: 'teams',
    value: 25,
    label: 'teams',
    icon: 'images/playing.png',
    iconAlt: 'Playing icon',
  },
  {
    id: 'awards',
    value: 10,
    label: 'awards won',
    icon: 'images/award_1.png',
    iconAlt: 'Award icon',
  },
];

export const postSlides: PostSlide[] = [
  {
    id: 'slide-1',
    image: 'images/IMG_0627-Enhanced-NR-min-scaled.jpg',
    category: 'Championships',
    title: 'Advance Basketball Crowned 2024 Elevate Ballers League Champions',
    excerpt: '<p>Advance bags first championship</p>',
    url: 'https://elevateballers.com/2025/01/06/advance-basketball-crowned-2024-elevate-ballers-league-champions/',
    shareUrl: 'https://elevateballers.com/2025/01/06/advance-basketball-crowned-2024-elevate-ballers-league-champions/',
  },
  {
    id: 'slide-2',
    image: 'images/b3afc460-adfb-4fd9-a642-a304c729edcd.jpg',
    category: 'Championships',
    title: 'Against All Odds',
    excerpt: '<p>Don Bosco Nets Secures Second Championship Title as Unlikely Underdogs</p>',
    url: 'https://elevateballers.com/2023/12/10/arrowhead-debuts-new-signature-concession-items/',
    shareUrl: 'https://elevateballers.com/2023/12/10/arrowhead-debuts-new-signature-concession-items/',
  },
  {
    id: 'slide-3',
    image: 'images/image-2-109-of-231-scaled.jpg',
    category: 'Interviews',
    title: 'Meet The Directors',
    excerpt: '<p>four individuals set out to create a basketball league that would redefine the narrative of what it means to be a professional player.</p>',
    url: 'https://elevateballers.com/2023/12/09/meetthedirectors/',
    shareUrl: 'https://elevateballers.com/2023/12/09/meetthedirectors/',
  },
  {
    id: 'slide-4',
    image: 'images/IMG_0293-scaled.jpg',
    category: 'Championships',
    title: 'A Triumph of Talent :',
    excerpt: '<p>Yvette Dominates the Court and Secures MVP Honors</p>',
    url: 'https://elevateballers.com/2023/11/20/what-we-learned-from-wednesdays-media-availability/',
    shareUrl: 'https://elevateballers.com/2023/11/20/what-we-learned-from-wednesdays-media-availability/',
  },
];

export const tickerItems: TickerItem[] = [
  {
    id: 4017,
    title: 'Advance Basketball Crowned 2024 Elevate Ballers League Champions',
    date: 'January 6, 2025',
    url: 'https://elevateballers.com/2025/01/06/advance-basketball-crowned-2024-elevate-ballers-league-champions/',
  },
  {
    id: 1616,
    title: 'Against All Odds',
    date: 'December 10, 2023',
    url: 'https://elevateballers.com/2023/12/10/arrowhead-debuts-new-signature-concession-items/',
  },
  {
    id: 1608,
    title: 'Meet The Directors',
    date: 'December 9, 2023',
    url: 'https://elevateballers.com/2023/12/09/meetthedirectors/',
  },
  {
    id: 1618,
    title: 'A Triumph of Talent :',
    date: 'November 20, 2023',
    url: 'https://elevateballers.com/2023/11/20/what-we-learned-from-wednesdays-media-availability/',
  },
  {
    id: 1624,
    title: 'Throwback night: ticket special',
    date: 'November 19, 2023',
    url: 'https://elevateballers.com/2023/11/19/post-game-interviews/',
  },
];

export const nextMatch = {
  team1: {
    name: 'Nexus 360',
    logo: 'images/WhatsApp-Image-2025-04-30-at-23.38.29-150x150.jpeg',
    url: 'https://elevateballers.com/team/nexus-360/',
  },
  team2: {
    name: 'Advance Hoops Mastery',
    logo: 'images/advance-150x150.jpg',
    url: 'https://elevateballers.com/team/advance-hoops-mastery/',
  },
  eventUrl: 'https://elevateballers.com/event/nexus-360-vs-advance-hoops-mastery/',
  league: 'Elevate Ballers League',
  date: 'January 10, 2026',
  title: '2025 FINALS',
};

export const sponsors = [
  {
    id: 'khoops',
    image: 'images/khoopslogo-200x100.jpg',
    alt: 'khoopslogo',
    title: 'khoopslogo',
    width: 200,
    height: 100,
  },
  {
    id: 'beams',
    image: 'images/beamslogo-200x100.jpg',
    alt: 'beamslogo',
    title: 'beamslogo',
    width: 200,
    height: 100,
  },
  {
    id: 'anto',
    image: 'images/Photo-from-Anto-200x92.jpg',
    alt: 'Photo from Anto',
    title: 'Photo from Anto',
    width: 200,
    height: 92,
  },
  {
    id: 'horizon',
    image: 'images/horizon-logo-200x100.jpg',
    alt: 'horizon-logo',
    title: 'horizon-logo',
    width: 200,
    height: 100,
  },
];
