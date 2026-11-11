'use strict';
const {send,ensureAdmin,parseBody,safeOrigin}=require('../../lib/security.cjs');
const {uploadImage}=require('../../lib/github.cjs');
module.exports=async(req,res)=>{
 if(req.method!=='POST')return send(res,405,{error:'Método não permitido.'});
 if(!ensureAdmin(req,res))return;
 if(!safeOrigin(req))return send(res,403,{error:'Origem não autorizada.'});
 try{
 const body=parseBody(req,2400000);
 if(typeof body.base64!=='string'||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(body.base64))throw Error('Formato de imagem inválido.');
 const path=await uploadImage(Buffer.from(body.base64,'base64'),body.mime);return send(res,200,{ok:true,path,message:'Imagem adicionada ao GitHub.'});
 }catch(e){return send(res,e.status||400,{error:e.message||'Falha no upload.'});}
};
