import {handlers} from "@/auth";
import {authenticationConfigured} from "@/lib/identity-policy";
import type {NextRequest} from "next/server";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const unavailable=()=>Response.json({error:"登录服务正在配置 / Sign-in is not configured"},{status:503,headers:{"Cache-Control":"no-store"}});
export const GET=(request:NextRequest)=>authenticationConfigured()?handlers.GET(request):unavailable();
export const POST=(request:NextRequest)=>authenticationConfigured()?handlers.POST(request):unavailable();
