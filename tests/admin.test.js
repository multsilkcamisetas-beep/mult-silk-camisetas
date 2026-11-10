// npm não é necessário: execute node --test tests/admin.test.js
const test = require('node:test');
const assert = require('node:assert/strict');

process.env.ADMIN_PASSWORD = 'senha-aleatoria-de-teste-123456';
process.env.ADMIN_SESSION_SECRET = 'segredo-de-teste-maior-que-trinta-e-dois-caracteres';
process.env.GITHUB_TOKEN = 'token-apenas-teste';
const handler = require('../api/admin.js');

const sha = 'a'.repeat(40);
const example = [{
  id: 'camiseta-teste', name: 'Camiseta de teste', category: 'esporte', subtitle: 'Teste',
  images: [{src: 'assets/foto-00.webp', label: 'Frente'}], badge: 'Esporte', kind: 'real',
  preview: false, price: 29.9
}];
let lastSaved = null;
global.fetch = async (url, options = {}) => {
  if (!String(url).includes('github.com/repos/')) throw Error('URL externa inesperada');
  if (options.method === 'PUT') {
    const data = JSON.parse(options.body);
    lastSaved = {url, data};
    return {ok: true, json: async () => ({content: {sha}})};
  }
  const content = 'window.MULT_SILK_PRODUCTS = ' + JSON.stringify(example) + ';\n';
  return {ok: true, json: async () => ({sha, content: Buffer.from(content).toString('base64')})};
};
async function request(method = 'GET', body = null, cookie = '', query = {}) {
  const headers = {
    host: 'example.vercel.app',
    origin: 'https://example.vercel.app',
    ...(cookie ? {cookie} : {}),
    ...(body ? {'content-type': 'application/json'} : {})
  };
  const req = {method, body, headers, query};
  const res = {
    statusCode: 200, headers: {}, payload: null,
    setHeader(name, val) {this.headers[name]=val;},
    end(s) {this.payload=JSON.parse(s);}
  };
  await handler(req, res);
  return res;
}
async function signIn() {
  const res = await request('POST', {action:'login',password:process.env.ADMIN_PASSWORD});
  assert.equal(res.statusCode,200);
  return res.headers['Set-Cookie'].split(';')[0];
}
test('bloqueia acesso sem login', async () => {
  const res=await request();
  assert.equal(res.statusCode,401);
});
test('não autoriza senha incorreta', async () => {
  const res=await request('POST',{action:'login',password:'uma-senha-incorreta-bastante-longa'});
  assert.equal(res.statusCode,401);
  assert.equal(res.headers['Set-Cookie'],undefined);
});
test('bloqueia POST de outra origem', async () => {
  const res=await request('POST',{action:'login',password:process.env.ADMIN_PASSWORD});
  // Testa primeiro o caso permitido; em seguida simula origem externa.
  assert.equal(res.statusCode,200);
  const req = {method:'POST',body:{action:'login',password:process.env.ADMIN_PASSWORD},query:{},
    headers:{host:'example.vercel.app',origin:'https://site-malicioso.example','content-type':'application/json'}};
  const out={statusCode:200,setHeader(){},end(text){this.payload=JSON.parse(text);}};
  await handler(req,out);
  assert.equal(out.statusCode,403);
});
test('login cria cookie seguro e permite ler catálogo', async () => {
  const res=await request('POST',{action:'login',password:process.env.ADMIN_PASSWORD});
  assert.match(res.headers['Set-Cookie'],/HttpOnly; Secure; SameSite=Strict/);
  const cookie=res.headers['Set-Cookie'].split(';')[0];
  const list=await request('GET',null,cookie);
  assert.equal(list.statusCode,200);
  assert.equal(list.payload.sha,sha);
  assert.equal(list.payload.products[0].name,'Camiseta de teste');
});
test('valida catálogo antes de escrever no GitHub', async () => {
  const cookie=await signIn();
  lastSaved=null;
  const invalid=[{...example[0],images:[{src:'https://evil.example/image.png',label:'Foto'}]}];
  const result=await request('POST',{action:'save',products:invalid,sha},cookie);
  assert.equal(result.statusCode,400);
  assert.equal(lastSaved,null);
});
test('salva produto válido em catalogo-data.js', async () => {
  const cookie=await signIn();
  lastSaved=null;
  const result=await request('POST',{action:'save',products:example,sha},cookie);
  assert.equal(result.statusCode,200);
  assert.match(lastSaved.url,/catalogo-data\.js$/);
  assert.equal(lastSaved.data.sha,sha);
  const text=Buffer.from(lastSaved.data.content,'base64').toString('utf8');
  assert.match(text,/window\.MULT_SILK_PRODUCTS =/);
  assert.match(text,/"price": 29.9/);
});
test('rejeita fotos que não sejam WebP', async () => {
  const cookie=await signIn();
  const result=await request('POST',{action:'upload',dataUrl:'data:image/png;base64,SGVsbG8='},cookie);
  assert.equal(result.statusCode,400);
});
