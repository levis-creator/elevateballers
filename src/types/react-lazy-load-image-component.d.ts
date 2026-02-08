declare module 'react-lazy-load-image-component' {
    import { ComponentType, ReactNode, ImgHTMLAttributes } from 'react';

    export interface LazyLoadImageProps extends ImgHTMLAttributes<HTMLImageElement> {
        afterLoad?: () => void;
        beforeLoad?: () => void;
        delayMethod?: 'debounce' | 'throttle';
        delayTime?: number;
        effect?: string;
        placeholder?: ReactNode;
        threshold?: number;
        useIntersectionObserver?: boolean;
        visibleByDefault?: boolean;
        wrapperClassName?: string;
        wrapperProps?: any;
        scrollPosition?: any;
        placeholderSrc?: string;
    }

    export const LazyLoadImage: ComponentType<LazyLoadImageProps>;
    export const trackWindowScroll: (component: ComponentType<any>) => ComponentType<any>;
    export const LazyLoadComponent: ComponentType<any>;
}
