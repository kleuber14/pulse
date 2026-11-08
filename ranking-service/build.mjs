import {mkdir,copyFile,cp,readFile,writeFile} from 'node:fs/promises';
await mkdir('dist/server',{recursive:true});await mkdir('dist/.openai',{recursive:true});await copyFile('.openai/hosting.json','dist/.openai/hosting.json');await cp('drizzle','dist/drizzle',{recursive:true});
const engine=await readFile('engine.js','utf8');const source=(await readFile('worker/index.js','utf8')).replace(/import .*? from ['"]\.\.\/engine\.js['"];?\n/,engine+'\n');await writeFile('dist/server/index.js',source);
