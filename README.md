# CRM — Operação comercial

Aplicativo web de CRM com pipelines configuráveis e módulos comerciais integrados. Referência funcional: interface Leads2b inspecionada com autorização; a implementação é própria e não usa APIs ou credenciais do aplicativo original.

**Página:** https://danpacheco28.github.io/CRM/

**Usuários internos:** consulte [CONFIGURACAO-USUARIOS.md](CONFIGURACAO-USUARIOS.md). Supabase Auth e a base interna estão conectados no projeto configurado. Administradores criam, editam, desativam e excluem contas; colaboradores trabalham na base comercial compartilhada. Não há usuários/senhas de demonstração no runtime.

## Usar localmente

Execute `node server.cjs` nesta pasta e abra http://127.0.0.1:4173. Não há dependências npm. Use um servidor HTTP; o módulo JavaScript não deve ser aberto diretamente por `file://`.

Para outra porta, defina a variável de ambiente `CRM_PORT`. Na verificação foi utilizada a porta 4174 com perfil de navegador isolado.

## Módulos

- **Pipelines:** criar, editar, duplicar estrutura e excluir; tipo lead/oportunidade/pós-venda; adicionar, renomear, reordenar e remover etapas; probabilidades e valores ponderados.
- **Negócios:** quadro/lista, busca, filtros, seleção e alterações em lote, transferência entre pipelines, status, motivo de perda, campos personalizados, histórico, comentários, atividades, orçamentos e anexos.
- **Contatos:** organizações e pessoas vinculadas, cliente/ativo, documentos, email, telefone, endereço, categoria, responsável e observações.
- **Atividades e calendário:** agendamento, associação a contato/negócio, responsáveis, pendentes/concluídas/canceladas, atrasadas/hoje e agenda mensal.
- **Produtos:** catálogo, SKU, categoria, unidade, quantidade, preços, custo, limite/promocional, classificação de recorrência e parâmetros comerciais. Tabelas com desconto percentual para novos itens de orçamento.
- **Orçamentos:** itens de catálogo/avulsos, quantidade, preço, desconto por item, desconto geral, frete, validade, vínculo comercial e estados registrados manualmente.
- **Pedidos:** geração única por orçamento aprovado; snapshot dos itens/valores; status, entrega, transportadora e rastreio.
- **Documentos:** modelos de texto com variáveis, prévia do orçamento, impressão e salvar PDF pelo navegador.
- **Visão geral:** ativos, ganhos, conversão de encerrados, distribuição por pipeline, previsão ponderada, atividades e motivos de perda.
- **Configurações:** pipelines, origens, motivos de perda, tags sugeridas, campos adicionais e backup/restauração.

## Configurar o funil

Em **Pipelines → Gerenciar pipelines**, crie um pipeline ou escolha Editar. Também há o atalho **Etapas** no quadro. Edite nomes, use as setas para reordenar e adicione etapas conforme sua operação.

Cada etapa possui identidade estável: renomear ou reordenar não troca negócios de lugar. Ao remover etapa ocupada, selecione uma etapa de destino antes de salvar. Excluir pipeline ocupado exige outro pipeline para receber os negócios. O último pipeline e a última etapa são protegidos.

Para mover um negócio a outro pipeline, abra o cartão e use **Mover para outro pipeline** ou edite seu cadastro. É possível alterar selecionados em lote. Arraste entre etapas ou utilize o seletor do cartão, inclusive com teclado ou celular.

## Dados, migração e backups

Com Supabase conectado, a base comercial fica no banco e os usuários ativos compartilham os registros. A sessão é mantida na aba; a senha não entra no armazenamento do CRM. Se a conexão estiver vazia, aplica-se o modo local anterior: dados em `localStorage` por navegador/endereço. Dados comerciais não são enviados ao repositório GitHub.

A versão anterior (`crm-funil-v1`) é lida quando não há dados v2. Contatos e referências das etapas são migrados; a chave antiga é preservada. A primeira gravação salva a versão integrada em `crm-workspace-v2`. Falhas de validação/leitura não substituem automaticamente dados antigos.

Use **Backup** para exportar os registros comerciais em JSON, incluindo anexos. Contas e senhas de autenticação não entram nesse arquivo. A restauração descrita a seguir está disponível apenas no modo local; a restauração compartilhada ainda não está habilitada. No modo local, a restauração valida o arquivo e exige confirmação, pois substitui a base atual. Antes da troca, mantém a última versão salva em `crm-before-restore` quando há espaço disponível. Isso não substitui um arquivo de backup fora do navegador. Arquivos JSON de restauração: limite de 15 MB.

Alterações simultâneas em outra aba são detectadas; recarregue para continuar. Falhas de quota ou validação não devem atualizar parcialmente a base. Anexos: até 1 MB por arquivo e 10 por negócio, sujeitos à quota do navegador. Arquivos são baixados, não executados como HTML pela aplicação.

## CSV

Importação em **Contatos** e **Produtos**, com prévia/validação antes da confirmação. Até 5.000 registros e 2 MB; UTF-8, cabeçalho obrigatório, separador `;` ou vírgula, aspas para campos que contêm o separador.

Exemplo de contatos:

```csv
nome;email;telefone;cnpj;categoria;responsavel
Empresa Exemplo;contato@example.test;11999999999;;Serviços;Eu
```

Exemplo de produtos:

```csv
nome;sku;preco;custo;quantidade;unidade;categoria;ativo
Consultoria;CONS-01;1250,50;300;1;un;Serviços;sim
```

Contatos existentes são identificados por ID, documento ou email dentro do tipo selecionado; produtos, por ID ou SKU. Sem correspondência, são criados. Para pessoas, selecione a aba Pessoas antes de importar. Vínculos existentes com organizações são preservados; novos vínculos devem ser definidos no cadastro. Datas/relacionamentos de outros módulos são restaurados pelo backup JSON, não importados por CSV.

O botão CSV exporta os registros filtrados do módulo atual. Campos iniciados por operadores de planilha recebem proteção contra execução como fórmula.

## Publicar no GitHub Pages

Arquivos necessários: `index.html`, `styles.css`, `app.js`, `model.mjs`, `operations-model.mjs`, `operations-ui.mjs`, `connection.mjs`, `account-client.mjs`, `accounts-ui.mjs` e `record-sync.mjs`. Envie-os na raiz junto de `.nojekyll`. O servidor Node é apenas para uso local. A função Supabase é publicada separadamente.

Em **Settings → Pages**, mantenha **Deploy from a branch → main → /(root)**. O site já usa caminhos relativos para funcionar no subdiretório `/CRM/`. Não enviar sessões de navegador, exportações de clientes, credenciais ou a pasta de memória junto do código.

## Verificação

Execute `node --test model.test.mjs operations.test.mjs` (27 testes). Os roteiros `verify-v2.cjs` e `verify-files.cjs` são expressões para `playwright-cli run-code`, não programas Node independentes. Usar apenas em perfis locais descartáveis na porta 4174; criam registros sintéticos. Veja `VALIDATION.md`.

## Organização, automação e gestão

- **Meu trabalho e projetos:** prazos, responsável, progresso e tarefas vinculadas. Projetos podem ser concluídos ou arquivados.
- **Atividades:** lista e quadro, prioridade, checklist, filtros, vínculo com contato/negócio/projeto e repetição diária, semanal ou mensal. Concluir cria uma próxima ocorrência, sem duplicação. Agenda ICS com lembrete para importação em outro calendário.
- **Calendário e agendamentos:** dia/semana/mês, tipos de reunião, disponibilidade por responsável/dias/expediente, duração e intervalo de segurança. Agendamentos criam atividades e rejeitam conflitos. Cadastro interno; ainda sem página pública de autoagendamento.
- **Jornadas:** gatilhos por criação, ganho ou entrada de etapa, além de inscrição manual; filtros, condições, esperas, tarefas, tags, mudança de etapa e preparação de destinatário de campanha. Modelos, ordenação de passos, duplicação, pausa e histórico. Execuções mantêm cópia dos passos. Ativação não inscreve negócios antigos automaticamente. Mudanças de etapa executadas pela jornada não disparam outras jornadas em cascata.
- **Campanhas:** conteúdo com variáveis, segmentação, público deduplicado, descadastros, programação da preparação, fila, exportação CSV e rascunho `.eml`. Envio é externo e seu registro é manual; preparar não significa enviar. Não há rastreamento de abertura ou entrega.
- **Gestão:** dashboards com indicadores selecionáveis, filtros por período/responsável/pipeline, relatórios agrupados e configurações salvas, CSV e metas totais/semanais/mensais com progresso calculado a partir dos registros.

A fila local é verificada a cada 30 segundos com o aplicativo aberto e ao reabrir; datas vencidas são processadas nesse momento. Navegador fechado ou suspenso não executa automações. Para envios reais e execução contínua será necessário conectar backend e provedor de email.

O roteiro `verify-operations.cjs` usa um perfil local descartável na porta 4175. Ele cria somente dados sintéticos e não envia mensagens.

## Limites desta versão

A base Poliniza usa gravação por entidade desde 30/10/2026. Apenas registros alterados são enviados e cada um possui sua própria versão. O carregamento ainda recompõe a base completa; etapas/itens/anexos permanecem dentro da respectiva entidade. Operações têm limite de 2.000 registros e 15 MB por lote. Todos os colaboradores acessam a mesma base; ainda não há carteira individual por vendedor. Use **Atualizar base** para buscar alterações de outras pessoas. Conflitos na versão dos registros ou configurações usadas são recusados para evitar sobrescrita; a tentativa não salva pode ser exportada antes de refazer a alteração. O administrador inicial escolheu começar com base vazia; dados locais antigos não foram apagados.

Backups comerciais não substituem o backup do banco e das contas Auth. Recuperação de senha por email e restauração do snapshot compartilhado ainda não estão habilitadas; consulte o procedimento temporário em CONFIGURACAO-USUARIOS.md.

Sem envio automático de email/WhatsApp, captação pública, integração bidirecional de agenda, assinatura eletrônica ou importação do Drive. Jornadas continuam dependendo do aplicativo aberto. Não há cálculo fiscal, emissão fiscal, controle real de estoque ou cobrança recorrente automática. Agentes de IA não fazem parte desta entrega.
## Gravação por registro — homologação
Primeira fatia backend isolada em [records/README.md](records/README.md): contatos, pipelines, etapas, negócios e histórico. Não conectada ao aplicativo publicado nem instalada no projeto ativo. SQL, importador e repositório com versões individuais, transações, idempotência e paginação. Roteiro `node scripts/test-records.mjs` exige PGlite descartável configurado e executa todos os testes existentes e novos.

## Publicação compatível na base atual
O usuário autorizou atualizar a própria base Poliniza em30/10/2026. Ponte de gravação por entidade preparada em record-sync.mjs e migration202610300001_record_compat.sql, preservando todas as telas e módulos. Não é a UI sintética nem a normalização tipada completa: etapas/itens/anexos continuam dentro de suas entidades; leitura ainda recompõe a base. Instalação, ativação e publicação concluídas em 30/10/2026; conteúdo recomposto conferido integralmente com o backup e leitura/gravação autenticadas validadas. Procedimento e limites em [records/PRODUCTION-CUTOVER.md](records/PRODUCTION-CUTOVER.md). Não executar de novo a migration de usuários.

## Importação e dashboards por pipeline
Em Contatos e Produtos, use Importar planilha para baixar o modelo CSV UTF-8 e validar a prévia. Dashboards oferece Atividades, Funil comercial e Resultados prontos, sempre separados por pipeline. Consulte [IMPORTACAO-DASHBOARDS.md](IMPORTACAO-DASHBOARDS.md) para formatos, critérios dos indicadores e limites.

Os dashboards prontos incluem cartões com cores semânticas, roscas de situação/conversão, barras mensais, distribuição por etapa, ranking de responsáveis e ticket médio. Gráficos usam apenas dados reais do pipeline e oferecem tabelas com valores exatos.
