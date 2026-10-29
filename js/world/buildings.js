/* world/buildings.js — Binaya giriş/çıkış ve bina içindeki asker yerleşimi. */

function layoutB(b){const P=2*((b.w-10)+(b.h-10));b.occ.forEach((u,i)=>{let t=(i+.5)/b.cap*P;const ew=b.w-10,eh=b.h-10;let x,y;
  if(t<ew){x=b.x+5+t;y=b.y+5}else if((t-=ew)<eh){x=b.x+b.w-5;y=b.y+5+t}else if((t-=eh)<ew){x=b.x+b.w-5-t;y=b.y+b.h-5}else{t-=ew;x=b.x+5;y=b.y+b.h-5-t}u.x=x;u.y=y})}
function enterBld(u,b){if(b.dead||b.occ.length>=b.cap||(b.occ[0]&&b.occ[0].side!==u.side)){u.enterB=null;u.dest=null;return}
  b.occ.push(u);u.inB=b;u.enterB=null;u.dest=null;u.dig=-1;u.cov=null;layoutB(b)}
function exitBld(u,tx,ty){const b=u.inB;if(!b)return;b.occ=b.occ.filter(x=>x!==u);layoutB(b);u.inB=null;
  const cx=b.x+b.w/2,cy=b.y+b.h/2;let dx=tx-cx,dy=ty-cy;if(Math.abs(dx)<.01&&Math.abs(dy)<.01)dx=1;
  const s=Math.min((b.w/2+10)/Math.max(Math.abs(dx),1e-6),(b.h/2+10)/Math.max(Math.abs(dy),1e-6));u.x=cx+dx*s;u.y=cy+dy*s}

export {enterBld,exitBld,layoutB};
