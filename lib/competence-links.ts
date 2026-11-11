const dictionary=[["沟通", "Communication"], ["分析", "Analysis"], ["数据", "Data"], ["协调", "Coordination"], ["熟练", "Proficiency"], ["独立", "Working independently"], ["协作", "Collaboration"], ["抗压", "Coping with pressure"], ["责任心", "Responsibility"], ["适应", "Adaptability"], ["目标", "Targets"], ["服务", "Service"], ["逻辑", "Logic"], ["学习", "Learning"], ["统筹", "Orchestration"], ["主动", "Initiative"], ["英语", "English"], ["严谨", "Rigour"], ["闭环", "Closing the loop"], ["执行力", "Execution"], ["自驱", "Self-direction"]];
export function dictionaryTerm(term:string):string|null{
 if(/自驱|自我驱动|self[- ]driv|self[- ]motivat/i.test(term))return "自驱";
 return dictionary.find(([zh,en])=>term.includes(zh)||term.toLowerCase().includes(en.toLowerCase()))?.[0]||null;
}
