# Documentação Detalhada do Fluxo de Pagamento - Opa que Delícia

Este documento explica detalhadamente todo o fluxo de pagamento no sistema de reservas do restaurante "Opa que Delícia", descrevendo cada componente, arquivo e processo.

## Visão Geral do Sistema de Pagamento

O sistema permite que os clientes façam pagamentos usando três métodos diferentes:
1. **Multibanco** (Referência para pagamento bancário)
2. **MBWay** (Pagamento via aplicativo móvel)
3. **Cartão de Crédito/Débito** (Pagamento online)

Todos os pagamentos são processados através da plataforma **EuPago**, que fornece APIs para cada método de pagamento.

## Fluxo Completo do Pagamento

### 1. Interface do Usuário (Frontend)

#### Arquivos Principais:
- `client/src/pages/Reservations.tsx`
- `client/src/components/payments/PaymentDetailsModal.tsx`
- `client/src/components/payments/CountdownTimer.tsx`
- `client/src/components/payments/QRCodeDisplay.tsx`
- `client/src/hooks/usePayment.ts`

#### Sequência de Ações:

1. **Início do Processo**:
   - O usuário escolhe o método de pagamento na tela de reserva (`Reservations.tsx`).
   - Ao clicar em "Pagar Agora", o sistema chama a função `handlePaymentProcess()`.

2. **Processamento do Frontend**:
   - `handlePaymentProcess()` em `Reservations.tsx` cria um objeto com os dados do pagamento.
   - O hook `usePaymentProcess` (definido em `usePayment.ts`) é chamado com este objeto.
   - A mutação React Query envia uma requisição POST para `/api/payments/process`.

3. **Exibição do Modal de Pagamento**:
   - Após receber a resposta, o sistema abre o modal de pagamento (`PaymentDetailsModal.tsx`).
   - Dependendo do método escolhido, exibe informações específicas:
     - Para Multibanco: entidade, referência, QR code, código de barras e contador regressivo
     - Para MBWay: número de telefone e instruções
     - Para Cartão: botão para redirecionar para página de pagamento

4. **Componentes Específicos**:
   - `CountdownTimer.tsx`: Exibe e gerencia o tempo restante para o pagamento expirar
   - `QRCodeDisplay.tsx`: Gera e exibe o QR code e código de barras para pagamentos Multibanco

5. **Verificação de Status**:
   - Periodicamente, o sistema verifica o status do pagamento usando `usePaymentStatus` de `usePayment.ts`
   - As verificações ocorrem a cada 15 segundos via polling

### 2. Backend - Comunicação com API 

#### Arquivos Principais:
- `server/routes.ts`
- `server/services/paymentService.ts`
- `server/integrations/eupago/client.ts`
- `server/integrations/eupago/payments.ts`
- `server/integrations/eupago/types.ts`

#### Sequência de Ações:

1. **Recebimento da Requisição**:
   - A rota `/api/payments/process` em `routes.ts` recebe a requisição do frontend
   - Extrai os dados necessários (método, valor, referência, etc.) do corpo da requisição

2. **Processamento do Serviço**:
   - Chama a função `processPayment()` do `paymentService.ts`
   - Este serviço atua como intermediário entre as rotas e a integração com a EuPago

3. **Chamada à API da EuPago**:
   - O serviço chama funções específicas em `payments.ts` baseadas no método:
     - `createMultibanco()` para Multibanco
     - `createMbway()` para MBWay
     - `createCardPayment()` para pagamentos com cartão

4. **Cliente HTTP**:
   - `client.ts` contém a lógica para enviar requisições à API EuPago
   - Verifica se é modo de simulação (configurado via variável de ambiente `EUPAGO_SIMULATION`)
   - Em simulação: gera dados fictícios para teste
   - Em produção: envia requisições reais para a API do EuPago

5. **Tratamento de Respostas**:
   - O cliente recebe a resposta da API e a formata
   - Retorna para a função que o chamou em `payments.ts`
   - A função em `payments.ts` processa e retorna para `paymentService.ts`
   - O serviço finaliza formatando a resposta para o formato esperado pelo frontend

### 3. Verificação de Status de Pagamento

#### Arquivos Principais:
- `server/routes.ts` - endpoint `/api/payments/status/:reference`
- `server/services/paymentService.ts` - função `checkPaymentStatus()`
- `server/integrations/eupago/payments.ts` - função `checkPaymentStatus()`

#### Sequência de Ações:

1. **Solicitação de Status**:
   - O frontend periodicamente envia requisições GET para `/api/payments/status/:reference`
   - A rota em `routes.ts` extrai a referência do pagamento

2. **Verificação no Serviço**:
   - Chama `checkPaymentStatus()` do `paymentService.ts`
   - Decide entre simular uma resposta ou fazer uma chamada real

3. **Consulta à API EuPago**:
   - Em produção: envia uma requisição para o endpoint de status da EuPago
   - Em simulação: retorna um status simulado (sempre 'pending')

4. **Resposta ao Frontend**:
   - Retorna um objeto com o status atual do pagamento
   - O frontend atualiza a interface de acordo com o status recebido

### 4. Cancelamento de Pagamento

#### Arquivos Principais:
- `server/routes.ts` - endpoint `/api/payments/cancel`
- `server/services/paymentService.ts` - função `cancelPayment()`
- `client/src/hooks/usePayment.ts` - hook `useCancelPayment()`

#### Sequência de Ações:

1. **Solicitação de Cancelamento**:
   - Ocorre quando o tempo expira ou o usuário cancela manualmente
   - O frontend chama a mutação `useCancelPayment()` passando a referência

2. **Processamento no Backend**:
   - A rota em `routes.ts` recebe a requisição e extrai a referência
   - Chama a função `cancelPayment()` em `paymentService.ts`

3. **Cancelamento na EuPago**:
   - Em produção: enviaria uma requisição para cancelar o pagamento na EuPago
   - Em simulação: apenas retorna uma resposta simulada de sucesso

4. **Resposta ao Frontend**:
   - Retorna confirmação de cancelamento
   - O frontend fecha o modal de pagamento ou mostra uma mensagem

## Configuração e Variáveis de Ambiente

### Arquivos de Configuração:
- `.env.local` - Contém todas as variáveis de ambiente
- `EUPAGO_INTEGRATION.md` - Documentação da integração

### Variáveis Importantes:
- `EUPAGO_API_KEY` - Chave de API para autenticação com o serviço EuPago
- `EUPAGO_BASE_URL` - URL base para as chamadas à API EuPago (ex: https://sandbox.eupago.pt)
- `EUPAGO_CARD_BASE_URL` - URL específica para pagamentos com cartão
- `EUPAGO_SIMULATION` - Controla se o sistema está em modo de simulação ('true') ou real ('false')

## Modo de Simulação vs. Produção

- **Modo de Simulação** (`EUPAGO_SIMULATION=true`):
  - Não faz chamadas reais à API EuPago
  - Gera números de entidade e referência simulados
  - Status do pagamento sempre permanece como 'pending' para fins de demonstração
  - Útil para testes e desenvolvimento sem custos

- **Modo de Produção** (`EUPAGO_SIMULATION=false`):
  - Faz chamadas reais à API EuPago
  - Recebe entidades e referências reais geradas pelo sistema bancário
  - O status é atualizado conforme pagamentos reais são processados
  - Necessário para operação em ambiente real

## Detalhes Específicos por Método de Pagamento

### 1. Multibanco
- Gera uma entidade (5 dígitos) e referência (9 dígitos em formato XXX XXX XXX)
- Exibe QR code e código de barras para facilitar o pagamento
- Tem temporizador regressivo de 30 minutos
- Status verificado periodicamente

### 2. MBWay
- Requer número de telefone do cliente
- Envia notificação para o app do cliente
- Expiração de 30 minutos
- Status verificado periodicamente

### 3. Cartão de Crédito/Débito
- Redireciona para página externa de pagamento
- URL de retorno configurada para voltar ao sistema após conclusão
- Expiração de 24 horas
- Status verificado periodicamente

## Fluxo de Dados Completo (Exemplo com Multibanco)

1. Usuário seleciona "Multibanco" na tela de reserva
2. Clica em "Pagar Agora"
3. Frontend (`Reservations.tsx`) chama hook `usePaymentProcess`
4. Hook faz POST para `/api/payments/process` com:
   ```json
   {
     "method": "multibanco",
     "amount": 1550, // 15,50€
     "reference": "RES-1234567890",
     "description": "Reserva 22/05/2025 - 12:00"
   }
   ```
5. Backend (`routes.ts`) recebe requisição
6. Chama `processPayment()` em `paymentService.ts`
7. Serviço chama `createMultibanco()` em `payments.ts`
8. Função faz requisição para API EuPago via `client.ts`
9. Em produção: API retorna entidade e referência reais
10. Em simulação: sistema gera entidade e referência simuladas
11. Resposta volta pelo mesmo caminho até o frontend
12. Frontend abre modal com detalhes do pagamento
13. Mostra entidade, referência, QR code, código de barras e temporizador
14. Frontend inicia verificações periódicas de status
15. A cada 15s, chama GET para `/api/payments/status/RES-1234567890`
16. Backend consulta API EuPago (ou simula resposta)
17. Frontend atualiza interface conforme status (pendente, pago, cancelado)
18. Quando concluído, fecha modal e confirma reserva

Este documento fornece uma visão abrangente de todo o fluxo de pagamento, ajudando a entender como cada parte do sistema interage com as outras para processar pagamentos.