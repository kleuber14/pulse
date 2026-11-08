import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {readFileSync} from 'node:fs';import worker,{validateProof,cleanAlias} from '../worker/index.js';import {levels} from '../engine.js';
const sql=readFileSync(new URL('../drizzle/0000_motionless_wonder_man.sql',import.meta.url),'utf8');
function binding(){const db=new DatabaseSync(':memory:');db.exec(sql);return {prepare(q){let params=[];return {bind(...p){params=p;return this;},async first(){return db.prepare(q).get(...params)??null;},async all(){return {results:db.prepare(q).all(...params)};},async run(){return db.prepare(q).run(...params);}};},async batch(statements){for(const s of statements)await s.run();}};}
const proof={level:1,turns:levels[0].solution};
test('servidor valida partida, limita apelido e rejeita pontuação fabricada',()=>{assert.equal(validateProof(proof).points,1000);assert.throws(()=>validateProof({level:1,turns:[2]}));assert.throws(()=>validateProof({level:51,turns:[1]}));assert.throws(()=>cleanAlias('<script>'));assert.equal(cleanAlias('  Ana  '),'Ana');});
test('ranking persiste top 3 entre aparelhos, sem multiplicar pontuação por repetição',async()=>{
 const env={DB:binding()};const call=(path,body,token='A'.repeat(40))=>worker.fetch(new Request('https://ranking.test'+path,{method:body?'POST':'GET',headers:{Origin:'https://kleuber14.github.io',Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined}),env);
 for(let i=0;i<4;i++){const response=await call('/api/scores',{...proof,alias:'Jogador '+i},String(i).repeat(40));assert.equal(response.status,200);}
 const top=await (await call('/api/leaderboard')).json();assert.equal(top.top.length,3);assert.equal(top.top[0].score,1000);assert.equal('id' in top.top[0],false);
 await call('/api/scores',{...proof,alias:'Jogador 0'},'0'.repeat(40));const repeated=await (await call('/api/leaderboard')).json();assert.equal(repeated.top[0].score,1000);
 const preview=await (await call('/api/preview',{level:2,turns:levels[1].solution},'0'.repeat(40))).json();assert.equal(preview.eligible,true);await call('/api/scores',{level:2,turns:levels[1].solution,alias:'Jogador 0'},'0'.repeat(40));const updated=await (await call('/api/leaderboard')).json();assert.equal(updated.top[0].score,2000);
 const bad=await worker.fetch(new Request('https://ranking.test/api/leaderboard',{headers:{Origin:'https://unrelated.test'}}),env);assert.equal(bad.status,403);
});
