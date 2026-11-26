import test from 'node:test';import assert from 'node:assert/strict';import {setupNative,shareNative} from '../src/native.js';
test('Voltar no Android respeita a tela atual e minimiza somente no início',async()=>{
 const callbacks={};let minimize=0,paused=0,handled=true,styled=false;
 globalThis.document={documentElement:{classList:{add(name){styled=name==='native-app';}}}};
 const runtime={Capacitor:{isNativePlatform:()=>true},App:{async addListener(event,callback){callbacks[event]=callback;},async minimizeApp(){minimize++;}}};
 await setupNative({onBack:()=>handled,onPause:()=>paused++},runtime);assert.equal(styled,true);
 await callbacks.backButton();assert.equal(minimize,0);handled=false;await callbacks.backButton();assert.equal(minimize,1);
 callbacks.appStateChange({isActive:false});callbacks.appStateChange({isActive:true});assert.equal(paused,1);
});
test('o site não ativa listeners Android; o aplicativo usa o compartilhamento nativo',async()=>{
 await setupNative({onBack(){throw Error();},onPause(){throw Error();}},{Capacitor:{isNativePlatform:()=>false}});
 assert.equal(await shareNative('PULSE',{Capacitor:{isNativePlatform:()=>false}}),false);
 let shared;assert.equal(await shareNative('PULSE 22 giros',{Capacitor:{isNativePlatform:()=>true},Share:{async share(data){shared=data;}}}),true);assert.equal(shared.text,'PULSE 22 giros');
 await assert.rejects(()=>shareNative('PULSE',{Capacitor:{isNativePlatform:()=>true},Share:{async share(){throw Error('Share canceled');}}}),{name:'AbortError'});
});
