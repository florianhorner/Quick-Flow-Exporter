export const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

export const DEMO_MODE_MESSAGE =
  'The hosted demo uses bundled examples only. To parse your own Quick Flow, run the app locally with the AI proxy.';

export const LOCAL_PROXY_FIX =
  'Running locally? Start the app and proxy together with ANTHROPIC_API_KEY=... npm start.';

export const PROXY_UNAVAILABLE_MESSAGE =
  'The AI proxy is not reachable from this deployment.';
