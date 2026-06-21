import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// The app is served from https://<user>.github.io/LifeTracker2026/
// so every asset must be resolved under that sub-path.
const BASE = '/LifeTracker2026/';

export default defineConfig({
  base: BASE,
  plugins: [preact()],
  build: {
    // iPad Mini 2 tops out at iOS 12.5 / Safari 12. Targeting these makes
    // esbuild transpile away optional chaining (?.), nullish (??), object
    // spread, etc. — INCLUDING inside dependencies — so nothing parse-breaks
    // on the device.
    target: ['es2017', 'safari12'],
    cssTarget: 'safari12'
  }
});
