import type {Database} from "./database-core";

export class ModelBudgetError extends Error {}
// One reservation for every provider request, including a bounded repair.
export async function reserveModelCall(db:Database,configured:string|undefined,stamp=new Date()){
  const limit=configured===undefined?100:Number(configured);
  if(!Number.isSafeInteger(limit)||limit<0||limit>10000)throw new ModelBudgetError("invalid_model_budget");
  if(limit===0)throw new ModelBudgetError("daily_model_budget");
  const key=`model-budget:${stamp.toISOString().slice(0,10)}`;
  const row=await db.prepare("INSERT INTO settings(key,value,updated_at) VALUES (?, '1', ?) ON CONFLICT(key) DO UPDATE SET value=CAST(CAST(settings.value AS INTEGER)+1 AS TEXT),updated_at=excluded.updated_at WHERE CAST(settings.value AS INTEGER) < ? RETURNING value").bind(key,stamp.toISOString(),limit).first<{value:string}>();
  if(!row)throw new ModelBudgetError("daily_model_budget");
}
