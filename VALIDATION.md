# Verificação da ampliação CRM — 20/10/2026

## Modelo de dados

`node --test model.test.mjs`: 12 testes passaram.

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
