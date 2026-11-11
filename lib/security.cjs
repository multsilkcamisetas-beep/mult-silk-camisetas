'use strict';
const crypto=require('node:crypto');
const COOKIE_NAME='multsilk_admin',SESSION_SECONDS=28800;
const attempts=new Map();
function send(res,status,data){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.end(JSON.stringify(data));}
function envReady(){return !!(process.env.ADMIN_PASSWORD?.length>=12&&process.env.SESSION_SECRET?.length>=32&&process.env.GITHUB_TOKEN);}
function getCookie(req){const v=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE_NAME+'='));return v?v.slice(COOKIE_NAME.length+1):'';}
function hmac(data){return crypto.createHmac('sha256',process.env.SESSION_SECRET).update(data).digest('base64url');}
function signSession(){const data=Buffer.from(JSON.stringify({exp:Date.now()+SESSION_SECONDS*1000,nonce:crypto.randomBytes(12).toString('hex')})).toString('base64url');return data+'.'+hmac(data);}
function isSession(req){if(!envReady())return false;const token=getCookie(req).split('.');if(token.length!==2||!token[0]||!token[1])return false;const expected=Buffer.from(hmac(token[0])),received=Buffer.from(token[1]);if(expected.length!==received.length||!crypto.timingSafeEqual(expected,received))return false;try{const obj=JSON.parse(Buffer.from(token[0],'base64url').toString('utf8'));return Number.isFinite(obj.exp)&&obj.exp>Date.now()&&obj.exp<Date.now()+SESSION_SECONDS*1000;}catch{return false;}}
function passwordCorrect(candidate){if(!envReady()||typeof candidate!=='string')return false;const sha=s=>crypto.createHash('sha256').update(s).digest();return crypto.timingSafeEqual(sha(candidate),sha(process.env.ADMIN_PASSWORD));}
function cookie(res,value,req,age){const secure=(req.headers['x-forwarded-proto']||'').includes('https')||process.env.VERCEL==='1'?'; Secure':'';res.setHeader('Set-Cookie',COOKIE_NAME+'='+value+'; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age='+age+secure);}
function setSessionCookie(res,token,req){cookie(res,token,req,SESSION_SECONDS);}
function clearSessionCookie(res,req){cookie(res,'',req,0);}
function safeOrigin(req){const origin=req.headers.origin,host=req.headers['x-forwarded-host']||req.headers.host;if(!origin||!host)return false;try{const u=new URL(origin);return u.host===host&&['http:','https:'].includes(u.protocol);}catch{return false;}}
function parseBody(req,max=1200000){const val=typeof req.body==='string'?JSON.parse(req.body):req.body||{};if(JSON.stringify(val).length>max)throw Error('REQUEST_TOO_LARGE');return val;}
function loginLimited(req,failed){const key=String(req.headers['x-real-ip']||req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].slice(0,90);const now=Date.now();if(attempts.size>5000)attempts.clear();let v=attempts.get(key);if(!v||now-v.since>600000)v={since:now,count:0};if(failed)v.count++;else v.count=0;attempts.set(key,v);return v.count>=8;}
function ensureAdmin(req,res){if(!envReady()){send(res,503,{error:'Painel não configurado. Cadastre as variáveis de ambiente na Vercel.'});return false;}if(!isSession(req)){send(res,401,{error:'Sessão expirada. Faça login novamente.'});return false;}return true;}
module.exports={send,envReady,signSession,isSession,passwordCorrect,setSessionCookie,clearSessionCookie,safeOrigin,parseBody,loginLimited,ensureAdmin};
