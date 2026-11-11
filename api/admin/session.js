'use strict';
const {send,envReady,isSession}=require('../../lib/security.cjs');
module.exports=async(req,res)=>{if(req.method!=='GET')return send(res,405,{error:'Método não permitido.'});return send(res,200,{configured:envReady(),authenticated:isSession(req)});};
