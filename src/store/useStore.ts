import { create } from 'zustand';

// Type definitions for the store
export type NewsFilter = 'All' | 'Interviews' | 'Championships' | 'Match report' | 'Analysis';

export type MediaFilter = 'All' | 'Images' | 'Audio';

interface UIState {
	// Mobile menu state
	isMobileMenuOpen: boolean;
	toggleMobileMenu: () => void;
	closeMobileMenu: () => void;

	// News filter state
	newsFilter: NewsFilter;
	setNewsFilter: (filter: NewsFilter) => void;

	// Media gallery filter state
	mediaFilter: MediaFilter;
	setMediaFilter: (filter: MediaFilter) => void;

	// Cart state
	cartItems: number;
	addToCart: () => void;
	removeFromCart: () => void;
	clearCart: () => void;

	// User authentication state
	isAuthenticated: boolean;
	user: { name: string; email: string } | null;
	login: (user: { name: string; email: string }) => void;
	logout: () => void;
}

export const useStore = create<UIState>((set) => ({
	// Mobile menu state
	isMobileMenuOpen: false,
	toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
	closeMobileMenu: () => set({ isMobileMenuOpen: false }),

	// News filter state
	newsFilter: 'All',
	setNewsFilter: (filter: NewsFilter) => set({ newsFilter: filter }),

	// Media gallery filter state
	mediaFilter: 'All',
	setMediaFilter: (filter: MediaFilter) => set({ mediaFilter: filter }),

	// Cart state
	cartItems: 0,
	addToCart: () => set((state) => ({ cartItems: state.cartItems + 1 })),
	removeFromCart: () => set((state) => ({ cartItems: Math.max(0, state.cartItems - 1) })),
	clearCart: () => set({ cartItems: 0 }),

	// User authentication state
	isAuthenticated: false,
	user: null,
	login: (user: { name: string; email: string }) =>
		set({ isAuthenticated: true, user }),
	logout: () => set({ isAuthenticated: false, user: null }),
}));

