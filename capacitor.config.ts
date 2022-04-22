import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'train-american',
  webDir: 'www',
  bundledWebRuntime: false,
  ios: {
    hideLogs: false,
  }
};

export default config;
