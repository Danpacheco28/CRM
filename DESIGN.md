---
name: CRM — Operação comercial
description: Sistema visual do CRM local com módulos e pipelines configuráveis.
colors:
  ink: "#183039"
  muted: "#596b78"
  accent: "#286964"
  accent-hover: "#194f4b"
  line: "#dce2e7"
  surface: "#f5f7f8"
  paper: "#fff"
  topbar: "#1b1d1e"
  stage: "#f6f8f9"
  board: "#eff3f5"
  navigation-active: "#e1efeb"
  navigation-active-text: "#1e5a54"
  warning-background: "#fff0e0"
  warning-text: "#754815"
  notice-background: "#edf4f1"
  notice-text: "#345f55"
  status-neutral-background: "#edf0f3"
  status-neutral-text: "#445c68"
  status-won-background: "#e2f2e9"
  status-lost-background: "#fbe9e9"
  control-border: "#9cabb3"
  focus: "#088eaa"
  tag-background: "#e2f0ec"
  tag-text: "#265c57"
  won: "#246c51"
  lost: "#a63737"
typography:
  headline:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "26px"
    fontWeight: 700
  dialog-title:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "21px"
    fontWeight: 700
  panel-title:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "17px"
    fontWeight: 700
  metric:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "23px"
    fontWeight: 600
  title:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "14px"
    fontWeight: 400
  label:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "12px"
    fontWeight: 600
rounded:
  control: "6px"
  panel: "10px"
  toolbar: "8px"
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
    padding: "9px 11px"
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
    padding: "9px 11px"
  tag:
    backgroundColor: "{colors.tag-background}"
    textColor: "{colors.tag-text}"
    rounded: "{rounded.tag}"
    padding: "4px 7px"
---

# Design System: CRM — Operação comercial

## Overview

Registro em modo scan do sistema implementado em `styles.css` e `index.html`. A referência indicada é `../../output/playwright/leads2b-funil.png`; este documento descreve o protótipo local, sem atribuir ao produto original comportamentos adicionados na implementação.

A interface combina topo escuro, controles em verde petróleo e superfícies claras para organizar uma operação comercial densa. A linguagem é funcional: texto curto, bordas discretas e colunas contínuas. Não houve definição de um nome conceitual de marca ou metáfora criativa pelo usuário.

Atualização v2: ampliação autorizada para módulos CRM e pipelines configuráveis, preservando a identidade do primeiro funil. Evidências de interface: ../../output/playwright/crm-v2-desktop.png, crm-v2-stages.png, crm-v2-mobile.png e crm-v2-mobile-detail.png. A tipografia Arial foi mantida como decisão de continuidade, apesar do aviso do detector; novos tamanhos e fundos semânticos refletem o CSS atual.

**Key Characteristics:**

- Colunas comerciais persistentes com rolagem horizontal.
- Verde petróleo para ações principais e seleção.
- Contraste por superfícies e bordas; sombras concentradas em sobreposições.
- Tipografia de sistema compacta.

## Colors

### Primary

O verde petróleo `accent` identifica ações principais, visualização selecionada e títulos interativos em hover; `accent-hover` escurece a resposta do controle. A marca simplificada usa verde próprio definido localmente no CSS.

### Neutral

`ink` estrutura o texto e `muted` carrega metadados. `paper` é a superfície de formulários, cartões e ferramentas; `surface` é o plano de fundo. `stage` distingue cabeçalhos e `board` define o fundo do quadro. `line` separa superfícies; `control-border` delimita campos.

### Semantic

`focus` é o contorno visível de teclado. `won` e `lost` distinguem métricas de encerramento, acompanhadas de rótulos textuais. As tags usam a combinação `tag-background` e `tag-text`.

## Typography

Arial, Helvetica e sans-serif são compartilhadas por toda a interface, incluindo controles. A base é compacta, sem fontes externas. O título de página usa headline, o diálogo usa dialog-title e painéis usam panel-title; nomes de negócios usam title. Metadados, rótulos e cabeçalhos usam tamanhos menores. A base atual é (14px); legendas e navegação têm tamanhos locais de (10px) a (13px).

Cabeçalhos das etapas são maiúsculos, com espaçamento entre letras de `.03em` e entrelinha de `1.5`. Valores monetários usam números tabulares. Não existe escala display nem fonte editorial distinta.

## Layout

O shell usa topo sticky de (56px), navegação lateral de (216px) e área principal flexível com preenchimento de (28px 28px 40px). O cabeçalho de página separa breadcrumb, título e ações. A barra de ferramentas usa flex com quebra e preenchimento de (14px 16px). O quadro contém tantas colunas quanto as etapas configuradas; cada coluna mede (285px), com rolagem interna, altura mínima de (540px) e máxima de `calc(100dvh - 270px)`. Cabeçalhos sticky das etapas têm mínimo de (100px); cartões ficam em áreas com preenchimento de (12px). A síntese do funil ocupa faixa abaixo do quadro, sem sticky no rodapé da janela.

Até (1100px), a lateral passa a (190px), o conteúdo tem preenchimento de (24px 18px), buscas medem (180px) e painéis em duas colunas passam a uma. A partir de (1700px), colunas podem crescer com base mínima de (280px).

Até (760px), a lateral fica oculta e pode abrir como painel fixo de (245px) pelo botão do topo. A marca secundária e o indicador local são ocultados. O conteúdo usa (20px 14px), títulos de página medem (23px), cabeçalho e ações empilham. O seletor de pipeline ocupa uma linha inteira; status e visualização se acomodam abaixo. Colunas têm base de (85vw), cabeçalhos mínimo de (110px), quadro mínimo de (500px) sem altura máxima. Formulários e detalhes passam a uma coluna. Tabelas e calendário mantêm mínimo de (650px) com rolagem no próprio contêiner. Indicadores reduzem para (19px).

Diálogos têm largura `min(760px,calc(100% - 28px))`; a variante ampla usa (1000px) com a mesma margem e altura máxima de `92dvh`. Textos longos quebram em cartões, tags, detalhes e tabelas. O quadro mantém contenção de layout e pintura.

## Elevation & Depth

O quadro e seus cartões usam bordas e fundos, sem sombra em repouso. Diálogos usam `0 20px 70px #13283040` e backdrop `#14232c70`. Avisos flutuantes usam `0 6px 20px #203f3c33` e ficam a (24px) da base. A lateral móvel aberta usa `8px 8px 24px #18303920`. Não há transições ou animações definidas no CSS atual.

## Shapes

Controles têm cantos discretamente arredondados; cartões, estados vazios e diálogos têm cantos mais amplos. Tags e navegação ativa usam cantos pequenos. Visualizações Quadro/Lista formam um controle segmentado unido. Bordas sólidas delimitam entradas e cartões; bordas tracejadas identificam estados vazios.

## Components

### Buttons

Ações principais e seleção compartilham verde petróleo e texto branco. Botões comuns usam fundo branco, borda de campo, peso (600) e altura mínima de (36px). Hover comum usa fundo suave; hover principal escurece. Botões de ícone têm fundo transparente. Exclusão usa texto vermelho. Foco de teclado usa contorno de (3px) com afastamento de (3px).

### Cards / Containers

Cartões mostram título interativo, organização/pessoa, valor, responsável, tags e seletor de etapa. O título recebe sublinhado e verde no hover; cartões arrastáveis usam cursor grab. A coluna de destino recebe fundo verde suave durante o arraste. Os cartões preenchidos são uma proposta do protótipo, pois a referência original estava vazia.

### Inputs / Fields

Campos e seletores compartilham o desenho dos controles. Labels ficam acima dos campos com distância de (7px). Campos de texto longo podem ocupar a largura total. Erros aparecem em vermelho com entrelinha de (1.7); o foco mantém o contorno de teclado comum.

### Navigation

Topo escuro com marca à esquerda e ações de backup e ajuda à direita. A navegação lateral clara mostra os módulos; o módulo ativo recebe fundo verde suave, texto verde escuro e peso (700). No breakpoint estreito, o menu abre e fecha uma lateral fixa. Alternância Quadro/Lista usa botões unidos e estado selecionado verde.

### Dialogs and feedback

Diálogo nativo com cabeçalho e rodapé sticky separados por borda. Ações quebram linha quando necessário. Toast centralizado próximo à base, limitado à largura da janela. Filtros revelam uma faixa de campos e um resumo tonal quando aplicados.

### Modules and configurable pipelines

Painéis brancos de configuração usam borda, raio de (10px) e preenchimento de (22px); listas de configuração têm linhas de ações com raio de (8px). Editores de etapas organizam nome, probabilidade e ações em três colunas: `minmax(130px,1fr) 80px auto`; em telas pequenas: `minmax(80px,1fr) 58px auto`. Avisos de transferência usam fundo quente e preservam o texto explicativo.

Orçamentos usam linhas de itens com produto, quantidade, preço, desconto e remoção; em telas pequenas, produto e descrição ocupam a linha inteira. Detalhes usam duas colunas no desktop e uma no celular, com histórico separado por bordas. Tabs e ações quebram linha.

Tabelas compactas têm cabeçalhos de (11px), células de (12px), preenchimento de (14px 16px), paginação e ações em lote. Indicadores resumidos aparecem em uma faixa de blocos; barras de relatório têm altura de (5px). O calendário usa sete colunas, dias de no mínimo (100px) e marca o dia atual com fundo verde suave.

A impressão isola o documento comercial, remove cabeçalho e ações do diálogo, permite quebra de tabelas e evita quebra interna das linhas. A página impressa usa margem de (18mm). Não aplica à impressão o shell do aplicativo.

## Do's and Don'ts

### Do:

- **Do** manter todas as etapas configuradas navegáveis em telas estreitas com rolagem interna.
- **Do** preservar o contorno visível para navegação por teclado.
- **Do** usar bordas e superfícies para separar o conteúdo do quadro.
- **Do** manter rótulos textuais junto às métricas de ganho e perda.

### Don't:

- **Don't** documentar funcionalidades propostas como evidência observada do Leads2b.
- **Don't** introduzir novas fontes ou efeitos de movimento como se fossem tokens existentes.
- **Don't** ocultar o acesso a etapas para encaixar o quadro na tela pequena.




