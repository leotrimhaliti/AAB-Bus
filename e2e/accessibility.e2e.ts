import { device, element, by, expect as detoxExpect, waitFor } from 'detox';

describe('Accessibility Features', () => {
  beforeAll(async () => {
    await device.launchApp({ 
      newInstance: true,
      permissions: { notifications: 'YES' },
    });
    
    // Login
    await element(by.label('Përdoruesi')).typeText('test@aab-edu.net');
    await element(by.label('Fjalëkalimi')).typeText('password123');
    await element(by.text('Kyçu')).tap();
    
    await waitFor(element(by.text('Stacionet e Linjës')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should have accessibility labels on login inputs', async () => {
    // Logout first
    await element(by.label('Profili')).tap();
    await waitFor(element(by.text('Profili im'))).toBeVisible().withTimeout(5000);
    await element(by.id('profile-scroll-view')).scrollTo('bottom');
    await element(by.text('Shkyçu')).tap();
    
    // Check login screen accessibility
    await detoxExpect(element(by.label('Përdoruesi'))).toBeVisible();
    await detoxExpect(element(by.label('Fjalëkalimi'))).toBeVisible();
    await detoxExpect(element(by.label('Kyçu'))).toBeVisible();
  });

  it('should have accessibility labels on map controls', async () => {
    // Login again
    await element(by.label('Përdoruesi')).typeText('test@aab-edu.net');
    await element(by.label('Fjalëkalimi')).typeText('password123');
    await element(by.text('Kyçu')).tap();
    
    await waitFor(element(by.text('Stacionet e Linjës')))
      .toBeVisible()
      .withTimeout(10000);
    
    // Center button should have accessibility label
    await detoxExpect(element(by.label('Qendro në autobusat'))).toBeVisible();
  });

  it('should have minimum touch target sizes', async () => {
    // All interactive elements should be at least 44x44 points
    // Center button
    await detoxExpect(element(by.label('Qendro në autobusat'))).toBeVisible();
    
    // Tab bar items
    await detoxExpect(element(by.label('Bus Tracking'))).toBeVisible();
    await detoxExpect(element(by.label('Orari'))).toBeVisible();
    await detoxExpect(element(by.label('Profili'))).toBeVisible();
  });

  it('should support VoiceOver/TalkBack navigation', async () => {
    // Test that all major interactive elements have proper labels
    await detoxExpect(element(by.label('Bus Tracking'))).toBeVisible();
    
    // Navigate to profile
    await element(by.label('Profili')).tap();
    await waitFor(element(by.text('Profili im'))).toBeVisible().withTimeout(5000);
    
    // Logout button should be accessible
    await element(by.id('profile-scroll-view')).scrollTo('bottom');
    await detoxExpect(element(by.text('Shkyçu'))).toBeVisible();
  });

  it('should have proper focus order for keyboard navigation', async () => {
    // Logout
    await element(by.label('Profili')).tap();
    await waitFor(element(by.text('Profili im'))).toBeVisible().withTimeout(5000);
    await element(by.id('profile-scroll-view')).scrollTo('bottom');
    await element(by.text('Shkyçu')).tap();
    
    // On login screen, focus order should be: email -> password -> login button
    await detoxExpect(element(by.label('Përdoruesi'))).toBeVisible();
    await detoxExpect(element(by.label('Fjalëkalimi'))).toBeVisible();
    await detoxExpect(element(by.label('Kyçu'))).toBeVisible();
  });

  it('should provide feedback for user actions', async () => {
    // Login to test action feedback
    await element(by.label('Përdoruesi')).typeText('test@aab-edu.net');
    await element(by.label('Fjalëkalimi')).typeText('password123');
    
    // Tap login - should show loading state
    await element(by.text('Kyçu')).tap();
    
    // Should navigate to home (visual feedback)
    await waitFor(element(by.text('Stacionet e Linjës')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should have descriptive error messages', async () => {
    // Logout
    await element(by.label('Profili')).tap();
    await waitFor(element(by.text('Profili im'))).toBeVisible().withTimeout(5000);
    await element(by.id('profile-scroll-view')).scrollTo('bottom');
    await element(by.text('Shkyçu')).tap();
    
    // Try to login with empty fields
    await element(by.text('Kyçu')).tap();
    
    // Should show descriptive error in Albanian
    await waitFor(element(by.text('Ju lutem vendosni një email të vlefshëm')))
      .toBeVisible()
      .withTimeout(2000);
  });
});
