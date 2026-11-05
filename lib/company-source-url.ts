// Citation validation only. Search results are never fetched as arbitrary URLs.
export function publicCompanySourceUrl(value:string){
 try{const url=new URL(value),host=url.hostname.toLowerCase();return ["https:","http:"].includes(url.protocol)&&!url.username&&!url.password&&host.includes(".")&&!/^(?:localhost|127\.|0\.|10\.|169\.254\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(host)&&!/^\[/.test(host)&&!/(?:^|\.)(?:localhost|local|internal|invalid|test|example)$/.test(host);}catch{return false;}
}
