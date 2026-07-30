# Como funciona

## O caminho dos dados

```
site philadelphiadonuts.com.br
        |
        |  1. GET na home devolve o cookie app-access-token
        v
API de catalogo do MenuDino
        |
        |  2. categorias e itens de cada categoria
        v
gerar.js
        |
        |  3. baixa cada foto WebP e padroniza em JPEG 1024x1024
        |  4. monta o feed.xml
        v
pasta public/
        |
        |  5. GitHub Actions publica no GitHub Pages
        v
https://alex7lbsan.github.io/philadelphia-donuts-feed/feed.xml
        |
        |  6. a Meta busca uma vez por dia
        v
Gerenciador de Comercio
```

## 1 e 2: de onde vem o cardapio

O site roda na plataforma MenuDino e e feito em Next.js. O cardapio **nao esta
no HTML** da pagina, nem existe sitemap. Se voce abrir o codigo-fonte do site,
nao vai achar nenhum produto.

Os produtos vem de uma API que exige um token. O jeito de conseguir o token e
mais simples do que parece: **um GET comum na home ja devolve o cookie
`app-access-token`**, um JWT de aplicacao com validade de 24 horas. Nao precisa
de login, chave, nem navegador headless.

Com esse token, duas chamadas resolvem tudo:

```
GET https://menudino-catalog.consumerapis.com/api/v1/categories/{merchantId}?OnlyActive=true&SellOnline=true
GET https://menudino-catalog.consumerapis.com/api/v1/items/{merchantId}/{categoryId}/summary?SellOnline=true&SellLocal=false
```

O `merchantId` da Philadelphia e `c60a7037-2faf-11ee-9964-0022483864db`.

Cuidado com uma pegadinha: `GET /categories/{merchantId}/{categoryId}` parece
ser o endpoint dos itens de uma categoria, mas devolve vazio. O certo e o
`/items/.../summary` acima.

Isso tudo esta em `src/catalogo.js`.

## 3: por que as fotos precisam de tratamento

Duas exigencias da Meta batem de frente com o que o MenuDino serve:

- A Meta **recusa WebP**. O MenuDino serve **so WebP**.
- A Meta exige **no minimo 500x500**. O MenuDino serve cerca de 600x600, mas com
  proporcoes que vao de 0.67 (bem vertical) a 1.78 (bem horizontal). Das 54
  fotos, 40 estao fora do quadrado.

Converter para quadrado com barra branca resolve a regra, mas fica feio: foto
deitada vira uma tira no meio do quadro e foto em pe vira uma coluna. O
catalogo parece desalinhado.

Por isso `src/imagem.js` classifica cada foto pelo **brilho medio das quatro
bordas** e trata de dois jeitos:

- **Foto ambientada** (borda escura, 49 itens, os donuts): cortada para o
  quadrado pela regiao de maior interesse visual. Ocupa o quadro inteiro.
- **Produto em fundo branco** (borda quase branca, 5 itens, as bebidas): a
  moldura branca e removida e o produto e recentralizado ocupando 86% do
  quadrado. Todas as bebidas ficam do mesmo tamanho relativo.

A separacao e limpa: as bebidas deram brilho de borda 233 ou mais, todo o resto
deu 145 ou menos. O corte fica em 200, entao produto novo cai no lado certo
sozinho.

Detalhe que custou tempo: o `trim` do sharp **nao** consegue remover a moldura
branca das bebidas. Varias dessas fotos vem de banco de imagens e tem marca
d'agua fraca na borda, o que faz o `trim` desistir e devolver a imagem inteira.
Por isso a caixa do produto e calculada direto nos pixels, aceitando ate 2% de
pixel escuro por linha ou coluna antes de considerar que ali tem produto.

## 4: o feed

`src/feed.js` monta um RSS 2.0 com o namespace `g:`, que e o formato padrao de
catalogo. Campos enviados:

`id`, `title`, `description`, `availability`, `condition`, `price`, `link`,
`image_link`, `brand`, `product_type`, `google_product_category` e `sale_price`
quando o item esta em promocao.

Regras de negocio embutidas:

- Produto **pausado** no cardapio vai como `out of stock`, nao some do feed.
- Loja **fechada** fora do horario **nao** afeta o feed, porque o site aceita
  pedido agendado.
- Produto **sem foto** fica de fora, porque `image_link` e obrigatorio.
- O `link` e um deep link que abre o produto direto no cardapio:
  `https://philadelphiadonuts.com.br/?produto={nome}&item={id}`

## 5: publicacao

`.github/workflows/feed.yml` roda todo dia as 09:00 UTC, que e 06:00 em
Brasilia, e tambem a cada push na branch `main`.

A variavel de repositorio `FEED_BASE_URL` guarda a URL publica do GitHub Pages.
E ela que monta o endereco de cada imagem dentro do feed. Se mudar o endereco
do Pages, precisa mudar essa variavel tambem.

As imagens ja convertidas ficam em cache entre execucoes. O nome do arquivo
carrega o carimbo de data da foto original mais a versao do tratamento
(`{id}_{carimbo}_{versao}.jpg`), entao:

- Trocou a foto no MenuDino, o carimbo muda, o nome muda, a Meta rebaixa a nova.
- Mudou a regra de tratamento de imagem, voce sobe a constante `VERSAO` em
  `src/imagem.js`, todo mundo e reprocessado e a Meta rebaixa tudo.

## Arquivos do projeto

| Arquivo | Papel |
| --- | --- |
| `gerar.js` | orquestra tudo e escreve `public/` |
| `src/catalogo.js` | pega o token e busca o cardapio na API |
| `src/imagem.js` | padroniza as fotos em JPEG quadrado |
| `src/feed.js` | monta o XML |
| `.github/workflows/feed.yml` | agenda e publica |
