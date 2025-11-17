import { validateEmail, validatePassword, validatePasswordMatch } from '../lib/validation';

describe('validation', () => {
  describe('validateEmail', () => {
    it('should accept any non-empty username', () => {
      expect(validateEmail('user123')).toEqual({ valid: true });
      expect(validateEmail('test@example.com')).toEqual({ valid: true });
      expect(validateEmail('john.doe')).toEqual({ valid: true });
    });

    it('should reject empty input', () => {
      expect(validateEmail('')).toEqual({
        valid: false,
        error: 'Ju lutem vendosni përdoruesin',
      });
    });

    it('should reject whitespace-only input', () => {
      expect(validateEmail('   ')).toEqual({
        valid: false,
        error: 'Ju lutem vendosni përdoruesin',
      });
    });
  });

  describe('validatePassword', () => {
    it('should accept passwords with 6+ characters', () => {
      expect(validatePassword('123456')).toEqual({ valid: true });
      expect(validatePassword('password123')).toEqual({ valid: true });
      expect(validatePassword('verylongpassword')).toEqual({ valid: true });
    });

    it('should reject empty password', () => {
      expect(validatePassword('')).toEqual({
        valid: false,
        error: 'Ju lutem vendosni fjalëkalimin',
      });
    });

    it('should reject passwords shorter than 6 characters', () => {
      expect(validatePassword('12345')).toEqual({
        valid: false,
        error: 'Fjalëkalimi duhet të ketë të paktën 6 karaktere',
      });
      expect(validatePassword('abc')).toEqual({
        valid: false,
        error: 'Fjalëkalimi duhet të ketë të paktën 6 karaktere',
      });
    });
  });

  describe('validatePasswordMatch', () => {
    it('should accept matching passwords', () => {
      expect(validatePasswordMatch('password123', 'password123')).toEqual({ valid: true });
      expect(validatePasswordMatch('test', 'test')).toEqual({ valid: true });
    });

    it('should reject non-matching passwords', () => {
      expect(validatePasswordMatch('password1', 'password2')).toEqual({
        valid: false,
        error: 'Fjalëkalimet nuk përputhen',
      });
      expect(validatePasswordMatch('test', 'TEST')).toEqual({
        valid: false,
        error: 'Fjalëkalimet nuk përputhen',
      });
    });
  });
});
