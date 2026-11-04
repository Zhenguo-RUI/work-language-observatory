import {handleApi} from "@/lib/observatory-server";
export const dynamic="force-dynamic";
type Context={params:Promise<{path:string[]}>};
async function route(request:Request,context:Context){return handleApi(request,(await context.params).path);}
export {route as GET,route as POST,route as PATCH};
