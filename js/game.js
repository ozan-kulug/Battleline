/* game.js — Yeni oyun kurulumu. */
import {state} from './state.js';
import {clampCam} from './camera.js';
import {H,PI,SQUADS,W} from './config.js';
import {cam} from './state.js';
import {aiReset} from './systems/ai.js';
import {fireCells} from './systems/effects.js';
import {spawnSquad} from './systems/units.js';
import {ghosts} from './systems/vision.js';
import {buildObjUI} from './ui/hud.js';
import {OBJ0,genTerrain} from './world/terrain.js';

function newGame(){
  genTerrain();state.units=[];state.squads=new Map();state.proj=[];state.parts=[];state.marks=[];state.fires=[];state.timers=[];fireCells.clear();ghosts.clear();state.shake=0;state.smokes=[];state.cbs=[];state.uid=1;state.sqid=1;state.time=0;state.money=[400,400];state.tickets=[500,500];state.avail=[SQUADS.map(S=>S.av),SQUADS.map(S=>S.av)];state.pending=[[],[]];state.retQ=[];
  state.vis=[new Set(),new Set()];state.aiNext=null;state.over=false;state.dc=null;state.groups={};state.attackArm=state.missionArm=state.runArm=state.precArm=false;state.airbase=[[],[]];state.abid=1;state.stats={kills:[0,0],lost:[0,0]};
  state.objs=OBJ0.map(o=>({...o,own:0,owner:-1,c:[0,0]}));aiReset();
  for(const s of [0,1]){const bx=s?W-280:280;
    for(const [idx,y] of [[0,800],[0,1500],[2,1150],[0,2200],[5,1850]]){const yy=s?H-y:y;spawnSquad(s,idx,bx,yy)}}
  for(const u of state.units){u.a=u.ta=u.side?PI:0}
  cam.z=state.VW<700?.45:.62;cam.x=0;cam.y=H/2-state.VH/2/cam.z;clampCam();buildObjUI();
}

export {newGame};
