# Opa que delicia - Sistema de Gerenciamento de Restaurante

Sistema completo de gerenciamento para o restaurante "Opa que delicia" durante o MSBN Europe Convention, oferecendo ferramentas avançadas de reservas, pagamentos e administração.

## 📋 Visão Geral

Este sistema foi desenvolvido para atender às necessidades específicas do restaurante brasileiro "Opa que delicia" que estará servindo durante a MSBN Europe Convention de 29 de maio a 1 de junho de 2025. O software oferece uma experiência completa para os clientes fazerem reservas, escolherem itens do menu, gerenciarem seus pedidos e realizarem pagamentos, além de fornecer ferramentas robustas de administração para a equipe do restaurante.

### Principais Funcionalidades

- **Reservas online** com seleção de data, hora, mesa e número de pessoas
- **Gerenciamento de mesas** com visualização de disponibilidade em tempo real
- **Sistema de pagamento** com múltiplos métodos (Multibanco, MBWay, Cartão)
- **Perfis de usuário** com preferências culinárias e restrições dietéticas
- **Sistema de pedidos** integrado às reservas
- **Painel administrativo** para gestão do restaurante
- **Relatórios financeiros** e análise de dados
- **Interface multilíngue** (Português, Inglês e Espanhol)

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React com TypeScript, Shadcn/UI, Tailwind CSS
- **Backend**: Express.js, Node.js
- **Banco de Dados**: Supabase (PostgreSQL) com Drizzle ORM
- **Armazenamento**: Supabase Storage para imagens e arquivos
- **Autenticação**: Sistema próprio com sessões
- **Validação**: Zod
- **Processamento de Pagamentos**: Integração com Eupago
- **Localização**: i18next para internacionalização
- **Estado**: React Query

## 🚀 Início Rápido

```bash
# Clonar o repositório
git clone https://github.com/davidesp1/ReservaRapda.git
cd ReservaRapda

# Instalar dependências
npm install

# Preparar o Supabase
# 1. Crie um projeto no Supabase
# 2. Execute o script database_setup.sql no editor SQL
# 3. Configure os buckets para armazenamento de imagens
# Veja SUPABASE_SETUP.md para instruções detalhadas

# Configurar ambiente local
# Crie um arquivo .env.local com as configurações necessárias
# Veja o modelo em QUICK_START.md

# Iniciar o servidor de desenvolvimento
npm run dev
```

O sistema estará disponível em: http://localhost:5000

Para instruções detalhadas, consulte [QUICK_START.md](QUICK_START.md).

## 🔨 Ambiente de Desenvolvimento

- O sistema inclui um modo de simulação que não requer APIs externas
- Conta administrativa padrão: `admin` / `admin123`
- Hot Module Replacement (HMR) habilitado para desenvolvimento rápido
- Banco de dados PostgreSQL facilmente configurável com script pronto

## 🌐 Modo Simulação

No ambiente de desenvolvimento, o sistema opera com simulação completa:
- Processamento de pagamentos sem necessidade de gateway externo
- Dados iniciais já configurados para teste imediato
- Todas as funcionalidades disponíveis sem dependências externas

## 📋 Estrutura do Banco de Dados

O sistema utiliza as seguintes tabelas principais:

- `users`: Dados dos usuários (clientes e administradores)
- `menu_categories`: Categorias do menu (entradas, pratos principais, etc.)
- `menu_items`: Itens específicos do menu com preços
- `tables`: Mesas do restaurante com capacidade e posição
- `reservations`: Reservas de clientes com detalhes
- `payments`: Registros de pagamentos realizados
- `orders`: Pedidos associados às reservas
- `user_dietary_preferences`: Preferências dietéticas dos usuários
- `sessions`: Armazenamento de sessões de usuários

## 👥 Perfis de Usuário

### Cliente
- Visualização da página inicial com informações do restaurante
- Criação e gerenciamento de reservas
- Seleção de mesas disponíveis com informações em tempo real
- Visualização do menu e seleção de itens
- Pagamento via Multibanco, MBWay ou Cartão
- Perfil personalizado com preferências
- Histórico de reservas e pagamentos

### Administrador
- Acesso ao painel administrativo
- Gerenciamento de reservas, mesas e clientes
- Visualização de relatórios financeiros
- Configuração de itens do menu
- Estatísticas e análises de desempenho

## 💳 Sistema de Pagamento

O sistema suporta os seguintes métodos de pagamento:

- **Multibanco**: Pagamento por referência bancária
- **MBWay**: Pagamento via celular
- **Cartão de Crédito**: Processamento seguro de cartões

Em ambiente de desenvolvimento, o sistema possui um modo de simulação que permite testar fluxos de pagamento sem integração real com gateways externos.

## 🌐 Internacionalização

Todo o sistema está disponível em três idiomas:

- 🇧🇷 Português (Padrão)
- 🇬🇧 Inglês
- 🇪🇸 Espanhol

As traduções incluem todas as páginas, mensagens de erro, confirmações e elementos da interface.

## 📱 Responsividade

O sistema foi projetado com uma abordagem mobile-first, garantindo uma experiência otimizada em:

- 📱 Dispositivos móveis
- 📲 Tablets
- 💻 Desktops

## 📑 Roteiro de Desenvolvimento

- ✅ Implementação da autenticação e autorização
- ✅ Sistema de reservas com seleção de mesa
- ✅ Gerenciamento de menu e categorias
- ✅ Perfis de usuário e preferências
- ✅ Sistema de pagamento com simulação
- ✅ Multilingual support (PT, EN, ES)
- ✅ Painel administrativo básico
- ✅ Interface responsiva
- ⬜ Sistema avançado de relatórios financeiros
- ⬜ Integração com serviços de notificação
- ⬜ Funcionalidades de fidelidade e promoções

## 📚 Documentação API

A API REST do sistema está documentada abaixo:

### Rotas de Autenticação
- `POST /api/auth/register`: Registro de novo usuário
- `POST /api/auth/login`: Login de usuário
- `POST /api/auth/logout`: Logout de usuário
- `GET /api/auth/me`: Perfil do usuário autenticado

### Rotas de Reservas
- `GET /api/reservations`: Lista de reservas do usuário
- `GET /api/reservations/:id`: Detalhes de uma reserva específica
- `POST /api/reservations`: Criar nova reserva
- `PUT /api/reservations/:id`: Atualizar reserva existente
- `DELETE /api/reservations/:id`: Cancelar reserva

### Rotas de Pagamento
- `POST /api/payments/process`: Processar novo pagamento
- `GET /api/payments/status/:reference`: Verificar status de pagamento
- `GET /api/payments/:id`: Detalhes de um pagamento específico

### Rotas de Menu
- `GET /api/menu-categories`: Listar categorias do menu
- `GET /api/menu-items`: Listar todos os itens do menu
- `GET /api/menu-items/:id`: Detalhes de um item do menu

### Rotas Administrativas
- `GET /api/users`: Lista de usuários (admin)
- `GET /api/stats/dashboard`: Estatísticas para o dashboard
- `GET /api/settings/:category`: Configurações do sistema

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo LICENSE para detalhes.

## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Faça commit das mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Faça push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📞 Contato

Para mais informações, entre em contato com:

- Email: contato@opaqueidelicia.com.br
- Website: www.opaqueidelicia.com.br
- Telefone: +55 (11) 9999-8888