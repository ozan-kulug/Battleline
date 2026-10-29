/* canvas.js — Tuval (canvas) öğeleri ve çizim bağlamları: ana sahne, savaş sisi, mini harita, arazi tamponu. */
import {H,W} from './config.js';
import {$} from './utils/helpers.js';

const cvs=$('c');
const ctx=cvs.getContext('2d');
const fogC=document.createElement('canvas');
const fctx=fogC.getContext('2d');
const mm=$('mm');
const mctx=mm.getContext('2d');
const tc=document.createElement('canvas');
tc.width=W;
tc.height=H;
const tctx=tc.getContext('2d');
const mmBase=document.createElement('canvas');
mmBase.width=220;
mmBase.height=138;
const mbctx=mmBase.getContext('2d');

export {ctx,cvs,fctx,fogC,mbctx,mctx,mm,mmBase,tc,tctx};
