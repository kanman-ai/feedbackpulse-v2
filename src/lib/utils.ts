/**
 * Utility functions for FeedbackPulse v2 application.
 * Provides common helper functions for styling and data manipulation.
 */
import { clsx, type ClassValue } from 'clsx'

/**
 * Combines class names using clsx for optimal CSS class handling.
 * Merges conditional classes and removes falsy values.
 * 
 * @param inputs - Array of class values (strings, objects, arrays, etc.)
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

/**
 * Validates email format using a comprehensive regex pattern.
 * Supports most standard email formats including internationalized domains.
 * 
 * @param email - Email string to validate
 * @returns True if email format is valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  // Basic type and null checks
  if (!email || typeof email !== 'string') {
    return false
  }

  // Check for invalid patterns that regex might miss
  if (email.endsWith('.') || email.includes('..') || email.startsWith('.') || 
      email.includes('@.') || email.includes('.@') || email.includes('@@')) {
    return false
  }

  // Ensure domain part has at least one dot (TLD requirement)
  const atIndex = email.indexOf('@')
  if (atIndex === -1 || !email.substring(atIndex + 1).includes('.')) {
    return false
  }

  // Comprehensive email regex pattern
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  return emailRegex.test(email)
}

/**
 * Validates password strength based on common security requirements.
 * Requires minimum length, uppercase, lowercase, number, and special character.
 * 
 * @param password - Password string to validate
 * @returns Object with validation result and specific requirement failures
 */
export function validatePassword(password: string): { 
  isValid: boolean
  errors: string[] 
} {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}