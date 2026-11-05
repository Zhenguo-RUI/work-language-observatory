// Next's internal Request URL can use localhost even when the browser addresses
// 127.0.0.1 or a public deployment host. Host is the browser's destination;
// do not trust an arbitrary client-supplied forwarded-host header.
export function sameRequestOrigin(request:Request,vercel=false){
 const origin=request.headers.get("origin");if(!origin)return true;
 const url=new URL(request.url),host=request.headers.get("host")||url.host;
 return origin===`${vercel?"https:":url.protocol}//${host}`;
}
