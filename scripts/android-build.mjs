import {spawnSync} from 'node:child_process';
const mode=process.argv[2]??'debug';
if(!['debug','bundle','release'].includes(mode))throw Error('Use debug, bundle ou release.');
const tasks={debug:['assembleDebug'],bundle:['bundleRelease'],release:['bundleRelease','assembleRelease']};
const command=process.platform==='win32'?'gradlew.bat':'./gradlew';
const result=spawnSync(command,['--no-daemon','--max-workers=2',...tasks[mode]],{cwd:new URL('../android/',import.meta.url),stdio:'inherit',shell:process.platform==='win32'});
if(result.error){console.error(result.error.message);process.exit(1);}process.exit(result.status??1);
