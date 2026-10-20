# Verificação da ampliação CRM — 20/10/2026

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