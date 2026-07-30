# Feed de produtos - Philadelphia Donuts

> Voltando ao projeto depois de um tempo? Comece pela pasta
> [`Instruções/`](Instru%C3%A7%C3%B5es/LEIA-ME.md), que tem o passo a passo das
> alteracoes comuns e o que fazer quando algo quebra.

Gera um feed de produtos no formato da Meta (RSS 2.0 com namespace `g:`) a partir do
cardapio de https://philadelphiadonuts.com.br/, para uso no Gerenciador de Comercio.

O GitHub Actions roda todo dia as 06:00 (horario de Brasilia), regenera o feed e
publica no GitHub Pages. A Meta busca o arquivo uma vez por dia.

## Como os dados sao obtidos

O site roda na plataforma MenuDino e o cardapio nao vem no HTML. O caminho usado e:

1. `GET https://philadelphiadonuts.com.br/` devolve o cookie `app-access-token`
   (JWT de aplicacao, validade de 24h).
2. Com esse token chamamos a API de catalogo do MenuDino:
   - `GET /categories/{merchantId}?OnlyActive=true&SellOnline=true`
   - `GET /items/{merchantId}/{categoryId}/summary?SellOnline=true&SellLocal=false`

Nao usa navegador headless.

## Padronizacao das imagens (`src/imagem.js`)

A Meta recusa WebP e exige no minimo 500x500. O MenuDino serve apenas WebP em
cerca de 600x600, com proporcoes entre 0.67 (vertical) e 1.78 (horizontal): 40
das 54 fotos estao fora do quadrado. Todas saem daqui em JPEG 1024x1024.

So converter para quadrado nao basta. Uma foto deitada vira uma tira no meio de
um fundo branco e uma foto em pe vira uma coluna, que e o que fazia o catalogo
parecer desalinhado. Por isso cada foto e classificada pelo brilho medio das
quatro bordas e tratada de um jeito:

- **Foto ambientada** (49 itens, os donuts): borda escura. E cortada para o
  quadrado pela regiao de maior interesse visual (`sharp.strategy.attention`),
  entao ocupa o quadro inteiro sem sobrar borda vazia.
- **Produto em fundo branco** (5 itens, as bebidas): borda quase branca. A
  moldura branca e removida e o produto e recentralizado ocupando 86% do
  quadrado, o que deixa todas as bebidas no mesmo tamanho relativo.

O recorte da moldura e calculado direto nos pixels em vez de usar o `trim` do
sharp: varias fotos de bebida vem de banco de imagens com marca d'agua fraca na
borda, e isso faz o `trim` desistir e devolver a imagem inteira. A regra aqui e
que a linha ou coluna conta como fundo quando ate 2% dos pixels dela estao
escuros, o que absorve a marca d'agua e o ruido de compressao.

A constante `VERSAO` em `src/imagem.js` entra no nome do arquivo. Mudou a regra
de tratamento, sobe a versao: isso invalida o cache e faz a Meta rebaixar as
fotos antigas.

## Rodar localmente

```
npm install
FEED_BASE_URL="https://alex7lbsan.github.io/philadelphia-donuts-feed" node gerar.js
```

Saida em `public/feed.xml` e `public/imagens/`.

## Configuracao

A variavel de repositorio `FEED_BASE_URL` (Settings > Secrets and variables >
Actions > Variables) precisa apontar para a URL publica do GitHub Pages, sem
barra no final. E ela que monta o `image_link` de cada produto.

## Campos do feed

`id`, `title`, `description`, `availability`, `condition`, `price`, `link`,
`image_link`, `brand`, `product_type`, `google_product_category` e `sale_price`
quando o item esta em promocao.

Produto pausado no cardapio vai como `out of stock`. Produto sem foto fica fora
do feed, porque `image_link` e obrigatorio.
