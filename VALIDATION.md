# Verificação da ampliação CRM — 20/10/2026

## Contas internas — 23/10/2026

- `node --test model.test.mjs operations.test.mjs account.test.mjs`: 31 testes passaram, incluindo configuração pública, recusa de chaves secretas, validação de cadastro e erros remotos sem sucesso fictício.
- `supabase/tests/internal-users.test.mjs`: um teste integrado PostgreSQL/PGlite passou com banco descartável. Exercitou criação por administrador, recusa para colaborador, troca real do hash inicial, proteção do próprio administrador, desativação, exclusão de conta com preservação da base, inicialização restrita, conflito de revisão e recusa de acesso direto às tabelas/RPCs por authenticated. A dependência PGlite foi instalada apenas em `tmp/crm-auth-test`, fora do aplicativo.
- `npx.cmd --yes deno check supabase/functions/crm-internal/index.ts`: passou no runtime Deno; não implantou função nem criou contas.
- `verify-accounts.cjs`: fluxo Chromium em localhost4176 com serviço explicitamente simulado passou. Cobriu login inválido, base escondida antes do login, criação/duplicidade/edição/desativação, troca de senha inicial, restrição de gestão para colaborador, exclusão confirmada com preservação de negócio e tentativa exportável em conflito. Nenhuma conta ou mensagem real foi criada/enviada.
- Regressão dos fluxos CRM anteriores passou no modo local. O roteiro antigo inicialmente verificou a rota de atividades antes de terminar a renderização; confirmada a atividade persistida e retomado o restante com espera da navegação, sem mudança do produto para acomodar o teste.
- Revisão visual em desktop/móvel: identidade anterior preservada; offset da lateral corrigido para a altura real do topo autenticado (102px no teste móvel), sem vazamento horizontal. Capturas `output/playwright/crm-users-*.png` são sintéticas e não entram no runtime. Detector uma vez; avisos herdados de Arial/tokens. Revisão independente e documentação DESIGN concluídas.
- A instalação remota e o ensaio de contas foram concluídos na etapa de ativação descrita abaixo. Permanecem fora desta etapa: recuperação por email, carteira individual, restauração compartilhada e agendador contínuo.

## Modelo de dados

`node --test model.test.mjs`: 13 testes passaram.

- Migração dos contatos/etapas da versão anterior, inclusive negócios perdidos.
- Dados legados inválidos preservados, sem sobrescrita automática.
- Renomear/reordenar etapas mantém a identidade dos vínculos.
- Remoção de etapa ocupada exige transferência; transação inválida não grava.
- Exclusão de pipeline migra negócios e protege o último pipeline.
- Exclusão de contatos/negócios vinculados é bloqueada.
- Totais monetários, aprovação prévia, snapshot e unicidade de pedido.
- Conflitos entre abas e falha de quota sem mutação parcial.
- Backup com identificador inseguro ou etapa inexistente é rejeitado.
- CSV com aspas/separadores e moeda brasileira; atualização por SKU.
- CSV inválido em linha posterior não faz gravação parcial.
- Importação não combina documentos diferentes/inválidos apenas por compartilharem email.

## Navegador

Perfil isolado, Chromium, http://127.0.0.1:4174. Roteiro `verify-v2.cjs` passou em duas execuções com perfis novos:

- Criar pipeline, renomear, reordenar e remover etapa ocupada com transferência.
- Excluir pipeline com negócio e conferir preservação após recarga.
- Criar atividade vinculada e concluir.
- Cadastrar produto, calcular orçamento com descontos/frete, aprovar e gerar pedido único.
- Conferir documento preenchido e cadastro de pessoa vinculado à organização.
- Criar campo personalizado e conferir presença no negócio.
- Largura de página móvel sem vazamento horizontal; quadro possui rolagem própria.

Roteiro adicional de arquivos exercitou adicionar/remover anexo, prévia/importação CSV, restauração de backup válido, recusa de backup inválido e navegação nos módulos restantes. As janelas de seleção de arquivo observadas pelo CLI foram encerradas com o perfil de teste.

## Interface e revisão

- Capturas: `output/playwright/crm-v2-desktop.png`, `crm-v2-stages.png`, `crm-v2-mobile.png`, `crm-v2-mobile-detail.png` na área de trabalho local, fora do repositório.
- Detector Impeccable executado uma vez; Arial mantida por continuidade com a interface anterior. Avisos de novas cores/tamanhos tratados como extensão documentada do sistema, sem mudança de identidade.
- Revisão independente das quatro capturas e fontes: nenhum defeito material encontrado no contrato visual.
- JavaScript e modelo passaram na verificação de sintaxe.

## Limites da validação

Não representa validação de servidor, segurança multiusuário, integrações ou equivalência total ao Leads2b. Não foram testados navegadores além do Chromium nem tecnologias assistivas reais. Movimentação foi exercitada pelo seletor; arraste não foi automatizado. Valores, categorias e contatos usados nos testes são sintéticos e não integram o código publicado.

## Organização, automação e gestão — 20/10/2026

`node --test model.test.mjs operations.test.mjs`: 27/27 testes passaram. Incluem normalização de base anterior, recorrência idempotente e checklist reiniciado, disponibilidade/conflitos e cancelamento, gatilhos de jornada, condição falsa, espera e pausa, referências de pipelines, deduplicação/descadastro, programação da preparação e cálculos de relatórios/metas. Transações inválidas não persistem ações parciais.

`verify-operations.cjs`, Chromium, perfil descartável em http://127.0.0.1:4175: projeto, checklist, tarefa semanal/próxima ocorrência, quadro, tipo de reunião, agendamento com atividade, conflito recusado, jornada/inscrição/tarefa/histórico, campanha com público/preparação/registro manual, dashboard personalizado, relatório salvo, meta e persistência após recarga. Fluxo completo passou sem erros JavaScript. Os emails .test são sintéticos e nenhuma mensagem foi enviada.

Revisão desktop e móvel em duas rodadas batidas, sem vazamento horizontal da página; tabelas possuem rolagem interna e largura mínima para legibilidade. Capturas locais `output/playwright/crm-ops-*.png`. Detector executado uma vez; identidade anterior mantida. Revisão independente apontou e foram corrigidos: checklist carregado para próxima recorrência, filtro de responsável do Meu trabalho e busca do calendário. Paginação das execuções e destinatários foi separada da página principal.

Ainda não há testes reais de entrega de email, servidor/agendador, multiusuário ou portal público de autoagendamento, pois esses serviços não estão implementados. Cronômetros de aba em segundo plano podem ser suspensos pelo navegador; fila local retoma ao abrir o aplicativo.

## Ativação real do Supabase — 23/10/2026

- Projeto informado pelo usuário: quatro tabelas CRM instaladas e verificadas com RLS ativo; escrita direta do navegador negada. Funções transacionais service-only instaladas.
- Função crm-internal publicada pelo editor Supabase com bundle gerado por scripts/build-dashboard-function.mjs. Namespaces preservam os módulos canônicos; sintaxe e validação de estado do bundle passaram localmente. Compilação e execução confirmadas na plataforma pela resposta real do handler.
- Origens autorizadas configuradas para GitHub Pages e localhost4176. Verificação JWT legada da plataforma desativada conforme desenho; auth.getUser e a situação/perfil no banco continuam obrigatórios no handler.
- Verificações remotas sem login: GET405 do handler, preflight204 com origem correta, origem externa403, POST sem login401 e acesso direto a tabela401. Cadastro público desativado no Auth.
- Primeiro administrador criou sua senha pessoal diretamente no painel, foi vinculado e entrou no CRM local conectado. Nenhuma senha ou chave secreta foi lida ou incluída em arquivos.
- Usuário autorizou base vazia; inicialização compartilhada confirmou cinco etapas e zero negócios, sem apagar dados locais antigos.
- Ensaio real pela interface: criação de conta técnica temporária; login Auth200; acesso aos dados bloqueado403 antes da troca inicial; sessão já emitida bloqueada403 após desativação; conta excluída e token recusado401. Conta temporária removida ao fim; apenas administrador permaneceu. Nenhum email enviado.
- 31 testes Node passaram antes de publicar. Avisos HTTP401/403 no console do ensaio correspondem às recusas intencionais, não a falhas de autenticação do administrador.
## Identidade Poliniza CRM — 25/10/2026
- Nome aplicado no topo, títulos de página e identificação dos diálogos. Emblema original fornecido usado no topo e favicon, sem alteração do arquivo.
- Púrpura em ações e seleções, dourado restrito à marca e detalhes do topo; superfícies claras e cores semânticas preservadas.
- Desktop1440px e celular390px: imagem carregada, nome visível, sem overflow horizontal da página, sem erros JavaScript no fluxo local vazio. Login também capturado sem dados de autenticação.
- Contraste calculado: ação principal10,13:1; seleção9,24:1; texto secundário5,53:1; foco púrpura6,72:1. Revisão independente concluída sem correções materiais.
- Detector executado uma vez: avisos de Arial herdada e tokens documentais; sem mudança de fonte solicitada. Funcionalidade, banco e contas não alterados.

## Persistência por registro — 29/10/2026 (homologação local)
42 testes passaram, zero skips:31 anteriores de modelo/operações/contas,1 anterior SQL e10 novos de plano/serviço/persistência. PGlite0.3.14 em memória, sem conexão com dados reais. Incluem edições independentes com versões antigas, conflito no mesmo registro, idempotência, rollback de comando composto, FKs de etapa/pipeline e tipo de contato, transferência antes de exclusão, IDs retirados, revogação/primeira senha, ACL de anon/authenticated, leitura individual/paginação/busca/filtro e histórico, importação idempotente admin com preservação do evento original. Não é teste de carga ou transações simultâneas em conexões PostgreSQL independentes. Handler passou deno check --cached-only. Nenhum deploy da nova API ou alteração do banco real. UI e persistência publicada permanecem no snapshot até migração completa coordenada. Código/documentação em records/README.md.

## UI e trabalho por registro — 30/10/2026
46 testes Node/SQL/HTTP passaram sem skips;3 testes de trabalho repetidos após ajuste do gerador para modo --check, todos passaram. Projetos/tarefas com FK e prazo local Brasília→timestamptz. SQL002_work é aditivo e gerado sem alterar001_core. HTTP local testa Host/origem, actor fictício, arquivos em allowlist, duas requisições sobrepostas, conflito e idempotência. PGlite serializa uma instância, portanto não é ensaio multi-conexão PostgreSQL real.
Navegador local4180: criou contato/projeto/negócio/tarefa vinculados; concluiu tarefa; criou funil com adição/reordenação; duas abas editaram o mesmo contato e a perdedora manteve campos. Resposta perdida após commit foi repetida com a mesma chave e conteúdo, sem segundo evento; histórico confirmou versões3/2/1. Paginação25+3 registros. Nenhum erro JavaScript; um erro de rede esperado na simulação. Desktop1440/celular390, overflow da página falso, foco e seletor legíveis. Detector uma vez [] e finish reviewer aprovado; documenter atualizou DESIGN/sidecar. Capturas sintéticas records-homologacao-*.png. Deno check passou; nada instalado no banco real. Hashes app.js/index.html/styles.css/connection.mjs iguais à release14ef92c.

## Ponte de produção por entidade — preparada, não instalada (30/10/2026)
55 testes Node/SQL/HTTP passaram, sem skips.9 testes da ponte repetidos após ampliar guarda de configuração, passaram. Deno check crm-internal e bundle gerado passaram. SQL local valida backup congelado, aba antiga bloqueada, preservação da ordem e conteúdo, edições independentes, conflito por registro, idempotência, rebase, rollback/ACL/revogação. UI completa em4182 com Auth simulado e PGlite: salvou negócio/contato/projeto/atividade recorrente/campanha rascunho/meta; requisições não continham state e enviavam apenas changes/guards/requestId. Nenhum email enviado. Instalação real ainda não feita: painel crm-production continua em sign-in e usuário foi solicitado a entrar. Não afirmar backup real ou migração remota concluídos.

## Implantação real concluída — 30/10/2026
Migration aditiva instalada sem repetir usuários; bundle crm-internal compilado/deployado; payload pré/pós-ativação comparado integralmente e idêntico. Backups privados fora do repositório e snapshot congelado no banco. Smoke com sessão Auth real: loadState em mode records e applyRecords com configurações idênticas confirmado, sem mudar valores comerciais. Requisição antiga saveState recebeu409 e não alterou revisão. Request sem autenticação401. Runtime publicado e03e74285f65040c06b1fb9719b2c4194c18a7f6, workflow41134077586 success. Cinco arquivos públicos200 com SHA256 igual ao local. Não houve importação de fixtures, envio de email ou alteração de contas. Normalização tipada/paginação remota/Storage não declarados concluídos.

## Importação e dashboards — 30/10/2026
69 testes completos Node/SQL/HTTP passaram, sem skips ou cancelamentos, com execução sequencial para evitar contenção do PGlite. Acrescentado teste SQL de importação com revisão de prévia obsoleta; os10 testes da ponte passaram após a inclusão (70 casos no conjunto). Cobertura de modelos CSV, colunas desconhecidas/duplicadas, identificadores ambíguos, preservação de campos vazios/zeros, validação monetária, atomicidade e isolamento dos pipelines por ID. Bundle gerado e validador executado; Deno check --cached-only aprovado.
Navegador local4183 com SQL descartável e SDK simulado: contagem de atividades, filtro de pipeline,3 modelos, importação de contato/produto, erro monetário bloqueado, prévia de criação/atualização e download do modelo passaram. Nenhum dado fictício inserido em produção. Desktop1440/celular390 conferidos em2 rodadas, sem overflow da página; tabelas mantêm rolagem interna. Corrigido contraste do botão selecionado no hover e adicionada dica de rolagem da comparação móvel. Detector uma vez com avisos de tipografia/cores legados; identidade mantida. Reviewer independente sem correções de produto pendentes; documentação de design atualizada pelo documenter.

## Dashboards visuais — 30/10/2026
44 testes de modelo/operações/importação/dashboards passaram; três novos casos verificam coorte de vencimento, séries/rankings por pipeline e filtros, ticket médio e gráficos vazios/escape de rótulos. Após ajustes de formato,17 testes de importação/dashboards repetidos passaram. Mudança frontend, sem SQL ou nova implantação da função.
Browser local4184 com SQL descartável/SDK simulado:3presets com2/3/3gráficos, acesso às tabelas, pipeline vazio, desktop1440 e celular390 sem overflow ou errosJS. Fixtures explícitas locais com32 negócios/52 atividades, nunca enviadas à produção. Duas rodadas limitadas de capturas, eixos móveis ampliados e percentuais brasileiros. O roteiro inicialmente tentou clicar na navegação oculta no celular; corrigido para navegação direta, sem ajuste do produto. Detector uma vez, avisos de paleta/tipo documentados sem repetir varredura.

Revisão independente indicou margem insuficiente do eixo monetário no celular. Margem ampliada no SVG; medição dos bounding boxes confirmou todos os rótulos dentro do viewBox, sem corte. Instância antiga do módulo exigiu recarregamento explícito no roteiro local. Demais padrões preservados.
