// In-memory Postgres and synthetic identities only. No model or external HTTP calls.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const root=process.cwd(),require=createRequire(root+'/package.json');
const ts=require('typescript'),{PGlite}=require('@electric-sql/pglite'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
function compile(source,resolve){const m={exports:{}};const out=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;new Function('require','module','exports',out)(resolve,m,m.exports);return m.exports;}
const {Database}=compile(readFileSync(root+'/lib/database-core.ts','utf8'),require),{initializeSchema}=compile(readFileSync(root+'/lib/database-schema.ts','utf8'),require);
const db=new PGlite();let queries=[],identity=null,identityCalls=0,schemaCalls=0,apiKey='synthetic-model-key';
const driver={execute:async q=>{queries.push(q);const r=await db.query(q.text,q.values);return {rows:r.rows,rowCount:r.affectedRows??r.rows.length}},transaction:async qs=>db.transaction(async tx=>{const results=[];for(const q of qs){queries.push(q);const r=await tx.query(q.text,q.values);results.push({rows:r.rows,rowCount:r.affectedRows??r.rows.length})}return results})};
const database=new Database(async()=>driver);await initializeSchema(database);
await db.query("INSERT INTO settings VALUES ('initialized','public-v1','now'),('model','synthetic-model','now'),('method_note','private method note','now')");
for(const owner of ['github:2001','github:2002'])await db.query("INSERT INTO analyses(id,owner_id,title,raw_text,text_hash,result_json,change_id,created_at,updated_at) VALUES($1,$2,'Synthetic role','Synthetic test input','test',$3,'test','now','now')",['row-'+owner,owner,JSON.stringify({comparisons:[],terms:[],headline:{zh:'测试',en:'Test'}})]);
const mocks={
 './database':{databaseConfigured:()=>true,getDatabase:()=>database,ensureDatabase:async()=>{schemaCalls++;await initializeSchema(database)}},
 './identity':{getUser:async()=>{identityCalls++;return identity}},
 './identity-policy':{authenticationConfigured:()=>true,githubAuthenticationConfigured:()=>true,isOperatorIdentity:u=>u?.userId==='operator:owner'},
 './operator-access':{operatorAccessConfigured:()=>true},
 './request-origin':{sameRequestOrigin:()=>true},
 './seed-data':{seeds:[],seedTranslations:[]},
 './model-client':{modelRuntime:()=>({provider:'deepseek',apiKey,model:'synthetic-model'})},
 './analysis-prompt':{ANALYSIS_VERSION:'test-startup'},
 './analysis-contract':{resultSchema:require('zod').z.object({})},
 './usage-store':{getUsageSummary:async()=>({}),UsageRateLimitError:class extends Error{}},
 './model-quota':{ModelBudgetError:class extends Error{}},
};
function server(source){return compile(source,p=>mocks[p]??(p.startsWith('@/data/')?JSON.parse(readFileSync(root+'/'+p.slice(2),'utf8')):p==='zod'||p==='node:crypto'?require(p):{})).handleApi;}
const current=server(readFileSync(root+'/lib/observatory-server.ts','utf8'));
async function call(handle,path){return handle(new Request('http://localhost/api/'+path),path.split('?')[0].split('/'))}
const checks=[];async function check(name,fn){await fn();checks.push(name)};
await check('public research skips identity and database, with public cache only',async()=>{queries=[];identityCalls=0;const r=await call(current,'research');assert.equal(r.status,200);assert.equal(identityCalls,0);assert.equal(queries.length,0);assert(r.headers.get('Cache-Control').includes('public'));assert.equal((await r.json()).study.methods.corpusN,2000)});
await check('anonymous bootstrap reads only model configuration and returns no private history',async()=>{queries=[];schemaCalls=0;const r=await call(current,'bootstrap'),body=await r.json();assert.equal(r.status,200);assert.deepEqual(body.analyses,[]);assert.deepEqual(body.activity,[]);assert.deepEqual(body.feedback,[]);assert.equal(body.settings.modelConnected,true);assert.equal(body.settings.model,'');assert.equal(body.settings.methodNote,'');assert.equal(schemaCalls,0);assert.equal(queries.length,1);assert(queries[0].text.includes('settings'));assert.equal(r.headers.get('Cache-Control'),'no-store');assert(!JSON.stringify(body).includes(apiKey));});
await check('without model credentials anonymous startup touches no database',async()=>{queries=[];apiKey='';const r=await call(current,'bootstrap');assert.equal((await r.json()).settings.modelConnected,false);assert.equal(queries.length,0);apiKey='synthetic-model-key';});
await check('anonymous operations bootstrap remains unauthorized',async()=>{queries=[];const r=await call(current,'bootstrap?scope=ops');assert.equal(r.status,401);assert.equal(queries.length,0)});
await check('signed-in readers retain strictly owner-scoped history',async()=>{for(const id of ['2001','2002']){identity={userId:'github:'+id,displayName:'Synthetic',email:'',fullName:null};const r=await call(current,'bootstrap'),body=await r.json();assert.equal(r.status,200);assert.deepEqual(body.analyses.map(a=>a.id),['row-github:'+id]);assert.equal(body.operator,false);assert.equal(body.stats.total,1);assert.deepEqual(body.activity,[]);assert.deepEqual(body.feedback,[]);assert.equal(body.settings.methodNote,'');const ops=await call(current,'bootstrap?scope=ops');assert.equal(ops.status,403)}});
await check('operator bootstrap retains authorized records and private configuration',async()=>{identity={userId:'operator:owner',displayName:'Operator',email:'',fullName:null};const body=await (await call(current,'bootstrap?scope=ops')).json();assert.equal(body.operator,true);assert.equal(body.analyses.length,2);assert.equal(body.settings.methodNote,'private method note')});
await check('a fresh database still initializes only when its settings table is missing',async()=>{identity=null;await db.query('DROP TABLE settings');schemaCalls=0;const r=await call(current,'bootstrap'),body=await r.json();assert.equal(r.status,200);assert.equal(body.settings.modelConnected,true);assert.deepEqual(body.analyses,[]);assert.equal(schemaCalls,1);});
// Render the real top-level component. Subcomponents are stubs; effects never run in SSR.
const clientSource=readFileSync(root+'/components/observatory.tsx','utf8');
const stubs=new Proxy({}, {get:(_o,key)=>key==='mergeReadings'?((local,cloud)=>[...local,...cloud]):key==='PUBLIC_DEMO'?{}:()=>null});
const {default:Observatory}=compile(clientSource,p=>p==='react'||p==='react/jsx-runtime'||p==='lucide-react'?require(p):p.endsWith('.css')?{}:stubs);
await check('public initial HTML contains an editable JD form before bootstrap resolves',async()=>{const html=renderToStaticMarkup(React.createElement(Observatory));assert(html.includes('id="jd-text"'));assert(html.includes('正在准备'));assert(!html.includes('模型暂未连接'));assert(!html.includes('正在连接工作区'));assert(/disabled=""[^>]*>正在准备/.test(html));});
await check('operations initial HTML stays behind its loading/auth boundary',async()=>{const html=renderToStaticMarkup(React.createElement(Observatory,{admin:true}));assert(!html.includes('id="jd-text"'));assert(html.includes('正在连接工作区'));});
await db.close();console.log(JSON.stringify({passed:true,startup_checks:checks.length,paid_calls:0,private_values_printed:false}));
