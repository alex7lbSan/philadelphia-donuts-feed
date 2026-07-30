// Extracao do catalogo do site MenuDino (Philadelphia Donuts).
//
// Como funciona:
// 1. Um GET simples na home devolve o cookie `app-access-token` (JWT de app, 24h).
// 2. Com esse token da para chamar a API de catalogo do MenuDino direto.
//
// Nao precisa de navegador headless.

const SITE = 'https://philadelphiadonuts.com.br';
const CATALOG_API = 'https://menudino-catalog.consumerapis.com/api/v1';
const MERCHANT_ID = 'c60a7037-2faf-11ee-9964-0022483864db';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

async function obterToken() {
  const res = await fetch(SITE + '/', { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Home respondeu ${res.status}`);

  const cookies = typeof res.headers.getSetCookie === 'function'
    ? res.headers.getSetCookie()
    : [res.headers.get('set-cookie') || ''];

  for (const c of cookies) {
    const m = /(?:^|,\s*)app-access-token=([^;]+)/.exec(c);
    if (m) return decodeURIComponent(m[1]);
  }
  throw new Error('Cookie app-access-token nao encontrado na resposta da home');
}

async function apiGet(url, token) {
  const res = await fetch(url, {
    headers: { Authorization: 'Bearer ' + token, 'User-Agent': UA },
  });
  if (!res.ok) throw new Error(`${res.status} em ${url}`);
  return res.json();
}

// Retorna [{ categoria, itens: [...] }] apenas com o que esta ativo para venda online.
async function buscarCatalogo() {
  const token = await obterToken();

  const cats = await apiGet(
    `${CATALOG_API}/categories/${MERCHANT_ID}?OnlyActive=true&SellOnline=true`,
    token,
  );

  const resultado = [];
  for (const cat of cats.items || []) {
    const dados = await apiGet(
      `${CATALOG_API}/items/${MERCHANT_ID}/${cat.id}/summary?SellOnline=true&SellLocal=false`,
      token,
    );
    resultado.push({ categoria: cat.name, itens: dados.items || [] });
  }
  return resultado;
}

// Achata em produtos unicos (um item pode aparecer em mais de uma categoria;
// vale a primeira categoria, que segue a ordem do cardapio).
function achatarProdutos(catalogo) {
  const vistos = new Map();
  for (const { categoria, itens } of catalogo) {
    for (const item of itens) {
      if (vistos.has(item.id)) continue;
      vistos.set(item.id, { ...item, categoria });
    }
  }
  return [...vistos.values()];
}

function linkDoProduto(item) {
  const q = new URLSearchParams({ produto: item.name, item: item.id });
  return `${SITE}/?${q.toString()}`;
}

function urlImagemOriginal(item) {
  const u = item.largeImageUrl || item.smallImageUrl;
  if (!u) return null;
  return u.startsWith('http') ? u : 'https://' + u;
}

module.exports = {
  SITE,
  MERCHANT_ID,
  UA,
  obterToken,
  buscarCatalogo,
  achatarProdutos,
  linkDoProduto,
  urlImagemOriginal,
};
