/* systems/pathfinding.js — Izgara üzerinde A* yol bulma. */
import {CS,GH,GW,T} from '../config.js';
import {clamp} from '../utils/helpers.js';
import {buildingAt,cellAt,grid} from '../world/terrain.js';

/* ızgara üzerinde A* yol bulma: bina (piyade için) ve su engel; köprü ve sığ geçit serbest */
const navOpen=new Float32Array(GW*GH);
const navFrom=new Int32Array(GW*GH);
const navStamp=new Int32Array(GW*GH);
let navGen=1;
function navFree(cx,cy,veh){if(cx<0||cy<0||cx>=GW||cy>=GH)return false;const i=cy*GW+cx;if(grid[i]===T.WATER)return false;if(!veh){const b=buildingAt(cx*CS+8,cy*CS+8);if(b)return false}return true}
function lineFree(ax,ay,bx,by,veh){const L=Math.hypot(bx-ax,by-ay),n=Math.ceil(L/8);for(let k=1;k<n;k++){const x=ax+(bx-ax)*k/n,y=ay+(by-ay)*k/n;if(cellAt(x,y)===T.WATER)return false;if(!veh&&buildingAt(x,y))return false}return true}
function findPath(u,tx,ty){const veh=!u.d.inf,sx=u.x/CS|0,sy=u.y/CS|0;let gx=tx/CS|0,gy=ty/CS|0;gx=clamp(gx,0,GW-1);gy=clamp(gy,0,GH-1);
  if(!navFree(gx,gy,veh)){let found=false;for(let r=1;r<6&&!found;r++)for(let dy=-r;dy<=r&&!found;dy++)for(let dx=-r;dx<=r;dx++)if(navFree(gx+dx,gy+dy,veh)){gx+=dx;gy+=dy;found=true;break}if(!found)return null}
  navGen++;const heap=[],push=(i,f)=>{heap.push([f,i]);let k=heap.length-1;while(k>0){const p=(k-1)>>1;if(heap[p][0]<=heap[k][0])break;[heap[p],heap[k]]=[heap[k],heap[p]];k=p}},
    pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let k=0;for(;;){const l=2*k+1,r=l+1;let m=k;if(l<heap.length&&heap[l][0]<heap[m][0])m=l;if(r<heap.length&&heap[r][0]<heap[m][0])m=r;if(m===k)break;[heap[m],heap[k]]=[heap[k],heap[m]];k=m}}return top};
  const si=sy*GW+sx,gi=gy*GW+gx,H8=(x,y)=>{const dx=Math.abs(x-gx),dy=Math.abs(y-gy);return(dx+dy)+(1.414-2)*Math.min(dx,dy)};
  navStamp[si]=navGen;navOpen[si]=0;navFrom[si]=-1;push(si,H8(sx,sy));let it=0;
  while(heap.length&&it++<14000){const [,i]=pop();if(i===gi)break;const cx=i%GW,cy=i/GW|0,g0=navOpen[i];
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=cx+dx,ny=cy+dy;if(!navFree(nx,ny,veh))continue;if(dx&&dy&&(!navFree(cx+dx,cy,veh)||!navFree(cx,cy+dy,veh)))continue;
      const ni=ny*GW+nx,t=grid[ni],cost=(dx&&dy?1.414:1)*(t===T.ROAD?.8:t===T.FOREST&&veh?1.8:t===T.SWAMP?1.6:t===T.FORD?1.5:1),g=g0+cost;
      if(navStamp[ni]===navGen&&navOpen[ni]<=g)continue;navStamp[ni]=navGen;navOpen[ni]=g;navFrom[ni]=i;push(ni,g+H8(nx,ny))}}
  if(navStamp[gi]!==navGen)return null;
  const pts=[];for(let i=gi;i!==-1&&i!==si;i=navFrom[i])pts.push({x:(i%GW)*CS+8,y:(i/GW|0)*CS+8});pts.reverse();
  const out=[];let ax=u.x,ay=u.y,k=0;while(k<pts.length){let j=pts.length-1;while(j>k&&!lineFree(ax,ay,pts[j].x,pts[j].y,veh))j--;out.push(pts[j]);ax=pts[j].x;ay=pts[j].y;k=j+1}
  return out}

export {findPath};
