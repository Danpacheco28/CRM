# Importação de cadastros e dashboards

## Contatos e produtos

Em Contatos, escolha Organizações ou Pessoas. Em Produtos, abra o cadastro de produtos. Clique em **Importar planilha → Baixar modelo CSV**. Cada modelo usa os campos disponíveis no formulário do CRM; a janela também apresenta o significado e o formato de cada coluna.

Preencha uma linha por cadastro e salve como **CSV UTF-8** no Excel ou Google Planilhas. Arquivos XLSX precisam ser convertidos para CSV. São aceitas até 400 linhas e 2 MB por arquivo. Mantenha documentos, códigos, SKU e telefones como texto para preservar zeros à esquerda. Valores monetários: `1234,56` ou `1234.56`, sem moeda ou separador de milhar. Tags são separadas por `|`. Campos de sim/não aceitam `sim` e `nao`.

Nome é obrigatório. Produtos novos também precisam de SKU e preço. Para atualizar contatos, use o ID existente, documento ou email único; emails compartilhados exigem ID ou documento. Para produtos, use ID ou SKU. Nome sozinho não identifica um cadastro existente. ID desconhecido, identidade ambígua, colunas desconhecidas ou duplicadas e valores inválidos bloqueiam a importação.

Campos vazios preservam os valores dos cadastros existentes. A importação não exclui cadastros. O vínculo de uma pessoa com uma organização usa o ID da organização já cadastrada; importe organizações primeiro. Quantidades fracionadas exigem `fracionario=sim`.

Selecione o arquivo, confira o resumo de novos cadastros e atualizações, marque a confirmação e clique em **Importar cadastros**. Se houver problemas, corrija as linhas indicadas ou baixe o relatório de erros. Nenhuma linha do arquivo é salva enquanto existirem erros. A prévia mostra até 100 linhas; a validação cobre o arquivo inteiro. Se a base mudar após a prévia, atualize e valide novamente. O botão de backup permite guardar a base comercial antes da operação.

## Três dashboards prontos

**Atividades:** criadas, realizadas, pendentes e em atraso por pipeline, comparativo e listas de atividades para agir. Criadas usam a data de criação; realizadas, a conclusão; pendentes e atrasadas, o vencimento dentro do período. Atraso considera somente atividades ainda pendentes. Canceladas não entram nas pendências.

**Funil comercial:** negócios criados, negócios ativos e valor em negociação, além da distribuição dos ativos por etapa. O período seleciona a criação dos negócios.

**Resultados:** negócios ganhos, valor ganho, perdas e conversão. A conversão é ganhos divididos por ganhos mais perdas encerrados no período. Valor ganho representa negócios e não recebimentos financeiros.

Use os filtros de período, responsável e pipeline, ou os atalhos Este mês e Todo o histórico. Todos os pipelines continuam com estatísticas próprias, mesmo quando têm o mesmo nome. É possível exportar uma linha por pipeline ou salvar uma visão personalizada com os indicadores desejados.

Atividades vinculadas a um negócio acompanham o pipeline atual desse negócio. Atividades sem negócio podem receber pipeline diretamente no formulário. Sem nenhum vínculo, aparecem em **Sem pipeline**. Registros antigos sem data de criação não recebem datas inventadas; conclusões antigas podem usar a atualização e mostram aviso. Datas dos indicadores seguem o horário de Brasília. Os modelos prontos não inserem dados de demonstração na base do cliente.

## Leitura visual dos dashboards
Os cartões usam azul para criação, verde para realização/ganho, vermelho para atraso/perda, dourado para pendências e púrpura/azul-petróleo para negociação e conversão. Cada cor acompanha um rótulo e um valor.
Atividades combina rosca de situação e barras de criação/conclusão. A rosca considera apenas atividades com vencimento no período; seu percentual de realização usa esse mesmo conjunto, incluindo canceladas no total. Por isso pode diferir da contagem de realizadas pela data de conclusão. Funil comercial mostra barras por etapa, top5 por valor ativo e entradas mensais. Resultados traz conversão de encerrados, evolução do valor ganho, ticket médio e top5 por valor ganho.
Barras mensais mostram seis meses até o fim do período selecionado, ou até o mês atual, respeitando os demais filtros. O resumo pode abranger um histórico maior que esses seis meses. Use Ver dados do gráfico para consultar os valores exatos. Pipelines sem registros exibem estados vazios e não recebem dados de demonstração.
