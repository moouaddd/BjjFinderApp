import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bjjspain.finder',
  appName: 'bjj-spain',
  webDir: 'dist',
  server: {
    url: 'https://bjj-finder-app-rz51.vercel.app',
    cleartext: true,
  },
};

export default config;
