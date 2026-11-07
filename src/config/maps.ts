import firebaseConfig from '../../firebase-applet-config.json';

// Resolves Google Maps Platform API key from Vite environment variable or provisioned Firebase/Cloud project config
export const GOOGLE_MAPS_API_KEY: string =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) ||
  firebaseConfig.apiKey ||
  '';

export const MAP_ID = 'DEMO_MAP_ID';

export const MAPS_USAGE_ATTRIBUTION = ['gmp_mcp_codeassist_v1_aistudio'];
