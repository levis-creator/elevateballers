import Masonry from 'react-masonry-css';
import styles from './MasonryGrid.module.css';

interface MasonryGridProps {
  children: React.ReactNode;
  breakpointCols?: {
    default: number;
    [key: number]: number;
  };
  className?: string;
}

/**
 * MasonryGrid component - Modular masonry layout using react-masonry-css
 * Replaces legacy Isotope grids
 */
export default function MasonryGrid({
  children,
  breakpointCols = {
    default: 4,
    1100: 3,
    700: 2,
    500: 1
  },
  className = ''
}: MasonryGridProps) {
  return (
    <Masonry
      breakpointCols={breakpointCols}
      className={`${styles.masonryGrid} ${className}`}
      columnClassName={styles.masonryGridColumn}
    >
      {children}
    </Masonry>
  );
}
