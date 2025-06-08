# Deploy para Vercel - Sistema de Restaurante

## Pré-requisitos
1. Conta na Vercel (https://vercel.com)
2. Banco de dados PostgreSQL configurado (recomendado: Neon, Supabase ou Railway)
3. Variáveis de ambiente configuradas

## Variáveis de Ambiente Necessárias

### Base de Dados
```
DATABASE_URL=postgresql://user:password@host:port/database
```

### EuPago (Pagamentos)
```
EUPAGO_API_KEY=your_eupago_api_key
EUPAGO_CLIENT_ID=your_client_id
EUPAGO_CLIENT_SECRET=your_client_secret
```

### Supabase (Storage de Imagens)
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Sessão
```
SESSION_SECRET=your_secure_session_secret_min_32_chars
```

### Configuração de Produção
```
NODE_ENV=production
FRONTEND_URL=https://your-domain.vercel.app
```

## Passos para Deploy

### 1. Preparar o Repositório
```bash
# Clone o projeto
git clone your-repository-url
cd your-project

# Instalar dependências
npm install
```

### 2. Configurar Banco de Dados
1. Criar banco PostgreSQL em produção
2. Executar o script de backup: `backup_restaurante_2025-06-06.sql`
3. Ou usar o comando: `npm run db:push`

### 3. Deploy na Vercel

#### Opção A: Via CLI
```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# Deploy
vercel

# Configurar variáveis de ambiente
vercel env add DATABASE_URL
vercel env add EUPAGO_API_KEY
# ... adicionar todas as outras variáveis
```

#### Opção B: Via Dashboard
1. Acessar https://vercel.com/dashboard
2. Clicar em "New Project"
3. Conectar o repositório Git
4. Configurar as variáveis de ambiente na aba "Environment Variables"
5. Deploy automático

### 4. Configurações Pós-Deploy

#### Verificar URLs
- Frontend: https://your-project.vercel.app
- API: https://your-project.vercel.app/api/health

#### Configurar Domínio Personalizado (Opcional)
1. Na dashboard da Vercel, ir em "Domains"
2. Adicionar domínio personalizado
3. Configurar DNS conforme instruções

## Estrutura de Arquivos para Vercel

```
├── api/
│   └── index.js          # Serverless function (auto-gerado)
├── dist/                 # Build do frontend (auto-gerado)
├── vercel.json          # Configuração da Vercel
├── package.json         # Dependências e scripts
└── backup_restaurante_2025-06-06.sql  # Backup do banco
```

## Scripts Disponíveis

- `npm run build` - Build completo (frontend + backend)
- `npm run dev` - Desenvolvimento local
- `npm run db:push` - Aplicar schema do banco

## Troubleshooting

### Erro de Banco de Dados
- Verificar se DATABASE_URL está correta
- Confirmar que o banco está acessível publicamente
- Testar conexão localmente primeiro

### Erro de API Routes
- Verificar se todas as variáveis de ambiente estão configuradas
- Confirmar que o arquivo `api/index.js` existe
- Verificar logs na dashboard da Vercel

### Problemas de CORS
- Adicionar domínio da Vercel na configuração de CORS
- Verificar se FRONTEND_URL está configurada corretamente

## Notas Importantes

1. **Analytics Reais**: O sistema agora usa dados reais do banco para analytics
2. **Backup Incluído**: Usar `backup_restaurante_2025-06-06.sql` para restaurar dados
3. **Pagamentos**: EuPago configurado para sandbox (alterar para produção conforme necessário)
4. **Imagens**: Supabase Storage configurado para upload de imagens

## Monitoramento

- Dashboard Vercel: https://vercel.com/dashboard
- Logs em tempo real disponíveis na dashboard
- Métricas de performance e usage incluídas