import type {DefaultSession} from "next-auth";
declare module "next-auth" {
 interface Session {user:{id:string;identity:"github"|"operator"}&DefaultSession["user"]}
 interface User {identity?:"github"|"operator";operatorVersion?:string}
}
declare module "@auth/core/jwt" {interface JWT {githubId?:string;identity?:"github"|"operator";operatorVersion?:string}}
