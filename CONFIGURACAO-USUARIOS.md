# Usuários internos — configuração

Esta etapa conecta o CRM a uma única empresa. Existem dois perfis: **Administrador**, que gerencia contas, e **Colaborador**, que trabalha na mesma base comercial. Ainda não há restrição por carteira de vendedor nem ambiente para outras empresas.

Enquanto `connection.mjs` estiver vazio, o aplicativo continua no modo local anterior. A tela Usuários orienta a configuração e não cria contas fictícias. Quando conectado, dados da equipe ficam em memória durante a sessão e no banco; a senha nunca é gravada pelo CRM. O SDK mantém a sessão de autenticação no sessionStorage da aba.

## 1. Criar a conta e o projeto

1. Acesse https://supabase.com/dashboard e crie sua conta.
2. Crie um projeto, por exemplo `crm-interno`. Escolha sua organização, região e o plano desejado.
3. Defina uma senha forte para o banco e guarde-a com você. Não envie essa senha pelo chat.
4. Aguarde o projeto ficar pronto. Separe a URL pública `https://SEU-PROJETO.supabase.co` e a chave **Publishable** (ou anon pública legada). A chave `service_role` ou `sb_secret_…` nunca deve ser colocada no site ou no repositório.

## 2. Instalar as tabelas e as regras

No **SQL Editor**, execute uma vez o conteúdo de `supabase/migrations/202610230001_internal_users.sql` deste projeto. O arquivo cria membros, base compartilhada, auditoria de acessos e funções transacionais.

As tabelas não concedem acesso direto ao navegador. A função de servidor verifica a identidade com Supabase Auth, confere a situação do usuário e autoriza cada operação. Alterações de usuários e gravações são serializadas no banco. Não remova essas verificações nem libere tabelas para `anon`/`authenticated`.

## 3. Criar o primeiro administrador

1. Em **Authentication → Users → Add user**, crie sua própria conta de administrador com email confirmado e uma senha pessoal que só você conheça. Não use um email de exemplo.
2. No SQL Editor, execute o comando abaixo, substituindo email e nome. Ele apenas vincula uma conta Auth que já existe; não cria senha no SQL.

```sql
insert into public.crm_members(id,name,email,role,active,must_change_password)
select id,'SEU NOME',lower(email),'admin',true,false
from auth.users where lower(email)=lower('SEU EMAIL');
```

Confira se foi criada exatamente uma linha. Desabilite o cadastro público em **Authentication → Sign In / Providers** (a nomenclatura pode variar). Novas contas serão criadas pelo administrador dentro do CRM. Usuário Auth sem membro ativo não acessa a base.

## 4. Publicar a função de servidor

Na pasta do projeto, com Node instalado:

```powershell
npx.cmd supabase login
npx.cmd supabase functions deploy crm-internal --project-ref feezzyorxypdibuaifxs
npx.cmd supabase secrets set ALLOWED_ORIGINS=https://danpacheco28.github.io --project-ref feezzyorxypdibuaifxs
```

O `project-ref` é o identificador que aparece na URL do painel. O login da CLI deve ser feito por você no navegador. Não publique tokens de acesso.

A função usa as variáveis de servidor `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` disponibilizadas pelo ambiente Supabase. `ALLOWED_ORIGINS` aceita origens separadas por vírgula; inclua `http://127.0.0.1:4176` somente se for testar localmente. Uma origem não inclui `/CRM/`.

O `supabase/config.toml` desliga somente a verificação JWT legada da plataforma para esta função. A função continua verificando o token com `auth.getUser()` e negando contas não autorizadas.

## 5. Conectar o site

Preencha `connection.mjs` com a URL e a chave publicável do projeto. São configurações públicas, não a senha do banco. Publique esse arquivo junto de `app.js`, `account-client.mjs`, `accounts-ui.mjs`, `model.mjs`, `operations-model.mjs`, `operations-ui.mjs`, HTML e CSS.

Entre com sua conta. Na primeira conexão, escolha **Começar com base vazia** ou **Importar dados deste navegador**. A importação pede confirmação e preserva os dados locais originais. Nunca importe uma base sem conferir seu conteúdo e fazer backup.

## 6. Cadastrar as pessoas

Em **Usuários → + Usuário**, informe nome, email, perfil e uma senha inicial com 12 a 128 caracteres. Compartilhe essa senha diretamente com a pessoa por um canal seguro. A criação não envia convite por email. O primeiro acesso exige uma senha pessoal diferente; o servidor verifica que a senha inicial foi realmente alterada.

Editar permite mudar nome, perfil e situação. Desativar bloqueia novas operações. Excluir revoga o acesso antes de remover a conta Auth e preserva a base comercial. O administrador não pode excluir, desativar ou rebaixar a si mesmo. Mantenha outro administrador de confiança para recuperação administrativa.

Email de acesso não é editável nesta etapa. Recuperação de senha por email/SMTP e redefinição pelo painel do CRM serão tratadas separadamente; até lá, o administrador deve resolver recuperação diretamente no Supabase. Não edite manualmente hashes de senha ou as tabelas auxiliares.

### Se alguém perder a senha antes de habilitarmos a recuperação

Não use o botão de enviar recuperação por email do Supabase com este frontend: o tratamento do link de recuperação ainda não está implementado. Como procedimento temporário, o administrador pode criar um **novo acesso com outro email controlado pela mesma pessoa** e desativar a conta antiga. A base comercial continua compartilhada e preservada. Isso substitui o acesso, não redefine a senha da conta antiga.

Se o único administrador perder o acesso, o proprietário do projeto Supabase deve entrar no painel, criar outra conta Auth com um email que controle e executar o vínculo de administrador descrito na etapa 3 para essa nova conta. Depois, entrar no CRM e desativar a conta anterior. Se houver outro administrador ativo, ele pode administrar esse procedimento. Recuperação da própria conta Supabase é feita pelo fluxo do provedor, fora do CRM.

## Limites e validação antes do uso real

- A primeira persistência compartilhada usa um snapshot JSON transacional, com limite de 15 MB incluindo anexos. Não é o modelo final de tabelas por módulo para grandes equipes.
- A base é carregada ao entrar e pelo botão **Atualizar base**. Se outra pessoa gravar antes, a gravação seguinte é recusada para evitar sobrescrever dados; exporte a tentativa, atualize e refaça a alteração.
- Após falha de gravação, o aplicativo volta à última base confirmada e permite exportar a tentativa não salva. Restaurar backups diretamente na base compartilhada não está habilitado nesta etapa.
- Jornada/campanha continua dependendo do aplicativo aberto; não foi instalado agendador contínuo nem provedor de email.
- Além dos testes locais e PostgreSQL embarcado, a ativação do projeto foi exercitada com administrador real e conta técnica temporária. Cadastro, senha inicial, desativação e exclusão foram confirmados no serviço real; a conta técnica foi removida. Para grandes equipes, faça também ensaios de edição simultânea e restauração em ambiente separado.
- Faça backup de banco e arquivos e valide a restauração. O JSON exportado pelo CRM contém os dados comerciais, não as senhas nem todas as contas de autenticação.

Referências: [Supabase createUser](https://supabase.com/docs/reference/javascript/auth-admin-createuser), [deleteUser](https://supabase.com/docs/reference/javascript/auth-admin-deleteuser), [segurança de funções](https://supabase.com/docs/guides/functions/auth).
