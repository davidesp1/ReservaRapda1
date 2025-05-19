# Guia de Integração EuPago

Este documento explica como a integração com a API EuPago foi implementada e como utilizá-la no projeto "Opa que delicia".

## 1. Configuração Inicial

### Arquivos de Configuração

A integração com EuPago utiliza as seguintes variáveis de ambiente (`.env.local`):

```
# API EuPago
EUPAGO_BASE_URL=https://sandbox.eupago.pt/api
EUPAGO_API_KEY=sua-chave-api-aqui
EUPAGO_SIMULATION=true # 'true' para modo simulação, 'false' para chamadas reais
```

### Modo Simulação vs. Modo Produção

- **Modo Simulação** (para desenvolvimento): Define `EUPAGO_SIMULATION=true` e não requer uma chave de API real
- **Modo Produção**: Define `EUPAGO_SIMULATION=false` e requer uma chave de API válida da EuPago

## 2. Arquitetura da Integração

A integração com EuPago segue uma arquitetura de três camadas:

### Backend

1. **Cliente HTTP** (`server/integrations/eupago/client.ts`)
   - Gerencia comunicação direta com a API EuPago
   - Suporta modo de simulação para desenvolvimento
   - Lida com autenticação e formatação de mensagens

2. **Rotas da API** (`server/routes.ts`)
   - Define endpoints para diferentes métodos de pagamento:
     - `/api/payments/multibanco` - Criar referências Multibanco
     - `/api/payments/mbway` - Processar pagamentos MBWay
     - `/api/payments/status` - Verificar status de pagamentos

### Frontend

1. **Hooks** (`client/src/hooks/usePayment.ts`)
   - Funções para criação de pagamentos por método
   - Formatação de respostas da API para uso na UI
   - Consulta periódica de status de pagamentos

2. **Componentes de UI** (`client/src/components/payments/PaymentDetailsModal.tsx`)
   - Exibe detalhes específicos para cada método de pagamento
   - Formata valores e referências
   - Fornece ações para o usuário (confirmar, cancelar)

## 3. Métodos de Pagamento Suportados

### Multibanco

**Endpoint:** `/reference/create`

**Parâmetros:**
- `valor` - Valor em euros (ex: 10.50)
- `idempotencia` - Identificador único (ex: reserva-123-mb)

**Resposta:**
```json
{
  "sucesso": true,
  "entidade": "11111",
  "referencia": "123 456 789",
  "valor": "10.50",
  "estado": "pendente",
  "dataLimite": "2023-12-31T23:59:59Z"
}
```

### MBWay

**Endpoint:** `/mbway/create`

**Parâmetros:**
- `valor` - Valor em euros (ex: 10.50)
- `telemovel` - Número de telefone (formato: 9XXXXXXXX)
- `idempotencia` - Identificador único (ex: reserva-123-mbw)

**Resposta:**
```json
{
  "sucesso": true,
  "referencia": "mbw_123456789",
  "valor": "10.50",
  "estado": "pendente",
  "telemovel": "914123456",
  "alias": "MBWay"
}
```

### Consulta de Status

**Endpoint:** `/payments/status`

**Parâmetros:**
- `referencia` - Referência do pagamento

**Resposta:**
```json
{
  "sucesso": true,
  "referencia": "mbw_123456789",
  "valor": "10.50",
  "estado": "pago",
  "dataPagamento": "2023-12-01T15:30:00Z"
}
```

## 4. Uso no Frontend

### Criar Pagamento Multibanco

```typescript
import { useCreateMultibanco } from '../hooks/usePayment';

const Component = () => {
  const multibancoMutation = useCreateMultibanco();
  
  const handlePay = async () => {
    const result = await multibancoMutation.mutateAsync({
      valor: 10.50,
      idempotencia: `reserva-${reservationId}-mb`,
      descricao: "Reserva no Opa que delicia"
    });
    
    // result contém: entity, reference, expirationDate, etc.
    setPaymentDetails(result);
  };
  
  return (
    // ...
  );
};
```

### Criar Pagamento MBWay

```typescript
import { useCreateMBWay } from '../hooks/usePayment';

const Component = () => {
  const mbwayMutation = useCreateMBWay();
  
  const handlePay = async () => {
    const result = await mbwayMutation.mutateAsync({
      valor: 10.50,
      telemovel: "914123456",
      idempotencia: `reserva-${reservationId}-mbw`,
      descricao: "Reserva no Opa que delicia"
    });
    
    // result contém: phone, reference, etc.
    setPaymentDetails(result);
  };
  
  return (
    // ...
  );
};
```

### Verificar Status de Pagamento

```typescript
import { useCheckPaymentStatus } from '../hooks/usePayment';

const Component = () => {
  const { data, isLoading } = useCheckPaymentStatus("mbw_123456789");
  
  useEffect(() => {
    if (data?.status === 'pago') {
      // Pagamento confirmado!
      handlePaymentSuccess();
    }
  }, [data]);
  
  return (
    // ...
  );
};
```

## 5. Exibindo Detalhes de Pagamento

O componente `PaymentDetailsModal` exibe diferentes informações dependendo do método de pagamento:

```typescript
import PaymentDetailsModal from '../components/payments/PaymentDetailsModal';

const Component = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  
  // ... lógica de pagamento ...
  
  return (
    <>
      <Button onClick={() => setIsModalOpen(true)}>
        Ver Detalhes de Pagamento
      </Button>
      
      <PaymentDetailsModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        paymentMethod="multibanco" // ou "mbway" ou "card"
        paymentDetails={paymentDetails}
        paymentUrl={paymentDetails?.url}
        total={10.50}
        onConfirm={handleConfirmPayment}
      />
    </>
  );
};
```

## 6. Monitoramento e Depuração

### Logs do Cliente API

Para ver detalhes das requisições e respostas, verifique os logs do servidor. O cliente da API EuPago registra:

1. URL e corpo das requisições
2. Respostas recebidas da API
3. Erros encontrados durante as chamadas

### Estado de Simulação

No modo de simulação, o sistema:
- Gera referencias Multibanco fictícias (entidade: 11111)
- Simula notificações MBWay
- Não faz chamadas reais à API

## 7. Transição para Produção

Para usar a API EuPago em produção:

1. Obtenha chaves de API de produção em https://eupago.pt/
2. Atualize as variáveis de ambiente:
   ```
   EUPAGO_BASE_URL=https://clientes.eupago.pt/api
   EUPAGO_API_KEY=sua-chave-api-producao
   EUPAGO_SIMULATION=false
   ```
3. Teste todas as funcionalidades em ambiente de stage antes de lançar

## 8. Solução de Problemas

### Erro: "EUPAGO_API_KEY não configurada"
- Verifique se a variável de ambiente EUPAGO_API_KEY está definida
- Se estiver em modo de desenvolvimento, certifique-se que EUPAGO_SIMULATION=true

### Erro: "Falha na comunicação com a API do Eupago"
- Verifique a conectividade da rede
- Confirme se EUPAGO_BASE_URL está correto
- Verifique se a chave API está ativa

### Pagamentos Multibanco não são gerados
- Verifique o formato do valor (deve ser numérico)
- Confirme se o identificador de idempotência é único
- Verifique o formato da resposta nos logs do servidor