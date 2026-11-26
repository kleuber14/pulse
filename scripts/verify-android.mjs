import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const config=JSON.parse(await readFile('capacitor.config.json','utf8'));
assert.equal(config.appId,'com.kleuberavila.pulse');assert.equal(config.webDir,'dist');assert.equal(config.server.androidScheme,'https');assert.ok(!config.server.url,'O app deve usar os arquivos locais, não uma URL remota.');assert.equal(config.android.allowMixedContent,false);
const files=await readdir('dist',{recursive:true});let checked=0;
for(const file of files.filter(f=>/\.(html|js|css|webp)$/.test(f))){const source=await readFile('dist/'+file);const native=await readFile('android/app/src/main/assets/public/'+file);const hash=x=>createHash('sha256').update(x).digest('hex');assert.equal(hash(source),hash(native),`Asset desatualizado: ${file}`);checked++;}
const manifest=await readFile('android/app/src/main/AndroidManifest.xml','utf8');assert.match(manifest,/usesCleartextTraffic="false"/);assert.match(manifest,/allowBackup="false"/);assert.match(manifest,/android.permission.INTERNET/);assert.doesNotMatch(manifest,/android.permission.(CAMERA|RECORD_AUDIO|ACCESS_FINE_LOCATION|READ_CONTACTS)/);
console.log(`Configuração Android e ${checked} arquivos locais verificados.`);
