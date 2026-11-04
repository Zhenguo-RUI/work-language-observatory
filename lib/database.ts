import {neon} from "@neondatabase/serverless";
import {Database,type SqlDriver,type SqlResult} from "./database-core";
import {initializeSchema} from "./database-schema";

const connection=()=>process.env.DATABASE_URL||process.env.POSTGRES_URL||"";
export const databaseConfigured=()=>!!connection()||process.env.NODE_ENV!=="production";
let driverPromise:Promise<SqlDriver>|undefined;
async function loadDriver():Promise<SqlDriver>{
  if(driverPromise)return driverPromise;
  driverPromise=(async()=>{
    const url=connection();
    if(!url||url.startsWith("pglite:")){
      if(process.env.NODE_ENV==="production")throw new Error("database_configuration_required");
      const {localDriver}=await import("./database-local");
      return localDriver(url.startsWith("pglite:")?url.slice(7):".runtime/observatory");
    }
    try{const parsed=new URL(url);if(!["postgres:","postgresql:"].includes(parsed.protocol))throw new Error();}catch{throw new Error("database_configuration_invalid");}
    const sql=neon(url,{fullResults:true});
    return {
      execute:async query=>await sql.query(query.text,query.values) as unknown as SqlResult,
      transaction:async queries=>await sql.transaction(queries.map(q=>sql.query(q.text,q.values))) as unknown as SqlResult[],
    };
  })();
  try{return await driverPromise;}catch(error){driverPromise=undefined;throw error;}
}
const instance=new Database(loadDriver);
export function getDatabase(){if(!databaseConfigured())throw new Error("database_configuration_required");return instance;}
let initialized:Promise<void>|undefined;
export async function ensureDatabase(){
  if(!initialized)initialized=initializeSchema(getDatabase());
  try{await initialized;}catch(error){initialized=undefined;throw error;}
}
