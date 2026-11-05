import type {Bi,CompanyContext} from "./observatory-types";

const bi=(zh:string,en:string):Bi=>({zh,en});
type Profile={id:string;aliases:RegExp;name:Bi;kind:"organization"|"platform";url:string;title:string;marker:RegExp;description:Bi};
// A small reviewed directory, not a general company search engine. No submitted
// URLs, JD text, company names or candidate details are sent to these sites.
const profiles:Profile[]=[
 {id:"tencent",aliases:/腾讯|\bTencent\b/i,name:bi("腾讯","Tencent"),kind:"organization",url:"https://www.tencent.com/who-we-are/",title:"Tencent — Who we are",marker:/Tencent.{0,120}(?:internet|technology)|Weixin|WeChat/i,description:bi("腾讯官网将其定位为互联网与科技公司，面向消费者及企业提供产品和服务。","Tencent describes itself as an internet and technology company providing products and services for consumers and businesses.")},
 {id:"xiaomi",aliases:/小米|\bXiaomi\b/i,name:bi("小米","Xiaomi"),kind:"organization",url:"https://www.mi.com/global/about/",title:"Xiaomi — About us",marker:/Xiaomi.{0,180}(?:electronics|manufacturing)|smartphones.{0,100}IoT/i,description:bi("小米官网将其定位为消费电子与智能制造公司，核心业务涉及手机、电动汽车及物联网连接的智能硬件。","Xiaomi describes itself as an electronics and smart manufacturing company spanning smartphones, electric vehicles and IoT-connected smart hardware.")},
 {id:"bytedance",aliases:/字节跳动|\bByteDance\b/i,name:bi("字节跳动","ByteDance"),kind:"organization",url:"https://www.bytedance.com/?locale=en",title:"ByteDance — About us",marker:/ByteDance.{0,150}(?:technology|creativity)|Information\/Content Platforms/i,description:bi("字节跳动官网将其定位为科技公司，展示信息内容平台、AI及交易服务等产品业务。","ByteDance presents itself as a technology company with information and content platforms, AI products and transactional services.")},
 {id:"douyin-commerce",aliases:/抖音电商|\bDouyin E-commerce\b|抖音.{0,18}(?:带货|商城|电商)|(?:电商|带货).{0,18}抖音/i,name:bi("抖音电商","Douyin E-commerce"),kind:"platform",url:"https://www.douyinec.com/",title:"Douyin E-commerce — Official platform",marker:/抖音电商|商家入驻|达人入驻/,description:bi("抖音电商官网分别设置商家、达人、机构与服务商入口；在这个平台工作的商家或服务商，并不因此成为抖音公司的员工。","Douyin E-commerce has separate entry points for merchants, creators, agencies and service providers. Working on this platform does not establish employment by its operator.")},
 {id:"oceanengine",aliases:/巨量引擎|巨量千川|\bOcean\s*Engine\b/i,name:bi("巨量引擎","Ocean Engine"),kind:"platform",url:"https://www.oceanengine.com/",title:"Ocean Engine — Marketing products",marker:/巨量引擎|营销目标|品牌建设/,description:bi("巨量引擎官网展示品牌建设、搜索营销、电商经营等不同营销目标，以及广告投放入口。","Ocean Engine presents distinct marketing objectives, including brand building, search marketing and e-commerce, with access to ad delivery tools.")}
];

// These concise profiles were checked against the linked primary pages on this
// date. Retain that date when a live request fails; never call a snapshot fresh.
const REVIEWED_ON="2026-11-05";

const verifiedCache=new Map<string,{until:number;retrievedAt:string}>();
const pending=new Map<string,Promise<string|null>>();
const MAX_PROFILE_BYTES=900_000;
async function checkOfficial(profile:Profile,request:typeof fetch):Promise<string|null>{
 const cached=verifiedCache.get(profile.id);if(cached&&cached.until>Date.now())return cached.retrievedAt;
 const inFlight=pending.get(profile.id);if(inFlight)return inFlight;
 const task=(async()=>{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),3000);
  try{
   // Redirects are never followed: even a compromised allowlisted page cannot
   // make this feature fetch a private address or a URL supplied in a JD.
   const response=await request(profile.url,{method:"GET",redirect:"error",signal:controller.signal,headers:{Accept:"text/html,application/xhtml+xml"}});
   if(!response.ok||!response.headers.get("content-type")?.includes("text/html"))return null;
   const length=Number(response.headers.get("content-length")||0);if(length>MAX_PROFILE_BYTES)return null;
   if(!response.body)return null;
   const reader=response.body.getReader(),decoder=new TextDecoder();let text="",size=0;
   try{for(;;){const next=await reader.read();if(next.done)break;size+=next.value.byteLength;if(size>MAX_PROFILE_BYTES){await reader.cancel();return null;}text+=decoder.decode(next.value,{stream:true});}}finally{reader.releaseLock();}
   // The response is used to verify a reviewed profile, never passed as prompt
   // instructions or rendered as HTML. Script bodies cannot inject directions.
   const visible=text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ").replace(/\s+/g," ");
   if(!profile.marker.test(visible))return null;
   const retrievedAt=new Date().toISOString();verifiedCache.set(profile.id,{until:Date.now()+6*3600_000,retrievedAt});return retrievedAt;
  }catch{return null;}finally{clearTimeout(timer);}
 })();pending.set(profile.id,task);try{return await task;}finally{pending.delete(profile.id);}
}

type Sector={test:RegExp;name:Bi;description:Bi;implication:Bi};
const sectors:Sector[]=[
 {test:/广告投放|信息流|竞价|千川|(?:电商|广告|媒体).{0,12}投放|投放(?:专员|运营|优化)|广告素材测试|投放.{0,25}(?:ROI|ROAS|转化)|performance marketing|media buying/i,name:bi("数字广告投放与商业转化","Digital advertising and conversion"),description:bi("这份JD将工作放在广告投放场景，应按素材、受众、预算和转化环节理解岗位，而非由平台品牌推定雇主主营业务。","The JD places the role in ad delivery. Read it through creative, audience, budget and conversion tasks rather than inferring the employer's entire business from a platform brand."),implication:bi("这里的“数据敏感”应落到投放诊断：曝光、点击与成交属于不同环节，优化素材、调整预算与决定经营目标也不是同一种权限。JD写出的职责决定需要解释哪一环；平台资料只补充业务背景。","Here, data sensitivity concerns diagnosing ad delivery: impressions, clicks and transactions are different stages, while changing creative, reallocating budget and setting business goals involve different authority. The stated duties determine the relevant stage; platform information supplies background.")},
 {test:/机评|人工标注|rubrics?|benchmark|评测集|判定逻辑|evaluator|human annotation/i,name:bi("AI产品评估与质量治理","AI product evaluation and quality"),description:bi("JD中的评测、标注或判定规则将该岗位放在AI质量工作中；这是一种职责分类，并非已验证的公司行业评级。","Evaluation, annotation or judgment rules place this role in AI quality work. This classifies the advertised duties rather than independently rating the company's industry."),implication:bi("“好内容”或“分析”在这里可能要变成可复用的判定标准，而不只是一份观点。应区分答案质量、评估器有效性、标注分歧与线上任务结果，不能用公司AI业务背景替代当前岗位的证据。","Good content or analysis may need to become reusable judgment criteria rather than an opinion. Distinguish answer quality, evaluator validity, annotation disagreement and online task outcomes; an AI company profile does not establish this role's duties.")},
 {test:/Agent|工具调用|Function Calling|MCP|智能助手|小爱|AI Native/i,name:bi("AI交互与Agent产品","AI interaction and agent products"),description:bi("JD中的Agent、工具调用或智能助手线索指向AI交互任务；开发、策略设计和测试仍须按原文职责分别识别。","Agent, tool-use or assistant language points to AI interaction work. Development, strategy design and testing still need to be distinguished using the stated duties."),implication:bi("“闭环”应连接理解、执行与反馈的具体链路：提出理想效果、定义可测标准和决定发布并非同一工作。若涉及多端或设备控制，还应检查功能调用成功与用户任务完成是否分别验收。","Read a loop through the specified understanding, execution and feedback stages. Proposing an ideal outcome, defining a test and authorizing release are different work. Where devices or multiple endpoints appear, distinguish successful tool calls from completion of the user's task.")},
 {test:/尽调|私募|投资岗|投后|产业基金|venture capital|due diligence|private equity/i,name:bi("投资研究与项目支持","Investment research and project support"),description:bi("行业资料、尽调或投后跟踪把职责放在投资项目流程中；协助撰写和数据核对本身不等于投资决策权。","Industry research, diligence or portfolio monitoring locates the work in an investment process. Drafting and checking data do not themselves confer investment authority."),implication:bi("“细心”“责任心”在这里关联材料可追溯性：数据来源、报告口径和版本是否能被复核。研究形成判断、撰写初稿与决定是否投资处在不同位置；不能因公司投资规模而提高实习岗位的权限。","Care and responsibility concern traceable evidence, report definitions and versions. Forming a research judgment, drafting a report and authorizing an investment occupy different positions; the firm's investment scale does not increase an intern's authority.")},
 {test:/短视频|直播|内容运营|涨粉|创作者|content creation|livestream/i,name:bi("内容制作与平台运营","Content production and platform operations"),description:bi("JD中的内容制作或平台运营职责涉及作品、受众和传播结果；是否承担销售转化，以广告原文为准。","The content or platform duties involve outputs, audiences and distribution. Sales responsibility is included only where the JD states it."),implication:bi("“创意”与“结果导向”需要分别连接作品质量、传播表现或成交任务。平台可见指标为工作提供反馈，但不能据平台的存在就断言该雇主以算法奖惩员工。","Connect creativity and result orientation to output quality, distribution or sales as stated. Platform metrics can inform the work, but the platform's presence does not prove algorithmic rewards or sanctions by this employer.")},
 {test:/财务|会计|核算|对账|发票|accounting|reconciliation/i,name:bi("财务记录与核验","Financial records and verification"),description:bi("账目或核算职责要求把业务活动转成可复核记录；招聘公司的业务性质仍应另行确认。","Accounting or reconciliation translates business activity into reviewable records. The employer's own business remains a separate question."),implication:bi("“严谨”在这里需要对应口径、差异与复核环节。生成数字、解释差异和批准提交是不同责任，不能从办公软件熟练度推定签字权。","Rigor concerns definitions, discrepancies and review. Producing figures, explaining differences and approving submission are different responsibilities; software proficiency does not imply sign-off authority.")},
 {test:/制造|生产线|工艺|质检|设备(?:的|日常|定期|运行)?(?:维护|维修|调试|检验|保养)|manufactur|production line/i,name:bi("生产制造与质量保障","Manufacturing and quality assurance"),description:bi("设备、工艺或质量职责将工作放在生产协作场景中；具体产品与工序以JD为界。","Equipment, process or quality duties place the work in production coordination, within the products and stages stated in the JD."),implication:bi("“执行力”不只是做得快，还可能涉及按工艺落实、记录异常和停止不合格流程。是否有停工、改参或放行权限，应分别读取原文，避免把遵循标准与决定标准混为一谈。","Execution can involve applying procedures, recording exceptions and stopping nonconforming processes as well as speed. Read any authority to halt work, change parameters or release products separately; applying standards and setting them differ.")},
 {test:/护理|诊疗|患者|临床|照护|clinical|patient care/i,name:bi("医疗照护与专业服务","Healthcare and professional care"),description:bi("患者或诊疗相关职责涉及照护与专业协作；JD本身不证明机构资质或执业权限。","Patient or clinical duties concern care and professional collaboration. The JD does not itself verify institutional credentials or licensing."),implication:bi("“耐心”或“沟通”应对应患者理解、信息交接或指定照护任务，而不是泛化为情绪承受。临床决定、沟通解释和按医嘱执行需要不同的授权依据。","Read patience or communication through patient understanding, handovers or specified care rather than generic emotional endurance. Clinical decisions, explanations and implementation of orders require distinct authority.")},
 {test:/软件(?:开发|测试|架构|工程)|(?:开发|测试).{0,8}软件|接口|后端|前端|数据库|(?:代码|系统|程序|应用|客户端|服务端).{0,8}开发|开发.{0,8}(?:系统|应用|接口|程序)|software (?:develop|test|engineer)|backend|frontend|\bAPI\b/i,name:bi("软件与技术交付","Software and technical delivery"),description:bi("JD的开发或系统职责指向技术交付，不能仅因使用数据或软件就推定公司是科技企业。","Development or system duties point to technical delivery. Using data or software alone does not establish that the employer is a technology business."),implication:bi("“独立”应对应具体的开发、定位问题或交付边界；技术方案提出权、代码评审和发布权可能由不同角色承担，应逐项依据JD解释。","Independence needs a specified development, debugging or delivery scope. Proposing a design, reviewing code and authorizing release can belong to different roles and need separate JD evidence.")}
];

export async function enrichCompanyContext(options:{raw:string;title:string;company?:string;request?:typeof fetch;onProgress?:(stage:string)=>void}):Promise<CompanyContext>{
 options.onProgress?.("context");
 const raw=options.raw,scope=`${options.title}\n${raw}`,company=options.company?.trim()||"";
 const named=company&&!/代理|服务商|合作商|外包|\bagency\b|reseller|outsourc/i.test(company)?profiles.find(p=>p.aliases.test(company)):undefined;
 const profile=named||profiles.find(p=>p.aliases.test(options.title))||profiles.find(p=>p.aliases.test(scope));
 const unverifiedPlatform=!profile&&/抖音|\bDouyin\b/i.test(scope);
 const sector=sectors.find(s=>s.test.test(scope));
 const lines=raw.split(/\n|[。；;]/).map(v=>v.trim()).filter(Boolean);
 const evidence=lines.filter(v=>(profile?.aliases.test(v)||sector?.test.test(v))).slice(0,3).map(v=>v.length>500?v.slice(0,500):v);
 let relationship:CompanyContext["company"]["relationship"]="unresolved";
 if(company)relationship=named?.kind==="platform"?"platform":"employer";
 else if(profile?.kind==="platform"||unverifiedPlatform)relationship="platform";
 else if(profile){
  const first=options.title||lines[0]||"";
  const startsWithBrand=profile.aliases.exec(first)?.index===0;
  if(startsWithBrand&&!/代理|服务商|合作商|驻场|外包|客户|\bagency\b|outsourc/i.test(first))relationship="employer";
  else if(/客户|服务|client|customer/i.test(lines.find(v=>profile.aliases.test(v))||""))relationship="client";
 }
 const liveRetrievedAt=profile?await checkOfficial(profile,options.request||fetch):null;
 const retrievedAt=liveRetrievedAt||(profile?REVIEWED_ON:null);
 const matchesEmployer=!company||!!named;
 const name=matchesEmployer&&profile?profile.name:company?bi(company,/^[\x20-\x7e]+$/.test(company)?company:"Employer named by the user"):unverifiedPlatform?bi("抖音（材料所提平台）","Douyin (platform mentioned in the JD)"):bi("雇主未明确","Employer not identified");
 let description=bi("材料未提供可独立核验的公司简介；本次只解释JD中的工作安排。","No independently verified company profile is available; this reading uses the advertised work arrangements.");
 if(profile&&retrievedAt&&matchesEmployer)description=profile.description;
 else if(profile&&retrievedAt)description=bi(`用户填写了雇主名称；材料另提到${profile.name.zh}。下列官方背景只适用于该组织／平台，不能证明用户填写雇主的主营业务、身份或内部考核。`,`An employer name was supplied, and the JD also mentions ${profile.name.en}. The official background applies only to that organization or platform and does not verify the named employer, its business or internal appraisal practices.`);
 else if(profile)description=bi(`${profile.name.zh}出现在材料中；本次未成功核验其官网简介，因此不补充公司事实。`,`${profile.name.en} appears in the supplied material. Its official profile could not be checked for this reading, so no company facts have been added.`);
 const notice=liveRetrievedAt?bi("公司／平台简介来自下列官网；行业归类和岗位含义依据本JD。官网介绍不验证招聘真实性，也不证明团队内部管理。","The company or platform profile comes from the official source below; the sector and role interpretation come from this JD. The profile verifies neither the vacancy nor internal team practices."):profile?bi(`本次未重新获取官网，使用${REVIEWED_ON}核对的官方资料快照；这不是实时公司调查。行业归类依据JD，官网背景不验证招聘真实性或内部管理。`,`The official page could not be fetched for this reading; the profile uses a reviewed reference dated ${REVIEWED_ON}, not a live company investigation. The sector uses the JD; official background verifies neither the vacancy nor internal management.`):bi("本次未获得可核验的官网资料；行业与语境仅依据JD。当前只对少量已核对官网提供补充，不会编造未知公司的介绍。","No official profile was verified for this reading. The sector and context use the JD only; official enrichment currently covers a small reviewed directory and does not invent profiles for unknown employers.");
 return {company:{name,relationship,description,basis:retrievedAt&&matchesEmployer?"official":"jd"},industry:{name:sector?.name||bi("按JD识别的工作场景","Work setting described in the JD"),description:sector?.description||bi("现有文本不足以可靠细分行业；应先区分服务对象、工作产物与协作关系。","The supplied text does not support a precise sector classification; identify the recipients, outputs and work relations first."),basis:"jd"},implication:sector?.implication||bi("同一能力词的含义由它修饰的动作、面向的对象及验收位置决定。公司规模或知名度不能替代JD中对职责与授权的表述。","A competence term takes meaning from its action, recipient and assessment position. Company size or reputation cannot replace the JD's statements about duties and authority."),sources:profile&&retrievedAt?[{title:profile.title,url:profile.url,retrievedAt,verification:liveRetrievedAt?"live":"reviewed"}]:[],status:retrievedAt?"verified":evidence.length||company?"jd_only":"unavailable",evidence,notice};
}
