import {auth} from "@/auth";
import {authenticationConfigured,githubId} from "./identity-policy";
import {operatorAccessConfigured} from "./operator-access";
export type UserIdentity={userId:string;displayName:string;email:string;fullName:string|null};
export async function getUser():Promise<UserIdentity|null>{
  if(!authenticationConfigured())return null;
  const session=await auth();
  if(session?.user?.identity==="operator"&&session.user.id==="operator:owner"&&operatorAccessConfigured())return {userId:"operator:owner",displayName:"Project operator",email:"",fullName:null};
  const id=githubId(session?.user?.id);if(!session?.user||!id)return null;
  return {userId:`github:${id}`,displayName:session.user.name||"GitHub user",email:session.user.email||"",fullName:session.user.name||null};
}
