import rawSeeds from "@/data/seeds.json";
import rawTranslations from "@/data/seed-translations.json";
import type {AnalysisResult, SourceTranslation} from "./observatory-types";

// Public exports intentionally have no individual archive or case records.
// Explicit types keep the application buildable when those arrays are empty.
type Seed = {
  id:string;
  title:string;
  company:string;
  raw_text:string;
  source_url:string;
  result:AnalysisResult;
};
type PreparedTranslation = SourceTranslation & {
  id:string;
  sourceTitle:string;
  sourceRaw:string;
  comparisonTitles:Record<string,string>;
};
export const seeds = rawSeeds as Seed[];
export const seedTranslations = rawTranslations as PreparedTranslation[];
