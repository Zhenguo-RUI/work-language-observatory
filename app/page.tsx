import type {PublicStudy} from "@/lib/public-study-types";
import type {Metadata} from "next";
import Observatory from "@/components/observatory";
import {SampleReading} from "@/components/sample-reading";
import {PageNotFound} from "@/components/page-not-found";
import {resolvePublicPage} from "@/lib/page-routes";
export const dynamic="force-dynamic";
type SearchParams=Promise<Record<string,string|string[]|undefined>>;
export async function generateMetadata({searchParams}:{searchParams:SearchParams}):Promise<Metadata>{
 const query=await searchParams;
 return query.lang==="en"
  ? {title:"Work Language Observatory",description:"Read job descriptions in context, compare workplace terms, and explore the research behind them."}
  : {title:"工作语言观察站",description:"把招聘里的词放回具体工作：拆解岗位要求，对照不同用法，查看研究观察。"};
}

export default async function Home({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const query=await searchParams,lang=query.lang==="en"?"en":"zh",page=resolvePublicPage(query.page);
 if(!page)return <PageNotFound lang={lang}/>;
 if(page.kind==="sample")return <SampleReading lang={lang}/>;
 const study=page.view==="lexicon"||page.view==="research"?(await import("@/data/public-study.json")).default as PublicStudy:null;
 return <Observatory initialLanguage={lang} initialView={page.view} initialKeyword={typeof query.term==="string"?query.term:""} initialStudy={study}/>;
}
