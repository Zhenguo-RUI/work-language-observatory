import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import {githubId} from "./lib/identity-policy";
import {operatorAccessConfigured,verifyOperatorKey,operatorKeyVersion} from "./lib/operator-access";

export const {handlers,auth,signIn,signOut}=NextAuth({
 providers:[
  ...(process.env.AUTH_GITHUB_ID&&process.env.AUTH_GITHUB_SECRET?[GitHub({clientId:process.env.AUTH_GITHUB_ID,clientSecret:process.env.AUTH_GITHUB_SECRET})]:[]),
  Credentials({id:"operator-key",name:"Project operator",credentials:{accessKey:{label:"Operator access key",type:"password"}},authorize(credentials){
   if(!verifyOperatorKey(credentials.accessKey))return null;
   return {id:"owner",name:"Project operator",identity:"operator",operatorVersion:operatorKeyVersion()!};
  }}),
 ],
 secret:process.env.AUTH_SECRET,
 trustHost:process.env.VERCEL==="1"||process.env.NODE_ENV!=="production",
 session:{strategy:"jwt",maxAge:7*24*60*60},
 pages:{signIn:"/auth/signin"},
 callbacks:{
  signIn({account,profile,user}){
   if(account?.provider==="operator-key")return operatorAccessConfigured()&&user.identity==="operator";
   return account?.provider==="github"&&!!githubId(profile?.id);
  },
  jwt({token,account,profile,user}){
   if(account?.provider==="operator-key"){
    token.identity="operator";token.sub="operator:owner";token.operatorVersion=user.operatorVersion;delete token.githubId;
   }else if(account?.provider==="github"){
    const id=githubId(profile?.id);if(!id)throw new Error("Invalid provider identity");
    token.identity="github";token.githubId=id;token.sub=`github:${id}`;delete token.operatorVersion;
   }
   if(token.identity==="operator"&&(!operatorAccessConfigured()||token.operatorVersion!==operatorKeyVersion()))return null;
   // Caller-supplied session updates never set identity or privileges.
   return token;
  },
  session({session,token}){
   session.user.identity=token.identity==="operator"?"operator":"github";
   session.user.id=session.user.identity==="operator"?"operator:owner":githubId(token.githubId)||"";
   return session;
  },
 },
});
