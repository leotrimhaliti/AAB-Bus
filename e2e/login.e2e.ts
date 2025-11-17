import { device, element, by, expect as detoxExpect, waitFor } from 'detox';

describe('Login Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should display login screen on app launch', async () => {
    await detoxExpect(element(by.text('Kyçu'))).toBeVisible();
  });

  it('should show validation error for empty email', async () => {
    // Tap login button without entering credentials
    await element(by.text('Kyçu')).tap();
    
    // Should show validation error
    await waitFor(element(by.text('Ju lutem vendosni një email të vlefshëm')))
      .toBeVisible()
      .withTimeout(2000);
  });

  it('should show validation error for short password', async () => {
    // Enter valid email but short password
    await element(by.label('Përdoruesi')).typeText('test@aab-edu.net');
    await element(by.label('Fjalëkalimi')).typeText('123');
    
    // Tap login button
    await element(by.text('Kyçu')).tap();
    
    // Should show password validation error
    await waitFor(element(by.text('Fjalëkalimi duhet të ketë të paktën 6 karaktere')))
      .toBeVisible()
      .withTimeout(2000);
  });

  it('should show error for invalid credentials', async () => {
    // Enter invalid credentials
    await element(by.label('Përdoruesi')).typeText('invalid@test.com');
    await element(by.label('Fjalëkalimi')).typeText('wrongpass');
    
    // Tap login button
    await element(by.text('Kyçu')).tap();
    
    // Should show authentication error
    await waitFor(element(by.text('Email ose fjalëkalimi është i gabuar')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should successfully login with valid credentials', async () => {
    // Enter valid credentials (replace with actual test credentials)
    await element(by.label('Përdoruesi')).typeText('test@aab-edu.net');
    await element(by.label('Fjalëkalimi')).typeText('password123');
    
    // Tap login button
    await element(by.text('Kyçu')).tap();
    
    // Should navigate to home screen
    await waitFor(element(by.text('Stacionet e Linjës')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should display forgot password link', async () => {
    await detoxExpect(element(by.text('Keni harruar fjalëkalimin?! Klikoni këtu'))).toBeVisible();
  });

  it('should disable login button while loading', async () => {
    // Enter credentials
    await element(by.label('Përdoruesi')).typeText('test@aab-edu.net');
    await element(by.label('Fjalëkalimi')).typeText('password123');
    
    // Tap login button
    await element(by.text('Kyçu')).tap();
    
    // Button should show loading indicator
    // The activity indicator should be visible briefly
    await waitFor(element(by.label('Kyçu')))
      .not.toBeVisible()
      .withTimeout(1000);
  });
});
