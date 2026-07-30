# Conectar o feed no Gerenciador de Comercio

Isso ja foi feito uma vez. Este arquivo serve para refazer, seja num catalogo
novo ou numa conta nova.

## Passo a passo

1. Abra o **Gerenciador de Comercio** e escolha o catalogo da Philadelphia
   Donuts. Nao tendo catalogo ainda, crie um do tipo **Comercio eletronico**.
2. Va em **Fontes de dados**, depois **Adicionar itens**, depois **Usar feed de
   dados**.
3. Escolha **Feed programado** e cole a URL:

   ```
   https://alex7lbsan.github.io/philadelphia-donuts-feed/feed.xml
   ```

   O arquivo e publico, entao **nao** preencha usuario e senha.
4. Frequencia: **Diaria**.
5. Horario: escolha algo **depois das 06:00 de Brasilia**, que e quando o
   GitHub Actions termina de gerar. As 08:00 e uma boa margem.
6. Moeda padrao: **BRL**.
7. De um nome que voce reconheca depois, por exemplo "Cardapio MenuDino
   automatico", e salve.

A primeira leitura acontece na hora. Confira em Fontes de dados se apareceram
54 itens e se nenhum foi rejeitado.

## Depois de conectar

Para o catalogo virar anuncio, ainda falta:

- **Vincular o pixel** ao catalogo, em Configuracoes do catalogo, para a Meta
  cruzar quem viu qual produto. O pixel do site e o `1246678970652394`.
- **Criar a campanha** de vendas do catalogo (Advantage+ catalogo), escolhendo
  esse catalogo como fonte.

## Se precisar trocar a URL do feed

Mudou o endereco do GitHub Pages, tem que mudar em dois lugares, e nessa ordem:

1. A variavel do repositorio, senao as imagens continuam apontando para o
   endereco velho:

   ```
   gh variable set FEED_BASE_URL --body "https://novo-endereco"
   gh workflow run feed.yml
   ```

2. A URL da fonte de dados dentro do Gerenciador de Comercio.

## O que a Meta enxerga de cada produto

| Campo do feed | De onde vem |
| --- | --- |
| `id` | id do item no MenuDino |
| `title` | nome do produto |
| `description` | descricao do produto |
| `price` | preco de venda |
| `sale_price` | so quando tem promocao ativa |
| `availability` | `out of stock` quando o item esta pausado no cardapio |
| `link` | deep link que abre o produto direto no cardapio |
| `image_link` | foto convertida para JPEG quadrado 1024x1024 |
| `brand` | fixo, "Philadelphia Donuts" |
| `product_type` | categoria do cardapio |
| `google_product_category` | fixo, 423 (padaria e confeitaria) |

Detalhe util: o `link` abre o produto ja aberto no cardapio, nao a home. Quem
clica no anuncio cai direto no item, com o botao de adicionar ao carrinho na
tela.
