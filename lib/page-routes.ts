/** Public page query values and client view names have one source of truth. */
export const PUBLIC_PAGES = {
 "": {kind:"observatory",view:"analyze"},
 history: {kind:"observatory",view:"history"},
 keywords: {kind:"observatory",view:"lexicon"},
 research: {kind:"observatory",view:"research"},
 sample: {kind:"sample",view:null},
} as const;
export type PublicPageName=keyof typeof PUBLIC_PAGES;
export function resolvePublicPage(value:string|string[]|undefined){
 if(Array.isArray(value))return null;
 const page=value??"";
 return Object.hasOwn(PUBLIC_PAGES,page)?PUBLIC_PAGES[page as PublicPageName]:null;
}
export function publicPageForView(view:string):PublicPageName{
 return (Object.keys(PUBLIC_PAGES) as PublicPageName[]).find(page=>PUBLIC_PAGES[page].view===view)??"";
}
export function publicPageHref(page:PublicPageName,lang:"zh"|"en"){
 const query=new URLSearchParams({lang});if(page)query.set("page",page);return "/?"+query.toString();
}
