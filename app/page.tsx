import Observatory from "@/components/observatory";
import {SampleReading} from "@/components/sample-reading";
import {PageNotFound} from "@/components/page-not-found";
import {resolvePublicPage} from "@/lib/page-routes";
export const dynamic="force-dynamic";
export default async function Home({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const query=await searchParams,lang=query.lang==="en"?"en":"zh",page=resolvePublicPage(query.page);
 if(!page)return <PageNotFound lang={lang}/>;
 if(page.kind==="sample")return <SampleReading lang={lang}/>;
 return <Observatory/>;
}
