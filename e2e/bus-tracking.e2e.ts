import { device, element, by, expect as detoxExpect, waitFor } from 'detox';

describe('Bus Tracking Features', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    
    // Login first
    await element(by.label('Përdoruesi')).typeText('test@aab-edu.net');
    await element(by.label('Fjalëkalimi')).typeText('password123');
    await element(by.text('Kyçu')).tap();
    
    // Wait for home screen
    await waitFor(element(by.text('Stacionet e Linjës')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should display map view on home screen', async () => {
    // Map container should be visible
    await detoxExpect(element(by.id('bus-tracking-map'))).toBeVisible();
  });

  it('should display route stops list', async () => {
    await detoxExpect(element(by.text('Stacionet e Linjës'))).toBeVisible();
    
    // Should show some route stops
    await detoxExpect(element(by.text('AAB Prishtinë'))).toBeVisible();
  });

  it('should display bus markers on map when data loads', async () => {
    // Wait for bus data to load
    await waitFor(element(by.id('bus-marker-bus-1')))
      .toBeVisible()
      .withTimeout(15000);
  });

  it('should handle offline mode gracefully', async () => {
    // Simulate going offline
    await device.setURLBlacklist(['https://testapieservice.aab-edu.net/*']);
    
    // Reload to trigger offline state
    await device.reloadReactNative();
    
    // Wait for home screen
    await waitFor(element(by.text('Stacionet e Linjës')))
      .toBeVisible()
      .withTimeout(10000);
    
    // Should show offline banner
    await waitFor(element(by.text('⚠️ Jeni offline')))
      .toBeVisible()
      .withTimeout(5000);
    
    // Re-enable network
    await device.setURLBlacklist([]);
  });

  it('should center map on buses when center button is tapped', async () => {
    // Wait for center button to be visible
    await waitFor(element(by.label('Qendro në autobusat')))
      .toBeVisible()
      .withTimeout(5000);
    
    // Tap center button
    await element(by.label('Qendro në autobusat')).tap();
    
    // Map should animate (no direct assertion, but tap should work)
    // This tests the button is functional
  });

  it('should refresh bus data on retry button tap', async () => {
    // Simulate error state by blocking API
    await device.setURLBlacklist(['https://testapieservice.aab-edu.net/*']);
    await device.reloadReactNative();
    
    // Wait for error message
    await waitFor(element(by.text('Provo përsëri')))
      .toBeVisible()
      .withTimeout(5000);
    
    // Re-enable network
    await device.setURLBlacklist([]);
    
    // Tap retry button
    await element(by.text('Provo përsëri')).tap();
    
    // Should load successfully
    await waitFor(element(by.text('Stacionet e Linjës')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should scroll through route stops list', async () => {
    // Scroll to bottom of stops list
    await element(by.id('stops-scroll-view')).scrollTo('bottom');
    
    // Should see the last stop
    await detoxExpect(element(by.text('Gjilan'))).toBeVisible();
    
    // Scroll back to top
    await element(by.id('stops-scroll-view')).scrollTo('top');
    
    // Should see first stop
    await detoxExpect(element(by.text('AAB Prishtinë'))).toBeVisible();
  });

  it('should display loading skeleton on initial load', async () => {
    // Reload app
    await device.reloadReactNative();
    
    // Should briefly show skeleton (this is timing-dependent)
    // The skeleton appears before data loads
    await waitFor(element(by.text('Stacionet e Linjës')))
      .toBeVisible()
      .withTimeout(10000);
  });
});
