export type SqlStatement = {text:string;values:unknown[]};
export type SqlResult = {rows:Record<string,unknown>[];rowCount:number|null};
export type SqlDriver = {
  execute(statement:SqlStatement):Promise<SqlResult>;
  transaction(statements:SqlStatement[]):Promise<SqlResult[]>;
  close?():Promise<void>;
};

// Statements are authored server-side; all submitted values remain parameters.
export function parameterize(sql:string,values:unknown[]):SqlStatement {
  let text="",quoted=false,index=0;
  for(let at=0;at<sql.length;at++){
    const char=sql[at];
    if(char==="'"){
      if(quoted&&sql[at+1]==="'"){text+="''";at++;continue;}
      quoted=!quoted;
    }
    text+=char==="?"&&!quoted?`$${++index}`:char;
  }
  if(index!==values.length)throw new Error("database_parameter_count");
  return {text,values};
}

export class PreparedStatement {
  constructor(readonly owner:Database,readonly sql:string,readonly values:unknown[]=[]){}
  bind(...values:unknown[]){return new PreparedStatement(this.owner,this.sql,values);}
  statement(){return parameterize(this.sql,this.values);}
  async all<T=Record<string,unknown>>(){const result=await this.owner.execute(this.statement());return {results:result.rows as T[]};}
  async first<T=Record<string,unknown>>(){return (await this.all<T>()).results[0]??null;}
  async run(){const result=await this.owner.execute(this.statement());return {meta:{changes:result.rowCount??0}};}
}
export class Database {
  constructor(private readonly driver:()=>Promise<SqlDriver>){}
  prepare(sql:string){return new PreparedStatement(this,sql);}
  async execute(statement:SqlStatement){return (await this.driver()).execute(statement);}
  async batch(statements:PreparedStatement[]){
    if(statements.some(statement=>statement.owner!==this))throw new Error("database_mixed_transaction");
    if(!statements.length)return [];
    return (await (await this.driver()).transaction(statements.map(s=>s.statement()))).map(result=>({results:result.rows,meta:{changes:result.rowCount??0}}));
  }
}
