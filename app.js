'use strict';
const TIERS=['Bronze','Silver','Gold','Hall of Fame','Legend'];
const TC=['#CD7F32','#B8C2CC','#FFC83D','#B36BFF','#FF4D6D'];
const CAT={Finishing:'#FF6B35',Shooting:'#2EC4B6',Playmaking:'#3A86FF',Defense:'#E63946',Rebounding:'#8AC926',Physicals:'#FFBE0B'};
const ATTRS=[['closeShot','Close Shot','Finishing'],['drivingLayup','Driving Layup','Finishing'],['drivingDunk','Driving Dunk','Finishing'],['standingDunk','Standing Dunk','Finishing'],['postControl','Post Control','Finishing'],['midRange','Mid-Range Shot','Shooting'],['threePoint','Three-Point Shot','Shooting'],['freeThrow','Free Throw','Shooting'],['passAccuracy','Pass Accuracy','Playmaking'],['ballHandle','Ball Handle','Playmaking'],['speedWithBall','Speed With Ball','Playmaking'],['interiorDefense','Interior Defense','Defense'],['perimeterDefense','Perimeter Defense','Defense'],['steal','Steal','Defense'],['block','Block','Defense'],['offensiveRebound','Offensive Rebound','Rebounding'],['defensiveRebound','Defensive Rebound','Rebounding'],['speed','Speed','Physicals'],['agility','Agility','Physicals'],['strength','Strength','Physicals'],['vertical','Vertical','Physicals']];
const AL=Object.fromEntries(ATTRS.map(a=>[a[0],a[1]]));
const STYLES={slasher:'Slasher / Finisher',shooter:'Shooter',playmaker:'Playmaker / Shot Creator',lockdown:'Perimeter Lockdown',post:'Post Scorer',rim_protector:'Rim Protector',rebounder:'Rebounder / Glass'};
const MODES=['Park','Rec / Pro-Am','MyCareer (NBA)','Theater / 1v1'];
const MB_AN={Park:['Ankle Assassin','Strong Handle','Handles for Days','Deadeye','Limitless Range','Challenger','Ankle Braces','Glove','Posterizer','Lightning Launch'],'Rec / Pro-Am':['Dimer','Brick Wall','Set and Fire','Off-Ball Pest','Pick Dodger','Boxout Boss','Wall Up','Paint Patroller','Slippery Off-Ball','Versatile Visionary'],'MyCareer (NBA)':['Break Starter','Interceptor','Flash','Work Horse','Possession Closer','Dimer']};MB_AN['Theater / 1v1']=MB_AN.Park;
const MB_REC={'Rec / Pro-Am':['Brick Wall','Dimer','Pick Dodger','Boxout Boss','Set and Fire','Off-Ball Pest'],Park:['Ankle Assassin','Handles for Days','Challenger','Lightning Launch','Posterizer'],'Theater / 1v1':['Ankle Assassin','Handles for Days','Ankle Braces','Challenger','Lightning Launch'],'MyCareer (NBA)':['Interceptor','Break Starter','Flash','Possession Closer','Dimer']};
const SAMPLE={closeShot:75,drivingLayup:85,drivingDunk:70,standingDunk:40,postControl:50,midRange:80,threePoint:88,freeThrow:85,passAccuracy:86,ballHandle:90,speedWithBall:82,interiorDefense:45,perimeterDefense:72,steal:70,block:40,offensiveRebound:40,defensiveRebound:50,speed:84,agility:80,strength:60,vertical:72};
const DEF={position:'PG',height:77,weight:205,wingspan:80,attrs:SAMPLE,styles:['playmaker','shooter'],mode:'Park',sw:{}};
let P=Object.assign({},DEF,JSON.parse(localStorage.getItem('player')||'{}'));
let D,tab=+(new URLSearchParams(location.search).get('tab')||0),ui={q:'',cat:'All',locked:false,sel:null,filt:'All',sub:0};
const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fh=i=>`${Math.floor(i/12)}'${i%12}"`;const save=()=>localStorage.setItem('player',JSON.stringify(P));
const wide=()=>innerWidth>=720;

function tierFor(b,p=P){if(p.height<b.minHeight||p.height>b.maxHeight)return -1;let best=-1;
 for(let t=0;t<4;t++){const f=r=>r.t[t]!=null&&(p.attrs[r.attr]||0)>=r.t[t];const ok=b.logic==='OR'?b.reqs.some(f):b.reqs.every(f);if(ok)best=t;else break}return best}
function gaps(b,t){if(t>3)return[];let g=b.reqs.filter(r=>r.t[t]!=null&&(P.attrs[r.attr]||0)<r.t[t]).map(r=>({attr:r.attr,have:P.attrs[r.attr]||0,need:r.t[t]}));
 if(b.logic==='OR'&&g.length)g=[g.sort((a,c)=>(a.need-a.have)-(c.need-c.have))[0]];return g}
function analyze(){const recs=D.badges.map(b=>{const tier=tierFor(b),hOk=P.height>=b.minHeight&&P.height<=b.maxHeight,match=b.styles.filter(s=>P.styles.includes(s)),
 gp=hOk?gaps(b,tier+1):[],mb=(MB_AN[P.mode]||[]).includes(b.name)?1:0,score=(tier+1)*1.5+match.reduce((a,s)=>a+(P.sw[s]??1)*3,0)+mb*1.5;
 let why=!hOk?`Height ${fh(P.height)} outside ${fh(b.minHeight)}–${fh(b.maxHeight)}. `:tier<0?'Attributes below Bronze. ':`Qualifies for ${TIERS[tier]}. `;
 if(match.length)why+=`Fits your ${match.map(s=>STYLES[s]).join(', ')} style. `;if(mb)why+=`Strong pick for ${P.mode}. `;
 if(gp.length)why+='Next tier: '+gp.map(g=>`${AL[g.attr]} ${g.have}→${g.need}`).join(', ')+'.';
 return{b,tier,hOk,score,match,gp,why}}).sort((a,c)=>c.score-a.score);
 const avail=recs.filter(r=>r.tier>=0),locked=recs.filter(r=>r.tier<0&&r.hOk&&r.match.length);
 const tips={};for(const r of recs.filter(r=>r.hOk&&r.match.length&&r.gp.length))if(r.gp.every(g=>g.need-g.have<=12))for(const g of r.gp){const l=`${r.b.name} → ${TIERS[r.tier+1]}`;(tips[g.attr]=tips[g.attr]||{t:0,u:[]});tips[g.attr].t=Math.max(tips[g.attr].t,g.need);tips[g.attr].u.push(l)}
 const cap=Object.entries(tips).map(([a,v])=>({attr:a,have:P.attrs[a],target:v.t,unlocks:v.u})).sort((a,c)=>c.unlocks.length-a.unlocks.length).slice(0,6);
 const syn=[],top=avail.filter(r=>r.match.length);const h=top.filter(r=>r.tier===3).sort((a,c)=>c.score-a.score)[0];
 if(h)syn.push([`+1 Fuse → Legend: ${h.b.name}`,`Already Hall of Fame. A +1 Fuse makes it Legend for the whole game and refunds its ${h.b.tokens[3]} tokens.`]);
 const g=top.filter(r=>r.tier===2).sort((a,c)=>c.b.tokens[2]-a.b.tokens[2])[0];if(g)syn.push([`+2 Fuse → Legend: ${g.b.name}`,`Gold today; a +2 pair (Build Specialization Goal 10 / REP Legend II) pushes it to Legend and frees ${g.b.tokens[2]} tokens.`]);
 const bc={};top.forEach(r=>(bc[r.b.category]=bc[r.b.category]||[]).push(r));for(const[c,l]of Object.entries(bc))if(l.length>=2){const[a,b]=l.sort((x,y)=>y.score-x.score);syn.push([`${c} pair: ${a.b.name} + ${b.b.name}`,`Fuse the one you trigger most (${a.b.name}); set ${b.b.name} as its Reaction. Note: each Fuse only allows certain Reactions — confirm pairing in-game (not modeled).`])}
 const nm=new Set(avail.map(r=>r.b.name));[['Ankle Assassin','Lightning Launch','Break down your man then explode off the first step.'],['Dimer','Versatile Visionary',"Tight passes that also boost your teammate's catch-and-shoot %."],['Set and Fire','Deadeye','Catch-and-shoot 3s that hold up against closeouts.'],['Posterizer','Physical Finisher','Dunk-or-contact-layup threat on every drive.'],['Brick Wall','Post Powerhouse','Screen-and-seal bigs.'],['Paint Patroller','Wall Up','Full rim protection: blocks plus vertical contests.'],['Boxout Boss','Possession Closer','Secure every defensive board.'],['Challenger','Ankle Braces','Stay attached and contest perimeter jumpers.']].forEach(([x,y,w])=>{if(nm.has(x)&&nm.has(y))syn.push([`Combo: ${x} + ${y}`,w])});
 return{recs:avail,locked,cap,syn,tokens:avail.reduce((a,r)=>a+(r.b.tokens[r.tier]||0),0)}}
function recommend(){const by=Object.fromEntries(D.badges.map(b=>[b.name,b]));const per={};
 for(const st of P.styles){const l=D.loadouts[st]||[];per[st]=l.map((e,i)=>{const b=by[e.badge];if(!b)return null;const t=tierFor(b);if(t<0)return null;const bo=(MB_REC[P.mode]||[]).includes(e.badge);
  return{e,b,tier:t,st,score:(P.sw[st]??1)*(l.length-i)*2+(bo?3:0)+t+(e.avoid?-100:0),mode:bo?`Boosted for ${P.mode} (app estimate)`:null}}).filter(Boolean).sort((a,c)=>c.score-a.score)}
 const g={};Object.values(per).flat().filter(r=>!r.e.avoid).forEach(r=>(g[r.b.name]=g[r.b.name]||[]).push(r));
 const comb=Object.values(g).map(v=>{const m=v.reduce((a,c)=>c.score>a.score?c:a);return{...m,score:v.reduce((a,c)=>a+c.score,0)}}).sort((a,c)=>c.score-a.score).slice(0,20);return{per,comb}}

/* graphics */
function icon(cat,s=36){const c=CAT[cat]||'#888';const g={Shooting:`<circle cx="18" cy="18" r="7" fill="none" stroke="${c}" stroke-width="2.6"/><circle cx="18" cy="18" r="2.6" fill="${c}"/>`,
 Finishing:`<path d="M11 25L25 11M18 11H25V18" fill="none" stroke="${c}" stroke-width="2.6"/>`,Playmaking:`<circle cx="18" cy="18" r="7.5" fill="none" stroke="${c}" stroke-width="2.6"/><path d="M10.5 18h15M18 10.5v15" stroke="${c}" stroke-width="1.8"/>`,
 Defense:`<path d="M18 9l7.5 3.5-1.8 9L18 27l-5.7-5.5-1.8-9z" fill="none" stroke="${c}" stroke-width="2.6"/>`,Rebounding:`<path d="M18 27V10M12.5 15.5L18 10l5.5 5.5" fill="none" stroke="${c}" stroke-width="2.6"/>`,
 Physicals:`<path d="M20 9l-6.5 10H19l-2.5 9 7.5-11.5H18z" fill="${c}"/>`}[cat]||'';
 return`<svg width="${s}" height="${s}" viewBox="0 0 36 36" style="flex:none"><circle cx="18" cy="18" r="17" fill="${c}38" stroke="${c}" stroke-width="2"/>${g}</svg>`}
const pill=(t,c)=>`<span class="pill" style="color:${c};border-color:${c};background:${c}40">${esc(t)}</span>`;
const tierChip=t=>t<0?pill('Locked','#6a7490'):pill(TIERS[t],TC[t]);
const pips=t=>`<div class="pips">${[0,1,2,3,4].map(i=>`<i style="${i<=t?'background:'+TC[i]:''}"></i>`).join('')}</div>`;
const vtag=(v,txt)=>pill(txt||(v?'✓ 2K27 verified':'Estimated'),v?'#52D17C':'#FFB020');
function bar(v,c,marks=[]){const x=n=>Math.max(0,(n-25)/74*100);return`<div class="bar"><div style="width:${x(v)}%;background:${c}"></div>${marks.map((m,i)=>m==null?'':`<s style="left:${x(m)}%;background:${TC[i]}"></s>`).join('')}</div>`}
function radar(){const ks=Object.keys(CAT),n=ks.length,r=62,c=75;const pt=(i,f)=>{const a=(-90+360*i/n)*Math.PI/180;return[c+r*f*Math.cos(a),c+r*f*Math.sin(a)]};
 const v=ks.map(k=>{const a=ATTRS.filter(x=>x[2]===k).map(x=>P.attrs[x[0]]||25);return Math.min(1,Math.max(.05,(a.reduce((s,y)=>s+y,0)/a.length-25)/74))});
 let s=`<svg width="150" height="150" style="flex:none">`;for(let q=1;q<=4;q++)s+=`<polygon points="${ks.map((_,i)=>pt(i,q/4).join(',')).join(' ')}" fill="none" stroke="#2A3350" stroke-width="1"/>`;
 s+=`<polygon points="${v.map((f,i)=>pt(i,f).join(',')).join(' ')}" fill="#F28C2859" stroke="#F28C28" stroke-width="2"/>`;v.forEach((f,i)=>{const[x,y]=pt(i,f);s+=`<circle cx="${x}" cy="${y}" r="4.5" fill="${CAT[ks[i]]}"/>`});return s+'</svg>'}
const src=s=>`<a class="src ${s.kind}" href="${s.url}" target="_blank" rel="noopener">${s.kind==='lab'?'🧪':'👥'} ${esc(s.name)}</a>`;
const slider=(id,label,val,disp,min,max,step=1,c)=>`<div class="sl" style="${c?'--c:'+c:''}"><div class="row"><span>${label}</span><b id="v-${id}">${disp}</b></div><input type="range" data-k="${id}" min="${min}" max="${max}" step="${step}" value="${val}"></div>`;
const chips=(items,isOn,act,scroll)=>`<div class="chips${scroll?' scroll':''}">${items.map(([k,l])=>`<button class="chip${isOn(k)?' on':''}" data-a="${act}" data-v="${esc(k)}">${esc(l)}</button>`).join('')}</div>`;
const catChips=(cur,act)=>chips([['All','All'],...Object.keys(CAT).map(c=>[c,c])],k=>k===cur,act,true);

/* screens */
function formHTML(){let h=`<h1>Player Builder</h1><div class="sub">Enter your MyPLAYER and how you play.</div><h2>Position</h2>${chips(['PG','SG','SF','PF','C'].map(x=>[x,x]),k=>k===P.position,'pos')}
 <h2>Body</h2>${slider('height','Height',P.height,fh(P.height),69,88)}${slider('weight','Weight',P.weight,P.weight+' lbs',150,290)}${slider('wingspan','Wingspan',P.wingspan,fh(P.wingspan),69,95)}
 <div class="mut">Height gates badges (2K27 data). Weight & wingspan are recorded for your build but don't change badge eligibility in this app.</div>
 <h2>How you play</h2>${chips(Object.entries(STYLES),k=>P.styles.includes(k),'style')}
 ${P.styles.map(s=>slider('sw:'+s,'Priority: '+STYLES[s],P.sw[s]??1,Math.round((P.sw[s]??1)*100)+'%',.25,1.5,.05)).join('')}
 <h2>Mode</h2>${chips(MODES.map(m=>[m,m]),k=>k===P.mode,'mode')}<h2>Attributes</h2>`;
 for(const c of Object.keys(CAT)){h+=`<div class="row" style="margin-top:10px">${icon(c,26)}<b style="color:${CAT[c]}">${c}</b></div>`;
  ATTRS.filter(a=>a[2]===c).forEach(a=>h+=slider('a:'+a[0],a[1],P.attrs[a[0]],P.attrs[a[0]],25,99,1,CAT[c]))}return h}
function recRow(r){return`<div class="card"><div class="row">${icon(r.b.category)}<div class="grow"><div class="bname">${esc(r.b.name)}</div><div style="font-size:12px;color:${CAT[r.b.category]}">${r.b.category}${r.match.length?' • ★ style fit':''}</div></div><div style="text-align:right">${tierChip(r.tier)}${pips(r.tier)}</div></div>
 <div class="sub" style="font-size:12px;margin-top:6px">${esc(r.why)}</div><details><summary class="mut">Details</summary><div style="font-size:13px;margin-top:4px">${esc(r.b.description)}</div><div class="mut">Token cost (B/S/G/HoF): ${r.b.tokens.join(' / ')}</div></details></div>`}
function resultsHTML(){const a=analyze();let h=`<h1>Badge Breakdown</h1><div class="card row">${radar()}<div><b>${P.position} • ${fh(P.height)} • ${P.weight} lbs</b><div class="sub">${a.recs.length} of ${D.badges.length} badges unlocked</div><div class="mut">~${a.tokens} tokens to max all unlocked tiers</div>
 <div class="row" style="gap:4px;margin-top:6px">${[0,1,2,3].map(t=>pill(a.recs.filter(r=>r.tier===t).length,TC[t])).join('')}</div><div class="mut" style="font-size:10px">Bronze / Silver / Gold / HoF</div></div></div>
 <div class="mut">${esc(D.slots.text)}</div>${catChips(ui.filt,'filt')}<h2>Recommended (best fit first)</h2>`;
 h+=a.recs.filter(r=>ui.filt==='All'||r.b.category===ui.filt).map(recRow).join('');
 if(a.cap.length)h+=`<h2>Cap Breaker targets</h2><div class="mut">Attributes within reach (≤12 pts) that unlock a higher tier on badges that fit your style. Cap Breakers: up to 5/attribute, 28 total, after 99 OVR (community-reported).</div>`+a.cap.map(c=>`<div class="card"><div class="row"><b class="grow">${AL[c.attr]}</b><b style="color:var(--pr)">${c.have} → ${c.target}</b></div>${bar(c.have,'#3A86FF',[null,null,null,c.target])}<div class="sub" style="font-size:12px;margin-top:4px">Unlocks: ${esc(c.unlocks.join(', '))}</div></div>`).join('');
 if(a.locked.length)h+='<h2>Fits your style but locked</h2>'+a.locked.slice(0,8).map(recRow).join('');
 return h+'<h2>Synergy ideas</h2>'+a.syn.map(([t,b])=>`<div class="card"><b>${esc(t)}</b><div class="sub">${esc(b)}</div></div>`).join('')}
function panes(a,b,cls=['',''],labels){const sub=ui.sub;return`${labels?`<div class="tabs">${labels.map((l,i)=>`<button class="${sub===i?'on':''}" data-a="sub" data-v="${i}">${l}</button>`).join('')}</div>`:''}<div class="panes ${labels?'tabbed':''}"><div class="pane ${cls[0]} ${sub===0?'show':''}" id="pa">${a}</div><div class="pane ${cls[1]} ${sub===1?'show':''}" id="pb">${b}</div></div>`}

function badgesHTML(){const list=D.badges.filter(b=>(ui.locked||tierFor(b)>=0)&&(ui.cat==='All'||b.category===ui.cat)&&(!ui.q||[b.name,b.category,b.description,b.reqs.map(r=>AL[r.attr]).join(' ')].some(s=>s.toLowerCase().includes(ui.q.toLowerCase())))).sort((a,c)=>tierFor(c)-tierFor(a));
 const unl=D.badges.filter(b=>tierFor(b)>=0).length;let sel=D.badges.find(b=>b.name===ui.sel)||(wide()?list[0]:null);
 const L=`<input class="search" id="q" placeholder="Search badges, categories, attributes…" value="${esc(ui.q)}">${catChips(ui.cat,'cat')}
 <div class="row"><span class="mut grow">${list.length} badges • ${fh(P.height)} build: ${unl} unlocked</span><label class="switch"><input type="checkbox" id="lk" ${ui.locked?'checked':''}> Show locked</label></div><div id="blist">`+
 list.map(b=>`<div class="card row ${sel&&sel.name===b.name?'sel':''}" data-a="sel" data-v="${esc(b.name)}" style="cursor:pointer">${icon(b.category)}<div class="grow"><div class="bname">${esc(b.name)}</div><div class="mut ell">${esc(b.description)}</div></div>${tierChip(tierFor(b))}</div>`).join('')+(list.length?'':'<div class="mut">No unlocked badges match. Toggle "Show locked".</div>')+'</div>';
 const R=sel?detailHTML(sel):'<div class="mut" style="padding:24px">Select a badge</div>';
 if(!wide())return`<div class="pane">${ui.sel&&sel?`<a class="link" data-a="back">← Back to list</a>`+R:L}</div>`;return panes(L,R,['p45','p55'])}
function detailHTML(b){const t=tierFor(b);return`<div class="row">${icon(b.category,64)}<div><h1>${esc(b.name)}</h1><b style="color:${CAT[b.category]}">${b.category}</b></div></div><div class="row" style="margin:8px 0">${vtag(b.verified)}${tierChip(t)}</div>
 <div class="card">${esc(b.description)}</div><h2>Unlock requirements (${b.logic==='OR'?'any one attribute':b.logic==='AND'?'all attributes':'single attribute'})</h2>
 <div class="card"><table><tr><th>Attribute</th>${[0,1,2,3].map(i=>`<th style="color:${TC[i]}">${TIERS[i].replace('Hall of Fame','HoF')}</th>`).join('')}</tr>${b.reqs.map(r=>`<tr><td>${AL[r.attr]}</td>${r.t.map(v=>`<td>${v??'—'}</td>`).join('')}</tr>`).join('')}</table><div class="mut">Height: ${fh(b.minHeight)} – ${fh(b.maxHeight)} • Legend: Synergy only</div></div>
 <h2>Your player vs. thresholds</h2><div class="card">${b.reqs.map(r=>`<div class="row" style="justify-content:space-between;font-size:12px"><span>${AL[r.attr]}</span><b>${P.attrs[r.attr]}</b></div>${bar(P.attrs[r.attr],CAT[b.category],r.t)}`).join('<div style="height:6px"></div>')}<div class="mut">Coloured ticks = Bronze/Silver/Gold/HoF thresholds.</div></div>
 <h2>Token cost</h2><div class="card row" style="justify-content:space-around">${[0,1,2,3].map(i=>`<div style="text-align:center"><div style="font-size:22px;font-weight:900;color:${TC[i]}">${b.tokens[i]}</div><div class="mut">${TIERS[i]}</div></div>`).join('')}</div>
 <h2>Sources</h2>${b.sources.map(s=>`<div><a href="${s.url}" target="_blank" rel="noopener">↗ ${esc(s.name)}</a></div>`).join('')}`}
function loadCard(r,rank){const sw=r.e.sweet;return`<div class="card"><div class="row">${rank?`<span class="rank">${rank}</span>`:''}${icon(r.b.category,32)}<div class="grow"><div class="bname">${esc(r.b.name)}</div><div style="font-size:11px;color:${CAT[r.b.category]}">${r.b.category} • ${STYLES[r.st]}</div></div><div style="text-align:right">${tierChip(r.tier)}<div class="mut" style="font-size:10px">${r.b.tokens[r.tier]} tokens</div></div></div>
 <div class="sub" style="font-size:12px;margin-top:4px">${esc(r.e.note)}</div>${sw!=null&&r.tier>sw?`<div class="tip">💡 Community says ${TIERS[sw]} is enough — equip at ${TIERS[sw]} to save ${r.b.tokens[r.tier]-r.b.tokens[sw]} tokens.</div>`:''}${r.mode?`<div class="est">⚙ ${r.mode}</div>`:''}<div>${r.e.src.map(k=>D.recSources[k]).filter(Boolean).map(src).join('')}</div></div>`}
function recsHTML(){const{per,comb}=recommend();let L=`<h1>Recommendations</h1><div class="sub">Best loadout from badges your build unlocks right now (${fh(P.height)} ${P.position}).</div>${chips(Object.entries(STYLES),k=>P.styles.includes(k),'style',true)}${chips(MODES.map(m=>[m,m]),k=>k===P.mode,'mode',true)}
 <div style="margin:6px 0">${src({name:'NBA2KLab',url:'https://www.nba2klab.com',kind:'lab'})}${src({name:'Community / creators',url:'https://www.reddit.com/r/NBA2k/',kind:'community'})} ${pill('⚙ App estimate','#FFB020')}</div>${P.styles.length?'':'<div>Pick at least one playstyle.</div>'}`;
 for(const[st,l]of Object.entries(per)){L+=`<h2>${STYLES[st]} priorities</h2>`+(l.length?'':`<div class="mut">No recommended ${STYLES[st]} badges unlocked yet — see Build tab cap-breaker targets.</div>`)+l.filter(r=>!r.e.avoid).map((r,i)=>loadCard(r,i+1)).join('')+l.filter(r=>r.e.avoid).map(r=>`<div class="bad">⛔ Low priority: ${esc(r.b.name)} — ${esc(r.e.note)}</div>`).join('')}
 const h=comb.find(r=>r.tier===3),g=comb.find(r=>r.tier===2);
 let R=`<h1>Suggested 20-slot loadout</h1><div class="mut">${comb.length} badges • ~${comb.reduce((a,r)=>a+r.b.tokens[r.tier],0)} tokens at current tiers • Mode: ${P.mode}</div><div class="est">⚙ Ordering & 20-slot fill are an app estimate combining the source priorities with your style weights and mode. Per-discipline slot limits not modeled.</div>
 <div class="row" style="gap:4px;margin:6px 0;flex-wrap:wrap">${Object.keys(CAT).map(c=>{const n=comb.filter(r=>r.b.category===c).length;return n?pill(c+' '+n,CAT[c]):''}).join('')}</div>`;
 if(h||g)R+=`<div class="card"><b>Synergy (Max +) targets</b>${h?`<div>+1 Fuse: ${esc(h.b.name)} HoF → Legend</div>`:''}${g?`<div>+1/+2: ${esc(g.b.name)} Gold → HoF/Legend (NBA2KLab picks its Max + targets the same way: top-priority badges one tier short)</div>`:''}</div>`;
 R+=comb.map((r,i)=>loadCard(r,i+1)).join('')+'<h2>About this data</h2>'+D.recNotes.map(n=>`<div class="sub" style="font-size:12px">• ${esc(n)}</div>`).join('');
 return panes(L,R,['',''],['By playstyle','Loadout'])}
function infoCard(t,i){const lab=i.status==='verified-partial'?'Partly verified':i.status.startsWith('community')?'Community-reported':null;return`<div class="card"><div class="row"><b class="grow" style="font-size:18px">${t}</b>${vtag(i.status.startsWith('verified'),lab)}</div>${i.text.map(x=>`<div style="margin-top:6px">• ${esc(x)}</div>`).join('')}<div style="margin-top:6px">${i.sources.map(s=>`<div><a href="${s.url}" target="_blank" rel="noopener">↗ ${esc(s.name)}</a></div>`).join('')}</div></div>`}
function synergyHTML(){const a=analyze();const L=`<h1>Synergy & Cap Breakers</h1><div class="card"><b>Synergy slot map</b><div class="syn" style="margin-top:8px">${[1,2,3,4,5,6,7,8].map(i=>{const c=i>=7?TC[4]:TC[3];return`<div><span style="background:${c};color:#000">F</span><span style="border:2px solid ${c};color:${c}">R</span>${i>=7?'+2':'+1'}</div>`}).join('')}</div><div class="mut">F = Fuse (top), R = Reaction (bottom). Cols 1–4 Season (temporary), 5–6 Crew, 7 Build Specialization, 8 REP Legend II.</div></div>${infoCard('Synergy (Fuse / Reaction)',D.synergy)}${infoCard('Cap Breakers',D.capBreakers)}`;
 const R=`<h1>For your build</h1><div class="mut">Based on the Build tab. App heuristic suggestions.</div>${a.syn.length?'':'<div>Select play styles and raise attributes to get synergy ideas.</div>'}${a.syn.map(([t,b])=>`<div class="card"><b>${esc(t)}</b><div class="sub">${esc(b)}</div></div>`).join('')}<h2>Cap Breaker targets</h2>${a.cap.length?'':'<div class="mut">No near-miss tier upgrades for your styles.</div>'}${a.cap.map(c=>`<div class="card"><b>${AL[c.attr]}: ${c.have} → ${c.target}</b><div class="sub" style="font-size:12px">${esc(c.unlocks.join(', '))}</div></div>`).join('')}`;
 return panes(L,R)}
function sourcesHTML(){const all=[...new Map(D.badges.flatMap(b=>b.sources).map(s=>[s.url,s])).values()];
 return`<div class="pane"><h1>Data & Sources</h1><div class="mut">Data version ${D.version} • bundled offline (badges.json)</div><div class="card">${D.notes.map(n=>`<div>• ${esc(n)}</div>`).join('')}</div>
 <div class="card"><b>Legend</b><div class="row" style="margin:6px 0;flex-wrap:wrap">${vtag(true)}${vtag(false,'Community-reported')}${vtag(false,'App heuristic')}</div><div class="sub">Badge requirements: verified 2K27 (NBA2KLab, cross-checked by my2kbuilder). Synergy split & Cap Breaker limits: community-reported. Playstyle fit, mode bonus, combos & synergy picks: this app's heuristic.</div></div>
 ${infoCard('Synergy',D.synergy)}${infoCard('Cap Breakers',D.capBreakers)}<div class="card"><b>Badge data sources</b>${all.map(s=>`<div style="margin-top:4px"><a href="${s.url}" target="_blank" rel="noopener">↗ ${esc(s.name)}</a><div class="mut">${s.url}</div></div>`).join('')}</div>
 <div class="card"><b>Recommendation sources</b>${Object.values(D.recSources).map(src).join('')}</div><div class="mut">Unofficial fan tool. Not affiliated with 2K or NBA2KLab.</div></div>`}

const TABS=[['Build','👤',0],['Badges','🔍',1],['Recs','👍',4],['Synergy','⭐',2],['Sources','ℹ️',3]];
function render(){$('#nav').innerHTML='<div class="logo">2K27</div>'+TABS.map(([l,i,k])=>`<button class="${tab===k?'on':''}" data-a="tab" data-v="${k}"><span class="ic">${i}</span>${l}</button>`).join('');
 const m=$('#main');m.innerHTML=tab===0?panes(formHTML(),resultsHTML(),['p45','p55'],['Inputs','Breakdown']):tab===1?badgesHTML():tab===4?recsHTML():tab===2?synergyHTML():sourcesHTML()}
document.addEventListener('click',e=>{const el=e.target.closest('[data-a]');if(!el)return;const a=el.dataset.a,v=el.dataset.v;
 if(a==='tab'){tab=+v;ui.sub=0;scrollTo(0,0)}else if(a==='pos')P.position=v;else if(a==='style'){P.styles=P.styles.includes(v)?P.styles.filter(s=>s!==v):[...P.styles,v]}
 else if(a==='mode')P.mode=v;else if(a==='filt')ui.filt=v;else if(a==='cat')ui.cat=v;else if(a==='sel'){ui.sel=v;scrollTo(0,0)}else if(a==='back')ui.sel=null;else if(a==='sub'){ui.sub=+v;scrollTo(0,0)}else return;
 save();const keep=[...document.querySelectorAll('.pane')].map(p=>p.scrollTop);render();document.querySelectorAll('.pane').forEach((p,i)=>p.scrollTop=keep[i]||0)});
document.addEventListener('input',e=>{const t=e.target;if(t.id==='q'){ui.q=t.value;const pos=t.selectionStart;render();const q=$('#q');q.focus();q.setSelectionRange(pos,pos);return}
 const k=t.dataset.k;if(!k)return;const v=+t.value;
 if(k.startsWith('a:'))P.attrs={...P.attrs,[k.slice(2)]:v};else if(k.startsWith('sw:'))P.sw={...P.sw,[k.slice(3)]:v};else P[k]=v;
 const lab=document.getElementById('v-'+k);if(lab)lab.textContent=k==='height'||k==='wingspan'?fh(v):k==='weight'?v+' lbs':k.startsWith('sw:')?Math.round(v*100)+'%':v;
 save();const pb=$('#pb');if(pb){const s=pb.scrollTop;pb.innerHTML=resultsHTML();pb.scrollTop=s}});
document.addEventListener('change',e=>{if(e.target.id==='lk'){ui.locked=e.target.checked;render()}});
let lw=wide();addEventListener('resize',()=>{if(wide()!==lw){lw=wide();render()}});
fetch('badges.json').then(r=>r.json()).then(d=>{D=d;render()});
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js'));
