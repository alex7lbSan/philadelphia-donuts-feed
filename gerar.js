// Gera public/feed.xml + public/imagens/*.jpg a partir do cardapio do site.
//
// Uso:  node gerar.js
// Env:  FEED_BASE_URL = URL publica onde a pasta public/ sera servida
//       (ex.: https://usuario.github.io/philadelphia-feed)

const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');

const { buscarCatalogo, achatarProdutos, urlImagemOriginal, UA } = require('./src/catalogo');
const { montarFeed } = require('./src/feed');

const BASE_URL = (process.env.FEED_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '');
const DIR_PUBLIC = path.join(__dirname, 'public');
const DIR_IMAGENS = path.join(DIR_PUBLIC, 'imagens');

// Meta exige JPEG ou PNG (WebP e recusado) e no minimo 500x500.
// O MenuDino so serve WebP em ~600x600, entao convertemos e completamos
// o quadrado com fundo branco ate 1024x1024.
const LADO = 1024;

function nomeArquivo(item, urlOriginal) {
  const carimbo = /_(\d{8,14})\.webp$/.exec(urlOriginal);
  return `${item.id}${carimbo ? '_' + carimbo[1] : ''}.jpg`;
}

async function converterImagem(item, urlOriginal) {
  const arquivo = nomeArquivo(item, urlOriginal);
  const destino = path.join(DIR_IMAGENS, arquivo);

  try {
    await fs.access(destino);
    return arquivo; // ja convertida numa execucao anterior
  } catch {}

  const res = await fetch(urlOriginal, { headers: { 'User-Agent': UA } });
  if (!res.ok) {
    console.warn(`  imagem falhou (${res.status}): ${item.name}`);
    return null;
  }

  const buf = Buffer.from(await res.arrayBuffer());
  await sharp(buf)
    .resize(LADO, LADO, { fit: 'contain', background: { r: 255, g: 255, b: 255 } })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(destino);

  return arquivo;
}

// Remove JPEGs de produtos que sairam do cardapio ou tiveram a foto trocada.
async function limparOrfas(mantidas) {
  const existentes = await fs.readdir(DIR_IMAGENS).catch(() => []);
  for (const arq of existentes) {
    if (arq.endsWith('.jpg') && !mantidas.has(arq)) {
      await fs.unlink(path.join(DIR_IMAGENS, arq));
      console.log('  removida imagem orfa:', arq);
    }
  }
}

async function main() {
  await fs.mkdir(DIR_IMAGENS, { recursive: true });

  console.log('Buscando cardapio...');
  const catalogo = await buscarCatalogo();
  const itens = achatarProdutos(catalogo);
  console.log(`${itens.length} produtos em ${catalogo.length} categorias`);

  const produtos = [];
  const mantidas = new Set();

  for (const item of itens) {
    const original = urlImagemOriginal(item);
    if (!original) {
      console.warn(`  sem foto, fora do feed: ${item.name}`);
      continue;
    }
    const arquivo = await converterImagem(item, original);
    if (!arquivo) continue;

    mantidas.add(arquivo);
    produtos.push({ item, urlImagem: `${BASE_URL}/imagens/${arquivo}` });
  }

  await limparOrfas(mantidas);

  const geradoEm = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  await fs.writeFile(path.join(DIR_PUBLIC, 'feed.xml'), montarFeed(produtos, geradoEm), 'utf8');

  console.log(`\nfeed.xml gerado com ${produtos.length} produtos (${geradoEm})`);
  console.log(`URL do feed: ${BASE_URL}/feed.xml`);
}

main().catch((e) => {
  console.error('Falhou:', e.message);
  process.exit(1);
});
