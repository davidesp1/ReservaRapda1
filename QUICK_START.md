# Guia Rápido de Inicialização

Este guia oferece instruções passo a passo para configurar e executar o sistema "Opa que delicia" localmente após clonar o repositório.

## Configuração Rápida

### 1. Clonar o Repositório

```bash
git clone https://github.com/davidesp1/ReservaRapda.git
cd ReservaRapda
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Configurar o Supabase

1. Acesse [Supabase](https://supabase.com/) e crie uma conta caso não tenha
2. Crie um novo projeto no Supabase
3. Vá para Settings > Database para obter sua DATABASE_URL
4. Execute o arquivo `database_setup.sql` no editor SQL do Supabase

### 4. Configurar o Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```
# Supabase Database
DATABASE_URL=sua_url_de_conexao_supabase

# Supabase Storage (para imagens)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua_chave_anon_publica

# Configuração de servidor
PORT=5000
NODE_ENV=development

# Não é necessário para desenvolvimento
EUPAGO_API_KEY=demo-key-for-development
```

A URL de conexão do Supabase pode ser encontrada em Settings > Database > Connection string > URI.

### 5. Executar o Projeto

```bash
npm run dev
```

O sistema estará disponível em: http://localhost:5000

## Características do Ambiente de Desenvolvimento

- **Modo Desenvolvimento**: O sistema inclui HMR (Hot Module Replacement) para desenvolvimento rápido
- **Simulação de Pagamento**: No modo desenvolvimento, o pagamento é simulado sem necessidade de API real
- **Conta Admin**: Username: `admin`, Senha: `admin123`

## Solução de Problemas Comuns

### Erro de Conexão do Banco de Dados

Verifique:
- O serviço PostgreSQL está em execução
- A URL de conexão está correta
- O banco de dados foi criado
- O usuário tem permissões suficientes

### Erro "Port already in use"

Execute:
```bash
npx kill-port 5000
```

E tente iniciar o servidor novamente.

### Problemas de Dependências

Se encontrar erros nas dependências, tente:

```bash
rm -rf node_modules
npm clean-cache
npm install
```

## Próximos Passos

Após a instalação bem-sucedida:

1. Acesse a interface do sistema em `http://localhost:5000`
2. Faça login como admin para configurar mesas, itens de menu e outras opções
3. Crie contas de usuário adicionais para testar o fluxo de reservas
4. Explore o módulo de relatórios financeiros