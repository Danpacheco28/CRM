# CRM — Operação comercial

Aplicativo web de CRM com pipelines configuráveis e módulos comerciais integrados. Referência funcional: interface Leads2b inspecionada com autorização; a implementação é própria e não usa APIs ou credenciais do aplicativo original.

**Página:** https://danpacheco28.github.io/CRM/

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

Os dados ficam em `localStorage`, neste navegador e endereço. Não são enviados ao GitHub nem compartilhados entre usuários/dispositivos. Limpar os dados do site remove os registros locais.

A versão anterior (`crm-funil-v1`) é lida quando não há dados v2. Contatos e referências das etapas são migrados; a chave antiga é preservada. A primeira gravação salva a versão integrada em `crm-workspace-v2`. Falhas de validação/leitura não substituem automaticamente dados antigos.

Use **Backup** para exportar todos os registros em JSON, incluindo anexos. A restauração valida o arquivo e exige confirmação, pois substitui a base atual. Antes da troca, mantém a última versão salva em `crm-before-restore` quando há espaço disponível. Isso não substitui um arquivo de backup fora do navegador. Arquivos JSON de restauração: limite de 15 MB.

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

Arquivos necessários: `index.html`, `styles.css`, `app.js` e **`model.mjs`**. Envie-os na raiz junto de `.nojekyll`. O servidor Node é apenas para uso local.

Em **Settings → Pages**, mantenha **Deploy from a branch → main → /(root)**. O site já usa caminhos relativos para funcionar no subdiretório `/CRM/`. Não enviar sessões de navegador, exportações de clientes, credenciais ou a pasta de memória junto do código.

## Verificação

Execute `node --test model.test.mjs`. Os roteiros `verify-v2.cjs` e `verify-files.cjs` são expressões para `playwright-cli run-code`, não programas Node independentes. Usar apenas em perfis locais descartáveis na porta 4174; criam registros sintéticos. Veja `VALIDATION.md`.

## Limites desta versão

Este CRM continua sem backend, login/permissões de servidor, sincronização, criptografia de banco, auditoria imutável, envio de email/WhatsApp, automações, captação pública, integração de agenda, assinatura eletrônica ou importação do Drive. A visão geral não implementa metas nem dashboards personalizados completos do sistema original. Não há cálculo fiscal, emissão de documentos fiscais, controle real de estoque ou cobrança recorrente automática. Status de envio/visualização são manuais.

O foco desta entrega é ampliar a **área CRM funcional no navegador**, com integridade dos vínculos. Recursos de outros grupos do levantamento (marketing, prospecção, comunicação, IA e administração multiusuário) exigem escopo e serviços próprios.
