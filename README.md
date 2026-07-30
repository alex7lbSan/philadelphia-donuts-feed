# Feed de produtos - Philadelphia Donuts

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

## Conversao das imagens

A Meta recusa WebP e exige no minimo 500x500. O MenuDino serve apenas WebP em
cerca de 600x600, entao cada foto e convertida para JPEG 1024x1024 com fundo
branco (`sharp`) e publicada junto do feed.

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
