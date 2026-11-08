'use strict';
const crypto=require('node:crypto');
const categories=['esporte','uniformes','formaturas','estampas','personalizacao'];
const repo=process.env.GITHUB_REPO||'multsilkcamisetas-beep/mult-silk-camisetas',branch=process.env.GITHUB_BRANCH||'main';
function sourcePath(src){return /^assets\/(?!.*\.\.)[a-zA-Z0-9_./-]+\.(?:webp|png|jpg|jpeg)$/i.test(src);}
function cleanProduct(p){
 if(!p||typeof p!=='object')throw Error('Produto inválido.');
 const field=(n,max)=>{const v=String(p[n]??'').trim();if(v.length>max)throw Error('Campo '+n+' muito longo.');return v;};
 const id=field('id',64),name=field('name',120),category=field('category',40);
 if(!/^[a-z0-9][a-z0-9-]{1,63}$/.test(id)||!name||!categories.includes(category))throw Error('Código, nome ou categoria inválidos.');
 if(!Array.isArray(p.images)||!p.images.length||p.images.length>12)throw Error('Informe de 1 a 12 fotos.');
 const images=p.images.map(im=>{const src=String(im?.src||'');if(!sourcePath(src))throw Error('Foto inválida.');return {src,label:String(im.label||'Imagem').slice(0,100),isPreview:Boolean(im.isPreview)};});
 return {id,name,category,subtitle:field('subtitle',500),images,badge:field('badge',50),kind:p.kind==='mockup'?'mockup':'real',preview:Boolean(p.preview),visible:p.visible!==false,price:field('price',50)};
}
function cleanCatalog(items){if(!Array.isArray(items)||items.length>200)throw Error('Limite de 200 produtos.');const products=items.map(cleanProduct);if(new Set(products.map(p=>p.id)).size!==products.length)throw Error('Códigos duplicados.');return products;}
async function gh(method,path,body){
 if(!process.env.GITHUB_TOKEN)throw Object.assign(Error('Token GitHub não configurado.'),{status:503});
 if(!/^[a-z0-9._-]+\/[a-z0-9._-]+$/i.test(repo))throw Error('GITHUB_REPO inválido.');
 const url='https://api.github.com/repos/'+repo+'/contents/'+path+(method==='GET'?'?ref='+encodeURIComponent(branch):'');
 const response=await fetch(url,{method,headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json','User-Agent':'MULT-SILK'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(16000)});
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw Object.assign(Error(response.status===403?'Token sem permissão Contents: Read and write.':response.status===409||response.status===422?'Catálogo foi alterado. Atualize a lista e tente novamente.':'GitHub respondeu '+response.status),{status:[403,409].includes(response.status)?response.status:502});
 return data;
}
async function getCatalog(){const item=await gh('GET','catalogo.json');return {products:JSON.parse(Buffer.from((item.content||'').replace(/\s/g,''),'base64').toString('utf8')),sha:item.sha};}
async function putCatalog(products,sha){const data=cleanCatalog(products);if(!/^[0-9a-f]{40}$/.test(sha||''))throw Error('Recarregue o catálogo antes de salvar.');await gh('PUT','catalogo.json',{message:'Atualizar produtos pelo painel MULT SILK',content:Buffer.from(JSON.stringify(data,null,2)+'\n').toString('base64'),sha,branch});return data.length;}
async function uploadImage(buffer,mime){
 const m={'image/jpeg':['jpg',b=>b[0]===255&&b[1]===216&&b[2]===255],'image/png':['png',b=>b.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'))],'image/webp':['webp',b=>b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP']};
 if(!m[mime]||!m[mime][1](buffer))throw Error('Arquivo inválido. Use JPG, PNG ou WEBP.');
 if(buffer.length>1700000||buffer.length<100)throw Error('Foto deve ter no máximo 1,7 MB.');
 const path='assets/admin/'+Date.now()+'-'+crypto.randomBytes(6).toString('hex')+'.'+m[mime][0];
 await gh('PUT',path,{message:'Adicionar imagem ao catálogo MULT SILK',content:buffer.toString('base64'),branch});return path;
}
module.exports={getCatalog,putCatalog,uploadImage,cleanCatalog,sourcePath};
