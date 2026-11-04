import {createHmac,createHash,timingSafeEqual} from "node:crypto";
export function operatorAccessConfigured(){return (process.env.OPERATOR_ACCESS_KEY?.length||0)>=32&&(process.env.AUTH_SECRET?.length||0)>=32;}
export function verifyOperatorKey(value:unknown){
 if(!operatorAccessConfigured()||typeof value!=="string"||value.length>256)return false;
 return timingSafeEqual(createHash("sha256").update(value).digest(),createHash("sha256").update(process.env.OPERATOR_ACCESS_KEY!).digest());
}
export function operatorKeyVersion(){return operatorAccessConfigured()?createHmac("sha256",process.env.AUTH_SECRET!).update(process.env.OPERATOR_ACCESS_KEY!).digest("hex"):null;}
