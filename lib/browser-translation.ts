import type {SourceTranslation} from './observatory-types';
import {originalEnglish,sourceSegments,sourceFingerprint,translationErrors} from './jd-translation';
export type NativeTranslator={translate(text:string):Promise<string>;destroy():void};
export type TranslatorFactory={availability(options:{sourceLanguage:string;targetLanguage:string}):Promise<string>;create(options:{sourceLanguage:string;targetLanguage:string;monitor?:(m:{addEventListener:(name:string,fn:(e:{loaded:number})=>void)=>void})=>void}):Promise<NativeTranslator>};
export const browserTranslator=()=>typeof window!=='undefined'?(window as unknown as {Translator?:TranslatorFactory}).Translator:undefined;
export async function browserTranslationAvailable(factory=browserTranslator()){if(!factory)return false;try{return (await factory.availability({sourceLanguage:'zh',targetLanguage:'en'}))!=='unavailable';}catch{return false;}}
export async function translateInBrowser(title:string,raw:string,onProgress?:(n:number)=>void,factory=browserTranslator()):Promise<SourceTranslation>{
 const original=await originalEnglish(title,raw);if(original)return original;
 if(!factory||!await browserTranslationAvailable(factory))throw new Error('Local translation is not supported by this browser.');
 const translator=await factory.create({sourceLanguage:'zh',targetLanguage:'en',monitor:m=>m.addEventListener('downloadprogress',e=>onProgress?.(Math.round(e.loaded*100)))});
 try{
  const titleEn=await translator.translate(title||'职位描述');const paragraphs=[];
  for(const source of sourceSegments(raw))paragraphs.push({source,en:await translator.translate(source)});
  const value:SourceTranslation={titleEn,paragraphs,basis:'browser',sourceHash:await sourceFingerprint(title,raw)};
  if(translationErrors(value,title,raw).length)throw new Error('The translation did not preserve every segment, number or contact detail. Please retry.');
  return value;
 }finally{translator.destroy();}
}
