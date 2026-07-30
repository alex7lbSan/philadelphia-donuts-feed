# Tarefas comuns

Todos os comandos abaixo rodam de dentro da pasta do projeto:

```
cd "C:\Users\ale-x\Desktop\Programação\Philadelphia Donuts Feed Meta"
```

## Forcar uma atualizacao agora

Nao espera o horario. Roda o Actions na hora:

```
gh workflow run feed.yml
```

Acompanhar:

```
gh run watch
```

Leva cerca de 1 a 2 minutos. Depois disso o feed novo ja esta no ar, mas a
**Meta so vai enxergar na proxima busca dela**. Para a Meta ler na hora, va no
Gerenciador de Comercio, em Fontes de dados, e clique em "Carregar novamente".

## Rodar na sua maquina para conferir antes de publicar

```
npm install
$env:FEED_BASE_URL = "https://alex7lbsan.github.io/philadelphia-donuts-feed"
node gerar.js
```

Sai `public\feed.xml` e as imagens em `public\imagens\`. Essa pasta nao vai para
o Git, e so para voce olhar. Abra algumas imagens e confira o XML antes de
fazer push.

Para reprocessar tudo do zero, apague `public\imagens` antes de rodar.

## Mudar o horario da atualizacao

Em `.github/workflows/feed.yml`, na linha do `cron`. O horario esta em **UTC**,
que e Brasilia mais 3 horas.

```yaml
- cron: '0 9 * * *'   # 09:00 UTC = 06:00 em Brasilia
```

Querendo as 05:00 de Brasilia, use `0 8 * * *`. Depois faca commit e push.

Lembre de deixar a busca da Meta agendada para **depois** desse horario.

## Adicionar ou mudar um campo do feed

Em `src/feed.js`, na lista `campos` dentro de `montarItem`. Cada linha e um par
`['g:nome_do_campo', valor]`.

Exemplo, para mandar tambem a quantidade em estoque:

```js
['g:inventory', 999],
```

Os nomes dos campos seguem a especificacao de catalogo da Meta. Se inventar um
nome que nao existe, a Meta ignora em silencio, entao confira na documentacao
antes.

## Mudar como as fotos sao tratadas

Em `src/imagem.js`. As constantes do topo controlam quase tudo:

| Constante | O que faz |
| --- | --- |
| `LADO` | tamanho final da imagem, hoje 1024 |
| `OCUPACAO` | quanto do quadro o produto ocupa no modo fundo branco, hoje 0.86 |
| `BRILHO_FUNDO_CLARO` | acima disso a foto e tratada como recorte em fundo claro, hoje 200 |
| `TOLERANCIA_FUNDO` | o quanto o pixel precisa escurecer para contar como produto |
| `RUIDO_ACEITO` | quanto de marca d'agua a borda pode ter e ainda ser fundo |

**Importante:** mexeu em qualquer uma dessas, suba a constante `VERSAO` no fim
do arquivo (`v2` vira `v3`). Sem isso o cache continua servindo as imagens
antigas e a Meta nao rebaixa nada.

## Trocar a foto de um produto

Isso e no MenuDino, nao aqui. Trocou la, o feed pega sozinho na proxima
execucao, porque o carimbo de data da foto muda e gera um nome de arquivo novo.

## Tirar um produto do feed sem tirar do cardapio

Hoje nao existe lista de excecao. Se precisar, o lugar de fazer isso e em
`gerar.js`, no laco que percorre `itens`, filtrando por `item.id` ou
`item.name`.

## Mudar o endereco onde o feed fica publicado

Se trocar o nome do repositorio ou apontar um dominio proprio para o Pages,
atualize a variavel:

```
gh variable set FEED_BASE_URL --body "https://novo-endereco"
```

Sem barra no final. Depois rode o workflow de novo e **atualize a URL do feed
dentro do Gerenciador de Comercio**, senao a Meta continua lendo o endereco
velho.

## Conferir o que esta publicado agora

No PowerShell, mostra quantos produtos tem e a data da ultima geracao:

```powershell
$x = [xml](Invoke-WebRequest "https://alex7lbsan.github.io/philadelphia-donuts-feed/feed.xml" -UseBasicParsing).Content
"itens: " + $x.rss.channel.item.Count
"gerado: " + $x.rss.channel.description
```

Resposta esperada hoje: 54 itens e a data de hoje. Ou simplesmente abra a URL do
feed no navegador.
