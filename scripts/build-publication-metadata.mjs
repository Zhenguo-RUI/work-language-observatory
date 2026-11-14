/** Derive public version labels from aggregate provenance, never from raw advertisements. */
import {readFileSync,writeFileSync} from "node:fs";
import {resolve} from "node:path";
const root=resolve(process.env.WLO_RESEARCH_ROOT||process.cwd());
const read=p=>JSON.parse(readFileSync(resolve(root,p),"utf8"));
const counts=read("research/aggregates/term_counts.json"),rule=read("research/config/self-drive-v1.json"),extension=read("research/logs/self-drive-extension.json");
const updatedAt=new Intl.DateTimeFormat("sv-SE",{timeZone:"Asia/Shanghai",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(extension.generated));
writeFileSync(resolve(root,"data/publication-metadata.json"),JSON.stringify({corpusVersion:counts.run_id,vocabularyVersion:rule.version,inputSha256:counts.input_sha256,updatedAt,author:"Rui Zhenguo",role:"Designer & Researcher",url:"https://work-language-observatory.org/?page=research"},null,2)+"\n");
console.log("Public publication metadata generated from recorded aggregate provenance.");
