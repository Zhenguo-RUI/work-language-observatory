import type {Bi} from "./observatory-types";
export type KeywordEntry={term:string;english:string;rank:number;documents:number;group:Bi;short:Bi;examples:{role:Bi;context:Bi;reading:Bi;question:Bi}[]};
export type Finding={id:string;title:Bi;interpretation:Bi;quantitative:Bi;contrast:Bi;mechanism:Bi;caveat:Bi;terms:string[]};
export type CrossTab={title:Bi;rowLabels:Bi[];columns:Bi[];cells:number[][];note:Bi};
export type PublicStudy={methods:{corpusN:number;archivedN:number;uniqueN:number;sources:{label:string;n:number}[];scope:Bi;frequencyNote:Bi;sampleNote:Bi;candidateVocabulary?:string[];publishedAt?:string;caseN?:number;pilotN?:number};keywords:KeywordEntry[];report:{title:Bi;standfirst:Bi;thesis:Bi;findings:Finding[];crossTabs:CrossTab[];conclusion:Bi;bibliography:{author:string;title:string;url:string;contribution:Bi}[]}};
