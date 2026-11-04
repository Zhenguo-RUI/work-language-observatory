import {PGlite} from "@electric-sql/pglite";
import type {SqlDriver,SqlResult} from "./database-core";
import {mkdir} from "node:fs/promises";

// Development-only Postgres engine. Never a persistence fallback in production.
export async function localDriver(location:string):Promise<SqlDriver>{
  if(location!=="memory")await mkdir(location,{recursive:true});
  const pg=new PGlite(location==="memory"?undefined:location);
  await pg.waitReady;
  const normalize=(r:{rows:unknown[];affectedRows?:number}):SqlResult=>({rows:r.rows as Record<string,unknown>[],rowCount:r.affectedRows??r.rows.length});
  return {
    close:()=>pg.close(),
    execute:async q=>normalize(await pg.query(q.text,q.values)),
    transaction:async qs=>pg.transaction(async tx=>{
      const results:SqlResult[]=[];
      for(const q of qs)results.push(normalize(await tx.query(q.text,q.values)));
      return results;
    }),
  };
}
