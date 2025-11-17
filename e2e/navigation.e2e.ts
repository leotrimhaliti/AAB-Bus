import { device, element, by, expect as detoxExpect, waitFor } from 'detox';

describe('App Navigation', () => {
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

  it('should have bottom tab navigation visible', async () => {
    // Check all tab buttons are visible
    await detoxExpect(element(by.label('Bus Tracking'))).toBeVisible();
    await detoxExpect(element(by.label('Orari'))).toBeVisible();
    await detoxExpect(element(by.label('Profili'))).toBeVisible();
  });

  it('should navigate between tabs', async () => {
    // Navigate to Orari tab
    await element(by.label('Orari')).tap();
    await waitFor(element(by.text('Orari')))
      .toBeVisible()
      .withTimeout(2000);
    
    // Navigate to Profile tab
    await element(by.label('Profili')).tap();
    await waitFor(element(by.text('Profili im')))
      .toBeVisible()
      .withTimeout(2000);
    
    // Navigate back to Bus Tracking
    await element(by.label('Bus Tracking')).tap();
    await waitFor(element(by.text('Stacionet e Linjës')))
      .toBeVisible()
      .withTimeout(2000);
  });

  it('should maintain state when switching tabs', async () => {
    // Scroll on home screen
    await element(by.id('stops-scroll-view')).scrollTo('bottom');
    
    // Navigate away
    await element(by.label('Profili')).tap();
    await waitFor(element(by.text('Profili im')))
      .toBeVisible()
      .withTimeout(2000);
    
    // Navigate back
    await element(by.label('Bus Tracking')).tap();
    
    // State should be maintained (still scrolled)
    await detoxExpect(element(by.text('Gjilan'))).toBeVisible();
  });

  it('should display schedule screen content', async () => {
    await element(by.label('Orari')).tap();
    
    await waitFor(element(by.text('Orari')))
      .toBeVisible()
      .withTimeout(2000);
    
    // Schedule screen should show content
    await detoxExpect(element(by.text('Orari'))).toBeVisible();
  });

  it('should handle deep linking to specific tabs', async () => {
    // This would test deep link handling if configured
    // For now, just verify tabs are accessible programmatically
    await element(by.label('Bus Tracking')).tap();
    await waitFor(element(by.text('Stacionet e Linjës')))
      .toBeVisible()
      .withTimeout(2000);
  });

  it('should preserve navigation stack on app background/foreground', async () => {
    // Navigate to profile
    await element(by.label('Profili')).tap();
    await waitFor(element(by.text('Profili im')))
      .toBeVisible()
      .withTimeout(2000);
    
    // Send app to background
    await device.sendToHome();
    await device.launchApp({ newInstance: false });
    
    // Should still be on profile screen
    await detoxExpect(element(by.text('Profili im'))).toBeVisible();
  });

  it('should handle rapid tab switching', async () => {
    // Rapidly switch tabs
    await element(by.label('Bus Tracking')).tap();
    await element(by.label('Orari')).tap();
    await element(by.label('Profili')).tap();
    await element(by.label('Bus Tracking')).tap();
    
    // Should end up on Bus Tracking
    await waitFor(element(by.text('Stacionet e Linjës')))
      .toBeVisible()
      .withTimeout(3000);
  });
});
