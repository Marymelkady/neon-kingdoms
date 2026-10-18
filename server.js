const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.join(__dirname, 'public');
const PORT = Number(process.env.PORT || 3000);
const rooms = new Map();
const streams = new Map();
const MIME = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.svg':'image/svg+xml' };

const COUNTRIES = [
  {name:'Venezuela',region:'South America',capital:'Caracas',currency:'bolívar',language:'Spanish',neighbors:['Colombia','Brazil','Guyana'],population:'about 28 million',fact:'Angel Falls, the world’s tallest uninterrupted waterfall, is here.'},
  {name:'Estonia',region:'Northern Europe',capital:'Tallinn',currency:'euro',language:'Estonian',neighbors:['Latvia','Russia'],population:'about 1.4 million',fact:'More than half of its land is covered by forest.'},
  {name:'Ghana',region:'West Africa',capital:'Accra',currency:'cedi',language:'English',neighbors:['Côte d’Ivoire','Burkina Faso','Togo'],population:'about 34 million',fact:'Lake Volta is one of the world’s largest artificial lakes.'},
  {name:'Japan',region:'East Asia',capital:'Tokyo',currency:'yen',language:'Japanese',neighbors:['No land borders'],population:'about 124 million',fact:'It is an archipelago of thousands of islands.'},
  {name:'Peru',region:'South America',capital:'Lima',currency:'sol',language:'Spanish',neighbors:['Ecuador','Colombia','Brazil','Bolivia','Chile'],population:'about 34 million',fact:'Machu Picchu sits high in the Andes.'},
  {name:'Morocco',region:'North Africa',capital:'Rabat',currency:'dirham',language:'Arabic and Amazigh',neighbors:['Algeria','Spain (by maritime border)'],population:'about 37 million',fact:'Its coast touches both the Atlantic Ocean and Mediterranean Sea.'},
  {name:'New Zealand',region:'Oceania',capital:'Wellington',currency:'dollar',language:'English and Māori',neighbors:['No land borders'],population:'about 5.2 million',fact:'The Māori name Aotearoa is commonly translated as “land of the long white cloud.”'},
  {name:'Nepal',region:'South Asia',capital:'Kathmandu',currency:'rupee',language:'Nepali',neighbors:['China','India'],population:'about 30 million',fact:'Mount Everest lies on its border with China.'},
  {name:'Iceland',region:'Northern Europe',capital:'Reykjavík',currency:'króna',language:'Icelandic',neighbors:['No land borders'],population:'about 390,000',fact:'The country is powered largely by geothermal and hydropower energy.'},
  {name:'Senegal',region:'West Africa',capital:'Dakar',currency:'CFA franc',language:'French',neighbors:['Mauritania','Mali','Guinea','Guinea-Bissau','The Gambia'],population:'about 18 million',fact:'The westernmost point of mainland Africa is here.'},
  {name:'Thailand',region:'Southeast Asia',capital:'Bangkok',currency:'baht',language:'Thai',neighbors:['Myanmar','Laos','Cambodia','Malaysia'],population:'about 72 million',fact:'It is the only Southeast Asian country never colonized by a European power.'},
  {name:'Chile',region:'South America',capital:'Santiago',currency:'peso',language:'Spanish',neighbors:['Peru','Bolivia','Argentina'],population:'about 20 million',fact:'It stretches across more than 38 degrees of latitude.'},
  {name:'Finland',region:'Northern Europe',capital:'Helsinki',currency:'euro',language:'Finnish and Swedish',neighbors:['Sweden','Norway','Russia'],population:'about 5.6 million',fact:'It has roughly 188,000 lakes.'},
  {name:'Canada',region:'North America',capital:'Ottawa',currency:'dollar',language:'English and French',neighbors:['United States'],population:'about 41 million',fact:'It has the world’s longest coastline.'},
  {name:'Kenya',region:'East Africa',capital:'Nairobi',currency:'shilling',language:'Swahili and English',neighbors:['Ethiopia','Somalia','South Sudan','Tanzania','Uganda'],population:'about 56 million',fact:'The Great Rift Valley runs through the country.'},
  {name:'Portugal',region:'Southern Europe',capital:'Lisbon',currency:'euro',language:'Portuguese',neighbors:['Spain'],population:'about 10 million',fact:'Its borders have remained largely unchanged since the 13th century.'},
  {name:'South Korea',region:'East Asia',capital:'Seoul',currency:'won',language:'Korean',neighbors:['North Korea'],population:'about 52 million',fact:'Its capital has been known as Seoul since 1945.'},
  {name:'Bhutan',region:'South Asia',capital:'Thimphu',currency:'ngultrum',language:'Dzongkha',neighbors:['China','India'],population:'about 790,000',fact:'Its national assembly first met in 1953.'},
  {name:'Laos',region:'Southeast Asia',capital:'Vientiane',currency:'kip',language:'Lao',neighbors:['China','Myanmar','Thailand','Cambodia','Vietnam'],population:'about 7.7 million',fact:'It is the only landlocked country in Southeast Asia.'},
  {name:'Suriname',region:'South America',capital:'Paramaribo',currency:'dollar',language:'Dutch',neighbors:['Guyana','Brazil','French Guiana'],population:'about 630,000',fact:'It is the only sovereign country in South America with Dutch as its official language.'},
  {name:'Timor-Leste',region:'Southeast Asia',capital:'Dili',currency:'US dollar',language:'Tetum and Portuguese',neighbors:['Indonesia'],population:'about 1.4 million',fact:'It became an independent state in 2002.'},
  {name:'Kyrgyzstan',region:'Central Asia',capital:'Bishkek',currency:'som',language:'Kyrgyz and Russian',neighbors:['Kazakhstan','China','Tajikistan','Uzbekistan'],population:'about 7.2 million',fact:'Issyk-Kul is a high-altitude lake that rarely freezes despite its elevation.'},
  {name:'Moldova',region:'Eastern Europe',capital:'Chișinău',currency:'leu',language:'Romanian',neighbors:['Romania','Ukraine'],population:'about 2.5 million',fact:'The underground galleries at Mileștii Mici form one of the world’s largest wine cellars.'},
  {name:'Lesotho',region:'Southern Africa',capital:'Maseru',currency:'loti',language:'Sesotho and English',neighbors:['South Africa'],population:'about 2.3 million',fact:'The entire country lies above 1,000 metres in elevation.'},
  {name:'Mongolia',region:'East Asia',capital:'Ulaanbaatar',currency:'tögrög',language:'Mongolian',neighbors:['Russia','China'],population:'about 3.5 million',fact:'It is the world’s least densely populated sovereign country.'},
  {name:'Namibia',region:'Southern Africa',capital:'Windhoek',currency:'dollar',language:'English',neighbors:['Angola','Zambia','Botswana','South Africa'],population:'about 3.0 million',fact:'The Namib is often described as the world’s oldest desert.'},
  {name:'Paraguay',region:'South America',capital:'Asunción',currency:'guaraní',language:'Spanish and Guaraní',neighbors:['Argentina','Bolivia','Brazil'],population:'about 6.9 million',fact:'Guaraní is widely spoken in daily life alongside Spanish.'},
  {name:'Madagascar',region:'East Africa',capital:'Antananarivo',currency:'ariary',language:'Malagasy and French',neighbors:['No land borders'],population:'about 32 million',fact:'Most of its native reptile species are found nowhere else in the wild.'},
  {name:'Mauritius',region:'East Africa',capital:'Port Louis',currency:'rupee',language:'English and French',neighbors:['No land borders'],population:'about 1.3 million',fact:'The dodo was endemic to Mauritius before it became extinct.'},
  {name:'Belize',region:'Central America',capital:'Belmopan',currency:'dollar',language:'English',neighbors:['Mexico','Guatemala'],population:'about 420,000',fact:'The Belize Barrier Reef is part of the second-largest barrier reef system.'}
];
const COUNTRY_MILESTONES = {
  'Venezuela':['declared independence','1811'],'Estonia':['first declared independence','1918'],'Ghana':['gained independence','1957'],
  'Japan':['put its postwar constitution into effect','1947'],'Peru':['declared independence','1821'],'Morocco':['regained independence','1956'],
  'New Zealand':['became a dominion','1907'],'Nepal':['abolished its monarchy','2008'],'Iceland':['became a republic','1944'],
  'Senegal':['gained independence','1960'],'Thailand':['became a constitutional monarchy','1932'],'Chile':['declared independence','1818'],
  'Finland':['declared independence','1917'],'Canada':['formed as a confederation','1867'],'Kenya':['gained independence','1963'],
  'Portugal':['had its independence recognized','1143'],'South Korea':['was established as a republic','1948'],'Bhutan':['established its hereditary monarchy','1907'],
  'Laos':['gained independence','1953'],'Suriname':['gained independence','1975'],'Timor-Leste':['restored its independence','2002'],
  'Kyrgyzstan':['declared independence','1991'],'Moldova':['declared independence','1991'],'Lesotho':['gained independence','1966'],
  'Mongolia':['adopted its first constitution as a republic','1924'],'Namibia':['gained independence','1990'],'Paraguay':['declared independence','1811'],
  'Madagascar':['gained independence','1960'],'Mauritius':['gained independence','1968'],'Belize':['gained independence','1981']
};
const QUIZ_TYPES = ['capital','currency','language','neighbor','population','fact','history'];
const pick = arr => arr[Math.floor(Math.random()*arr.length)];
const id = () => crypto.randomBytes(8).toString('hex');
const shuffled = arr => [...arr].sort(() => Math.random()-.5);

function roomCode(){ let s=''; do { s=crypto.randomBytes(3).toString('hex').slice(0,4).toUpperCase(); } while(rooms.has(s)); return s; }
function safePlayer(p, room, viewerId){
  const out={id:p.id,name:p.name,avatar:p.avatar,ready:p.ready,qualified:p.qualified,guess:p.guess,attempts:p.attempts,score:p.score,stats:p.stats,quizDone:p.quizDone,health:p.health,bluffSubmitted:Boolean(p.bluff),joinedAt:p.joinedAt};
  if(room.phase==='bluff' && p.setterId===viewerId){ const target=room.players.find(x=>x.id===p.targetId); out.privateBluff={country:target?.country?.name,options:p.bluffOptions}; }
  if(room.phase==='guess' && p.id===viewerId){ out.privatePuzzle={clues:p.clues}; }
  if(room.phase==='quiz' && p.id===viewerId){ out.privateQuiz=p.quiz?.map(q=>({type:q.type,prompt:q.prompt,choices:q.choices,answered:q.answered,correct:q.answered?q.correct:undefined,locked:q.locked||false,lockedBy:room.quizClaims?.[q.type]?room.players.find(x=>x.id===room.quizClaims[q.type])?.name:null})); }
  return out;
}
function publicRoom(room, viewerId){
  return {code:room.code,phase:room.phase,hostId:room.hostId,players:room.players.map(p=>safePlayer(p,room,viewerId)),message:room.message,round:room.round,turn:room.turn,bracket:room.bracket,bonus:room.bonus,quizClaims:Object.fromEntries(Object.entries(room.quizClaims||{}).map(([type,id])=>[type,room.players.find(p=>p.id===id)?.name])),duel:room.duel,champion:room.champion,updatedAt:room.updatedAt};
}
function emit(room){ room.updatedAt=Date.now(); for(const stream of streams.get(room.code)||[]){ stream.res.write(`data: ${JSON.stringify(publicRoom(room,stream.playerId))}\n\n`); } }
function setPhase(room,phase,message){room.phase=phase;room.message=message;room.updatedAt=Date.now();emit(room);}
function makePlayer(name, avatar){return {id:id(),name:name.slice(0,18),avatar,ready:false,joinedAt:Date.now(),country:null,targetId:null,setterId:null,bluffOptions:[],bluff:null,clues:[],guess:null,attempts:0,qualified:false,score:0,stats:{iq:0,strength:0,tolerance:0},quiz:null,quizDone:false,health:100};}
function startGame(room){
  room.phase='bluff';room.round=1;room.turn=0;room.message='Bluff phase: each player secretly prepares one false clue for the next player.';
  const countries=shuffled(COUNTRIES).slice(0,room.players.length);
  room.players.forEach((p,i)=>{p.country=countries[i];const setter=room.players[(i+1)%room.players.length];p.setterId=setter.id;p.targetId=p.id;const alternatives=COUNTRIES.filter(c=>c.name!==countries[i].name);p.bluffOptions=[`This country is in ${pick(alternatives.filter(c=>c.region!==countries[i].region)).region}.`,`Its capital is ${pick(alternatives).capital}.`];p.clues=[];p.bluff=null;p.guess=null;p.attempts=0;p.qualified=false;p.score=0;p.stats={iq:0,strength:0,tolerance:0};p.quizDone=false;p.health=100;});
  emit(room);
}
function makeClues(country, bluff){
  const truths=[`It is in ${country.region}.`,`Its capital is ${country.capital}.`,`Its currency is the ${country.currency}.`,`One official language is ${country.language}.`,`Its population is ${country.population}.`,`A country fact: ${country.fact}`];
  return shuffled([...truths.slice(0,4),bluff]);
}
function beginGuess(room){room.players.forEach(p=>{p.clues=makeClues(p.country,p.bluff);});room.phase='guess';room.message='Guess phase: read the mixed clues and identify each country.';emit(room);}
function makeQuiz(country,types=QUIZ_TYPES.slice(0,5)){
  const peers=COUNTRIES.filter(c=>c.name!==country.name), near=peers.filter(c=>c.region===country.region||country.neighbors.includes(c.name));
  const decoys=(answer,values)=>shuffled([...new Set(values.filter(x=>x!==answer))]).slice(0,3);
  const capitalPair=c=>`${c.capital} — ${c.name}`;
  const regionPeers=near.length>=3?near:peers;
  const questions={
    capital:()=>{const answer=capitalPair(country);const distractors=regionPeers.map(capitalPair);return {prompt:`A map labels ${country.name}. Which capital–country pairing is correct?`,answer,distractors};},
    currency:()=>{const answer=country.currency;const distractors=regionPeers.map(c=>c.currency);return {prompt:`Which currency is used in ${country.name}?`,answer,distractors};},
    language:()=>{const answer=country.language;const distractors=regionPeers.map(c=>c.language);return {prompt:`Which language combination is associated with ${country.name}?`,answer,distractors};},
    neighbor:()=>{
      const borders=country.neighbors.filter(n=>n!=='No land borders');
      if(!borders.length){const answer='It has no land borders.';return {prompt:`Which statement about ${country.name}'s land borders is accurate?`,answer,distractors:['It borders one neighboring country.','It borders two neighboring countries.','It borders three or more neighboring countries.']};}
      if(borders.length===1){const answer=borders[0];return {prompt:`Which country shares a land border with ${country.name}?`,answer,distractors:regionPeers.map(c=>c.name)};}
      const correct=shuffled(borders).slice(0,2).sort().join(' and ');const wrong=shuffled(peers.filter(c=>!borders.includes(c.name)&&c.region===country.region).map(c=>c.name));
      const pairs=[correct,...wrong.slice(0,3).map(n=>`${n} and ${pick(borders)}`)];return {prompt:`Which pair both share a land border with ${country.name}?`,answer:correct,distractors:pairs.slice(1)};
    },
    population:()=>{
      const number=c=>{const m=c.population.match(/([\d,.]+)\s*(million|thousand)?/i);let n=Number(m?.[1]?.replace(/,/g,''))||0;if(/million/i.test(m?.[2]||''))n*=1_000_000;else if(/thousand/i.test(m?.[2]||''))n*=1_000;return n;};
      const value=number(country), close=peers.filter(c=>number(c)>0).sort((a,b)=>Math.abs(Math.log(number(a)/value))-Math.abs(Math.log(number(b)/value))).slice(0,3).map(c=>c.population.replace(/^about /,''));
      return {prompt:`Which estimate is closest to ${country.name}'s population?`,answer:country.population.replace(/^about /,''),distractors:close};
    },
    fact:()=>{const answer=country.fact;return {prompt:`Which geographic or cultural detail belongs to ${country.name}?`,answer,distractors:shuffled(peers.map(c=>c.fact))};}
    ,history:()=>{const [event,answer]=COUNTRY_MILESTONES[country.name];const distractors=peers.map(c=>COUNTRY_MILESTONES[c.name][1]).filter(y=>y!==answer).sort((a,b)=>Math.abs(Number(a)-Number(answer))-Math.abs(Number(b)-Number(answer))).slice(0,3);return {prompt:`In what year did ${country.name} ${event}?`,answer,distractors};}
  };
  return types.map(type=>{const item=questions[type]();const choices=shuffled([item.answer,...decoys(item.answer,item.distractors)]);return {type,prompt:item.prompt,answer:item.answer,choices,index:choices.indexOf(item.answer),answered:false,correct:false};});
}
function beginQuiz(room){room.quizTypes=shuffled(QUIZ_TYPES).slice(0,5);room.quizClaims={};room.players.filter(p=>p.qualified).forEach(p=>{p.quiz=makeQuiz(p.country,room.quizTypes);p.quizDone=false;});room.phase='quiz';room.message='Country quiz: answer first to claim each shared topic and build your fighter.';if(room.players.every(p=>!p.qualified)){room.phase='over';room.message='No one guessed their country this round. Start a new room to play again.';}emit(room);}
function beginBracket(room){
  const qs=room.players.filter(p=>p.qualified); if(qs.length<2){room.phase='over';room.message=qs.length?'Only one player qualified. They win by default!':'No players qualified.';room.champion=qs[0]?.id||null;emit(room);return;}
  room.bracket=shuffled(qs.map(p=>p.id));room.roundWinners=[];room.round=1;startNextDuel(room);
}
function newCombatant(x,facing){return {x,y:0,vy:0,vx:0,facing,keys:[],action:'idle',actionStarted:Date.now(),actionUntil:0,stunUntil:0,dodgeUntil:0,stamina:100,cooldowns:{},lastInputAt:Date.now()};}
function startNextDuel(room){
  if(room.bracket.length===1){room.roundWinners.push(room.bracket.pop());}
  if(room.bracket.length===0){
    if(room.roundWinners.length===1){room.phase='over';room.champion=room.roundWinners[0];room.message=`${room.players.find(p=>p.id===room.champion)?.name} is the Neon Kingdoms champion!`;emit(room);return;}
    room.bracket=room.roundWinners;room.roundWinners=[];room.round++;
  }
  const [a,b]=room.bracket.splice(0,2);const pa=room.players.find(p=>p.id===a),pb=room.players.find(p=>p.id===b);pa.health=pb.health=100;
  room.duel={a,b,health:{[a]:100,[b]:100},fighters:{[a]:newCombatant(220,1),[b]:newCombatant(780,-1)},pendingHits:[],projectiles:[],lastAction:null,lastHit:null,winner:null,endsAt:Date.now()+90000,lastTick:Date.now(),lastBroadcast:0};room.phase='fight';room.message=`${pa.name} vs ${pb.name} — fight!`;emit(room);
}
function nextDuel(room,winner){room.roundWinners.push(winner);startNextDuel(room);}
function finishDuel(room,winner,message){if(!room.duel||room.duel.winner)return;room.duel.winner=winner;room.message=message;emit(room);setTimeout(()=>{if(room.phase==='fight'&&room.duel?.winner===winner)nextDuel(room,winner);},2200);}
function damagePlayer(room,attackerId,targetId,type,baseDamage,now,attackFacing){
  const duel=room.duel,attacker=duel.fighters[attackerId],target=duel.fighters[targetId],person=room.players.find(p=>p.id===targetId);if(now<target.dodgeUntil)return false;
  const dx=target.x-attacker.x,dy=target.y-attacker.y;if(type!=='special'&&(dx*attackFacing<0||Math.abs(dx)>(type==='heavy'?138:104)||Math.abs(dy)>96))return false;
  const guarding=target.keys.includes('block')&&target.stamina>0&&target.facing===-attackFacing;let broken=false,damage=Math.ceil(baseDamage);
  if(guarding){const drain=baseDamage*(type==='heavy'?1.45:0.72);target.stamina=Math.max(0,target.stamina-drain);broken=target.stamina===0;damage=Math.ceil(baseDamage*(broken?0.82:type==='heavy'?0.58:0.2));}
  person.health=Math.max(0,person.health-damage);if(!guarding||broken){target.stunUntil=now+(broken?370:type==='heavy'?330:210);target.action='hit';target.actionStarted=now;target.actionUntil=target.stunUntil;}else{target.action='block';target.actionStarted=now;target.actionUntil=now+120;}
  duel.health[targetId]=person.health;duel.lastHit={x:target.x,y:target.y+60,at:now,blocked:guarding&&!broken,type};duel.lastAction={player:attackerId,move:type,at:now,result:broken?'GUARD BREAK':guarding?'GUARDED':'HIT'};
  if(person.health<=0)finishDuel(room,attackerId,`${room.players.find(p=>p.id===attackerId).name} lands the KO!`);
  return true;
}
function tickFight(room,now,dt){
  const duel=room.duel;if(room.phase!=='fight'||!duel||duel.winner)return;
  for(const pid of [duel.a,duel.b]){
    const f=duel.fighters[pid],player=room.players.find(p=>p.id===pid),other=duel.fighters[pid===duel.a?duel.b:duel.a];f.facing=other.x>=f.x?1:-1;
    if(now-f.lastInputAt>1800)f.keys=[];
    const stunned=now<f.stunUntil,guard=f.keys.includes('block')&&f.stamina>0;
    const horizontal=(f.keys.includes('right')?1:0)-(f.keys.includes('left')?1:0);
    if(stunned)f.vx=0;else if(now<f.dodgeUntil){}else if(guard){f.vx=horizontal*75;f.stamina=Math.max(0,f.stamina-19*dt);f.action='block';}else{f.vx=horizontal*340;if(horizontal&&['idle','walk','block'].includes(f.action))f.action='walk';else if(!horizontal&&['walk','block'].includes(f.action))f.action='idle';}
    if(!guard&&now>=f.dodgeUntil)f.stamina=Math.min(100,f.stamina+(15+player.stats.tolerance*.08)*dt);
    f.x=Math.max(55,Math.min(945,f.x+f.vx*dt));f.y+=f.vy*dt;if(f.y>0)f.vy-=1500*dt;if(f.y<=0){f.y=0;f.vy=0;if(f.action==='jump'&&now>=f.actionUntil)f.action=horizontal?'walk':'idle';}
    if(now>=f.actionUntil&&['light','heavy','special','dodge','hit','block'].includes(f.action)){f.action=horizontal?'walk':'idle';}
    if(now-f.lastInputAt>1800)f.vx=0;
  }
  const gap=duel.fighters[duel.b].x-duel.fighters[duel.a].x;if(Math.abs(gap)<42){const push=(42-Math.abs(gap))/2;duel.fighters[duel.a].x-=Math.sign(gap||1)*push;duel.fighters[duel.b].x+=Math.sign(gap||1)*push;}
  const remain=[];
  for(const hit of duel.pendingHits){if(now<hit.at){remain.push(hit);continue;}const f=duel.fighters[hit.attacker];if(now<f.stunUntil||f.action!==hit.type)continue;if(hit.type==='special'){duel.projectiles.push({owner:hit.attacker,x:f.x+hit.facing*42,y:f.y+62,vx:hit.facing*700,damage:hit.damage,expiresAt:now+1200});}else damagePlayer(room,hit.attacker,hit.target,hit.type,hit.damage,now,hit.facing);}
  duel.pendingHits=remain;
  duel.projectiles=duel.projectiles.filter(shot=>{shot.x+=shot.vx*dt;if(now>shot.expiresAt||shot.x<20||shot.x>980)return false;const targetId=shot.owner===duel.a?duel.b:duel.a,target=duel.fighters[targetId];if(Math.abs(target.x-shot.x)<34&&Math.abs(target.y+55-shot.y)<92){damagePlayer(room,shot.owner,targetId,'special',shot.damage,now,Math.sign(shot.vx));return false;}return true;});
  if(duel.winner)return;
  if(now>=duel.endsAt){const pa=room.players.find(p=>p.id===duel.a),pb=room.players.find(p=>p.id===duel.b);const winner=pa.health===pb.health?(duel.fighters[duel.a].stamina>=duel.fighters[duel.b].stamina?duel.a:duel.b):(pa.health>pb.health?duel.a:duel.b);finishDuel(room,winner,`Time! ${room.players.find(p=>p.id===winner).name} wins on health and guard.`);return;}
  if(now-duel.lastBroadcast>=110){duel.lastBroadcast=now;emit(room);}
}

async function body(req){let s='';for await(const ch of req)s+=ch;try{return s?JSON.parse(s):{};}catch{return {};}}
function send(res,status,obj){res.writeHead(status,{'content-type':'application/json; charset=utf-8','access-control-allow-origin':'*'});res.end(JSON.stringify(obj));}
const server=http.createServer((req,res)=>{
  handleRequest(req,res).catch(err=>{console.error('Request failed:',err);if(!res.headersSent)send(res,500,{error:'The game hit a server error. Please try again.'});else if(!res.writableEnded)res.end();});
});
async function handleRequest(req,res){
  const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);const parts=url.pathname.split('/').filter(Boolean);
  if(req.method==='OPTIONS'){res.writeHead(204,{'access-control-allow-origin':'*','access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'content-type'});return res.end();}
  if(req.method==='GET'&&url.pathname==='/api/events'){
    const code=(url.searchParams.get('code')||'').toUpperCase(),playerId=url.searchParams.get('player');const room=rooms.get(code);if(!room)return send(res,404,{error:'Room not found.'});
    res.writeHead(200,{'content-type':'text/event-stream','cache-control':'no-cache','connection':'keep-alive','access-control-allow-origin':'*'});res.write(`data: ${JSON.stringify(publicRoom(room,playerId))}\n\n`);
    const list=streams.get(code)||new Set();const stream={res,playerId};list.add(stream);streams.set(code,list);res.on('close',()=>list.delete(stream));return;
  }
  if(req.method==='GET'&&url.pathname.startsWith('/api/room/')){const code=parts[2]?.toUpperCase(),room=rooms.get(code);if(!room)return send(res,404,{error:'Room not found.'});return send(res,200,{room:publicRoom(room,url.searchParams.get('player'))});}
  if(req.method==='POST'&&url.pathname==='/api/create'){
    const data=await body(req);const room={code:roomCode(),phase:'lobby',players:[],hostId:null,round:0,turn:0,bracket:[],duel:null,champion:null,bonus:null,message:'Room is open. Waiting for fighters.',updatedAt:Date.now()};const p=makePlayer(data.name||'Player 1',data.avatar||'⚔');room.players.push(p);room.hostId=p.id;rooms.set(room.code,room);emit(room);return send(res,201,{code:room.code,playerId:p.id,room:publicRoom(room,p.id)});
  }
  if(req.method==='POST'&&url.pathname==='/api/join'){
    const data=await body(req),room=rooms.get(String(data.code||'').toUpperCase());if(!room)return send(res,404,{error:'That room code was not found.'});if(room.phase!=='lobby')return send(res,409,{error:'This game has already started.'});if(room.players.length>=8)return send(res,409,{error:'This room already has eight players.'});if(room.players.some(p=>p.name.toLowerCase()===String(data.name||'').toLowerCase()))return send(res,409,{error:'That name is already in the room.'});const p=makePlayer(data.name||`Player ${room.players.length+1}`,data.avatar||'⚔');room.players.push(p);emit(room);return send(res,201,{code:room.code,playerId:p.id,room:publicRoom(room,p.id)});
  }
  if(req.method==='POST'&&parts[0]==='api'&&parts[1]==='action'){
    const data=await body(req),room=rooms.get(String(data.code||'').toUpperCase()),player=room?.players.find(p=>p.id===data.playerId);if(!room||!player)return send(res,404,{error:'Room or player not found.'});
    const reject=msg=>send(res,409,{error:msg});
    if(data.action==='start'){if(player.id!==room.hostId)return reject('Only the host can start.');if(room.players.length<2)return reject('Invite at least one more player.');if(room.players.some(p=>!p.ready))return reject('Everyone, including the host, must be ready first.');startGame(room);return send(res,200,{ok:true});}
    if(data.action==='ready'){player.ready=!player.ready;emit(room);return send(res,200,{ok:true});}
    if(data.action==='bluff'){if(room.phase!=='bluff'||player.id!==data.setterId)return reject('It is not your bluff turn.');const target=room.players.find(p=>p.id===data.targetId);if(!target)return reject('Target not found.');target.bluff=String(data.text||'').slice(0,140);if(room.players.every(p=>p.bluff))beginGuess(room);else emit(room);return send(res,200,{ok:true});}
    if(data.action==='guess'){
      if(room.phase!=='guess')return reject('Guess phase is over.');if(player.guess===player.country.name)return reject('You already qualified.');
      player.attempts++;const answer=String(data.text||'').trim().toLowerCase();
      if(answer===player.country.name.toLowerCase()){player.guess=player.country.name;player.qualified=true;player.score=Math.max(15,100-(player.attempts-1)*15);player.stats.iq=Math.min(100,35+player.score);player.stats.strength=25;player.stats.tolerance=25;}
      else player.score=Math.max(0,player.score-8);
      if(room.players.every(p=>p.guess===p.country.name||p.attempts>=5)){
        const qs=room.players.filter(p=>p.qualified);if(qs.length%2===1&&qs.length<room.players.length){room.bonus={eligible:room.players.filter(p=>!p.qualified).map(p=>p.id),answer:'Canada',winner:null};room.phase='bonus';room.message='Bonus country race! First correct guess fills the final bracket spot.';}
        else beginQuiz(room);
      } else emit(room);return send(res,200,{ok:true,correct:player.qualified});
    }
    if(data.action==='bonus'){if(room.phase!=='bonus'||!room.bonus.eligible.includes(player.id))return reject('You are not in this bonus race.');if(String(data.text||'').trim().toLowerCase()===room.bonus.answer.toLowerCase()){room.bonus.winner=player.id;player.qualified=true;player.country=COUNTRIES.find(c=>c.name===room.bonus.answer);player.score=100;player.stats.iq=70;player.stats.strength=35;player.stats.tolerance=35;room.message=`${player.name} won the bonus guess and qualified!`;beginQuiz(room);return send(res,200,{ok:true,correct:true});}return send(res,200,{ok:true,correct:false});}
    if(data.action==='quiz'){
      if(room.phase!=='quiz'||!player.qualified||player.quizDone)return reject('Quiz is unavailable.');const qi=Number(data.index),question=player.quiz?.[qi];if(!question)return reject('Question not found.');if(question.answered)return reject('That question has already been answered.');
      const claimedBy=room.quizClaims?.[question.type];if(claimedBy){question.answered=true;question.locked=true;question.correct=false;player.quizDone=player.quiz.every(q=>q.answered);emit(room);return send(res,200,{ok:true,locked:true,by:room.players.find(p=>p.id===claimedBy)?.name});}
      const correct=Number(data.choice)===question.index;question.answered=true;question.correct=correct;player.score+=correct?20:0;
      const stat={capital:'iq',currency:'iq',language:'tolerance',neighbor:'strength',population:'iq',fact:'tolerance',history:'iq'}[question.type];player.stats[stat]=Math.min(100,player.stats[stat]+(correct?15:3));
      if(correct){room.quizClaims[question.type]=player.id;player.stats[stat]=Math.min(100,player.stats[stat]+10);player.score+=10;
        for(const other of room.players.filter(p=>p.qualified&&p.id!==player.id)){const otherQuestion=other.quiz?.find(q=>q.type===question.type);if(otherQuestion&&!otherQuestion.answered){otherQuestion.answered=true;otherQuestion.locked=true;otherQuestion.correct=false;}if(other.quiz?.every(q=>q.answered))other.quizDone=true;}
      }
      if(player.quiz.every(q=>q.answered))player.quizDone=true;
      if(room.players.filter(p=>p.qualified).every(p=>p.quizDone))beginBracket(room);else emit(room);return send(res,200,{ok:true,correct});
    }
    if(data.action==='controls'){
      if(room.phase!=='fight'||!room.duel||![room.duel.a,room.duel.b].includes(player.id))return reject('You are not in the active fight.');
      const f=room.duel.fighters[player.id];f.keys=[...new Set((Array.isArray(data.keys)?data.keys:[]).filter(k=>['left','right','block'].includes(k)))];f.lastInputAt=Date.now();
      if(f.keys.includes('block')&&Date.now()>=f.stunUntil)f.action='block';
      return send(res,200,{ok:true});
    }
    if(data.action==='fight'){
      if(room.phase!=='fight'||!room.duel)return reject('There is no active fight.');if(![room.duel.a,room.duel.b].includes(player.id))return reject('You are not in this fight.');if(room.duel.winner)return reject('This fight has ended.');
      const duel=room.duel,f=duel.fighters[player.id],otherId=player.id===duel.a?duel.b:duel.a,now=Date.now(),move=String(data.move);f.lastInputAt=now;
      if(move==='jump'){if(f.y<=0&&now>=(f.cooldowns.jump||0)){f.vy=555;f.action='jump';f.actionStarted=now;f.actionUntil=now+260;f.cooldowns.jump=now+420;}return send(res,200,{ok:true});}
      if(move==='dodge'){if(now<(f.cooldowns.dodge||0)||f.stamina<17)return send(res,200,{ok:true,ignored:true});f.stamina-=17;f.vx=-f.facing*640;f.dodgeUntil=now+280;f.action='dodge';f.actionStarted=now;f.actionUntil=now+360;f.cooldowns.dodge=now+760;duel.lastAction={player:player.id,move,at:now};emit(room);return send(res,200,{ok:true});}
      const specs={light:{cooldown:390,windup:100,animation:370,cost:6,damage:10+player.stats.strength*.12},heavy:{cooldown:920,windup:260,animation:680,cost:19,damage:18+player.stats.strength*.2},special:{cooldown:1050,windup:190,animation:540,cost:0,damage:15+player.stats.iq*.17}};
      if(move==='attack')data.move='light';const spec=specs[data.move];if(!spec)return reject('Unknown fight move.');if(now<(f.cooldowns[data.move]||0))return send(res,200,{ok:true,ignored:true});if(data.move==='heavy'&&f.stamina<spec.cost)return send(res,200,{ok:true,ignored:true});if(data.move==='special'&&player.stats.iq<12)return send(res,200,{ok:true,ignored:true});
      if(data.move!=='special')f.stamina=Math.max(0,f.stamina-spec.cost);else player.stats.iq=Math.max(0,player.stats.iq-12);
      f.cooldowns[data.move]=now+spec.cooldown;f.action=data.move;f.actionStarted=now;f.actionUntil=now+spec.animation;duel.lastAction={player:player.id,move:data.move,at:now};duel.pendingHits.push({attacker:player.id,target:otherId,type:data.move,damage:spec.damage,facing:f.facing,at:now+spec.windup});emit(room);return send(res,200,{ok:true});
    }
    return reject('Unknown game action.');
  }
  let file=url.pathname==='/'?'index.html':path.normalize(url.pathname).replace(/^([/\\]|\.\.(?:[/\\]|$))+/, '');file=path.join(ROOT,file);if(!file.startsWith(ROOT))return send(res,403,{error:'Forbidden'});fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end('Not found');}res.writeHead(200,{'content-type':MIME[path.extname(file)]||'application/octet-stream'});res.end(data);});
}
server.listen(PORT,'0.0.0.0',()=>console.log(`Neon Kingdoms is running at http://localhost:${PORT}`));
setInterval(()=>{const now=Date.now();for(const room of rooms.values()){if(room.phase==='fight'&&room.duel&&!room.duel.winner){const dt=Math.min(.05,Math.max(.001,(now-room.duel.lastTick)/1000));room.duel.lastTick=now;tickFight(room,now,dt);}}},50);
