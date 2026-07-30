# Instrucoes do feed Philadelphia Donuts

Se voce chegou aqui depois de meses sem mexer no projeto, leia esta pagina
inteira. Ela responde "o que e isso" e "o que eu faco agora".

## O que este projeto e

Um gerador de feed de produtos. Ele le o cardapio do site
https://philadelphiadonuts.com.br/, monta um arquivo XML no formato que a Meta
entende e publica esse arquivo num endereco fixo. O Gerenciador de Comercio da
Meta busca esse endereco uma vez por dia e atualiza o catalogo sozinho.

Ninguem precisa rodar nada na mao. O GitHub Actions faz tudo todo dia as 06:00
do horario de Brasilia.

## Enderecos que importam

| O que | Onde |
| --- | --- |
| Feed que a Meta le | https://alex7lbsan.github.io/philadelphia-donuts-feed/feed.xml |
| Repositorio | https://github.com/alex7lbSan/philadelphia-donuts-feed |
| Historico de execucoes | https://github.com/alex7lbSan/philadelphia-donuts-feed/actions |
| Pasta local | `C:\Users\ale-x\Desktop\Programação\Philadelphia Donuts Feed Meta` |
| Site de origem | https://philadelphiadonuts.com.br/ |
| Painel do cardapio | MenuDino (onde as fotos e precos sao cadastrados) |

## As tres coisas que voce mais vai querer fazer

**Produto novo ou preco mudou no cardapio.** Nao faca nada. O feed pega sozinho
na proxima execucao. Se tiver pressa, veja `02-tarefas-comuns.md`, secao "Forcar
uma atualizacao agora".

**A Meta reclamou de algum produto.** Veja `03-quando-der-problema.md`.

**Preciso mudar o que vai no feed** (adicionar campo, mudar categoria, mudar o
horario). Veja `02-tarefas-comuns.md`.

## Os outros arquivos desta pasta

- `01-como-funciona.md` - o caminho dos dados, de ponta a ponta, e por que cada
  parte existe. Leia antes de mexer no codigo.
- `02-tarefas-comuns.md` - o passo a passo das alteracoes do dia a dia.
- `03-quando-der-problema.md` - o que fazer quando o feed para, some produto ou
  a Meta recusa imagem.
- `04-conectar-na-meta.md` - como ligar o feed no Gerenciador de Comercio, caso
  precise refazer.

## Pendencias conhecidas

Duas fotos precisam ser trocadas no MenuDino. Nao da para consertar por codigo,
o problema esta no arquivo original:

- **Guarana Antartica 350ml**: a foto cadastrada e de banco de imagens e tem o
  xadrez de transparencia e a marca "Download Gratis" queimados dentro dela.
- **Guarana Antartica 200ml**: nao tem foto nenhuma, entao fica fora do feed.
  A Meta exige imagem em todo produto.

Trocando as fotos no MenuDino, os dois entram certos na execucao seguinte.
