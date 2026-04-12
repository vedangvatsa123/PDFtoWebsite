import dotenv from "dotenv";
dotenv.config({path:".env.local"});
const SB=process.env.NEXT_PUBLIC_SUPABASE_URL,SK=process.env.SUPABASE_SERVICE_ROLE_KEY;
const h={"apikey":SK,"Authorization":"Bearer "+SK};
const all=[];let off=0;
while(true){const r=await fetch(SB+"/rest/v1/jobs?select=tags&offset="+off+"&limit=1000",{headers:h});const j=await r.json();if(!j.length)break;all.push(...j);off+=j.length;if(j.length<1000)break;}
console.log("Total jobs:",all.length);
const langs={"go":0,"python":0,"sql":0,"javascript":0,"java":0,"typescript":0,"rust":0,"ruby":0,"kotlin":0,"c++":0,"c#":0};
for(const job of all){
  const tags=(Array.isArray(job.tags)?job.tags:[]).map(t=>String(t).toLowerCase().trim());
  for(const l of Object.keys(langs)){
    if(tags.some(t=>t===l||t.includes(l)||(l==="go"&&(t==="golang"||t==="go")))) langs[l]++;
  }
}
console.log("\nLanguage tag frequency:");
for(const[l,c]of Object.entries(langs).sort((a,b)=>b[1]-a[1])){
  console.log("  "+l.padEnd(15)+String(c).padStart(5)+" / "+all.length+"  ("+(c/all.length*100).toFixed(1)+"%)");
}
