export const validateEmail = (email: string): { valid: boolean; error?: string } => {
  if (!email) {
    return { valid: false, error: 'Ju lutem vendosni përdoruesin' };
  }

  // Allow any non-empty string (username or email)
  if (email.trim().length === 0) {
    return { valid: false, error: 'Ju lutem vendosni përdoruesin' };
  }

  return { valid: true };
};

export const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (!password) {
    return { valid: false, error: 'Ju lutem vendosni fjalëkalimin' };
  }

  if (password.length < 6) {
    return { valid: false, error: 'Fjalëkalimi duhet të ketë të paktën 6 karaktere' };
  }

  return { valid: true };
};

export const validatePasswordMatch = (
  password: string,
  confirmPassword: string
): { valid: boolean; error?: string } => {
  if (password !== confirmPassword) {
    return { valid: false, error: 'Fjalëkalimet nuk përputhen' };
  }

  return { valid: true };
};
