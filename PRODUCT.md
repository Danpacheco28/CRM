# Poliniza CRM — Operação comercial
<!-- impeccable:product-schema 1 -->
## Platform
web
## Product Purpose
Organizar a operação comercial com módulos CRM integrados, a partir da referência Leads2b e do levantamento funcional de 20/10/2026.
## Operating Context
Usuário confirmou ampliação da área CRM: múltiplos pipelines, nomes e etapas configuráveis, contatos, leads, atividades, produtos, orçamentos, pedidos, documentos e pós-venda. Referência: https://app.leads2b.com/#/deals/1. Projeto publicado em https://danpacheco28.github.io/CRM/.
## Capabilities and Constraints
Pipelines por tipo (lead, oportunidade, pós-venda) com etapas de identidade estável, nomes, ordem e probabilidade editáveis. Exclusão de etapas ocupadas ou pipelines exige transferência dos negócios. Vinculações entre contatos, negócios, atividades, orçamentos e pedidos devem ser preservadas.
Cadastros e operações no navegador, backup/restauração JSON, importação CSV de contatos/produtos, exportação CSV, campos personalizados, histórico, comentários e anexos locais limitados. Orçamento aprovado gera um único pedido com itens e preços copiados. Modelos de texto e impressão/PDF.
Sem configuração do Supabase, o aplicativo mantém os dados locais e não ativa login nem base compartilhada. A integração de autenticação e usuários internos está instalada no projeto Supabase informado pelo usuário. Sem envio de mensagens ou integrações externas. Estoque/recorrência são referências de cadastro, sem execução financeira ou logística. Status de envio/visualização de orçamento é manual.
## Evidence on Hand
Screenshot: ../../output/playwright/leads2b-funil.png. Funil original sem negócios; cartões preenchidos, edição, valores e status são implementações propostas, não comportamentos confirmados do original.
## Open Decisions
Recuperação de senha, permissões por carteira, integrações e automações de comunicação. Supabase Auth e a base interna foram conectados; comunicação externa não foi conectada.

## Ampliação confirmada — organização, automação e gestão
Projetos, Meu trabalho, tarefas com checklist/prioridade/recorrência, calendário dia/semana/mês e agendamento interno com disponibilidade e validação de conflitos. Jornadas locais com gatilhos, condições, esperas, ações, pausa e histórico; campanhas com segmentação, preparação programada, descadastros e registro manual. Dashboards personalizáveis, relatórios configuráveis e metas por vigência/semanal/mensal calculados dos dados reais. Sem agentes de IA.
Execução de jornadas e preparação programada ocorre apenas com o aplicativo aberto ou na reabertura. Campanhas não enviam mensagens: produzem fila local e rascunhos .eml. Backend/provedor e página pública de autoagendamento continuam pendentes.

## Uso interno e contas — 23/10/2026
Usuário definiu uso interno e pediu criação/exclusão de contas. Área Usuários com administrador/colaborador, edição de nome/perfil/situação, desativação e exclusão confirmada por email. Não permite remover/rebaixar o próprio administrador. Login, senha inicial obrigatoriamente alterada e encerramento de sessão. Projeto Supabase criado e conectado; tabelas, função e primeiro administrador instalados. Cadastro público desabilitado. O usuário definiu sua própria senha diretamente no painel.
Servidor instalado com Supabase Auth, função crm-internal, tabelas sem acesso direto do navegador e verificação de membros ativos em cada operação. Todos os colaboradores acessam a mesma base comercial; não há isolamento por carteira. Persistência inicial compartilhada em snapshot transacional de até 15 MB, controle de revisão e exportação da tentativa em conflito. Inicialização vazia ou importação local somente após confirmação do administrador. Contas/senhas não fazem parte do backup comercial. A base vazia foi inicializada por escolha explícita do usuário. Contas reais e bloqueios de acesso são validados antes da publicação.

## Identidade confirmada — 25/10/2026
Nome: Poliniza CRM. Usar emblema fornecido e cores púrpura/dourado com moderação, mantendo superfícies claras e leitura operacional.
