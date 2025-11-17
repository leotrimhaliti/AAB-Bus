import { device, element, by, expect as detoxExpect, waitFor } from 'detox';

describe('Profile Management', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    
    // Login
    await element(by.label('Përdoruesi')).typeText('test@aab-edu.net');
    await element(by.label('Fjalëkalimi')).typeText('password123');
    await element(by.text('Kyçu')).tap();
    
    // Wait for home screen
    await waitFor(element(by.text('Stacionet e Linjës')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should navigate to profile screen from tab bar', async () => {
    // Tap profile tab
    await element(by.label('Profili')).tap();
    
    // Profile screen should be visible
    await waitFor(element(by.text('Profili im')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should display user profile information', async () => {
    // Navigate to profile
    await element(by.label('Profili')).tap();
    
    // Wait for profile to load
    await waitFor(element(by.text('Profili im')))
      .toBeVisible()
      .withTimeout(5000);
    
    // Should display profile fields
    await detoxExpect(element(by.text('Email Adresa'))).toBeVisible();
    await detoxExpect(element(by.text('Datëlindja'))).toBeVisible();
    await detoxExpect(element(by.text('Grupi'))).toBeVisible();
  });

  it('should fetch profile data from Faculty API', async () => {
    await element(by.label('Profili')).tap();
    
    // Wait for API data to load
    await waitFor(element(by.text('Profili im')))
      .toBeVisible()
      .withTimeout(10000);
    
    // Profile data should be populated
    // This assumes the test account has profile data
    await waitFor(element(by.id('profile-email-value')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should handle profile API errors gracefully', async () => {
    // Block Faculty API
    await device.setURLBlacklist(['https://testapieservice.uniaab.com/*']);
    
    // Navigate to profile
    await element(by.label('Profili')).tap();
    
    // Should still render profile screen
    await waitFor(element(by.text('Profili im')))
      .toBeVisible()
      .withTimeout(5000);
    
    // Re-enable network
    await device.setURLBlacklist([]);
  });

  it('should logout and return to login screen', async () => {
    // Navigate to profile
    await element(by.label('Profili')).tap();
    
    // Wait for profile screen
    await waitFor(element(by.text('Profili im')))
      .toBeVisible()
      .withTimeout(5000);
    
    // Scroll to find logout button
    await element(by.id('profile-scroll-view')).scrollTo('bottom');
    
    // Tap logout button
    await element(by.text('Shkyçu')).tap();
    
    // Should return to login screen
    await waitFor(element(by.text('Kyçu')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should display profile image when available', async () => {
    // Login again
    await element(by.label('Përdoruesi')).typeText('test@aab-edu.net');
    await element(by.label('Fjalëkalimi')).typeText('password123');
    await element(by.text('Kyçu')).tap();
    
    await waitFor(element(by.text('Stacionet e Linjës')))
      .toBeVisible()
      .withTimeout(10000);
    
    // Navigate to profile
    await element(by.label('Profili')).tap();
    
    // Check if profile image is visible
    await waitFor(element(by.id('profile-image')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should display faculty information', async () => {
    await element(by.label('Profili')).tap();
    
    await waitFor(element(by.text('Profili im')))
      .toBeVisible()
      .withTimeout(5000);
    
    // Should show faculty field
    await detoxExpect(element(by.text('Fakulteti'))).toBeVisible();
  });

  it('should display group information for students', async () => {
    await element(by.label('Profili')).tap();
    
    await waitFor(element(by.text('Profili im')))
      .toBeVisible()
      .withTimeout(5000);
    
    // Should show group field
    await detoxExpect(element(by.text('Grupi'))).toBeVisible();
  });
});
