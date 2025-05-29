import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Printer, Settings, Wifi, Cable, AlertCircle, CheckCircle } from 'lucide-react';

interface PrinterConfig {
  id: string;
  name: string;
  type: 'thermal' | 'inkjet' | 'laser';
  connection: 'usb' | 'network' | 'bluetooth';
  ipAddress?: string;
  port?: number;
  enabled: boolean;
  autocut: boolean;
  paperWidth: number;
  baudRate?: number;
  status: 'online' | 'offline' | 'error';
}

export default function PrinterSettings() {
  const [selectedPrinter, setSelectedPrinter] = useState<PrinterConfig | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch available printers
  const { data: printers = [], isLoading, refetch } = useQuery<PrinterConfig[]>({
    queryKey: ['/api/printers/config'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/printers/config');
      return response.json();
    },
  });

  // Refresh and verify printers
  const refreshPrintersMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/printers/refresh');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Impressoras Verificadas',
        description: 'A verificação de impressoras foi concluída',
      });
      refetch();
    },
    onError: () => {
      toast({
        title: 'Erro na Verificação',
        description: 'Não foi possível verificar as impressoras',
        variant: 'destructive',
      });
    },
  });

  // Test printer connection
  const testConnectionMutation = useMutation({
    mutationFn: async (printerId: string) => {
      const response = await apiRequest('POST', `/api/printers/${printerId}/test`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.success ? 'Conexão Bem-sucedida' : 'Erro de Conexão',
        description: data.message,
        variant: data.success ? 'default' : 'destructive',
      });
    },
  });

  // Test print page
  const testPrintMutation = useMutation({
    mutationFn: async (printerId: string) => {
      const response = await apiRequest('POST', `/api/printers/${printerId}/test-print`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.success ? 'Página de Teste Enviada' : 'Erro na Impressão',
        description: data.message,
        variant: data.success ? 'default' : 'destructive',
      });
    },
  });

  // Open cash drawer
  const openDrawerMutation = useMutation({
    mutationFn: async (printerId: string) => {
      const response = await apiRequest('POST', `/api/printers/${printerId}/open-drawer`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.success ? 'Gaveta Aberta' : 'Erro ao Abrir Gaveta',
        description: data.message,
        variant: data.success ? 'default' : 'destructive',
      });
    },
  });

  // Save printer configuration
  const saveConfigMutation = useMutation({
    mutationFn: async (config: PrinterConfig) => {
      const response = await apiRequest('PUT', `/api/printers/${config.id}/config`, config);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Configurações Salvas',
        description: 'As configurações da impressora foram atualizadas com sucesso',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/printers/config'] });
      setIsEditing(false);
    },
    onError: () => {
      toast({
        title: 'Erro ao Salvar',
        description: 'Não foi possível salvar as configurações da impressora',
        variant: 'destructive',
      });
    },
  });

  const handleSaveConfig = () => {
    if (selectedPrinter) {
      saveConfigMutation.mutate(selectedPrinter);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'offline':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getConnectionIcon = (connection: string) => {
    switch (connection) {
      case 'network':
        return <Wifi className="h-4 w-4" />;
      case 'usb':
        return <Cable className="h-4 w-4" />;
      case 'bluetooth':
        return <Settings className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Printer className="h-8 w-8 text-brasil-blue" />
          <div>
            <h1 className="text-3xl font-bold text-brasil-blue">Configurações de Impressora</h1>
            <p className="text-gray-600">Gerencie as configurações das impressoras de talão do restaurante</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lista de Impressoras */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Printer className="h-5 w-5" />
                    Impressoras Disponíveis
                  </CardTitle>
                  <CardDescription>
                    Selecione uma impressora para configurar
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refreshPrintersMutation.mutate()}
                  disabled={refreshPrintersMutation.isPending || isLoading}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  {refreshPrintersMutation.isPending ? 'Verificando...' : 'Verificar Impressoras'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brasil-blue mx-auto"></div>
                  <p className="text-gray-500 mt-2">Carregando impressoras...</p>
                </div>
              ) : printers.length === 0 ? (
                <div className="text-center py-8">
                  <Printer className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma impressora encontrada</p>
                  <p className="text-sm text-gray-400">Conecte uma impressora ao sistema</p>
                </div>
              ) : (
                printers.map((printer) => (
                  <div
                    key={printer.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedPrinter?.id === printer.id
                        ? 'border-brasil-blue bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPrinter(printer)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getConnectionIcon(printer.connection)}
                        <div>
                          <h3 className="font-medium">{printer.name}</h3>
                          <p className="text-sm text-gray-500 capitalize">
                            {printer.type} • {printer.connection}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(printer.status)}
                        <Badge
                          variant={printer.enabled ? 'default' : 'secondary'}
                          className={printer.enabled ? 'bg-green-100 text-green-800' : ''}
                        >
                          {printer.enabled ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Configurações da Impressora Selecionada */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações
              </CardTitle>
              <CardDescription>
                {selectedPrinter
                  ? `Configurações para ${selectedPrinter.name}`
                  : 'Selecione uma impressora para configurar'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedPrinter ? (
                <div className="space-y-6">
                  {/* Informações Básicas */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Informações Básicas</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(!isEditing)}
                      >
                        {isEditing ? 'Cancelar' : 'Editar'}
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="printer-name">Nome</Label>
                        <Input
                          id="printer-name"
                          value={selectedPrinter.name}
                          disabled={!isEditing}
                          onChange={(e) =>
                            setSelectedPrinter({ ...selectedPrinter, name: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="printer-type">Tipo</Label>
                        <Input
                          id="printer-type"
                          value={selectedPrinter.type}
                          disabled={!isEditing}
                          onChange={(e) =>
                            setSelectedPrinter({
                              ...selectedPrinter,
                              type: e.target.value as any,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="printer-enabled"
                        checked={selectedPrinter.enabled}
                        disabled={!isEditing}
                        onCheckedChange={(checked) =>
                          setSelectedPrinter({ ...selectedPrinter, enabled: checked })
                        }
                      />
                      <Label htmlFor="printer-enabled">Impressora Ativa</Label>
                    </div>
                  </div>

                  <Separator />

                  {/* Configurações de Conexão */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Configurações de Conexão</h4>

                    {selectedPrinter.connection === 'network' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="ip-address">Endereço IP</Label>
                          <Input
                            id="ip-address"
                            value={selectedPrinter.ipAddress || ''}
                            disabled={!isEditing}
                            placeholder="192.168.1.100"
                            onChange={(e) =>
                              setSelectedPrinter({
                                ...selectedPrinter,
                                ipAddress: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="port">Porta</Label>
                          <Input
                            id="port"
                            type="number"
                            value={selectedPrinter.port || ''}
                            disabled={!isEditing}
                            placeholder="9100"
                            onChange={(e) =>
                              setSelectedPrinter({
                                ...selectedPrinter,
                                port: parseInt(e.target.value) || undefined,
                              })
                            }
                          />
                        </div>
                      </div>
                    )}

                    {selectedPrinter.connection === 'usb' && selectedPrinter.baudRate && (
                      <div>
                        <Label htmlFor="baud-rate">Taxa de Transmissão</Label>
                        <Input
                          id="baud-rate"
                          type="number"
                          value={selectedPrinter.baudRate}
                          disabled={!isEditing}
                          onChange={(e) =>
                            setSelectedPrinter({
                              ...selectedPrinter,
                              baudRate: parseInt(e.target.value) || undefined,
                            })
                          }
                        />
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Configurações de Impressão */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Configurações de Impressão</h4>

                    <div>
                      <Label htmlFor="paper-width">Largura do Papel (mm)</Label>
                      <Input
                        id="paper-width"
                        type="number"
                        value={selectedPrinter.paperWidth}
                        disabled={!isEditing}
                        onChange={(e) =>
                          setSelectedPrinter({
                            ...selectedPrinter,
                            paperWidth: parseInt(e.target.value) || 80,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="autocut"
                        checked={selectedPrinter.autocut}
                        disabled={!isEditing}
                        onCheckedChange={(checked) =>
                          setSelectedPrinter({ ...selectedPrinter, autocut: checked })
                        }
                      />
                      <Label htmlFor="autocut">Corte Automático</Label>
                    </div>
                  </div>

                  <Separator />

                  {/* Ações */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testConnectionMutation.mutate(selectedPrinter.id)}
                        disabled={testConnectionMutation.isPending}
                        className="flex items-center gap-1"
                      >
                        <CheckCircle className="h-3 w-3" />
                        {testConnectionMutation.isPending ? 'Testando...' : 'Conexão'}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testPrintMutation.mutate(selectedPrinter.id)}
                        disabled={testPrintMutation.isPending}
                        className="flex items-center gap-1"
                      >
                        <Printer className="h-3 w-3" />
                        {testPrintMutation.isPending ? 'Imprimindo...' : 'Imprimir'}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDrawerMutation.mutate(selectedPrinter.id)}
                        disabled={openDrawerMutation.isPending}
                        className="flex items-center gap-1 bg-yellow-50 hover:bg-yellow-100 border-yellow-300"
                      >
                        <Settings className="h-3 w-3" />
                        {openDrawerMutation.isPending ? 'Abrindo...' : 'Gaveta'}
                      </Button>
                    </div>

                    {isEditing && (
                      <Button
                        onClick={handleSaveConfig}
                        disabled={saveConfigMutation.isPending}
                        className="w-full bg-brasil-green hover:bg-green-700 flex items-center gap-2"
                      >
                        <Settings className="h-4 w-4" />
                        {saveConfigMutation.isPending ? 'Salvando...' : 'Salvar Configurações'}
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Selecione uma impressora</p>
                  <p className="text-sm text-gray-400">
                    Escolha uma impressora da lista para configurar
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}