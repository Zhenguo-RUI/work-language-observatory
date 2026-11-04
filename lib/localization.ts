export const hasChinese=(value:string)=>/[\u3400-\u9fff]/u.test(value);
const terms:Record<string,string>={
 '独立':'Working independently','独立思考':'Independent thinking','独立站':'Standalone website','抗压':'Coping with pressure','抗压能力':'Ability to cope with pressure','压力':'Pressure','沟通':'Communication','沟通能力':'Communication skills','协作':'Collaboration','协调':'Coordination','数据':'Data','数据分析':'Data analysis','数据敏感性':'Sensitivity to data','数据能力':'Data skills','自驱':'Self-direction','主动':'Initiative','主动性':'Initiative','责任心':'Responsibility','闭环':'Follow-through','全流程':'Across the process','全链路':'Across the workflow','好内容':'Content quality','机评':'Automated evaluation','人工标注':'Human annotation','一致率':'Agreement rate','消融实验':'Ablation experiment','消融':'Ablation','可复用':'Reusable','沉淀':'Making work reusable','线上实验':'Online experiments','用户行为':'User behaviour','检索增强':'Retrieval augmentation','任务自足':'Task completion','判断':'Judgment','流程归属':'Process ownership','核对':'Reconciliation','计划':'Planning','集成':'Integration','情境':'Context','组织承诺':'Organizational commitments','反例':'Counterexamples','工作交付 / Deliverable':'Deliverable','飞书':'Feishu'};
export function englishTerm(value:string){return terms[value]||(!hasChinese(value)?value:'Source expression');}
export function displayTerm(value:string,lang:'zh'|'en'){return lang==='zh'?value:englishTerm(value);}
export function localizeError(value:string,lang:'zh'|'en'){
 const parts=value.split(/\s\/\s/);if(parts.length>1)return lang==='en'?parts.at(-1)!:parts[0];
 if(lang==='en'&&hasChinese(value))return 'The request could not be completed. Please check the entered fields and try again.';
 return value;
}
const numeral=(s:string)=>({一:'1',二:'2',三:'3',四:'4',五:'5',六:'6',七:'7',八:'8',九:'9',十:'10'} as Record<string,string>)[s]||s;
/** Deliberately bounded condition translation; never label a partial summary a complete translation. */
export function englishCondition(source:string):{text:string;complete:boolean}{
 if(!hasChinese(source))return {text:source,complete:true};
 const clauses=source.split(/[，；;。]|(?<!\d),|,(?!\d)/).map(s=>s.replace(/^(?:任职要求|任职条件|基本任职条件|工作要求|实习工资|工作地点|要求|条件|\d+[、.])[:：\s]*/,'').trim()).filter(Boolean);
 const result:string[]=[];let complete=true;
 for(const c of clauses){
  const preferred=/优先|加分/.test(c),negative=/不要求|无需|无须|不必/.test(c),mandatory=/[（(]必[）)]|必须|必备/.test(c);
  const modal=preferred?'Preferred: ':negative?'Not required: ':mandatory?'Required: ':'';
  let text='';let m:RegExpMatchArray|null;
  if((m=c.match(/(?:每周(?:到岗|出勤|实习|工作)?|每周到岗\s*)([一二三四五六七\d])\s*天(?:及以上|以上)?/))){text=`${numeral(m[1])}${/以上/.test(c)?' or more':''} days per week${/到岗|出勤/.test(c)?' on site':''}`;}
  else if((m=c.match(/([\d一二三四五六七八九十]+(?:\s*[-—至到]\s*[\d一二三四五六七八九十]+)?)\s*个月(?:及以上|以上)?/))){text=`${m[1].split(/\s*[-—至到]\s*/).map(numeral).join('–')}${/以上/.test(c)?' or more':''} months of continuous availability`;}
  else if((m=c.match(/毕业时间(?:在)?\s*(\d{4})\s*年(?:及以后|以后|及之后)?/))){text=`Graduation in ${m[1]}${/以后|之后/.test(c)?' or later':''}`;}
  else if(/本科及以上在校生/.test(c)){text='Currently enrolled in a bachelor’s or higher degree';}
  else if(/本科(?:及以上)?学历/.test(c)){text=`Bachelor’s degree${/以上/.test(c)?' or higher':''}`;}
  else if(/英语.{0,5}(?:工作语言|工作沟通)/.test(c)){text='Ability to work in English';}
  else if(/985\/211|985、211/.test(c)){text='Education at a Chinese 985/211 university'+(/海外|境外/.test(c)?' or a well-known overseas university':'');}
  else if(/北京/.test(c)&&/base|到岗|实习|现场|on.site|工作地/i.test(c)){text='Based in Beijing'+(/on.site|现场|到岗/i.test(c)?'; on-site attendance':'');}
  else if(/尽快到岗/.test(c)){text='Start as soon as possible';}
  else if(/双休/.test(c)){text='Two days off per week';}
  else if((m=c.match(/(\d[\d,]*(?:\.\d+)?)\s*[-–—~至]\s*(\d[\d,]*(?:\.\d+)?)\s*元\s*\/\s*月/))){text=`CNY ${m[1]}–${m[2]} per month`;}
  else if((m=c.match(/(\d[\d,]*)\s*元\s*\/\s*月/))){text=`CNY ${m[1]} per month`;}
  else if((m=c.match(/餐补\s*(\d[\d,]*)\s*(?:元)?\s*\/\s*月/))){text=`Meal allowance: CNY ${m[1]} per month`;}
  else if((m=c.match(/房补\s*(\d[\d,]*)\s*(?:元)?\s*\/\s*月/))){text=`Housing allowance: CNY ${m[1]} per month${/户籍外地且学校外地/.test(c)?'; both household registration and university must be outside the city':''}`;}
  else if(/不要求抗压型人格/.test(c)){text='A pressure-tolerant personality';}
  else if(/拒绝加班不影响评价/.test(c)){text='Declining overtime does not affect assessment';}
  else if(/员工可暂停通话/.test(c)){text='Employees may pause the call';}
  else if(/遇到辱骂由主管接管/.test(c)){text='The supervisor takes over when a caller becomes abusive';}
  else if(/护士长提供技术支持/.test(c)){text='The head nurse provides technical support';}
  else if(/互联网大厂产品实习经验/.test(c)){text='Prior product internship experience at a major internet company in the listed evaluation areas (automated evaluation, rubric or benchmark design, RAG, multi-turn dialogue or Agent evaluation)';}
  else if(/有Agent\/大模型策略实习经历/.test(c)){text='Prior Agent or large-language-model strategy internship experience';}
  else if(/有互联网公司战略部门、项目管理部门或咨询公司实习经历/.test(c)){text='Prior internship experience in an internet company’s strategy or project-management team, or at a consulting firm';}
  else if(/相关经验/.test(c)){text='Relevant experience';}
  else if(/SQL/.test(c)&&/经验|了解|熟悉/.test(c)&&/优先|加分/.test(c)){const ts=c.match(/Power BI|Tableau|SQL/g)||['SQL'];text=`Experience with ${ts.join(', ')}`;}
  else {complete=false;continue;}
  result.push(modal+text.replace(/[。.]+$/,'')+'.');
 }
 return {text:result.length?result.join(' '):'This source condition needs a full translation.',complete};
}
export function englishActors(s:string){
 const pairs:[RegExp,string][]=[[/算法/,'algorithm specialists'],[/研发|开发|后端/,'engineering'],[/测试/,'testing'],[/财务/,'finance'],[/数据团队/,'the data team'],[/采购/,'purchasing'],[/技术负责人/,'the technical lead'],[/主管|领班/,'the supervisor'],[/医生/,'the doctor'],[/护士长/,'the head nurse'],[/编辑/,'the editor'],[/患者|病人/,'patients'],[/家属/,'families'],[/客户|顾客/,'customers'],[/各部门|跨部门/,'other departments']];
 return [...new Set(pairs.filter(([re])=>re.test(s)).map(([,name])=>name))];
}
export function englishAuthority(s:string){
 if(!hasChinese(s))return s;
 const items:string[]=[];
 if(/可拒绝/.test(s))items.push('an explicit right to decline the stated action');
 if(/可暂停|有权叫停|立即停止|可停止|一律停止|停止录制/.test(s))items.push('permission to pause or stop the stated activity');
 if(/拍板/.test(s))items.push('decision-making within the stated scope');
 if(/向上升级|上报/.test(s))items.push('escalation to a senior role');
 if(/审批|批准|签字/.test(s))items.push('an explicit review or approval condition');
 if(/由.{1,16}决定/.test(s))items.push('a named actor retaining the decision');
 if(/无权|不得|不能|须经/.test(s))items.push('an explicit limit or prior-approval requirement');
 return items.length?`The source specifies ${items.join('; ')}. Check the original clause for the exact actor, action and scope.`:'The source contains an authority clause whose precise scope requires translation.';
}
