import 'dotenv/config';
import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'mindtalkapp',
  slug: 'mindtalkapp',
  extra: {
    apiUrl: process.env.API_URL || 'https://admin.mindtalk.ge/api/v1',
    reverbAppKey: process.env.REVERB_APP_KEY || '',
    reverbHost: process.env.REVERB_HOST || '',
    reverbPort: process.env.REVERB_PORT || '443',
    reverbScheme: process.env.REVERB_SCHEME || 'https',
  },
});
