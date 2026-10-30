---
name: Poliniza CRM — Operação comercial
description: Sistema visual Poliniza CRM com marca discreta e módulos comerciais configuráveis.
colors:
  ink: "#302b36"
  muted: "#68616e"
  accent: "#602878"
  accent-hover: "#481b5d"
  line: "#e3dfe7"
  surface: "#f7f6f8"
  paper: "#fff"
  topbar: "#24102f"
  brand-gold: "#d9b75f"
  brand-gold-line: "#72502a"
  topbar-secondary-text: "#dfd3e5"
  topbar-control-border: "#8e7898"
  topbar-control-hover: "#3b2148"
  stage: "#f8f7fa"
  board: "#f1eff4"
  task-column: "#f0edf3"
  progress-track: "#e9e2ed"
  navigation-active: "#efe7f3"
  navigation-active-text: "#57246e"
  warning-background: "#fff0e0"
  warning-text: "#754815"
  notice-background: "#f2edf5"
  notice-text: "#60446d"
  status-neutral-background: "#edf0f3"
  status-neutral-text: "#445c68"
  status-won-background: "#e2f2e9"
  status-lost-background: "#fbe9e9"
  control-border: "#9cabb3"
  focus: "#80409b"
  tag-background: "#f0eaf4"
  tag-text: "#5d326e"
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
  dashboard-metric:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "27px"
    fontWeight: 600
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

# Design System: Poliniza CRM — Operação comercial

## Overview

Registro em modo scan do sistema implementado em `styles.css`, `index.html`, `app.js`, `operations-ui.mjs` e `import-ui.mjs`. A referência indicada é `../../output/playwright/leads2b-funil.png`; este documento descreve o sistema Poliniza implementado, sem atribuir ao produto original comportamentos adicionados na implementação.

A interface combina topo escuro, controles em púrpura e superfícies claras para organizar uma operação comercial densa. A linguagem é funcional: texto curto, bordas discretas e colunas contínuas. Marca Poliniza CRM confirmada pelo usuário; emblema dourado sobre púrpura fornecido em 25/10/2026.

Atualização v2: ampliação autorizada para módulos CRM e pipelines configuráveis, preservando a identidade do primeiro funil. Evidências de interface: ../../output/playwright/crm-v2-desktop.png, crm-v2-stages.png, crm-v2-mobile.png e crm-v2-mobile-detail.png. A tipografia Arial foi mantida como decisão de continuidade, apesar do aviso do detector; novos tamanhos e fundos semânticos refletem o CSS atual.

A ampliação operacional mantém o mesmo sistema para projetos, tarefas, agenda, jornadas, campanhas e gestão. Os novos elementos reutilizam painéis, tabelas, campos e estados existentes; progressos e etapas numeradas explicitam sequência e andamento.

A homologação de gravação por registro amplia o mesmo sistema em `homologacao/index.html`, `homologacao/app.mjs` e `homologacao/style.css`. O aviso permanente identifica dados fictícios, ausência de login real e descarte dos dados ao reiniciar o servidor local. A superfície de teste não representa implantação remota nem migração do CRM publicado.

**Key Characteristics:**

- Colunas comerciais persistentes com rolagem horizontal.
- Púrpura para ações principais e seleção.
- Contraste por superfícies e bordas; sombras concentradas em sobreposições.
- Tipografia de sistema compacta.

## Colors

### Primary

O púrpura `accent` identifica ações principais, visualização selecionada e títulos interativos em hover; `accent-hover` escurece a resposta do controle. O topo usa `topbar`; o emblema dourado original identifica a marca. O dourado `brand-gold` é reservado ao foco dos controles no topo, e `brand-gold-line` forma seu divisor inferior de (1px).

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

Até (760px), a lateral fica oculta e pode abrir como painel fixo de (245px) pelo botão do topo. A marca secundária e o indicador local são ocultados. O conteúdo usa (20px 14px), títulos de página medem (23px), cabeçalho e ações empilham. O seletor de pipeline ocupa uma linha inteira; status e visualização se acomodam abaixo. Colunas têm base de (85vw), cabeçalhos mínimo de (110px), quadro mínimo de (500px) sem altura máxima. Formulários e detalhes passam a uma coluna. Tabelas operacionais mantêm mínimo de (800px) com rolagem no próprio contêiner; calendário mensal mantém (650px). Indicadores reduzem para (19px).

Diálogos têm largura `min(760px,calc(100% - 28px))`; a variante ampla usa (1000px) com a mesma margem e altura máxima de `92dvh`. Textos longos quebram em cartões, tags, detalhes e tabelas. O quadro mantém contenção de layout e pintura.

Quadros de tarefas usam colunas flexíveis de base (270px), espaçamento de (16px) e rolagem interna; no celular, a base passa a (85vw). Dashboards por pipeline usam faixas de quatro indicadores; a visão comercial usa três. Até (760px), ambas passam a duas colunas. Metas usam duas colunas, uma até (1100px). Seletores e filtros de gestão quebram linha; no celular, seletores da barra ocupam a linha inteira e filtros de relatórios empilham. A agenda semanal mantém largura mínima de (850px) no celular; a diária usa uma única coluna sem largura mínima, com dia de no mínimo (400px). A agenda semanal usa dias de no mínimo (380px).

A extensão de acesso interno reutiliza o shell. O painel de login e troca obrigatória de senha tem largura máxima de (460px), margem de (20px auto), preenchimento de (28px), título de (22px) e formulário em grade com intervalo de (18px). Instruções de configuração ficam em painel de até (850px). Até (760px), o painel de acesso usa margem de (8px 0) e preenchimento de (22px). Com ações de conta presentes, o topo permite quebra de linha e altura automática, mantendo mínimo de (56px). A lateral móvel acompanha a altura real medida do topo por `--crm-header-height`, com fallback de (56px); não deve sobrepor suas ações. Nomes nos controles de conta usam reticências, limitados a (160px), ou (94px) no celular.

Na homologação, o topo usa altura automática, mínimo de (56px) e preenchimento vertical de (8px). O seletor de pessoa de teste usa `ink` sobre `paper`, texto de (12px) e largura máxima de (220px). Até (760px), as ações do topo ocupam outra linha e o seletor respeita a largura disponível. A lateral móvel acompanha a altura medida do topo via `--crm-header-height`, com fallback de (100px). A tabela mantém largura mínima de (650px) e rolagem contida; a instrução “Deslize a tabela para ver mais colunas.” aparece apenas nesse breakpoint. Busca e paginação reutilizam toolbar e tablewrap; o campo de busca tem largura de (260px), passando a (100%) no celular.

## Elevation & Depth

O quadro e seus cartões usam bordas e fundos, sem sombra em repouso. Diálogos usam `0 20px 70px #13283040` e backdrop `#14232c70`. Avisos flutuantes usam `0 6px 20px #203f3c33` e ficam a (24px) da base. A lateral móvel aberta usa `8px 8px 24px #302b3620`. Não há transições ou animações definidas no CSS atual.

## Shapes

Controles têm cantos discretamente arredondados; cartões, estados vazios e diálogos têm cantos mais amplos. Tags e navegação ativa usam cantos pequenos. Visualizações Quadro/Lista formam um controle segmentado unido. Bordas sólidas delimitam entradas e cartões; bordas tracejadas identificam estados vazios.

## Components

### Poliniza brand

A marca do topo reúne o emblema original `poliniza-emblema.png`, sem alteração, o nome “Poliniza CRM” e o descritor “Operação comercial”. O mesmo arquivo serve como favicon. O emblema mede (36px) com cantos de (7px); em telas de até (760px), mede (32px). O nome usa peso (700) e tamanho de (18px), reduzido a (17px) no celular, permanecendo visível. Somente o descritor é ocultado nesse breakpoint. O topo usa texto secundário `topbar-secondary-text`, bordas de controle `topbar-control-border` e hover `topbar-control-hover`.

**The Restrained Brand Rule.** Púrpura identifica ação e seleção sobre superfícies claras; dourado fica no emblema e nos detalhes do topo. Estados de ganho, perda e alerta mantêm as cores semânticas existentes. Não ampliar a marca para fundos saturados de tabelas ou quadros.

Evidências da atualização de 25/10/2026: `../../output/playwright/poliniza-login-desktop.png`, `poliniza-board-desktop.png` e `poliniza-board-mobile.png`. As capturas do quadro usam base local vazia de validação.

### Buttons

Ações principais e seleção compartilham púrpura e texto branco. Botões comuns usam fundo branco, borda de campo, peso (600) e altura mínima de (36px). Hover comum usa fundo suave; hover principal escurece. Botões de ícone têm fundo transparente. Exclusão usa texto vermelho. Foco de teclado usa contorno de (3px) com afastamento de (3px).

### Cards / Containers

Cartões mostram título interativo, organização/pessoa, valor, responsável, tags e seletor de etapa. O título recebe sublinhado e verde no hover; cartões arrastáveis usam cursor grab. A coluna de destino recebe fundo verde suave durante o arraste. Os cartões preenchidos são uma proposta do protótipo, pois a referência original estava vazia.

### Inputs / Fields

Campos e seletores compartilham o desenho dos controles. Labels ficam acima dos campos com distância de (7px). Campos de texto longo podem ocupar a largura total. Erros aparecem em vermelho com entrelinha de (1.7); o foco mantém o contorno de teclado comum.

### Navigation

Topo escuro com marca à esquerda e ações de backup e ajuda à direita. A navegação lateral clara mostra os módulos; o módulo ativo recebe fundo púrpura suave, texto púrpura escuro e peso (700). No breakpoint estreito, o menu abre e fecha uma lateral fixa. Alternância Quadro/Lista usa botões unidos e estado selecionado púrpura.

### Dialogs and feedback

Diálogo nativo com cabeçalho e rodapé sticky separados por borda. Ações quebram linha quando necessário. Toast centralizado próximo à base, limitado à largura da janela. Filtros revelam uma faixa de campos e um resumo tonal quando aplicados.

### Modules and configurable pipelines

Painéis brancos de configuração usam borda, raio de (10px) e preenchimento de (22px); listas de configuração têm linhas de ações com raio de (8px). Editores de etapas organizam nome, probabilidade e ações em três colunas: `minmax(130px,1fr) 80px auto`; em telas pequenas: `minmax(80px,1fr) 58px auto`. Avisos de transferência usam fundo quente e preservam o texto explicativo.

Orçamentos usam linhas de itens com produto, quantidade, preço, desconto e remoção; em telas pequenas, produto e descrição ocupam a linha inteira. Detalhes usam duas colunas no desktop e uma no celular, com histórico separado por bordas. Tabs e ações quebram linha.

Tabelas compactas têm cabeçalhos de (11px), células de (12px), preenchimento de (14px 16px), paginação e ações em lote. Indicadores resumidos aparecem em uma faixa de blocos; barras de relatório têm altura de (5px). O calendário usa sete colunas, dias de no mínimo (100px) e marca o dia atual com fundo verde suave.

A impressão isola o documento comercial, remove cabeçalho e ações do diálogo, permite quebra de tabelas e evita quebra interna das linhas. A página impressa usa margem de (18mm). Não aplica à impressão o shell do aplicativo.

### Operational work and progress

Projetos e Meu trabalho usam linhas com bordas inferiores, metadados menores e ações alinhadas. Estatísticas operacionais usam valores de (22px), reduzidos a (19px) no celular. Checklists se organizam verticalmente com intervalo de (12px); dias da semana e horários disponíveis quebram linha. Horários disponíveis ocupam aproximadamente metade da linha no celular.

**The Progress Rule.** Andamento é mostrado por barra nativa acompanhada de percentual e contexto textual. O trilho usa `progress-track`, preenchimento `accent`, altura de (9px) e cantos de (4px); valores visuais ficam limitados ao máximo da barra.

### Journey steps and campaign previews

Passos de jornada usam superfície clara, borda, cantos de (10px), preenchimento de (18px) e intervalo inferior de (22px). Um número circular de (28px) identifica a ordem; setas verticais conectam os passos. Cabeçalhos acomodam o tipo de passo e ações de reordenação, quebrando linha em larguras menores. No celular, o preenchimento passa a (14px). Históricos reutilizam linhas e divisores existentes.

Prévia de email usa superfície tonal, borda e cantos de (8px), preenchimento de (24px), reduzido a (16px) no celular. Conteúdo preserva quebras e permite quebra de palavras. Estados e avisos descrevem preparação local e registro manual; a aparência não comunica envio automático inexistente.

### Management dashboards and goals

Dashboards apresentam três seletores prontos em botões com estado pressionado textual e púrpura. Abaixo ficam período, responsável e pipeline, atalhos de período e uma comparação tabular. Cada pipeline ocupa um painel próprio com nome, contexto e ação para isolá-lo. Valores usam (26px), peso (700) e algarismos tabulares, reduzidos a (22px) no celular; legendas usam (12px) e contexto de data usa (11px). A faixa possui divisores horizontais e preenchimento vertical de (20px), reduzido a (16px) no celular. Listas de atividades atrasadas e futuras usam duas colunas no desktop e uma no celular. A comparação mantém rolagem interna, foco de teclado e instrução móvel. Metas reutilizam painéis, badges de situação e barras de progresso.

**The Pipeline Context Rule.** Nome do pipeline, recorte e sentido da data permanecem visíveis junto aos valores. Pipelines são separados por ID, inclusive quando seus nomes coincidem; atividades sem vínculo aparecem em “Sem pipeline”. Cores semânticas reforçam os rótulos, sem substituí-los.

**The Surface Continuity Rule.** Novos módulos reutilizam topo escuro, navegação clara, púrpura, campos e bordas do CRM; não introduzem uma identidade visual independente.

### Guided spreadsheet import

O importador reutiliza o diálogo amplo com cabeçalho e ações sticky. Instruções numeradas precedem os botões de modelo e backup, seguidas de um dicionário de campos expansível, entrada de arquivo rotulada e prévia com anúncio de atualização. O resumo usa superfície tonal, borda e cantos de (8px), com espaçamento de (16px); no celular, o resumo quebra linha e o total ocupa uma linha própria. A tabela mostra linha, ação, nome e identificação. Badges textuais distinguem criação e atualização; erros mostram linha, coluna e correção, acompanhados de relatório para download. O conteúdo rola dentro do diálogo sem deslocar as ações principais.

**The Preview Before Commit Rule.** A ação de importar permanece desabilitada até existir uma prévia válida; a confirmação explícita antecede a gravação. Erros indicam como corrigir e selecionar novamente o arquivo. Formato e limites aparecem antes da seleção, sem comunicar suporte nativo a XLSX.

### Internal accounts and protected forms

Acesso interno preserva painel branco, borda, campos, botão principal e foco existentes. Login, primeira troca de senha e carregamento são estados do mesmo painel. Gestão de usuários reutiliza tabela, busca, filtro de situação, badges textuais e diálogos de criação/edição/exclusão. Administrador e colaborador têm explicações específicas; o estado de acesso não depende apenas da cor. Exclusão pede confirmação digitada; erros permanecem próximos ao formulário com anúncio de alerta. Durante uma operação, submissões ficam desabilitadas até a resposta. Campos de senha usam os propósitos de preenchimento automático atuais e novos; limpar um diálogo remove seu conteúdo sensível do DOM.

**The Access State Rule.** A interface distingue dados locais, configuração pendente, autenticação/carregamento e base compartilhada confirmada. Dados da equipe e navegação dos módulos só aparecem após o carregamento autorizado; falha de gravação comunica que a alteração não foi confirmada e oferece recuperação da tentativa. Esses estados não afirmam que um serviço já está provisionado.

O Supabase do CRM publicado está conectado e provisionado, conforme PRODUCT.md; a superfície de homologação permanece separada. Não há envio de convite nem recuperação de senha por email implementados. A tela orienta procurar o administrador. As imagens `../../output/playwright/crm-users-desktop.png`, `crm-users-edit-mobile.png` e `crm-users-login-mobile.png` mostram fixtures sintéticas de teste, não contas reais nem evidência isolada de provisionamento.

### Record-persistence homologation

A superfície de homologação reutiliza a marca, as ações púrpura, a navegação clara e os diálogos nativos existentes. O aviso de dados fictícios fica acima do cabeçalho da página; escopo e limitações aparecem após a lista. O seletor de pessoa é uma fixture de teste, não um login. Os registros aparecem em tabelas paginadas com nome/título interativo, data da atualização e ações explícitas; o histórico mostra eventos recentes e autor.

O editor de etapas usa fieldsets com borda de (1px), raio de (8px), preenchimento de (16px), reduzido a (12px) no celular, e intervalo de (14px). Legendas de (12px) identificam a ordem; botões nomeiam adicionar, subir, descer e remover. Formulários preservam os labels e o foco de teclado do CRM.

Campos com confirmação pendente usam opacidade de (.65) e ficam desabilitados; o botão de nova tentativa permanece disponível quando o resultado é desconhecido. Mensagens de conflito aparecem junto ao formulário e não apagam os valores digitados.

**The Confirmed Save Rule.** Gravação não confirmada preserva a edição no formulário. Conflito oferece baixar a edição e reabrir a versão atual; resultado desconhecido mantém os campos bloqueados e oferece “Tentar confirmar”, repetindo a mesma requisição. Não anunciar sucesso antes da confirmação.

Referências sintéticas: `../../output/playwright/records-homologacao-desktop.png`, `records-homologacao-mobile.png` e `records-homologacao-form-mobile.png`. Esses arquivos mostram o ambiente local de testes; não comprovam autenticação real, dados persistentes ou deploy em produção.

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
