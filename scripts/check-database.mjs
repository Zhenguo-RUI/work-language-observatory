import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const out=resolve('.sites-runtime/database-tests');mkdirSync(out,{recursive:true});
writeFileSync(out+'/package.json','{"type":"commonjs"}');
const compiled=spawnSync(process.execPath,[resolve('node_modules/typescript/bin/tsc'),'--target','ES2022','--module','commonjs','--moduleResolution','node','--esModuleInterop','--skipLibCheck','--strict','--outDir',out,'lib/model-quota.ts','lib/database-core.ts','lib/database-schema.ts','lib/database-local.ts','lib/identity-policy.ts'],{encoding:'utf8'});
if(compiled.status!==0){console.error(compiled.stdout+compiled.stderr);process.exit(1);}
const require=createRequire(import.meta.url);
const {Database,parameterize}=require(out+'/database-core.js');
const {initializeSchema}=require(out+'/database-schema.js');
const {localDriver}=require(out+'/database-local.js');
const {githubId,isOperatorIdentity,safeReturnPath}=require(out+'/identity-policy.js');
const {reserveModelCall}=require(out+'/model-quota.js');
const {verifyOperatorKey,operatorKeyVersion}=require(out+'/operator-access.js');
const checks=[];
async function check(name,fn){await fn();checks.push({name,passed:true});}
const driver=await localDriver('memory'),db=new Database(async()=>driver);
try{
 await check('source parameters are separated from SQL, including quoted question marks',()=>assert.deepEqual(parameterize("SELECT '?' AS literal, ? AS input, 'it''s ?' AS quoted",['untrusted']),{text:"SELECT '?' AS literal, $1 AS input, 'it''s ?' AS quoted",values:['untrusted']}));
 await check('parameter count mismatches fail before sending a query',()=>assert.throws(()=>parameterize('SELECT ? + ?', [1]),/parameter_count/));
 await check('Postgres schema initialization is idempotent',async()=>{await initializeSchema(db);await initializeSchema(db);assert.equal((await db.prepare("SELECT count(*)::integer AS n FROM information_schema.tables WHERE table_schema='public'").first()).n,7);});
 const stamp=new Date().toISOString();
 await db.prepare('INSERT INTO settings(key,value,updated_at) VALUES (?,?,?)').bind('test','before',stamp).run();
 await check('untrusted values cannot escape into SQL',async()=>{const value="'; DROP TABLE settings; --";await db.prepare('UPDATE settings SET value=? WHERE key=?').bind(value,'test').run();assert.equal((await db.prepare('SELECT value FROM settings WHERE key=?').bind('test').first()).value,value);});
 await db.prepare('UPDATE settings SET value=? WHERE key=?').bind('before','test').run();
 await check('multi-statement writes roll back on a later failure',async()=>{await assert.rejects(()=>db.batch([db.prepare('UPDATE settings SET value=? WHERE key=?').bind('should-rollback','test'),db.prepare('INSERT INTO settings(key,value,updated_at) VALUES (?,?,?)').bind('test','duplicate',stamp)]));assert.equal((await db.prepare('SELECT value FROM settings WHERE key=?').bind('test').first()).value,'before');});
 await check('an update reports zero changes for a stale condition',async()=>assert.equal((await db.prepare('UPDATE settings SET value=? WHERE key=? AND value=?').bind('after','test','not-current').run()).meta.changes,0));
 await check('upsert counters use Postgres syntax and return the new value',async()=>{const query="INSERT INTO settings(key,value,updated_at) VALUES (?, '1', ?) ON CONFLICT(key) DO UPDATE SET value=CAST(CAST(settings.value AS INTEGER)+1 AS TEXT) RETURNING value";await db.prepare(query).bind('rate:test',stamp).first();assert.equal((await db.prepare(query).bind('rate:test',stamp).first()).value,'2');});
 await check('SQL counts are numeric after explicit conversion',async()=>assert.equal(typeof (await db.prepare('SELECT count(*)::integer AS n FROM settings').first()).n,'number'));
 await check('foreign database statements cannot be mixed into a transaction',async()=>{const other=new Database(async()=>driver);await assert.rejects(()=>db.batch([other.prepare('SELECT 1')]),/mixed_transaction/);});
 await check('numeric verified provider identity is required',()=>{assert.equal(githubId('352296715'),'352296715');for(const v of ['',null,'owner@example.test','0','1 OR true'])assert.equal(githubId(v),null);});
 await check('operator access is based on stable provider id rather than display name or email',()=>{assert(isOperatorIdentity({userId:'github:352296715'},'352296715'));assert(!isOperatorIdentity({userId:'github:42',email:'owner@example.test'},'352296715'));assert(!isOperatorIdentity({userId:'github:352296715'},undefined));assert(!isOperatorIdentity(null,'352296715'));});
 await check('external and ambiguous return paths cannot become login redirects',()=>{for(const path of ['https://evil.test','//evil.test','/\\evil.test','/api/auth/callback/github'])assert.equal(safeReturnPath(path),'/');assert.equal(safeReturnPath('/ops?lang=en'),'/ops?lang=en');});
 await check('daily budget admits only the configured number of concurrent provider calls',async()=>{const calls=await Promise.allSettled(Array.from({length:7},()=>reserveModelCall(db,'3',new Date('2030-01-01T00:00:00Z'))));assert.equal(calls.filter(c=>c.status==='fulfilled').length,3);assert.equal((await db.prepare('SELECT value FROM settings WHERE key=?').bind('model-budget:2030-01-01').first()).value,'3');});
 await check('daily budget renews on the next UTC date',async()=>assert.doesNotReject(()=>reserveModelCall(db,'3',new Date('2030-01-02T00:00:00Z'))));
 await check('disabled and malformed daily budgets fail closed',async()=>{for(const limit of ['0','-1','invalid','1.5'])await assert.rejects(()=>reserveModelCall(db,limit,new Date('2030-01-03T00:00:00Z')));});
 await check('owner keys are checked against server configuration',()=>{const oldKey=process.env.OPERATOR_ACCESS_KEY,oldSecret=process.env.AUTH_SECRET;try{process.env.OPERATOR_ACCESS_KEY='SYNTHETIC_OWNER_KEY_FOR_UNIT_TEST_123456';process.env.AUTH_SECRET='SYNTHETIC_SESSION_SECRET_FOR_UNIT_TEST_123456';assert(verifyOperatorKey(process.env.OPERATOR_ACCESS_KEY));assert(!verifyOperatorKey('wrong'));assert(!verifyOperatorKey(undefined));}finally{if(oldKey===undefined)delete process.env.OPERATOR_ACCESS_KEY;else process.env.OPERATOR_ACCESS_KEY=oldKey;if(oldSecret===undefined)delete process.env.AUTH_SECRET;else process.env.AUTH_SECRET=oldSecret;}});
 await check('key rotation changes the server session credential version',()=>{const oldKey=process.env.OPERATOR_ACCESS_KEY,oldSecret=process.env.AUTH_SECRET;try{process.env.AUTH_SECRET='SYNTHETIC_SESSION_SECRET_FOR_UNIT_TEST_123456';process.env.OPERATOR_ACCESS_KEY='SYNTHETIC_OWNER_KEY_FOR_UNIT_TEST_123456';const version=operatorKeyVersion();assert(version);process.env.OPERATOR_ACCESS_KEY+='rotated';assert.notEqual(operatorKeyVersion(),version);delete process.env.OPERATOR_ACCESS_KEY;assert.equal(operatorKeyVersion(),null);}finally{if(oldKey===undefined)delete process.env.OPERATOR_ACCESS_KEY;else process.env.OPERATOR_ACCESS_KEY=oldKey;if(oldSecret===undefined)delete process.env.AUTH_SECRET;else process.env.AUTH_SECRET=oldSecret;}});
 await check('owner-key identity cannot grant operations unless explicitly enabled server-side',()=>{assert(!isOperatorIdentity({userId:'operator:owner'},undefined));assert(isOperatorIdentity({userId:'operator:owner'},undefined,true));assert(!isOperatorIdentity({userId:'operator:unknown'},undefined,true));});
 writeFileSync('database-checks.json',JSON.stringify({checks,count:checks.length,passed:true,engine:'PGlite / Postgres',live_neon_tested:false},null,2)+'\n');
 console.log(JSON.stringify({database_and_identity_checks:checks.length,passed:true,live_neon_tested:false}));
}finally{await driver.close();}
