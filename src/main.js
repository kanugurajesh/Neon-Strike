import './style.css';
import { Game } from './core/Game.js';

try {
  const game = new Game(document.getElementById('game'));
  // Development-only inspection for browser acceptance tests. Not shipped in production.
  if (import.meta.env.DEV) window.__game = game;
  if (import.meta.hot) import.meta.hot.dispose(() => game.dispose());
} catch (error) {
  console.error(error);
  const message = document.getElementById('error'); message.hidden = false;
  message.textContent = 'The 3D playground could not start. Please use a browser with WebGL 2 and hardware acceleration enabled.';
}
