// Monta o XML (RSS 2.0 + namespace g:) que o Gerenciador de Comercio da Meta consome.

const { linkDoProduto } = require('./catalogo');

const MARCA = 'Philadelphia Donuts';

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function limpar(txt, max) {
  const t = String(txt || '').replace(/\s+/g, ' ').trim();
  return t.length > max ? t.slice(0, max - 3).trimEnd() + '...' : t;
}

function preco(valor) {
  return `${Number(valor).toFixed(2)} BRL`;
}

// item vem de achatarProdutos(); urlImagem ja e a JPEG publica convertida.
function montarItem(item, urlImagem) {
  const titulo = limpar(item.name, 200);
  const descricao = limpar(item.description || item.name, 5000);
  const disponivel = item.isPaused ? 'out of stock' : 'in stock';

  const campos = [
    ['g:id', item.id],
    ['g:title', titulo],
    ['g:description', descricao],
    ['g:availability', disponivel],
    ['g:condition', 'new'],
    ['g:price', preco(item.salePrice)],
    ['g:link', linkDoProduto(item)],
    ['g:image_link', urlImagem],
    ['g:brand', MARCA],
    ['g:product_type', item.categoria],
    ['g:google_product_category', '423'], // Alimentos, bebidas e tabaco > Alimentos > Padaria e confeitaria
  ];

  // minPrice menor que salePrice indica promocao ativa no cardapio.
  if (item.minPrice != null && item.minPrice < item.salePrice) {
    campos.push(['g:sale_price', preco(item.minPrice)]);
  }

  const linhas = campos.map(([tag, val]) => `      <${tag}>${esc(val)}</${tag}>`);
  return `    <item>\n${linhas.join('\n')}\n    </item>`;
}

// produtos: [{ item, urlImagem }]
function montarFeed(produtos, geradoEm) {
  const itens = produtos
    .filter((p) => p.urlImagem)
    .map((p) => montarItem(p.item, p.urlImagem))
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Philadelphia Donuts - Catalogo</title>
    <link>https://philadelphiadonuts.com.br/</link>
    <description>Cardapio Philadelphia Donuts Sete Lagoas. Atualizado em ${esc(geradoEm)}.</description>
${itens}
  </channel>
</rss>
`;
}

module.exports = { montarFeed, montarItem, MARCA };
