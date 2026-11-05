import type {Analysis} from "./observatory-types";
import {readingBlocks,type ReadingBlock} from "./reading-export";

let fontPromise:Promise<ArrayBuffer>|undefined;
async function loadFont(){
 if(!fontPromise)fontPromise=fetch("/fonts/NotoSansSC-Regular.ttf",{signal:AbortSignal.timeout(45000)}).then(r=>{if(!r.ok)throw new Error("PDF_FONT_UNAVAILABLE");return r.arrayBuffer();}).catch(e=>{fontPromise=undefined;throw e;});
 return fontPromise;
}

/** Browser-local, selectable-text PDF; no JD is uploaded to a PDF service. */
export async function generateReadingPdf(a:Analysis,lang:"zh"|"en",options:{fontBytes?:ArrayBuffer|Uint8Array}={}):Promise<Uint8Array>{
 const [{PDFDocument,rgb},fontkitModule,fontBytes]=await Promise.all([import("pdf-lib"),import("@pdf-lib/fontkit"),options.fontBytes?Promise.resolve(options.fontBytes):loadFont()]);
 const doc=await PDFDocument.create();doc.registerFontkit(fontkitModule.default);
 // Full embedding avoids missing visible CJK glyphs in fontkit subset output.
 const font=await doc.embedFont(fontBytes,{subset:false});
 const supported=new Set(font.getCharacterSet()),unmapped=new Set<string>();
 function clean(value:string){return Array.from(value.replace(/\r\n?/g,"\n").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,"")).map(c=>{
  if(c==="\n"||c==="\t"||supported.has(c.codePointAt(0)!))return c==="\t"?"    ":c;
  const code=`U+${c.codePointAt(0)!.toString(16).toUpperCase()}`;unmapped.add(code);return `[${code}]`;
 }).join("");}
 const width=595.28,height=841.89,left=48,right=48,bottom=53,contentWidth=width-left-right;
 const ink=rgb(.12,.15,.15),muted=rgb(.39,.42,.41),accent=rgb(.66,.25,.18),rule=rgb(.83,.82,.78);
 let page=doc.addPage([width,height]),y=height-91;
 const pages=()=>doc.getPages();
 function pageHeader(){page.drawText("WORK LANGUAGE OBSERVATORY",{x:left,y:height-36,size:8.2,font,color:muted});page.drawLine({start:{x:left,y:height-47},end:{x:width-right,y:height-47},color:rule,thickness:.55});}
 pageHeader();
 function nextPage(){page=doc.addPage([width,height]);y=height-76;pageHeader();}
 function room(required:number){if(y-required<bottom)nextPage();}
 function wrap(text:string,size:number,available:number):string[]{
  const lines:string[]=[];
  for(const paragraph of clean(text).split("\n")){
   const tokens=paragraph.match(/[A-Za-z0-9][A-Za-z0-9'’.,:;!?/@#%&+_=()\-]*|[ \t]+|./gu)||[];
   let line="";
   for(const token of tokens){
    const candidate=line+token;
    if(font.widthOfTextAtSize(candidate,size)<=available){line=candidate;continue;}
    if(line.trim()){lines.push(line.trimEnd());line="";}
    if(!token.trim())continue;
    if(font.widthOfTextAtSize(token,size)<=available){line=token;continue;}
    for(const char of token){if(line&&font.widthOfTextAtSize(line+char,size)>available){lines.push(line);line="";}line+=char;}
   }
   lines.push(line.trimEnd());
  }
  return lines;
 }
 function block(b:ReadingBlock){
  const size=b.kind==="title"?22:b.kind==="heading"?14:b.kind==="subheading"?11.4:b.kind==="meta"?8.3:b.kind==="quote"?9.5:10.3;
  const leading=size*(b.kind==="title"?1.46:1.63),indent=b.kind==="quote"?13:0;
  const lines=wrap(b.text,size,contentWidth-indent);
  if(b.kind==="heading"){room(leading*3+14);y-=14;}
  else if(b.kind==="subheading")room(leading*2+8);
  else room(leading+3);
  for(const line of lines){
   room(leading);
   if(b.kind==="quote")page.drawLine({start:{x:left+2,y:y+size*.8},end:{x:left+2,y:y-leading+size*.8},color:accent,thickness:1.5});
   if(line)page.drawText(line,{x:left+indent,y,size,font,color:b.kind==="heading"?accent:b.kind==="meta"||b.kind==="quote"?muted:ink});
   y-=leading;
  }
  y-=b.kind==="title"?15:b.kind==="heading"?6:b.kind==="meta"?8:9;
 }
 const content=readingBlocks(a,lang);for(const b of content)block(b);
 if(unmapped.size)block({kind:"meta",text:(lang==="zh"?"字体未覆盖的符号已保留为 Unicode 码位：":"Symbols outside the font are preserved as Unicode code points: ")+Array.from(unmapped).join(", ")});
 const allPages=pages();allPages.forEach((p,i)=>{
  p.drawLine({start:{x:left,y:39},end:{x:width-right,y:39},color:rule,thickness:.55});
  p.drawText(clean(lang==="zh"?"语境阅读 · 不是对实际工作经历的核实":"A situated reading; not verified employment experience"),{x:left,y:24,size:7.4,font,color:muted});
  const n=`${i+1} / ${allPages.length}`;p.drawText(n,{x:width-right-font.widthOfTextAtSize(n,8),y:24,size:8,font,color:muted});
 });
 const title=lang==="en"&&a.result.sourceTranslation?a.result.sourceTranslation.titleEn:a.title;
 doc.setTitle(title);doc.setAuthor("Work Language Observatory");doc.setSubject(lang==="zh"?"招聘文本语境分析":"Situated job advertisement reading");doc.setCreator("Work Language Observatory - browser-local PDF export");doc.setLanguage(lang==="zh"?"zh-CN":"en");
 return doc.save();
}

export async function exportReadingPdf(a:Analysis,lang:"zh"|"en"):Promise<void>{
 const bytes=await generateReadingPdf(a,lang),blob=new Blob([new Uint8Array(bytes)],{type:"application/pdf"}),url=URL.createObjectURL(blob),link=document.createElement("a");
 link.href=url;link.download=`work-language-${a.id.replace(/[^a-zA-Z0-9_-]/g,"-")}-${lang}.pdf`;link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
