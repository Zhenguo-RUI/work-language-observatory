import Link from "next/link";
import {signOut} from "@/auth";
export const dynamic="force-dynamic";
export default function SignOut(){return <main className="standalone-auth"><section className="panel auth-card"><h1>退出登录 / Sign out</h1><form action={async()=>{"use server";await signOut({redirectTo:"/"});}}><button className="button primary" type="submit">确认退出 / Confirm sign out</button></form><Link className="text-button" href="/">返回观察站 / Back to the observatory</Link></section></main>;}
