# CRM — Operação comercial
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
Sem autenticação, autorização no servidor, backend compartilhado, sincronização, envio de mensagens ou integrações externas. Estoque/recorrência são referências de cadastro, sem execução financeira ou logística. Status de envio/visualização de orçamento é manual.
## Evidence on Hand
Screenshot: ../../output/playwright/leads2b-funil.png. Funil original sem negócios; cartões preenchidos, edição, valores e status são implementações propostas, não comportamentos confirmados do original.
## Open Decisions
Nome definitivo, banco compartilhado, usuários/permissões, integrações e automações de comunicação. Essas áreas não estão implementadas como serviços nesta versão.
