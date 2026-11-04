import type {Metadata} from "next";
import "./globals.css";
export const metadata:Metadata={title:"工作语言观察站 · Work Language Observatory",description:"让能力词回到具体工作：招聘语言的语境解释、比较档案与可复核交付。",icons:{icon:"/favicon.svg"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="zh-CN"><body>{children}</body></html>;}
