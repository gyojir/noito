export * from './Math';

export const assert = (cond: boolean, msg?: string)=>{
  if(process.env.NODE_ENV === "development"){
    if(!cond){
      throw new Error(msg);
    }
  }
}