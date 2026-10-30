# Gravação por registro — homologação

Implementação de 29/10/2026. **Não instalada no Supabase real, não conectada ao app publicado e não constitui migração completa do CRM.**

## Entregue

- Schema privado `crm_records` com contatos, pipelines, etapas, negócios e histórico imutável pela API. IDs legados textuais preservados. Campos de vínculo, valor e status relacionais; `attributes` preserva campos flexíveis do modelo, sem snapshot comercial completo.
- Versão por registro, controle otimista e transação em lote. A atualização usa substituição completa do **registro**, não patch de campos: envie seus dados e `expectedVersion`.
- Ator extraído do token Auth no endpoint. SQL revalida usuário ativo e senha inicial trocada; acesso de navegador às tabelas/RPCs negado. Lock compartilhado no membro permite edições independentes e coordena revogação. Não atribui responsáveis legados a usuários: mantém `owner_label`.
- Idempotência por ator/chave/conteúdo: mesma solicitação retorna resultado sem duplicar eventos; conteúdo divergente falha. Repetir solicitação que falhou continua permitido porque a transação foi desfeita.
- FKs diferidas permitem criar contato + negócio, transferir negócios + remover etapa e reordenar etapas em uma transação; falha desfaz tudo. Etapa deve pertencer ao pipeline, contato precisa ter o tipo correto. Pipeline não fica sem etapas e último pipeline não é removido. Configurações de pipeline/etapas compartilham um lock estrutural; edições comuns não usam esse lock global.
- IDs excluídos não podem ser reutilizados, evitando uma edição antiga atingir outro registro criado depois com o mesmo ID.
- Paginação e busca no SQL, limite100 por consulta, histórico paginado por cursor. Pesquisa por substring literal, inclusive `%`; offset de listas ainda não é um cursor estável diante de novas inserções.
- Plano e importação inicial atômica do núcleo e histórico legado; administrador, destino vazio, máximo500 registros por lote, até2MB de comandos e2MB de histórico. Cada registro tem limite128KB. Datas originais ficam em `attributes.created/updated`; metadados SQL identificam quando ocorreu a migração.
- Importação sinaliza anexos pendentes de Storage e IDs de etapas repetidos entre pipelines. Ambos bloqueiam a carga. Módulos fora do núcleo aparecem em `retained`, continuam no backup original e **não são importados por este código**. `cutoverReady` é sempre `false` nesta etapa.

## Arquivos

- `../supabase/records/001_core.sql`: instalação isolada, após a migration de usuários. Fora do diretório automático `migrations` intencionalmente.
- `core.mjs`: plano de importação, repositório e `fromRow`, que recompõe o registro legado e mantém versão/metadados separados.
- `service.mjs`: validação e roteamento dos comandos para RPCs service-only.
- `../supabase/records/handler.ts`: entrada Auth/CORS com limite de corpo5MB. Retorna503 enquanto `CRM_RECORDS_HOMOLOGATION` não for `enabled`.
- `core.test.mjs`: testes executados no PostgreSQL WASM/PGlite descartável, sem conexão externa.
- `../scripts/test-records.mjs`: execução obrigatória de testes antigos e novos; falha se dependência SQL ausente.

## Executar os testes

Node com suporte ao test runner e `@electric-sql/pglite@0.3.14` em diretório de ferramentas separado. Não há nova dependência de produção.

```powershell
# Instalação descartável de ferramentas, se ainda não existir:
npm install --prefix ./tmp-record-tools --no-save @electric-sql/pglite@0.3.14
$env:CRM_PGLITE_MODULE = (Resolve-Path ./tmp-record-tools/node_modules/@electric-sql/pglite/dist/index.js).Path
node scripts/test-records.mjs
```

Criar ferramentas fora do diretório publicado e não enviar node_modules ao GitHub. O banco do ensaio existe só em memória e é fechado ao fim de cada cenário.

## Contrato de uso

```js
const repo = new RecordRepository((action,values) =>
  callHomologationFunction({action,...values}));
const page = await repo.page('contacts',{limit:25,search:'Cliente'});
const {record,version} = fromRow('contacts',page.rows[0]);
record.name = 'Nome corrigido';
await repo.apply([{entity:'contacts',op:'put',id:record.id,
  expectedVersion:version,data:record}],crypto.randomUUID());
const events = await repo.history('contacts',record.id);
```

`put` com expectedVersion0 cria; `delete` exige a versão corrente. Ao receber409, preserve a edição, recarregue o registro e permita resolver o conflito. Ao repetir uma requisição por falha de rede, use a **mesma chave e conteúdo**. Não gere chave nova automaticamente para uma solicitação cujo resultado é desconhecido.

Criação/configuração de pipeline precisa incluir etapas no mesmo lote. Remoção de etapa ocupada precisa incluir a transferência de todos os negócios afetados com as respectivas versões. O servidor registra autor/data/versão; não aceite confirmação otimista como persistência concluída. A lista retornada usa colunas SQL e `attributes`; use `fromRow` antes de editar pelo modelo legado. IDs de responsáveis existentes não são inferidos do texto `Eu`.

## Instalar em Supabase de homologação (etapa externa ainda não executada)

1. Criar projeto exclusivo de testes. Não usar o projeto ativo da Poliniza nem copiar credenciais/dados para o cliente.
2. Instalar a migration existente de usuários e `supabase/records/001_core.sql`. Criar administrador de teste por procedimento próprio. As tabelas do schema privado não precisam ser expostas no Data API.
3. Empacotar handler e módulos preservando imports relativos. O arquivo é um template de entrada, não uma função já publicada. Se for movido para `supabase/functions/crm-records/index.ts`, ajustar caminho de `records/service.mjs` para `../../../records/service.mjs` e validar o bundle antes do deploy.
4. Definir `ALLOWED_ORIGINS` para o frontend de testes, `CRM_RECORDS_HOMOLOGATION=enabled` e configuração da função `verify_jwt=false`, pois o handler verifica todo bearer com `auth.getUser`, inclusive chaves atuais. Segredos somente no servidor.
5. Fazer smoke tests Auth/HTTP, testar duas sessões de usuários reais de teste e ensaiar importação com dados autorizados. A suíte atual testa versões de duas leituras antigas em gravações intercaladas; **não é ensaio de transações paralelas com múltiplas conexões, carga ou latência de rede**.

## Limites antes de produção

Não alterar `app.js` para usar este repositório sem migrar suas dependências: atividades/agendamentos, produtos/orçamentos/pedidos, configurações, anexos, jornadas, campanhas e gestão ainda usam o snapshot. FKs novas cobrem apenas núcleo, não vínculos em módulos antigos. Não permitir produção híbrida com dois lugares independentes para a mesma informação.

As telas locais já estão conectadas ao banco descartável; ainda faltam autenticação/HTTP Supabase real, endpoints dos módulos restantes, Storage/anexos, ensaio multi-conexão real, teste de carga, backup/restauração completa e corte coordenado. As funções SQL foram executadas localmente; handler passou `deno check`, mas não foi exercitado via HTTP remoto. Histórico, recibos de idempotência e IDs retirados exigem política de retenção antes de escala; apagar recibos muda a janela de garantia de repetição.

Migração completa deve bloquear gravações antigas na troca. Nunca restaurar snapshot anterior cegamente após novas gravações: é necessário preservar e reconciliar o trabalho novo. Este schema permanece aditivo e isolado; não oferece downgrade destrutivo automático.

## Continuação — 30/10/2026
Telas reais de homologação local em [homologacao/README.md](../homologacao/README.md), com banco descartável e API HTTP. Projetos/tarefas simples adicionados por002_work.sql (após001), sem recorrências/agendamentos. As entidades aceitas pelo repositório agora incluem projects e activities, mas o importador de snapshot continua só do núcleo: não há corte completo pronto. Suite ampliada para46 testes Node/SQL/HTTP, sem skips, mais validação funcional no navegador. Ambiente remoto depende de projeto separado que o usuário ainda não criou. O aplicativo publicado e seu banco continuam inalterados.