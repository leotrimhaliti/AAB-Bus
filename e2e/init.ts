import { device } from 'detox';

beforeAll(async () => {
  await device.launchApp({
    permissions: { location: 'always', notifications: 'YES' },
    newInstance: true,
  });
});

beforeEach(async () => {
  await device.reloadReactNative();
});
