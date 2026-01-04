/**
 * UI Helper utilities for shadcn/ui components in the admin portal
 * 
 * These helpers provide common patterns and utilities for working with
 * shadcn/ui components while maintaining the existing admin design system.
 */

import { cn } from "@/lib/utils";

/**
 * Common button class combinations for admin portal
 */
export const buttonClasses = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  ghost: "hover:bg-accent hover:text-accent-foreground",
};

/**
 * Common card class combinations
 */
export const cardClasses = {
  default: "rounded-lg border bg-card text-card-foreground shadow-sm",
  elevated: "rounded-lg border bg-card text-card-foreground shadow-md",
  flat: "rounded-lg border bg-card text-card-foreground",
};

/**
 * Common input class combinations
 */
export const inputClasses = {
  default: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
  error: "flex h-10 w-full rounded-md border border-destructive bg-background px-3 py-2 text-sm ring-offset-background",
};

/**
 * Helper to merge admin-specific classes with shadcn/ui components
 */
export function adminClassNames(...classes: (string | undefined | null | false)[]) {
  return cn(...classes);
}

/**
 * Get heading font class (Teko)
 */
export function headingFont() {
  return "font-heading font-semibold";
}

/**
 * Get body font class (Rubik)
 */
export function bodyFont() {
  return "font-sans";
}

