// Padroniza as fotos do cardapio em JPEG quadrado para o catalogo da Meta.
//
// A Meta recusa WebP e exige no minimo 500x500. O MenuDino serve apenas WebP
// em cerca de 600x600, com proporcoes que variam de 0.67 (vertical) a 1.78
// (horizontal). Sem tratamento, uma foto deitada vira uma tira no meio de um
// quadrado branco e outra em pe vira uma coluna: e o que fazia o catalogo
// parecer desalinhado.
//
// O cardapio tem dois tipos de foto, que pedem tratamentos diferentes:
//
// 1. Produto recortado sobre fundo branco (as bebidas). Aqui da para remover a
//    moldura branca e recentralizar com folga fixa, o que deixa todos os itens
//    do mesmo tamanho relativo.
// 2. Foto ambientada, que ocupa o quadro inteiro (os donuts). Aqui a foto e
//    cortada para o quadrado usando a regiao de maior interesse visual, entao
//    o produto continua no centro e nao sobra borda vazia.

const sharp = require('sharp');

const LADO = 1024;
// Fracao do quadrado ocupada pelo produto no modo fundo branco.
const OCUPACAO = 0.86;
// Acima deste brilho medio de borda a foto e tratada como recorte em fundo claro.
const BRILHO_FUNDO_CLARO = 200;
// Quanto um pixel precisa escurecer em relacao ao branco para contar como produto.
const TOLERANCIA_FUNDO = 14;
// Fracao da linha/coluna que pode ter pixel escuro e ainda assim ser fundo.
// Cobre marca d'agua fina e ruido de compressao nas bordas.
const RUIDO_ACEITO = 0.02;
const JPEG = { quality: 88, mozjpeg: true };

// Brilho medio das quatro bordas da imagem.
async function brilhoDaBorda(img, largura, altura) {
  const e = Math.max(2, Math.round(Math.min(largura, altura) * 0.04));
  const faixas = [
    { left: 0, top: 0, width: largura, height: e },
    { left: 0, top: altura - e, width: largura, height: e },
    { left: 0, top: 0, width: e, height: altura },
    { left: largura - e, top: 0, width: e, height: altura },
  ];

  let soma = 0;
  let n = 0;
  for (const faixa of faixas) {
    const { data } = await img.clone().extract(faixa).raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += 3) {
      soma += (data[i] + data[i + 1] + data[i + 2]) / 3;
      n++;
    }
  }
  return soma / n;
}

// Caixa que envolve o produto, ignorando a moldura clara em volta.
//
// O trim do sharp nao serve aqui: varias fotos de bebida sao de banco de
// imagens e tem marca d'agua fraca nas bordas, o que faz o trim desistir e
// devolver a imagem inteira. Por isso a linha/coluna so conta como fundo
// quando quase todos os pixels dela sao claros, e nao todos.
async function caixaDoProduto(base, largura, altura) {
  const { data } = await base.clone().greyscale().raw().toBuffer({ resolveWithObject: true });

  const escuro = (x, y) => 255 - data[y * largura + x] > TOLERANCIA_FUNDO;

  const linhaTemProduto = (y) => {
    let n = 0;
    for (let x = 0; x < largura; x++) if (escuro(x, y)) n++;
    return n / largura > RUIDO_ACEITO;
  };
  const colunaTemProduto = (x) => {
    let n = 0;
    for (let y = 0; y < altura; y++) if (escuro(x, y)) n++;
    return n / altura > RUIDO_ACEITO;
  };

  let topo = 0;
  let base_ = altura - 1;
  let esq = 0;
  let dir = largura - 1;
  while (topo < base_ && !linhaTemProduto(topo)) topo++;
  while (base_ > topo && !linhaTemProduto(base_)) base_--;
  while (esq < dir && !colunaTemProduto(esq)) esq++;
  while (dir > esq && !colunaTemProduto(dir)) dir--;

  const width = dir - esq + 1;
  const height = base_ - topo + 1;
  if (width < 60 || height < 60) return null; // recorte suspeito, melhor nao mexer
  return { left: esq, top: topo, width, height };
}

async function emFundoBranco(base, largura, altura) {
  const caixa = await caixaDoProduto(base, largura, altura);
  const util = caixa ? base.clone().extract(caixa) : base.clone();

  const lado = Math.round(LADO * OCUPACAO);
  const frente = await util.resize(lado, lado, { fit: 'inside' }).toBuffer();

  return sharp({ create: { width: LADO, height: LADO, channels: 3, background: '#ffffff' } })
    .composite([{ input: frente, gravity: 'centre' }])
    .jpeg(JPEG)
    .toBuffer();
}

function emFotoAmbientada(base) {
  return base
    .resize(LADO, LADO, { fit: 'cover', position: sharp.strategy.attention })
    .jpeg(JPEG)
    .toBuffer();
}

// Recebe o WebP original e devolve { buf, modo }.
async function padronizar(entrada) {
  const base = sharp(entrada).flatten({ background: '#ffffff' });
  const { width, height } = await base.metadata();

  const claro = (await brilhoDaBorda(base, width, height)) > BRILHO_FUNDO_CLARO;

  return claro
    ? { modo: 'fundo-branco', buf: await emFundoBranco(base, width, height) }
    : { modo: 'foto-ambientada', buf: await emFotoAmbientada(base) };
}

// Entra no nome do arquivo gerado. Mudou a regra de tratamento, sobe a versao:
// isso invalida o cache de imagens e forca a Meta a rebaixar as fotos antigas.
const VERSAO = 'v2';

module.exports = { padronizar, LADO, VERSAO };
