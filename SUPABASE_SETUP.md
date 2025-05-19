# Configuração do Supabase para o projeto "Opa que delicia"

Este guia oferece instruções detalhadas para configurar o Supabase como banco de dados e serviço de armazenamento para o projeto.

## 1. Criar uma conta e projeto no Supabase

1. Acesse [supabase.com](https://supabase.com/) e crie uma conta ou faça login
2. Crie um novo projeto, fornecendo:
   - Nome do projeto: `opa-que-delicia` (ou outro nome de sua preferência)
   - Database password: crie uma senha forte
   - Region: escolha a região mais próxima dos seus usuários

## 2. Configurar o banco de dados

### Executar o script de criação

1. No painel do Supabase, vá para o menu "SQL Editor"
2. Clique em "New Query"
3. Cole o conteúdo do arquivo `database_setup.sql`
4. Clique em "Run" para executar o script

### Obter a string de conexão

1. No painel do Supabase, vá para Settings > Database
2. Role até a seção "Connection string"
3. Selecione "URI" e copie a string
4. Substitua `[YOUR-PASSWORD]` pela senha do banco de dados

## 3. Configurar o Storage para imagens

### Criar buckets para as imagens

1. No painel do Supabase, vá para Storage
2. Crie os seguintes buckets:
   - `profile-images`: para fotos de perfil dos usuários
   - `menu-items`: para imagens dos itens do menu
   - `restaurant`: para imagens do restaurante

### Configurar permissões dos buckets

Para cada bucket criado, configure as permissões:

1. Clique no bucket
2. Vá para "Policies"
3. Clique em "Add new policy"
4. Configure cada bucket com as seguintes políticas:

#### profile-images
- **Policy name**: Allow authenticated users to upload their own profile
- **Allowed operations**: INSERT, SELECT
- **Policy definition**: `(auth.uid() = owner_id)`

#### menu-items
- **Policy name**: Allow all users to view menu items
- **Allowed operations**: SELECT
- **Policy definition**: `true`

- **Policy name**: Allow admins to manage menu items
- **Allowed operations**: INSERT, UPDATE, DELETE
- **Policy definition**: `(auth.uid() IN (SELECT id FROM users WHERE role = 'admin'))`

#### restaurant
- **Policy name**: Allow all users to view restaurant images
- **Allowed operations**: SELECT
- **Policy definition**: `true`

## 4. Obter as chaves da API

1. No painel do Supabase, vá para Settings > API
2. Copie a URL e a chave anon key
3. Adicione essas informações ao seu arquivo `.env.local`:

```
SUPABASE_URL=https://[seu-projeto].supabase.co
SUPABASE_KEY=[sua-chave-anon]
```

## 5. Testar a integração

Para verificar se a integração está funcionando:

```bash
# Iniciar o servidor
npm run dev

# Tentar fazer upload de uma imagem
# Se o upload funcionar, a configuração está correta
```

## Dicas adicionais

### Monitoramento e limites

- Acompanhe o uso de recursos no menu "Reports" do Supabase
- O plano gratuito tem limites de:
  - 500MB de armazenamento de banco de dados
  - 1GB de armazenamento no Storage
  - 2GB de transferência mensal

### Backup dos dados

- No menu Database > Backups, você pode fazer backups manuais
- Considere exportar periodicamente os dados para maior segurança

### Solução de problemas comuns

- **Erro de CORS**: Verifique as configurações de API > Settings > API Settings
- **Erro de autenticação**: Verifique se as chaves estão corretas no .env
- **Erros de permissão**: Verifique as políticas configuradas para cada bucket