/* main.js — Giriş noktası: modülleri başlatır ve oyunu açar. */
import {newGame} from './game.js';
import {frame,resize} from './game-loop.js';
import {initInput} from './input.js';
import {computeVis} from './systems/vision.js';
import {initArmy} from './ui/army-builder.js';
import {buildDeck,initDeck} from './ui/deck.js';
import {initDeploy} from './ui/deploy.js';
import {initHud} from './ui/hud.js';
import {initMenus} from './ui/menus.js';

// Olay dinleyicileri, tek dosyalı sürümdeki kayıt sırasıyla
initDeck();
initHud();
initInput();
addEventListener('resize',resize);
initMenus();
initArmy();
initDeploy();
resize();
buildDeck();
newGame();
computeVis();
requestAnimationFrame(frame);
