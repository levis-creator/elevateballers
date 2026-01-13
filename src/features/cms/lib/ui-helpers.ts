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

/**
 * Teko font inline style object for use with style prop
 * Usage: <span style={tekoFont}>Text</span>
 */
export const tekoFont: { fontFamily: string } = {
  fontFamily: 'Teko, sans-serif',
};

/**
 * Navigation active state styling
 * Yellow accent background and border for active navigation items
 */
export const navActive = "bg-yellow-400/15 border-yellow-400 font-semibold";

/**
 * Navigation hover state styling
 * White background overlay and yellow accent border on hover
 */
export const navHover = "hover:bg-white/10 hover:border-yellow-400";

/**
 * Yellow accent button styling
 * Primary action button with yellow accent color
 */
export const buttonAccent = "bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-semibold shadow-lg hover:shadow-xl";

/**
 * Sticky header styling
 * Sticky header container with white background and border
 */
export const stickyHeader = "bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm";

/**
 * Sticky footer styling
 * Sticky footer container with white background and border
 */
export const stickyFooter = "sticky bottom-0 bg-white border-t border-slate-200 p-6 shadow-lg";

/**
 * Elevated card styling
 * Card with enhanced shadow and border for visual depth
 */
export const cardElevated = "shadow-lg border-slate-200";

/**
 * Card header styling
 * Card header with slate background and border
 */
export const cardHeader = "bg-slate-50 border-b border-slate-200";

/**
 * Card title styling
 * Card title with Teko font and larger text size
 */
export const cardTitle = "text-2xl font-bold";

/**
 * Form input styling
 * Input fields with slate borders and yellow accent focus state
 */
export const formInput = "border-slate-300 focus:border-yellow-400 focus:ring-yellow-400";

/**
 * Form select trigger styling
 * Select triggers with slate borders and neutral focus state
 */
export const formSelectTrigger = "border-slate-300";

/**
 * Form label styling
 * Label text with semibold weight and slate color
 */
export const formLabel = "text-sm font-semibold text-slate-700";

/**
 * Form helper text styling
 * Helper text with smaller size and muted slate color
 */
export const formHelperText = "text-xs text-slate-500";
