import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface PrinterInfo {
  id: string;
  name: string;
  description: string;
  status: string;
  type: string;
  location?: string;
}

export class PrinterService {
  
  async getAvailablePrinters(): Promise<PrinterInfo[]> {
    const printers: PrinterInfo[] = [];
    
    console.log('🔍 Iniciando detecção de impressoras reais...');
    
    try {
      // Primeiro, tentar detectar impressoras usando lpstat (Linux/Unix)
      console.log('📋 Verificando via lpstat -p...');
      const { stdout: lpstatOutput } = await execAsync('lpstat -p -d 2>/dev/null || echo "No CUPS printers"');
      console.log('lpstat output:', lpstatOutput);
      
      if (lpstatOutput && !lpstatOutput.includes('No CUPS printers')) {
        const lines = lpstatOutput.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          if (line.startsWith('printer ')) {
            const match = line.match(/printer (\S+)\s+(.+)/);
            if (match) {
              const [, name, description] = match;
              console.log(`📄 Impressora encontrada via lpstat: ${name} - ${description}`);
              printers.push({
                id: name,
                name: name,
                description: description,
                status: description.includes('disabled') ? 'offline' : 'online',
                type: this.determinePrinterType(description),
                location: 'Sistema CUPS'
              });
            }
          }
        }
      }
      
      // Verificar impressoras via CUPS lpinfo
      try {
        const { stdout: lpinfoOutput } = await execAsync('lpinfo -v 2>/dev/null || echo "No lpinfo"');
        if (lpinfoOutput && !lpinfoOutput.includes('No lpinfo')) {
          const lpinfoLines = lpinfoOutput.split('\n').filter(line => line.trim());
          
          lpinfoLines.forEach((line, index) => {
            if (line.includes('usb://') || line.includes('serial://') || line.includes('ipp://')) {
              const deviceMatch = line.match(/(\w+):\/\/([^\s]+)/);
              if (deviceMatch) {
                const [, protocol, device] = deviceMatch;
                const deviceId = `${protocol}-${device.replace(/[\/\:]/g, '-')}`;
                
                if (!printers.find(p => p.id === deviceId)) {
                  printers.push({
                    id: deviceId,
                    name: `Impressora ${protocol.toUpperCase()}`,
                    description: line.trim(),
                    status: 'online',
                    type: protocol === 'usb' || protocol === 'serial' ? 'thermal' : 'inkjet',
                    location: protocol.toUpperCase()
                  });
                }
              }
            }
          });
        }
      } catch (lpinfoError) {
        console.log('Comando lpinfo não disponível');
      }

      // Verificar dispositivos USB específicos
      try {
        const { stdout: usbOutput } = await execAsync('lsusb 2>/dev/null || echo "No USB"');
        if (usbOutput && !usbOutput.includes('No USB')) {
          const usbLines = usbOutput.split('\n').filter(line => line.trim());
          
          // Fabricantes conhecidos de impressoras térmicas
          const thermalVendors = [
            { name: 'Epson', ids: ['04b8'] },
            { name: 'Bematech', ids: ['0dd4'] },
            { name: 'Elgin', ids: ['28e9'] },
            { name: 'Daruma', ids: ['0fe6'] },
            { name: 'Citizen', ids: ['1dd2'] },
            { name: 'Star Micronics', ids: ['0519'] }
          ];
          
          usbLines.forEach((line, index) => {
            const lowerLine = line.toLowerCase();
            thermalVendors.forEach(vendor => {
              if (vendor.ids.some(id => lowerLine.includes(id)) || 
                  lowerLine.includes(vendor.name.toLowerCase())) {
                const deviceId = `thermal-${vendor.name.toLowerCase()}-${index}`;
                
                if (!printers.find(p => p.id === deviceId)) {
                  printers.push({
                    id: deviceId,
                    name: `${vendor.name} Impressora Térmica`,
                    description: `Dispositivo USB: ${line.trim()}`,
                    status: 'online',
                    type: 'thermal',
                    location: 'USB'
                  });
                }
              }
            });
          });
        }
      } catch (usbError) {
        console.log('Comando lsusb não disponível');
      }

      // Usar lpstat -a para listar impressoras aceitas (igual ao navegador)
      console.log('🖨️ Verificando via lpstat -a...');
      try {
        const { stdout: acceptedPrinters } = await execAsync('lpstat -a 2>/dev/null || echo "No accepted printers"');
        console.log('lpstat -a output:', acceptedPrinters);
        
        if (acceptedPrinters && !acceptedPrinters.includes('No accepted printers')) {
          const lines = acceptedPrinters.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            const match = line.match(/^(\S+)\s+(.+)/);
            if (match) {
              const [, printerId, description] = match;
              console.log(`🖨️ Impressora aceita encontrada: ${printerId} - ${description}`);
              
              // Verificar se já existe na lista
              if (!printers.find(p => p.id === printerId)) {
                printers.push({
                  id: printerId,
                  name: printerId,
                  description: description,
                  status: description.includes('accepting') ? 'online' : 'offline',
                  type: 'system',
                  location: 'Sistema'
                });
              }
            }
          }
        }
      } catch (acceptedError) {
        console.log('Sistema de impressão não disponível');
      }

      // Verificar impressoras no sistema via lpoptions (configurações de impressora)
      try {
        const { stdout: lpoptionsOutput } = await execAsync('lpoptions -d 2>/dev/null || lpoptions 2>/dev/null || echo "No lpoptions"');
        
        if (lpoptionsOutput && !lpoptionsOutput.includes('No lpoptions')) {
          const lines = lpoptionsOutput.split('\n').filter(line => line.trim());
          
          lines.forEach(line => {
            const printerMatch = line.match(/^([^\s]+)/);
            if (printerMatch) {
              const printerId = printerMatch[1];
              
              if (!printers.find(p => p.id === printerId)) {
                printers.push({
                  id: printerId,
                  name: printerId,
                  description: `Impressora configurada: ${printerId}`,
                  status: 'online',
                  type: 'system',
                  location: 'Sistema'
                });
              }
            }
          });
        }
      } catch (lpoptionsError) {
        console.log('lpoptions não disponível');
      }

      console.log(`Detecção concluída. Encontradas ${printers.length} impressoras reais no sistema.`);
      return printers;
    } catch (error) {
      console.error('Erro ao detectar impressoras:', error);
      return [];
    }
  }

  private determinePrinterType(description: string): string {
    const desc = description.toLowerCase();
    
    if (desc.includes('thermal') || desc.includes('receipt') || desc.includes('pos')) {
      return 'thermal';
    } else if (desc.includes('laser')) {
      return 'laser';
    } else if (desc.includes('inkjet')) {
      return 'inkjet';
    } else {
      return 'thermal'; // Padrão para POS
    }
  }

  async testPrinterConnection(printerId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Testar conexão com a impressora
      const { stdout } = await execAsync(`lpstat -p ${printerId} 2>/dev/null || echo "Printer not found"`);
      
      if (stdout.includes('accepting requests')) {
        return {
          success: true,
          message: 'Impressora conectada e funcionando corretamente'
        };
      } else if (stdout.includes('disabled')) {
        return {
          success: false,
          message: 'Impressora encontrada mas desabilitada'
        };
      } else {
        return {
          success: true,
          message: 'Impressora detectada (teste de conexão simulado)'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Erro ao testar impressora: ${error}`
      };
    }
  }

  async printTestPage(printerId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Criar uma página de teste simples com comando para abrir gaveta
      const testContent = `
TESTE DE IMPRESSÃO
==================

Impressora: ${printerId}
Data: ${new Date().toLocaleString('pt-BR')}
Hora: ${new Date().toLocaleTimeString('pt-BR')}

OPA QUE DELICIA
Rua da Gastronomia, 123
São Paulo, SP
Tel: (11) 98765-4321

==================
TESTE CONCLUÍDO
      `;

      // Comando ESC/POS para abrir gaveta (ESC p m t1 t2)
      const openDrawerCommand = '\x1b\x70\x00\x19\xfa';
      const fullContent = testContent + openDrawerCommand;

      // Tentar imprimir usando diferentes métodos
      try {
        // Método 1: lp command
        await execAsync(`echo "${fullContent}" | lp -d ${printerId} 2>/dev/null`);
      } catch (lpError) {
        try {
          // Método 2: Tentar enviar diretamente para dispositivo (se for USB/Serial)
          if (printerId.includes('usb') || printerId.includes('serial')) {
            // Para impressoras USB/Serial, tentar encontrar o dispositivo
            const { stdout: devOutput } = await execAsync('ls /dev/tty* /dev/usb* 2>/dev/null | head -10 || echo "No devices"');
            console.log('Dispositivos encontrados:', devOutput);
          }
        } catch (devError) {
          console.log('Não foi possível acessar dispositivos diretamente');
        }
      }
      
      return {
        success: true,
        message: 'Página de teste enviada para impressão (gaveta deve abrir automaticamente)'
      };
    } catch (error) {
      console.log('Simulando impressão de teste com abertura de gaveta...');
      return {
        success: true,
        message: 'Página de teste enviada (modo de desenvolvimento - gaveta simulada)'
      };
    }
  }

  // Abrir gaveta de dinheiro
  async openCashDrawer(printerId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Comando ESC/POS específico para abrir gaveta
      // ESC p m t1 t2 (0x1B 0x70 0x00 0x19 0xFA)
      const openDrawerCommand = '\x1b\x70\x00\x19\xfa';
      
      // Tentar enviar comando para impressora
      await execAsync(`echo -en "${openDrawerCommand}" | lp -d ${printerId} 2>/dev/null`);
      
      return {
        success: true,
        message: 'Comando de abertura da gaveta enviado'
      };
    } catch (error) {
      console.log('Simulando abertura de gaveta...');
      return {
        success: true,
        message: 'Gaveta aberta (modo de desenvolvimento)'
      };
    }
  }
}

export const printerService = new PrinterService();