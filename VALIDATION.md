# Verificação — 20/10/2026

- Playwright, aplicação local em 127.0.0.1:4173.
- Verificados: organização ou pessoa obrigatória; criação; valor; movimentação pelo seletor; persistência após recarga; busca; filtro por responsável; limpar filtros; edição para ganho; filtro de status; modo lista; exclusão.
- Capturas desktop 1440×900 e móvel 390×844, inclusive formulário. Corrigida contenção de rolagem horizontal do quadro e cabeçalhos alinhados.
- Confirmado estado final: zero registros sintéticos, formulário fechado.
- JavaScript passou em `node --check app.js`.
- Detector visual executado uma vez: um aviso sobre Arial, mantida como fonte de interface coerente com a referência.
- Revisão visual independente inspecionou referência e capturas. Ajustado texto longo em cartões para quebrar linha. Arraste implementado; verificação automatizada de movimentação usou seletor acessível, sem simular arraste.
- Não verificados: equivalência do backend original, integrações, ambiente multiusuário, navegadores além do Chromium, testes com tecnologias assistivas.

O roteiro `verify.cjs` é uma expressão assíncrona para `playwright-cli run-code`, não um programa Node independente. Ele cria e remove um registro sintético reservado chamado “Teste de verificação”; executar somente em ambiente local de teste, nunca sobre conta ou dados de produção.
