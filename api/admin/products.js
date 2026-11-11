'use strict';
const {send,ensureAdmin,parseBody,safeOrigin}=require('../../lib/security.cjs');
const {getCatalog,putCatalog}=require('../../lib/github.cjs');
module.exports=async(req,res)=>{
 if(!['GET','PUT'].includes(req.method))return send(res,405,{error:'Método não permitido.'});
 if(!ensureAdmin(req,res))return;
 if(req.method==='PUT'&&!safeOrigin(req))return send(res,403,{error:'Origem não autorizada.'});
 try{
  if(req.method==='GET')return send(res,200,await getCatalog());
  const body=parseBody(req,500000);const count=await putCatalog(body.products,body.sha);
  return send(res,200,{ok:true,count,message:'Catálogo salvo no GitHub. A Vercel fará nova publicação.'});
 }catch(e){return send(res,e.status||400,{error:e.message||'Falha ao salvar catálogo.'});}
};
