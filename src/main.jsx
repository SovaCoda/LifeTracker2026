import { render } from 'preact';
import { App } from './app.jsx';
import './styles.css';

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
