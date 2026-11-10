import Link from "next/link";
import {signIn} from "@/auth";
import {AuthError} from "next-auth";
import {redirect} from "next/navigation";
import {githubAuthenticationConfigured,safeReturnPath} from "@/lib/identity-policy";
import {operatorAccessConfigured} from "@/lib/operator-access";
export const dynamic="force-dynamic";
export default async function SignIn({searchParams}:{searchParams:Promise<{return_to?:string;callbackUrl?:string;error?:string}>}){
 const query=await searchParams,returnTo=safeReturnPath(query.return_to||query.callbackUrl||"/");
 const githubReady=githubAuthenticationConfigured(),operatorReady=operatorAccessConfigured();
 return <main className="standalone-auth"><section className="panel auth-card"><p className="eyebrow">WORK LANGUAGE OBSERVATORY</p><h1>登录观察站 / Sign in</h1><p>公开分析与研究汇总无需账号。</p><p>The public tool and aggregate findings need no account.</p>{query.error&&<p role="alert">登录信息无效，请重试。 / Sign-in failed. Please try again.</p>}
 {githubReady?<form action={async()=>{"use server";await signIn("github",{redirectTo:returnTo});}}><button className="button primary" type="submit">使用 GitHub 登录 / Continue with GitHub</button></form>:<p>个人云端历史暂未开放，匿名结果可以导出。<br/>Personal cloud history is not yet enabled; anonymous results can be exported.</p>}
 {operatorReady&&<details open={returnTo.startsWith("/ops")}><summary>项目运营者登录 / Operator sign-in</summary><form action={async(formData)=>{"use server";try{await signIn("operator-key",{accessKey:String(formData.get("accessKey")||""),redirectTo:returnTo});}catch(error){if(error instanceof AuthError)redirect("/auth/signin?return_to="+encodeURIComponent(returnTo)+"&error=invalid");throw error;}}}><label>管理员口令 / Operator access key<input type="password" name="accessKey" autoComplete="current-password" required maxLength={256}/></label><button className="button primary" type="submit">进入运营工作区 / Open operations</button></form></details>}
 <Link className="text-button" href="/">返回观察站 / Back to the observatory</Link></section></main>;
}
