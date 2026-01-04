import { create } from 'zustand';

/**
 * Carousel store for managing carousel/slider state
 */
interface CarouselState {
  currentSlide: number;
  totalSlides: number;
  isAutoPlaying: boolean;
  goToSlide: (index: number) => void;
  nextSlide: () => void;
  prevSlide: () => void;
  setTotalSlides: (total: number) => void;
  toggleAutoPlay: () => void;
  setAutoPlay: (value: boolean) => void;
}

export const useCarouselStore = create<CarouselState>((set, get) => ({
  currentSlide: 0,
  totalSlides: 0,
  isAutoPlaying: false,
  goToSlide: (index: number) => {
    const { totalSlides } = get();
    if (index >= 0 && index < totalSlides) {
      set({ currentSlide: index });
    }
  },
  nextSlide: () => {
    const { currentSlide, totalSlides } = get();
    set({ currentSlide: (currentSlide + 1) % totalSlides });
  },
  prevSlide: () => {
    const { currentSlide, totalSlides } = get();
    set({ currentSlide: currentSlide === 0 ? totalSlides - 1 : currentSlide - 1 });
  },
  setTotalSlides: (total: number) => set({ totalSlides: total }),
  toggleAutoPlay: () => set((state) => ({ isAutoPlaying: !state.isAutoPlaying })),
  setAutoPlay: (value: boolean) => set({ isAutoPlaying: value }),
}));

