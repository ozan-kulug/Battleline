/* camera.js — Kamera dönüşümü, sınırlama ve yakınlaştırma. */
import {state} from './state.js';
import {H,W} from './config.js';
import {cam} from './state.js';
import {clamp} from './utils/helpers.js';

const toW=(sx,sy)=>({x:cam.x+sx/cam.z,y:cam.y+sy/cam.z});
function clampCam(){const mw=state.VW/cam.z,mh=state.VH/cam.z;cam.x=clamp(cam.x,-120,Math.max(-120,W-mw+120));cam.y=clamp(cam.y,-140,Math.max(-140,H-mh+220))}
function zoomAt(sx,sy,f){const w=toW(sx,sy);cam.z=clamp(cam.z*f,.22,1.8);cam.x=w.x-sx/cam.z;cam.y=w.y-sy/cam.z;clampCam()}

export {clampCam,toW,zoomAt};
