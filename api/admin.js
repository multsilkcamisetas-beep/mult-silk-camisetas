// Vercel Serverless Function — MULT SILK admin. Segredos somente no servidor.
const crypto = require('node:crypto');

const COOKIE = '__Host-msadmin';
const MAX_AGE = 12 * 60 * 60;
const REPO = process.env.GITHUB_REPOSITORY || 'multsilkcamisetas-beep/mult-silk-camisetas';
const BRANCH = process.env.GITHUB_BRANCH || 'main';

function reply(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.end(JSON.stringify(payload));
}
function fail(status, message) { const err = new Error(message); err.status = status; throw err; }
function validConfig() {
  if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 14 ||
      !process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET.length < 32) {
    fail(503, 'Painel ainda não configurado. Defina ADMIN_PASSWORD e ADMIN_SESSION_SECRET na Vercel.');
  }
}
function sign(data) {
  return crypto.createHmac('sha256', process.env.ADMIN_SESSION_SECRET).update(data).digest('base64url');
}
function session(req) {
  const raw = (req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith(COOKIE + '='));
  if (!raw) return false;
  const [value, mac, extra] = raw.slice(COOKIE.length + 1).split('.');
  if (!value || !mac || extra || value.length > 512) return false;
  const expected = Buffer.from(sign(value), 'base64url');
  let provided;
  try { provided = Buffer.from(mac, 'base64url'); } catch { return false; }
  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) return false;
  try { const p = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
    return p.v === 1 && Number.isFinite(p.exp) && p.exp > Date.now();
  } catch { return false; }
}
function cookieValue() {
  const payload = Buffer.from(JSON.stringify({v: 1, exp: Date.now() + MAX_AGE * 1000})).toString('base64url');
  return payload + '.' + sign(payload);
}
function sameOrigin(req) {
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (!origin || !host) return false;
  try { const url = new URL(origin); return url.protocol === 'https:' && url.host === host; }
  catch { return false; }
}
function getBody(req) {
  if (!req.headers['content-type']?.startsWith('application/json')) fail(415, 'Envie dados no formato JSON.');
  if (Number(req.headers['content-length'] || 0) > 4_300_000) fail(413, 'Arquivo ou pedido muito grande.');
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { fail(400, 'JSON inválido.'); } }
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) fail(400, 'Dados inválidos.');
  return req.body;
}
function safeText(v, max) { return typeof v === 'string' ? v.trim().slice(0, max) : ''; }
function validateProducts(value) {
  if (!Array.isArray(value) || value.length > 500) fail(400, 'Catálogo inválido (máximo de 500 produtos).');
  const ids = new Set(), cats = new Set(['esporte','uniformes','formaturas','estampas','personalizacao']);
  return value.map(p => {
    if (!p || typeof p !== 'object') fail(400, 'Produto inválido.');
    const id = safeText(p.id, 60), name = safeText(p.name, 120), category = p.category;
    if (!/^[a-z0-9][a-z0-9-]{0,59}$/.test(id) || ids.has(id) || !name || !cats.has(category)) fail(400, 'ID, nome ou categoria de produto inválidos.');
    ids.add(id);
    if (!Array.isArray(p.images) || p.images.length < 1 || p.images.length > 20) fail(400, 'Cada produto deve ter entre 1 e 20 fotos.');
    const images = p.images.map(i => {
      const src = safeText(i?.src, 200), label = safeText(i?.label, 90);
      if (!/^assets\/[a-zA-Z0-9/_-]+\.(webp|png|jpg|jpeg)$/.test(src) || src.includes('//') || src.includes('..')) fail(400, 'Caminho de imagem inválido.');
      return {src, label: label || 'Foto', ...(i.isPreview ? {isPreview: true} : {})};
    });
    let price = null;
    if (p.price !== null && p.price !== undefined && p.price !== '') {
      price = Number(p.price);
      if (!Number.isFinite(price) || price < 0 || price > 1_000_000) fail(400, 'Preço inválido.');
      price = Math.round(price * 100) / 100;
    }
    return {id, name, category, subtitle: safeText(p.subtitle, 550),
      images, badge: safeText(p.badge, 50) || 'Camiseta',
      kind: p.kind === 'mockup' ? 'mockup' : 'real', preview: images.some(i => i.isPreview),
      ...(price !== null ? {price} : {})};
  });
}
async function github(path, method = 'GET', data) {
  const token = process.env.GITHUB_TOKEN;
  if (!token || !/^[\w.-]+\/[\w.-]+$/.test(REPO)) fail(503, 'Falta configurar GITHUB_TOKEN e repositório no servidor.');
  const url = 'https://api.github.com/repos/' + REPO + '/' + path;
  const response = await fetch(url, {
    method,
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': 'Bearer ' + token,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'mult-silk-admin',
      ...(data ? {'Content-Type': 'application/json'} : {})
    },
    ...(data ? {body: JSON.stringify(data)} : {})
  });
  if (!response.ok) {
    if (response.status === 409 || response.status === 422) fail(409, 'Arquivo alterado ou em conflito. Atualize o painel e tente novamente.');
    if (response.status === 401 || response.status === 403) fail(502, 'O token do GitHub não tem permissão para atualizar o catálogo.');
    fail(502, 'Não foi possível comunicar com o GitHub (HTTP ' + response.status + ').');
  }
  return response.json();
}
async function catalog() {
  const file = await github('contents/catalogo-data.js?ref=' + encodeURIComponent(BRANCH));
  const source = Buffer.from((file.content || '').replace(/\s/g, ''), 'base64').toString('utf8');
  const match = source.match(/window\.MULT_SILK_PRODUCTS\s*=\s*([\s\S]*?)\s*;\s*$/);
  if (!match) fail(502, 'Formato do catálogo não reconhecido.');
  try { return {products: JSON.parse(match[1]), sha: file.sha}; }
  catch { fail(502, 'Dados do catálogo inválidos no GitHub.'); }
}
module.exports = async function handler(req, res) {
  try {
    validConfig();
    if (req.method === 'GET') {
      if (!session(req)) return reply(res, 401, {error: 'Entre com sua senha.'});
      if (req.query?.mode === 'session') return reply(res, 200, {ok: true});
      return reply(res, 200, await catalog());
    }
    if (req.method !== 'POST') return reply(res, 405, {error: 'Método não permitido.'});
    if (!sameOrigin(req)) return reply(res, 403, {error: 'Origem não autorizada.'});
    const body = getBody(req), action = body.action;
    if (action === 'login') {
      const actual = typeof body.password === 'string' ? body.password : '';
      const hash = s => crypto.createHmac('sha256', process.env.ADMIN_SESSION_SECRET).update(s).digest();
      const ok = actual.length >= 14 && actual.length <= 256 && crypto.timingSafeEqual(hash(actual), hash(process.env.ADMIN_PASSWORD));
      if (!ok) return reply(res, 401, {error: 'Senha incorreta.'});
      res.setHeader('Set-Cookie', COOKIE + '=' + cookieValue() + '; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=' + MAX_AGE);
      return reply(res, 200, {ok: true});
    }
    if (action === 'logout') {
      res.setHeader('Set-Cookie', COOKIE + '=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0');
      return reply(res, 200, {ok: true});
    }
    if (!session(req)) return reply(res, 401, {error: 'Sua sessão expirou. Entre novamente.'});
    if (action === 'save') {
      if (typeof body.sha !== 'string' || !/^[a-f0-9]{40}$/.test(body.sha)) fail(400, 'Versão do catálogo inválida.');
      const products = validateProducts(body.products);
      const content = '/* Catálogo MULT SILK — gerenciado pelo painel online. */\nwindow.MULT_SILK_PRODUCTS = ' + JSON.stringify(products, null, 2) + ';\n';
      await github('contents/catalogo-data.js', 'PUT', {
        message: 'Atualiza catálogo pelo painel MULT SILK',
        content: Buffer.from(content, 'utf8').toString('base64'),
        sha: body.sha, branch: BRANCH
      });
      const fresh = await catalog();
      return reply(res, 200, {ok: true, sha: fresh.sha, products: fresh.products});
    }
    if (action === 'upload') {
      if (typeof body.dataUrl !== 'string' || body.dataUrl.length > 3_600_000 ||
          !body.dataUrl.startsWith('data:image/webp;base64,')) fail(400, 'Envie uma foto WebP de até 2,5 MB.');
      const binary = Buffer.from(body.dataUrl.slice('data:image/webp;base64,'.length), 'base64');
      if (binary.length < 20 || binary.length > 2_500_000 ||
          binary.toString('ascii', 0, 4) !== 'RIFF' || binary.toString('ascii', 8, 12) !== 'WEBP') fail(400, 'Arquivo de imagem inválido.');
      const path = 'assets/uploads/' + Date.now() + '-' + crypto.randomBytes(6).toString('hex') + '.webp';
      await github('contents/' + path, 'PUT', {
        message: 'Adiciona foto ao catálogo MULT SILK',
        content: binary.toString('base64'), branch: BRANCH
      });
      return reply(res, 200, {ok: true, src: path});
    }
    return reply(res, 400, {error: 'Ação desconhecida.'});
  } catch (err) {
    console.error('Admin API:', err.status || 500, err.message);
    return reply(res, err.status || 500, {error: err.status ? err.message : 'Falha inesperada no servidor.'});
  }
};
