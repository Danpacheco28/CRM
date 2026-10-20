# Funil de negócios

Execute `node server.cjs` nesta pasta e abra http://127.0.0.1:4173.

## Publicação no GitHub Pages

Envie o conteúdo desta pasta para a raiz do repositório. Em **Settings → Pages**, escolha **Deploy from a branch**, branch **main** e pasta **/(root)**. Salve e acompanhe a publicação na aba **Actions**. O endereço final aparece na seção Pages.

O site usa apenas `index.html`, `styles.css` e `app.js`; não é necessário executar `server.cjs` no GitHub Pages. Os caminhos relativos permitem servir o aplicativo em um subdiretório de repositório. O arquivo `.nojekyll` permite publicar os arquivos estáticos diretamente.

Publicar o código não transfere os negócios já cadastrados no navegador local. Os registros do endereço publicado começam vazios e continuam restritos a cada navegador.

Primeira versão local, baseada na observação autorizada do funil do Leads2b. Inclui cinco etapas, cadastro e edição, organização/pessoa, origem, responsável, tags, valor, previsão, temperatura, status, anotações, filtros, busca, quadro/lista, movimentação por arraste ou seletor, totais e persistência via localStorage.

Não contém credenciais, dados importados, integração com Leads2b, backend, autenticação, sincronização, backup ou outros módulos. Limpar os dados do navegador remove os registros locais. Não utilizar esta versão como armazenamento único de dados de produção.

## Evidências e limites

Referência visual: `../../output/playwright/leads2b-funil.png`. Inspeção de 20/10/2026 confirmou quadro vazio, cinco etapas, formulário de criação e filtros. Nenhum registro original foi criado ou modificado. Como não havia negócios, aparência dos cartões, edição, valores, previsão, status, anotações e movimentação são uma proposta funcional, não uma reprodução verificada do original. Filtros avançados do original (atividades, região, datas) não estão implementados nesta etapa.
