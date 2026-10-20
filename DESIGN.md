---
name: CRM — Funil de negócios
description: Sistema visual do protótipo local de funil comercial.
colors:
  ink: "#183039"
  muted: "#596b78"
  accent: "#286964"
  accent-hover: "#194f4b"
  line: "#dce2e7"
  surface: "#f5f7f8"
  paper: "#fff"
  topbar: "#1b1d1e"
  stage: "#f7f9fa"
  totals: "#e9edf0"
  control-border: "#9cabb3"
  focus: "#088eaa"
  tag-background: "#e2f0ec"
  tag-text: "#265c57"
  won: "#246c51"
  lost: "#a63737"
typography:
  headline:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "22px"
    fontWeight: 700
  title:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "13px"
    fontWeight: 400
  label:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "12px"
    fontWeight: 600
rounded:
  control: "6px"
  card: "12px"
  tag: "4px"
  toast: "8px"
spacing:
  compact: "8px"
  card-gap: "12px"
  standard: "16px"
  panel: "24px"
  dialog-inline: "26px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "8px 11px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  card:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.card}"
    padding: "15px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "8px 11px"
  tag:
    backgroundColor: "{colors.tag-background}"
    textColor: "{colors.tag-text}"
    rounded: "{rounded.tag}"
    padding: "4px 7px"
---

# Design System: CRM — Funil de negócios

## Overview

Registro em modo scan do sistema implementado em `styles.css` e `index.html`. A referência indicada é `../../output/playwright/leads2b-funil.png`; este documento descreve o protótipo local, sem atribuir ao produto original comportamentos adicionados na implementação.

A interface combina topo escuro, controles em verde petróleo e superfícies claras para organizar uma operação comercial densa. A linguagem é funcional: texto curto, bordas discretas e colunas contínuas. Não houve definição de um nome conceitual de marca ou metáfora criativa pelo usuário.

**Key Characteristics:**

- Colunas comerciais persistentes com rolagem horizontal.
- Verde petróleo para ações principais e seleção.
- Contraste por superfícies e bordas; sombras concentradas em sobreposições.
- Tipografia de sistema compacta.

## Colors

### Primary

O verde petróleo `accent` identifica ações principais, visualização selecionada e títulos interativos em hover; `accent-hover` escurece a resposta do controle. A marca simplificada usa verde mais vivo, definido localmente no CSS.

### Neutral

`ink` estrutura o texto e `muted` carrega metadados. `paper` é a superfície de formulários, cartões e ferramentas; `surface` é o plano de fundo. `stage` distingue cabeçalhos e `totals` distingue totais por etapa. `line` separa superfícies; `control-border` delimita campos.

### Semantic

`focus` é o contorno visível de teclado. `won` e `lost` distinguem métricas de encerramento, acompanhadas de rótulos textuais. As tags usam a combinação `tag-background` e `tag-text`.

## Typography

Arial, Helvetica e sans-serif são compartilhadas por toda a interface, incluindo controles. A base é compacta, sem fontes externas. O título do diálogo usa o papel headline; nomes de negócios usam title; metadados, rótulos e cabeçalhos usam tamanhos menores.

Cabeçalhos das etapas são maiúsculos, com espaçamento entre letras de `.04em` e entrelinha de `1.5`. Valores monetários usam números tabulares. Não existe escala display nem fonte editorial distinta.

## Layout

O topo tem altura fixa de (48px). A barra de ferramentas usa flex com quebra, espaçamento de (14px) e preenchimento de (16px 24px). O quadro usa cinco colunas iguais com mínimo de (265px), rolagem horizontal interna e altura mínima calculada em relação à janela. Cabeçalhos de etapa têm altura de (84px); cartões ficam em áreas com preenchimento de (16px). A barra inferior de métricas é sticky na borda inferior.

Em larguras até (700px), navegação e sufixo da marca são ocultados; grupos de ferramentas ocupam toda a largura; o quadro mantém cinco colunas com mínimo de `minmax(280px,85vw)`. Os formulários passam de duas colunas para uma; filtros se reorganizam; métricas empilham sob o botão. O quadro continua navegável por rolagem horizontal. Diálogos têm largura `min(620px,calc(100% - 24px))` e altura máxima de `92dvh`.

Textos longos em títulos, responsáveis e tags podem quebrar em qualquer ponto; metadados dos cartões quebram linha e tags respeitam a largura disponível. O quadro usa contenção de layout e pintura e mantém largura máxima de 100%.

## Elevation & Depth

O quadro e seus cartões usam bordas e fundos, sem sombra em repouso. Diálogos usam `0 20px 70px #13283040` e backdrop `#14232c70`. Avisos flutuantes usam `0 6px 20px #203f3c33` e aparecem acima das métricas. Não há transições ou animações definidas no CSS atual.

## Shapes

Controles têm cantos discretamente arredondados; cartões, estados vazios e diálogos têm cantos mais amplos. Tags e navegação ativa usam cantos pequenos. Visualizações Quadro/Lista formam um controle segmentado unido. Bordas sólidas delimitam entradas e cartões; bordas tracejadas identificam estados vazios.

## Components

### Buttons

Ações principais e seleção compartilham verde petróleo e texto branco. Botões comuns usam fundo branco, borda de campo, peso (600) e altura mínima de (34px). Hover comum usa fundo suave; hover principal escurece. Botões de ícone têm fundo transparente. Exclusão usa texto vermelho. Foco de teclado usa contorno de (3px) com afastamento de (3px).

### Cards / Containers

Cartões mostram título interativo, organização/pessoa, valor, responsável, tags e seletor de etapa. O título recebe sublinhado e verde no hover; cartões arrastáveis usam cursor grab. A coluna de destino recebe fundo verde suave durante o arraste. Os cartões preenchidos são uma proposta do protótipo, pois a referência original estava vazia.

### Inputs / Fields

Campos e seletores compartilham o desenho dos controles. Labels ficam acima dos campos com distância de (7px). Campos de texto longo podem ocupar a largura total. Erros aparecem em vermelho com entrelinha de (1.6); o foco mantém o contorno de teclado comum.

### Navigation

Topo escuro com marca à esquerda, módulo ativo em superfície cinza e indicação de versão local à direita. A navegação do módulo desaparece no breakpoint estreito. Alternância Quadro/Lista usa botões unidos e estado selecionado verde.

### Dialogs and feedback

Diálogo nativo com cabeçalho separado por borda e rodapé sticky. Ações quebram linha quando necessário. Toast centralizado próximo à base, limitado à largura da janela. Filtros revelam uma faixa de campos e um resumo tonal quando aplicados.

## Do's and Don'ts

### Do:

- **Do** manter as cinco etapas navegáveis em telas estreitas com rolagem interna.
- **Do** preservar o contorno visível para navegação por teclado.
- **Do** usar bordas e superfícies para separar o conteúdo do quadro.
- **Do** manter rótulos textuais junto às métricas de ganho e perda.

### Don't:

- **Don't** documentar funcionalidades propostas como evidência observada do Leads2b.
- **Don't** introduzir novas fontes ou efeitos de movimento como se fossem tokens existentes.
- **Don't** ocultar o acesso a etapas para encaixar o quadro na tela pequena.


