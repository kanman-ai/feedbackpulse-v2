/**
 * Tests for utility functions in FeedbackPulse v2.
 * Validates email validation, password strength validation, and class name merging.
 */
import { cn, isValidEmail, validatePassword } from '../utils'

describe('cn (className utility)', () => {
  it('should combine class names', () => {
    const result = cn('class1', 'class2', 'class3')
    expect(result).toBe('class1 class2 class3')
  })

  it('should handle conditional classes', () => {
    const result = cn('base', true && 'conditional', false && 'hidden')
    expect(result).toBe('base conditional')
  })

  it('should handle objects', () => {
    const result = cn({
      'active': true,
      'hidden': false,
      'base': true
    })
    expect(result).toBe('active base')
  })

  it('should handle arrays', () => {
    const result = cn(['class1', 'class2'], ['class3'])
    expect(result).toBe('class1 class2 class3')
  })

  it('should handle mixed inputs', () => {
    const result = cn(
      'base',
      { 'active': true, 'hidden': false },
      ['additional', 'classes'],
      'final'
    )
    expect(result).toBe('base active additional classes final')
  })
})

describe('isValidEmail', () => {
  it('should validate correct email formats', () => {
    const validEmails = [
      'test@example.com',
      'user.name@domain.co.uk',
      'user+tag@example.org',
      'firstname.lastname@company.com',
      'email@subdomain.example.com',
      'firstname+lastname@example.com',
      'email@example-one.com',
      '_______@example.com',
      'email@123.123.123.123', // IP address format (technically valid)
      'email@example.name',
    ]

    validEmails.forEach(email => {
      expect(isValidEmail(email)).toBe(true)
    })
  })

  it('should reject invalid email formats', () => {
    const invalidEmails = [
      '',
      'invalid',
      'invalid@',
      '@invalid.com',
      'invalid@.com',
      'invalid.@com',
      'invalid..email@example.com',
      'invalid@example.',
      'invalid@.example.com',
      '.invalid@example.com',
      'invalid@example..com',
      'invalid@',
      'invalid@example',
      'invalid email@example.com',
      'invalid@exam ple.com',
    ]

    invalidEmails.forEach(email => {
      expect(isValidEmail(email)).toBe(false)
    })
  })
})

describe('validatePassword', () => {
  it('should validate strong passwords', () => {
    const strongPasswords = [
      'Password123!',
      'MyStr0ng!Pass',
      'C0mpl3x@Password',
      '8Ch@r@ct3rs',
      'Another!Valid9',
    ]

    strongPasswords.forEach(password => {
      const result = validatePassword(password)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  it('should reject password too short', () => {
    const result = validatePassword('Sh0rt!')
    
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Password must be at least 8 characters long')
  })

  it('should require uppercase letter', () => {
    const result = validatePassword('lowercase123!')
    
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Password must contain at least one uppercase letter')
  })

  it('should require lowercase letter', () => {
    const result = validatePassword('UPPERCASE123!')
    
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Password must contain at least one lowercase letter')
  })

  it('should require number', () => {
    const result = validatePassword('NoNumbers!')
    
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Password must contain at least one number')
  })

  it('should require special character', () => {
    const result = validatePassword('NoSpecial123')
    
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Password must contain at least one special character')
  })

  it('should return multiple errors for weak password', () => {
    const result = validatePassword('weak')
    
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Password must be at least 8 characters long')
    expect(result.errors).toContain('Password must contain at least one uppercase letter')
    expect(result.errors).toContain('Password must contain at least one number')
    expect(result.errors).toContain('Password must contain at least one special character')
  })

  it('should handle empty password', () => {
    const result = validatePassword('')
    
    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('should validate various special characters', () => {
    const specialCharacters = '!@#$%^&*(),.?\":{}|<>'
    
    for (const char of specialCharacters) {
      const password = `Password123${char}`
      const result = validatePassword(password)
      expect(result.isValid).toBe(true)
    }
  })
})