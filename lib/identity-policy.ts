export function githubId(value:unknown):string|null {
  const id=String(value??"");return /^[1-9][0-9]{0,19}$/.test(id)?id:null;
}
export function safeReturnPath(value:string){
  if(!value.startsWith("/")||value.startsWith("//")||value.includes("\\"))return "/";
  try{const url=new URL(value,"https://app.local");return url.origin==="https://app.local"&&!url.pathname.startsWith("/api/auth/")?url.pathname+url.search+url.hash:"/";}catch{return "/";}
}
export function isOperatorIdentity(user:{userId:string}|null,configuredId:string|undefined,operatorEnabled=false){
  if(operatorEnabled&&user?.userId==="operator:owner")return true;
  const id=githubId(configuredId);return !!user&&!!id&&user.userId===`github:${id}`;
}
export function githubAuthenticationConfigured(){
  return !!process.env.AUTH_SECRET&&process.env.AUTH_SECRET.length>=32&&!!process.env.AUTH_GITHUB_ID&&!!process.env.AUTH_GITHUB_SECRET;
}

import {operatorAccessConfigured} from "./operator-access";
export const authenticationConfigured=()=>githubAuthenticationConfigured()||operatorAccessConfigured();
