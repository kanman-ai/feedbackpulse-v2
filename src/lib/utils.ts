/**
 * Utility functions for common operations across the application.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines and merges class names using clsx and tailwind-merge.
 * Useful for conditionally applying CSS classes and resolving Tailwind conflicts.
 * 
 * @param inputs - Class values to combine (strings, objects, arrays, etc.)
 * @returns Merged class string with conflicts resolved
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}