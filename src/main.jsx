import { render } from 'preact';
import { App } from './app.jsx';
import './styles.css';

// iOS standalone PWAs leave a black gap when you rely on 100vh / 100%.
// Setting a real pixel height from window.innerHeight (and refreshing it on
// rotate/resize) makes the app fill the screen exactly.
function setAppHeight() {
  document.documentElement.style.setProperty('--app-height', window.innerHeight + 'px');
}
setAppHeight();
window.addEventListener('resize', setAppHeight);
window.addEventListener('orientationchange', setAppHeight);

render(<App />, document.getElementById('app'));

// Register the offline service worker (under the GitHub Pages base path).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker
      .register(import.meta.env.BASE_URL + 'sw.js')
      .catch(function () {
        /* offline support is a nice-to-have; ignore failures */
      });
  });
}
