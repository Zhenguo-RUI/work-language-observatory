import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {createRequire} from "node:module";
const root=process.cwd(),require=createRequire(root+"/package.json"),ts=require("typescript"),cache=new Map();
let mode="success",calls=0,releasePending;
const handleApi=async(_request,_path,onStage)=>{calls++;onStage?.("analysis");if(mode==="pending")await new Promise(resolve=>{releasePending=resolve});onStage?.("validating");if(mode==="business")return Response.json({error:"Synthetic quota failure"},{status:429});if(mode==="exception")throw new TypeError("PRIVATE_ERROR_SENTINEL");return Response.json({analysis:{id:"synthetic-only"}});};
function local(file){const path=resolve(root,file);if(cache.has(path))return cache.get(path).exports;const mod={exports:{}};cache.set(path,mod);const js=ts.transpileModule(readFileSync(path,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;const dependency=p=>{if(p==="@/lib/observatory-server")return {handleApi};if(p.startsWith(".")||p.startsWith("@/")){const stem=p.startsWith("@/")?resolve(root,p.slice(2)):resolve(dirname(path),p);for(const ext of ["",".ts"])if(existsSync(stem+ext))return local(stem+ext);throw Error(p)}return require(p)};new Function("require","module","exports",js)(dependency,mod,mod.exports);return mod.exports;}
const {POST}=local("app/api/[...path]/route.ts"),ctx={params:Promise.resolve({path:["analyses"]})},rows=[],originalInfo=console.info;
const request=(id)=>new Request("https://example.test/api/analyses",{method:"POST",headers:{accept:"text/event-stream","content-type":"application/json","x-wlo-request-id":id,cookie:"PRIVATE_COOKIE_SENTINEL",origin:"https://PRIVATE_ORIGIN_SENTINEL.test"},body:JSON.stringify({rawText:"PRIVATE_BODY_SENTINEL"})});
const events=text=>text.split("\n\n").map(frame=>{const name=/^event: (.+)$/m.exec(frame)?.[1],data=/^data: (.+)$/m.exec(frame)?.[1];return data?{name,data:JSON.parse(data)}:null}).filter(Boolean);
console.info=line=>{rows.push(JSON.parse(line));};
try{
 const id="00000000-0000-4000-8000-000000000001",first=await POST(request(id),ctx),firstEvents=events(await first.text());assert.equal(first.headers.get("x-wlo-request-id"),id);assert(firstEvents.some(e=>e.name==="result"));assert(firstEvents.some(e=>e.name==="diagnostics"&&e.data.phase==="accepted"&&e.data.first_in_instance));assert(firstEvents.some(e=>e.name==="diagnostics"&&e.data.phase==="result"&&!e.data.resumed));
 const secondEvents=events(await(await POST(request(id),ctx)).text());assert(secondEvents.some(e=>e.name==="diagnostics"&&e.data.phase==="result"&&e.data.resumed));assert.equal(calls,1);
 mode="business";const failure=events(await(await POST(request("00000000-0000-4000-8000-000000000002"),ctx)).text());assert(failure.some(e=>e.name==="failure"&&e.data.status===429));assert(failure.some(e=>e.name==="diagnostics"&&e.data.errorType==="http_429"));
 mode="exception";const exception=events(await(await POST(request("PRIVATE_ID_SENTINEL"),ctx)).text());assert(exception.some(e=>e.name==="diagnostics"&&e.data.errorType==="transport_error"));assert(!rows.some(row=>row.requestId==="PRIVATE_ID_SENTINEL"));
 mode="pending";const pending=await POST(request("00000000-0000-4000-8000-000000000003"),ctx);const reader=pending.body.getReader();await reader.read();await reader.cancel();releasePending();await new Promise(resolve=>setTimeout(resolve,0));assert(rows.some(row=>row.phase==="cancelled"));
 const allowed=new Set(["event","requestId","phase","elapsedMs","first_in_instance","resumed","status","errorType"]);for(const row of rows){assert(Object.keys(row).every(key=>allowed.has(key)));assert.equal(row.event,"analysis_stream");assert(typeof row.elapsedMs==="number"&&row.elapsedMs>=0);assert(typeof row.first_in_instance==="boolean");assert(!/PRIVATE_|rawText|cookie|origin|apiKey|hash|secret/i.test(JSON.stringify(row)));}
}finally{console.info=originalInfo;}
console.log(JSON.stringify({passed:true,checks:7,no_private_fields:true,live_model_calls:0}));
