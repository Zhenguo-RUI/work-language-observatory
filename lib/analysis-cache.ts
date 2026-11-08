import {ANALYSIS_VERSION} from "./analysis-prompt";
import type {Analysis} from "./observatory-types";

/** Eligibility only; the caller still scopes the lookup to owner and exact input. */
export function canReuseAnalysis(analysis:Analysis,useModel:boolean,company:string):boolean{
 const companyContextFresh=!company||(analysis.result.context?.lookup?.status==="matched"&&analysis.result.context.briefBasis==="model");
 return companyContextFresh&&(!useModel||(analysis.engine==="model"&&analysis.result.analysisVersion===ANALYSIS_VERSION));
}
