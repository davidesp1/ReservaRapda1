# Guia de Instalação e Configuração

Este documento fornece instruções detalhadas para configurar o sistema "Opa que delicia" em um novo ambiente.

## Pré-requisitos

- Node.js (v18.0.0 ou superior)
- PostgreSQL (v14.0 ou superior)
- NPM (v8.0.0 ou superior)

## Passos para Instalação

### 1. Configurar o Banco de Dados

1. Crie um novo banco de dados PostgreSQL:

```sql
CREATE DATABASE opa_que_delicia;
```

2. Execute o script de configuração do banco de dados:

```bash
psql -U seu_usuario -d opa_que_delicia -f database_setup.sql
```

Ou use a interface GUI do PostgreSQL para executar o conteúdo de `database_setup.sql`.

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:

```
# Database
DATABASE_URL=postgres://username:password@localhost:5432/opa_que_delicia

# Session
SESSION_SECRET=sua-chave-secreta-aqui

# Eupago (Processamento de Pagamentos)
EUPAGO_API_KEY=sua-chave-api-eupago

# Environment
NODE_ENV=development
```

### 3. Instalar Dependências

```bash
npm install
```

### 4. Iniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

O sistema estará disponível em `http://localhost:5000`

## Configuração para Produção

Para ambiente de produção, considere:

1. Configurar uma senha mais robusta para o usuário admin:

```sql
UPDATE users SET password = 'senha-segura-aqui' WHERE username = 'admin';
```

2. Configurar um provedor de e-mail para notificações:

Adicione ao arquivo `.env`:

```
# Email
EMAIL_HOST=seu-smtp-servidor
EMAIL_PORT=587
EMAIL_USER=seu-usuario
EMAIL_PASSWORD=sua-senha
EMAIL_FROM=noreply@opaqueidelicia.com
```

3. Configurar HTTPS:

Para produção, é recomendado usar HTTPS. Considere usar serviços como Nginx ou Apache como proxy reverso com certificados Let's Encrypt.

## Sistema de Pagamento

O sistema está configurado para usar o Eupago como gateway de pagamento. Para configurar:

1. Registre-se na [Eupago](https://eupago.pt/) e obtenha sua chave API
2. Adicione a chave API ao arquivo `.env`
3. O sistema suporta:
   - Multibanco (Referências)
   - MBWay
   - Cartão de crédito
   - Transferência bancária

Para testes, o sistema usa um modo de simulação que não requer conexão real com a API do Eupago.

## Conectando-se ao Supabase (Opcional)

Se desejar usar o Supabase como seu banco de dados, siga estas etapas:

1. Crie uma conta no [Supabase](https://supabase.com/)
2. Crie um novo projeto
3. Obtenha a URL de conexão do banco de dados
4. Atualize o DATABASE_URL no arquivo `.env`
5. Execute o script SQL para criar as tabelas necessárias

## Personalização

### Menu e Categorias

Você pode personalizar o menu editando as tabelas `menu_categories` e `menu_items`.

### Mesas e Disposição

Configure as mesas do seu restaurante editando a tabela `tables`.

### Configurações Gerais

Ajuste as configurações do sistema através da tabela `settings`.

## Solução de Problemas

### Erro de Conexão com o Banco de Dados

Verifique se:
- O PostgreSQL está em execução
- As credenciais no DATABASE_URL estão corretas
- O banco de dados foi criado corretamente

### Erro no Processamento de Pagamentos

- Verifique se a chave API do Eupago está configurada corretamente
- Para testes, você pode usar o modo de simulação

### Erro na Execução da Migração

Se encontrar erros ao executar o script SQL:
- Verifique se o usuário do PostgreSQL tem permissões suficientes
- Execute as declarações CREATE TYPE e CREATE TABLE separadamente

## Suporte

Para dúvidas ou suporte, entre em contato:
- Email: suporte@opaqueidelicia.com
- Website: www.opaqueidelicia.com