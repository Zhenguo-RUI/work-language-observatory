import {fillStats} from "@/lib/research-stats";
import {researchObservations} from "@/lib/research-observations";
import {homeResearchCopy} from "@/lib/home-research-copy";
export function HomeResearchNote({lang}:{lang:"zh"|"en"}){const finding=researchObservations.find(item=>item.id==="pressure-coordination")!;return <section className="home-research-note" aria-label={lang==="zh"?"研究摘要":"Research summary"}><span>{fillStats(homeResearchCopy.size[lang],lang)}</span><p>{finding.title[lang]}</p><a className="text-button" href={`/?page=research&lang=${lang}`}>{lang==="zh"?"看研究观察":"Read the research notes"} →</a></section>;}
