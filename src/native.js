import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Share } from '@capacitor/share';

// The website keeps its normal browser behavior; these hooks run only in the app.
export async function setupNative({onBack,onPause},runtime={Capacitor,App}) {
  if (!runtime.Capacitor.isNativePlatform()) return;
  document.documentElement.classList.add('native-app');
  try {
    await runtime.App.addListener('backButton',async()=>{
      if (!onBack()) await runtime.App.minimizeApp();
    });
    await runtime.App.addListener('appStateChange',({isActive})=>{
      if (!isActive) onPause();
    });
  } catch(error) { console.warn('Integração Android indisponível:',error.message); }
}
export async function shareNative(text,runtime={Capacitor,Share}) {
  if (!runtime.Capacitor.isNativePlatform()) return false;
  try {await runtime.Share.share({title:'PULSE',text,dialogTitle:'Compartilhar resultado'});return true;}
  catch(error){if(/cancel/i.test(error.message??''))throw new DOMException('Compartilhamento cancelado','AbortError');throw error;}
}
