import {levels,move,network} from '../engine.js';
export function validateProof(body){
 if(!Number.isInteger(body.level)||body.level<1||body.level>levels.length||!Array.isArray(body.turns)||!body.turns.length||body.turns.length>512)throw Error('Partida inválida.');
 const level=levels[body.level-1];let state=[...level.state];
 for(const index of body.turns){if(!Number.isInteger(index)||index<0||index>=state.length||index===level.source)throw Error('Giro inválido.');state=move(level,state,index);}
 if(!network(level,state).solved)throw Error('Circuito incompleto.');
 return {level:body.level,moves:body.turns.length,points:Math.min(1000,Math.floor(1000*level.solution.length/body.turns.length))};
}
export function cleanAlias(value){const name=String(value??'').normalize('NFKC').trim().replace(/\s+/g,' ');if(!/^[\p{L}\p{N} _.-]{2,18}$/u.test(name))throw Error('Use um apelido de 2 a 18 letras ou números.');return name;}
const rankingSql=`SELECT p.id,p.alias,SUM(s.points) AS score,COUNT(*) AS cleared,SUM(s.moves) AS moves,p.created_at FROM players p JOIN scores s ON s.player=p.id GROUP BY p.id ORDER BY score DESC,moves ASC,p.created_at ASC,p.id ASC LIMIT 3`;
async function top(db){const {results}=await db.prepare(rankingSql).all();return results.map((r,i)=>({...r,rank:i+1}));}
async function identity(request){const token=request.headers.get('Authorization')?.replace(/^Bearer /,'');if(!token||!/^[a-zA-Z0-9_-]{32,128}$/.test(token))throw Error('Identificação do aparelho indisponível.');const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');}
async function candidate(db,id,proof){const total=await db.prepare('SELECT COALESCE(SUM(points),0) AS score,COALESCE(SUM(moves),0) AS moves FROM scores WHERE player=?').bind(id).first();const previous=await db.prepare('SELECT points,moves FROM scores WHERE player=? AND level=?').bind(id,proof.level).first();const improved=!previous||proof.moves<previous.moves;const score=total.score-(previous?.points??0)+proof.points,moves=total.moves-(previous?.moves??0)+proof.moves;const leaders=await top(db);const third=leaders[2];const eligible=improved&&(!third||leaders.some(r=>r.id===id)||score>third.score||(score===third.score&&moves<third.moves));return {eligible,improved,score,leaders};}
export default {async fetch(request,env){
 const origin=request.headers.get('Origin');const allowed=!origin||origin==='https://kleuber14.github.io'||/^http:\/\/localhost:\d+$/.test(origin);const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Access-Control-Allow-Origin':allowed?(origin||'*'):'https://kleuber14.github.io','Vary':'Origin','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization'};
 const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});if(!allowed)return json({error:'Origem não autorizada.'},403);if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 const path=new URL(request.url).pathname;
 try{
  if(path==='/health')return json({ok:true,levels:levels.length});
  if(path==='/api/leaderboard'&&request.method==='GET')return json({top:(await top(env.DB)).map(({id,created_at,...row})=>row)});
  if((path==='/api/preview'||path==='/api/scores')&&request.method==='POST'){
   if(Number(request.headers.get('Content-Length')||0)>16000)return json({error:'Partida muito longa.'},413);
   const raw=await request.text();if(raw.length>16000)return json({error:'Partida muito longa.'},413);const body=JSON.parse(raw),id=await identity(request),proof=validateProof(body),evaluation=await candidate(env.DB,id,proof);
   if(path==='/api/preview')return json({eligible:evaluation.eligible,improved:evaluation.improved,score:evaluation.score});
   const alias=cleanAlias(body.alias);if(!evaluation.improved){const leaders=await top(env.DB);return json({improved:false,rank:leaders.find(r=>r.id===id)?.rank??null,top:leaders.map(({id,created_at,...r})=>r)});}
   await env.DB.batch([
    env.DB.prepare('INSERT INTO players(id,alias,created_at) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET alias=excluded.alias').bind(id,alias,Date.now()),
    env.DB.prepare('INSERT INTO scores(player,level,moves,points,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(player,level) DO UPDATE SET moves=excluded.moves,points=excluded.points,updated_at=excluded.updated_at WHERE excluded.moves<scores.moves').bind(id,proof.level,proof.moves,proof.points,Date.now())
   ]);const leaders=await top(env.DB);return json({improved:true,rank:leaders.find(r=>r.id===id)?.rank??null,top:leaders.map(({id,created_at,...r})=>r)});
  }
  return json({service:'PULSE ranking',game:'https://kleuber14.github.io/pulse/'},path==='/'?200:404);
 }catch(error){const expected=/inválid|incompleto|apelido|aparelho/.test(error.message);return json({error:expected?error.message:'Placar temporariamente indisponível.'},expected?400:503);}
}};
