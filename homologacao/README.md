# Poliniza CRM — homologação local

Telas conectadas à persistência por registro em PostgreSQL/PGlite descartável. Ambiente exclusivo de demonstração, com dados fictícios, sem conexão ao Supabase ou ao CRM publicado.

## Iniciar neste workspace

Na pasta `work/crm-funil`, execute:

```powershell
./scripts/start-records-homologation.ps1
```

O helper usa a ferramenta de testes já existente no workspace. Em outra máquina, instale `@electric-sql/pglite@0.3.14` num diretório de ferramentas e defina `CRM_PGLITE_MODULE` como seu caminho absoluto `dist/index.js`, conforme `records/README.md`.

Abra **http://127.0.0.1:4180/homologacao/**. O servidor só aceita acesso pelo endereço127.0.0.1; não é servidor público. Para outra porta: `./scripts/start-records-homologation.ps1 -Port 4181`.

Ao reiniciar o servidor, o banco recomeça vazio com os pipelines padrão. Fechar apenas a aba não apaga os dados enquanto o processo continua ativo. O seletor de pessoa é uma fixture de teste, **não autenticação**. Não use dados reais nem exponha este servidor em uma VPS. O handler Supabase é uma implementação diferente, verifica Auth e exige instalação e configuração em projeto separado.

## Fluxos disponíveis

1. Cadastre organização/pessoa em **Contatos**.
2. Em **Pipelines**, crie outro funil; adicione, renomeie e reordene suas etapas. Etapas ocupadas não são removidas: primeiro mova os negócios pela edição. Pipeline ocupado também é protegido; esta tela ainda não oferece transferência em massa ao excluir.
3. Em **Negócios**, escolha contato, pipeline, etapa, responsável e valor. Mude etapa/situação por edição. Nesta homologação a listagem é tabular; não reproduz todos os controles do Kanban publicado.
4. Cadastre um **Projeto** e uma **Tarefa**, vinculando contato/negócio/projeto. Conclua a tarefa e confira o histórico. Prazo em horário de Brasília; banco também grava o instante correspondente com fuso explícito.
5. Abra duas abas, escolha pessoas de teste diferentes e edite o mesmo contato. A segunda gravação fica em conflito e mantém o formulário preenchido. Baixe a edição antes de reabrir a versão atual. Não há mesclagem automática.
6. A lista carrega25 registros por requisição e permite buscar/paginar no SQL. Histórico mostra25 eventos recentes. Opções de vínculo mostram100 registros e preservam o vínculo atual, se fora desse conjunto; seleção remota com busca continua pendente para bases maiores.

Só aparece sucesso após confirmação. Quando uma confirmação se perde, o formulário fica protegido e a opção **Tentar confirmar** repete a mesma chave e conteúdo, evitando uma segunda operação. A edição pendente existe em memória da aba; não há rascunho persistente após recarregar o navegador.

## Banco e migrações

- `supabase/records/001_core.sql`: contatos/funis/negócios/histórico.
- `supabase/records/002_work.sql`: projetos e tarefas simples, FKs, índices e extensão das RPCs. Instalar após001. Gerado de forma determinística por `scripts/extend-record-work.mjs`; verificar sem reescrever com `--check`.
- Banco local: `records/sandbox.mjs` instala os schemas, cria perfis fictícios e semeia apenas os pipelines. Nenhuma credencial real é usada.
- API HTTP local: origem e Host exatos, corpo limitado, arquivos estáticos em allowlist, CSP. `connection.mjs` da produção não é servido.

A importação automática de snapshot continua **apenas do núcleo**. Projetos e atividades existentes no snapshot aparecem como dados retidos, não são migrados por aquele importador. Bookings/recorrências/jornadas ainda dependem de regras próprias: tarefas recorrentes são recusadas no novo schema até a migração dessas regras. Não ligar essa UI à base ativa nem misturar snapshot e tabelas novas em produção.

## Verificações de 30/10/2026

46 testes Node/SQL/HTTP passaram sem skips. Deno check da entrada Supabase passou. Navegador: cadastro vinculado de contato→negócio→tarefa/projeto, conclusão, criação de pipeline com inclusão/reordenação, conflito em duas abas preservando campos, confirmação perdida e repetida com a mesma chave/conteúdo. Conferidos25+3 registros paginados e histórico de versões1/2/3 sem duplicação na repetição.

HTTP testa requisições sobrepostas de dois perfis, mas PGlite serializa a execução numa instância; não comprova bloqueios entre conexões PostgreSQL independentes. Login real, Data API, Storage, múltiplas conexões remotas, carga e corte completo continuam pendentes.

Desktop1440 e celular390 verificados; rolagem horizontal contida na tabela, foco visível, seletor legível. Detector uma vez sem achados e revisão independente Impeccable aprovada. Capturas sintéticas em `output/playwright/records-homologacao-*.png` no workspace.

## Próximo ambiente

Usuário informou que ainda não criou projeto Supabase de homologação. Criar projeto exclusivo, informar URL pública e depois configurar chave publicável/autenticação diretamente pelos fluxos apropriados. Não enviar senha de banco nem service_role no chat. Nenhum projeto remoto, deploy, DNS, envio de mensagem ou dado de produção foi alterado nesta etapa.
