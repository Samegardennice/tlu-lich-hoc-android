import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'vn.tlu.lichhoc',
  appName: 'TLU Lịch Học',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    backgroundColor: '#FFF0F6',
    allowMixedContent: false,
  },
  plugins: {
    SystemBars: {
      insetsHandling: 'css',
      style: 'LIGHT',
    },
    StatusBar: {
      overlaysWebView: false,
      backgroundColor: '#FFF0F6',
      style: 'LIGHT',
    },
  },
};

export default config;
