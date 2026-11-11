'use strict';
const {send,envReady,passwordCorrect,signSession,setSessionCookie,safeOrigin,loginLimited,parseBody}=require('../../lib/security.cjs');
module.exports=async function(req,res){
 if(req.method!=='POST')return send(res,405,{error:'Método não permitido.'});
 if(!safeOrigin(req))return send(res,403,{error:'Origem não autorizada.'});
 if(!envReady())return send(res,503,{error:'Painel ainda não configurado. Consulte README.md.'});
 if(loginLimited(req,false))return send(res,429,{error:'Muitas tentativas. Tente novamente mais tarde.'});
 let data;try{data=parseBody(req,2000)}catch{return send(res,400,{error:'Dados de login inválidos.'});}
 if(!passwordCorrect(data.password)){loginLimited(req,true);return send(res,401,{error:'Senha incorreta.'});}
 setSessionCookie(res,signSession(),req);return send(res,200,{ok:true});
};
