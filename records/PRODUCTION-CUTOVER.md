# Publicação na base atual — transição compatível

Preparação de30/10/2026, autorizada pelo usuário para o projeto atual Poliniza. **Instalação, publicação e ativação concluídas em30/10/2026 na base atual, com backup privado e comparação integral de conteúdo.**

## Decisão técnica

As telas de homologação não substituem a interface completa publicada: não tinham todos os módulos, login real ou persistência durável. Para publicar mantendo funções, foi criada uma ponte que preserva as telas e o modelo comercial atual e salva somente os registros modificados.

Cada entidade das20 coleções tem uma linha JSONB própria em `crm_store.entries`, com versão, ator, data e tombstone após exclusão. Configurações são registros singleton. Pipelines continuam com suas etapas dentro do mesmo registro; itens de orçamento/pedido, checklist, passos de jornada e anexos mantêm o formato atual dentro da respectiva entidade. Isso é persistência por registro compatível, **não normalização relacional completa**. O schema tipado `crm_records` permanece separado para os próximos trabalhos e não será instalado como outra fonte comercial na produção.

Todos os módulos publicados usam uma única fonte autoritativa depois do corte. O snapshot original é congelado como backup, não atualizado em paralelo. O carregamento ainda recompõe a base inteira para a UI existente; a paginação existente continua no navegador. Arquivos ainda ficam nos negócios. SQL serializa commits durante validação de consistência; revisões individuais evitam rejeitar uma edição por outra em registro independente. Paginação remota, Storage, índices de campos comerciais e normalização tipada continuam pendentes.

## Arquivos de produção

- `record-sync.mjs`: codec, diferenças por entidade, guardas de configurações usadas, merge com dados mais recentes, validação e rebase limitado no servidor.
- `supabase/migrations/202610300001_record_compat.sql`: instalação aditiva, snapshots/recibos privados, autorização, RPCs e bloqueio de abas antigas após corte. Instalar essa migration, **não** executar novamente a migration de usuários existente.
- `supabase/functions/crm-internal/index.ts`: preserva ações de usuários; loadState usa a RPC, applyRecords valida todos os vínculos do modelo antes do commit; migrateRecords é exclusiva do administrador. Deno check aprovado. Bundle dashboard regenerado a partir das fontes.
- `app.js`: escolhe snapshot ou registros conforme modo retornado; envia alterações/versões/guardas/chave de requisição sem enviar o snapshot. Mantém recuperação de tentativa não confirmada. Não envia sucesso antes de confirmação.

Pedidos por orçamento, próxima recorrência e execução ativa da jornada não podem duplicar no merge. Agendamento confirmado não pode sobrepor outra atividade do responsável com buffer. Destinatários pendentes não podem ser mantidos ao detectar descadastro/inatividade. Configurações de jornadas/agendamento/campanhas usadas numa edição são guardadas por versão. Essas verificações devem ser ensaiadas também com os dados reais antes do corte; qualquer inconsistência preexistente exige resolução explícita.

## Ordem de publicação

1. Autenticar no Supabase atual pelo navegador, sem compartilhar senha/token no chat. Conferir projeto feezzyorxypdibuaifxs.
2. Fazer preflight somente leitura: revisão, estado de migrações e contagens, sem presumir base vazia. Exportar o snapshot real consistente para backup privado fora do repositório/vault. Validar o conteúdo com o modelo e comparar entidades/totais antes de avançar.
3. Instalar migration aditiva. Ela mantém modo snapshot; não troca a fonte de dados nesse momento.
4. Publicar bundle atualizado da função. Com modo snapshot, as telas antigas ainda funcionam normalmente.
5. Publicar frontend completo atualizado e record-sync.mjs no GitHub autorizado, preservando módulos/configuração pública. Conferir deploy e hashes.
6. Fazer nova exportação consistente da base imediatamente antes do corte. Chamar migrateRecords autenticado como administrador com a revisão esperada. Se outra pessoa gravou, a migração é recusada sem efeitos e exige novo backup.
7. Ativação é uma transação: preserva snapshot no banco, importa registros/ordem/IDs/campos, registra metadados e muda storage_mode. Conferir payload recomposto contra backup e contagens, antes de liberar smoke de escrita. Não usar dados fictícios da homologação na produção.
8. Refresh do app carrega versões; abas antigas têm gravações recusadas em vez de sobrescrever o backup. Validar login/admin e os módulos com ações não destrutivas, e um teste reversível explicitamente identificado se necessário.

## Recuperação

Antes da ativação, código antigo e snapshot continuam sendo o ambiente ativo. Depois da ativação, não basta republicar JS antigo: gravações antigas são bloqueadas. Preservar/exportar todas as novas alterações antes de qualquer retorno ao modelo anterior. O backup SQL e o arquivo privado de corte não são uma restauração automática; não descartar trabalho posterior para recuperar a versão antiga.

## Evidência local

55 testes Node/SQL/HTTP passaram sem skips (incluindo9 casos da ponte, com subtestes). Migração preserva coleções/configuração/extensões/ordem, congela backup, bloqueia aba antiga; editores independentes persistem, mesmo registro conflita, SQL inválido faz rollback, servidor rebaseia corrida e recibo impede replay divergente. Revogação e ACLs verificadas. Entrada Deno e bundle validaram.

UI completa testada na porta4182 com Auth simulado e banco PGlite real em memória: criou contato/negócio, projeto, atividade recorrente, rascunho de campanha e meta; todos apareceram em mode records. Requests de gravação tinham changes/guards/requestId, sem campo state. Nenhuma mensagem enviada. Esse teste não equivale a Auth/Supabase remoto nem a carga PostgreSQL multiconexão.

## Resultado da implantação
Migration aditiva e função publicadas; modo records ativado após conferir a revisão de corte. Payload recomposto idêntico ao backup anterior, inclusive ordem/vínculos/campos. Snapshot preservado no banco e cópias privadas fora do repositório. Smoke autenticado leu o novo modo e confirmou uma gravação idêntica de configurações, sem mudar valores comerciais. Tentativa de cliente antigo recebeu409 e não alterou a revisão. Frontend e novo módulo retornaram200 e hashes iguais aos locais; workflow41134077586 success, commit de runtime e03e74285f65040c06b1fb9719b2c4194c18a7f6. Nenhum dado fictício da homologação foi importado.
