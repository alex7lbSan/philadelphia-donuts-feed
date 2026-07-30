# Quando der problema

## Primeiro passo, sempre

Veja se a ultima execucao passou:

https://github.com/alex7lbSan/philadelphia-donuts-feed/actions

Ou pelo terminal, na pasta do projeto:

```
gh run list --limit 5
gh run view --log-failed
```

## O feed parou de atualizar

**Sintoma:** a data dentro da tag `<description>` do feed esta velha.

Causas prováveis, em ordem:

1. **O GitHub desativou o agendamento.** O GitHub desliga o cron de repositorio
   sem atividade por 60 dias. Ele avisa por e-mail. Solucao: rode
   `gh workflow run feed.yml` uma vez, que reativa.
2. **A execucao esta falhando.** Veja o log com `gh run view --log-failed` e siga
   os casos abaixo.

## Falhou com "Cookie app-access-token nao encontrado"

Essa e a falha mais seria possivel: significa que o **MenuDino mudou o jeito de
autenticar**. O projeto inteiro depende de aquele cookie vir num GET simples na
home.

Como investigar:

```
curl -s -D - -o /dev/null -A "Mozilla/5.0" https://philadelphiadonuts.com.br/
```

Procure na resposta um cabecalho `Set-Cookie` com algo que pareca um token. Se
o nome do cookie mudou, e so ajustar o nome em `src/catalogo.js`, na funcao
`obterToken`.

Se o token sumiu de vez dos cookies, o caminho passa a ser abrir o site num
navegador headless e capturar o cabecalho `Authorization` das chamadas para
`consumerapis.com`. Da trabalho, mas funciona: foi assim que o projeto comecou,
antes de eu descobrir o cookie.

## Falhou com erro 401 nas chamadas de catalogo

O token foi obtido mas nao foi aceito. Costuma ser token expirado dentro da
propria execucao, o que e raro porque ele vale 24 horas. Rode de novo. Se
persistir, o MenuDino mudou a API.

## Falhou com 404 em algum endpoint

O MenuDino mudou a rota. Os endpoints usados estao em `src/catalogo.js`. Para
descobrir a rota nova, abra o site no Chrome com o DevTools na aba Network,
filtre por `consumerapis` e veja quais chamadas o proprio site faz ao carregar
e ao rolar o cardapio.

## Sumiram produtos do feed

Conte quantos itens tem, no PowerShell:

```powershell
$x = [xml](Invoke-WebRequest "https://alex7lbsan.github.io/philadelphia-donuts-feed/feed.xml" -UseBasicParsing).Content
$x.rss.channel.item.Count
```

Hoje sao 54. Se o numero caiu, veja o log da execucao. O gerador avisa cada produto que
descartou, com a razao:

- `sem foto, fora do feed: X` - o produto nao tem imagem no MenuDino. A Meta
  exige imagem. Cadastre a foto la.
- `imagem falhou (404): X` - a foto sumiu do servidor do MenuDino. Recadastre.

Se o produto simplesmente nao aparece no cardapio online, confira no MenuDino
se ele esta ativo e marcado para venda online. O feed so pega o que esta
`OnlyActive=true` e `SellOnline=true`.

## A Meta recusou imagens

**"Formato de imagem nao suportado":** alguma imagem saiu como WebP. Nao deveria
acontecer, tudo passa por conversao. Confira baixando uma imagem do feed e
olhando o tipo:

```
curl -s -o /dev/null -w "%{content_type}" <url da imagem>
```

Tem que responder `image/jpeg`.

**"Imagem muito pequena":** o minimo da Meta e 500x500 e as nossas saem
1024x1024. Se aparecer, verifique a constante `LADO` em `src/imagem.js`.

**"Nao foi possivel baixar a imagem":** o GitHub Pages pode estar fora do ar ou
a URL mudou. Abra a URL de uma imagem do feed no navegador e veja se carrega.

## A Meta recusou o feed inteiro

Abra a URL do feed no navegador. Se o XML aparece, o problema e de configuracao
na Meta. Confira em `04-conectar-na-meta.md` se a URL cadastrada la esta certa.

Se o navegador mostra erro de XML, algum texto de produto quebrou o arquivo.
O escape de caracteres esta em `src/feed.js`, na funcao `esc`.

## Preco errado no catalogo

O feed manda `salePrice` como preco cheio e `minPrice` como preco promocional,
quando `minPrice` e menor. Se o preco no catalogo esta diferente do site,
confira primeiro no MenuDino, porque o feed so repete o que a API devolve.

Vale lembrar que a Meta so le o feed uma vez por dia. Preco mudado hoje de
manha aparece no catalogo amanha.

## Preciso desfazer uma alteracao

O repositorio tem historico. Para ver o que mudou:

```
git log --oneline
```

Para voltar um arquivo especifico para como estava:

```
git checkout <hash do commit> -- caminho/do/arquivo
```

Depois commit e push, que o Actions republica.
