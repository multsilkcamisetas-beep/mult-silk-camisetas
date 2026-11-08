'use strict';
const {send,clearSessionCookie,safeOrigin}=require('../../lib/security.cjs');
module.exports=async(req,res)=>{if(req.method!=='POST')return send(res,405,{error:'Método não permitido.'});if(!safeOrigin(req))return send(res,403,{error:'Origem não autorizada.'});clearSessionCookie(res,req);return send(res,200,{ok:true});};
