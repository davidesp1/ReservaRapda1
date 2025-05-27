#!/usr/bin/env node

/**
 * DEBUG COMPLETO DO SISTEMA DE IMPRESSORAS
 * Teste rigoroso passo a passo
 */

import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

async function debugCompleto() {
  console.log('🔍 === DEBUG COMPLETO DO SISTEMA DE IMPRESSORAS ===\n');
  
  // PASSO 1: Identificar Sistema Operacional
  console.log('📋 PASSO 1: IDENTIFICAÇÃO DO SISTEMA OPERACIONAL');
  const platform = process.platform;
  console.log(`   Sistema detectado: ${platform}`);
  
  try {
    const { stdout: osInfo } = await execAsync('uname -a 2>/dev/null || echo "Windows"');
    console.log(`   Detalhes: ${osInfo.trim()}`);
  } catch (e) {
    console.log('   Detalhes: Sistema Windows ou erro na detecção');
  }
  
  // PASSO 2: Verificar comandos disponíveis
  console.log('\n📋 PASSO 2: VERIFICAÇÃO DE COMANDOS DISPONÍVEIS');
  
  const comandos = ['lpstat', 'lp', 'lsusb', 'which', 'ls'];
  for (const cmd of comandos) {
    try {
      await execAsync(`which ${cmd} 2>/dev/null`);
      console.log(`   ✅ ${cmd}: Disponível`);
    } catch (e) {
      console.log(`   ❌ ${cmd}: Não disponível`);
    }
  }
  
  // PASSO 3: Detecção específica por plataforma
  console.log('\n📋 PASSO 3: DETECÇÃO ESPECÍFICA POR PLATAFORMA');
  
  if (platform === 'linux') {
    console.log('   🐧 SISTEMA LINUX DETECTADO');
    
    // Verificar CUPS
    try {
      const { stdout } = await execAsync('lpstat -p 2>/dev/null || echo "NO_CUPS"');
      if (stdout.includes('NO_CUPS')) {
        console.log('   ❌ CUPS: Não instalado');
        console.log('   💡 Solução: sudo apt-get install cups-client');
      } else {
        console.log('   ✅ CUPS: Instalado e funcionando');
        console.log(`   📄 Saída: ${stdout.trim()}`);
      }
    } catch (e) {
      console.log('   ❌ CUPS: Erro na verificação');
    }
    
    // Verificar dispositivos USB
    try {
      const { stdout } = await execAsync('lsusb 2>/dev/null || echo "NO_USB"');
      if (stdout.includes('NO_USB')) {
        console.log('   ❌ USB: Comando lsusb não disponível');
      } else {
        console.log('   ✅ USB: Comando disponível');
        const printers = stdout.split('\n').filter(line => 
          line.toLowerCase().includes('printer') || 
          line.toLowerCase().includes('canon') ||
          line.toLowerCase().includes('epson') ||
          line.toLowerCase().includes('hp') ||
          line.toLowerCase().includes('brother')
        );
        console.log(`   📄 Impressoras USB encontradas: ${printers.length}`);
        printers.forEach(p => console.log(`      - ${p.trim()}`));
      }
    } catch (e) {
      console.log('   ❌ USB: Erro na verificação');
    }
    
    // Verificar dispositivos de impressão
    try {
      const { stdout } = await execAsync('ls /dev/lp* /dev/usb/lp* 2>/dev/null || echo "NO_DEVICES"');
      if (stdout.includes('NO_DEVICES')) {
        console.log('   ❌ Dispositivos: Nenhum dispositivo /dev/lp* encontrado');
      } else {
        console.log('   ✅ Dispositivos: Encontrados');
        console.log(`   📄 Dispositivos: ${stdout.trim()}`);
      }
    } catch (e) {
      console.log('   ❌ Dispositivos: Erro na verificação');
    }
    
  } else if (platform === 'darwin') {
    console.log('   🍎 SISTEMA MACOS DETECTADO');
    
    try {
      const { stdout } = await execAsync('lpstat -p 2>/dev/null || echo "NO_PRINTERS"');
      console.log(`   📄 Impressoras macOS: ${stdout.trim()}`);
    } catch (e) {
      console.log('   ❌ macOS: Erro na verificação de impressoras');
    }
    
  } else if (platform === 'win32') {
    console.log('   🪟 SISTEMA WINDOWS DETECTADO');
    
    try {
      const { stdout } = await execAsync('powershell -Command "Get-WmiObject -Class Win32_Printer | Select-Object Name | ConvertTo-Json" 2>nul || echo "NO_PRINTERS"');
      console.log(`   📄 Impressoras Windows: ${stdout.trim()}`);
    } catch (e) {
      console.log('   ❌ Windows: Erro na verificação de impressoras');
    }
  }
  
  // PASSO 4: Teste de comunicação real
  console.log('\n📋 PASSO 4: TESTE DE COMUNICAÇÃO REAL');
  
  try {
    const response = await fetch('http://localhost:5000/api/settings/pos/printers');
    const data = await response.json();
    console.log('   ✅ API: Conexão com backend funcionando');
    console.log(`   📄 Impressoras detectadas pela API: ${data.length}`);
    data.forEach((printer, i) => {
      console.log(`      ${i+1}. ${printer.name} (${printer.status}) - ${printer.type}`);
    });
  } catch (e) {
    console.log('   ❌ API: Erro na conexão com backend');
    console.log(`   📄 Erro: ${e.message}`);
  }
  
  // PASSO 5: Recomendações
  console.log('\n📋 PASSO 5: RECOMENDAÇÕES PARA FUNCIONAMENTO REAL');
  
  if (platform === 'linux') {
    console.log('   🐧 PARA LINUX:');
    console.log('      1. Instalar CUPS: sudo apt-get install cups cups-client');
    console.log('      2. Conectar impressora USB');
    console.log('      3. Configurar impressora: sudo lpadmin -p MinhaImpressora -E -v usb://...');
    console.log('      4. Testar: echo "teste" | lp -d MinhaImpressora');
  }
  
  console.log('\n🎯 === RESUMO DO DEBUG ===');
  console.log(`   Sistema: ${platform}`);
  console.log('   Status: Sistema pronto para detectar impressoras reais quando disponíveis');
  console.log('   Próximos passos: Conectar impressora física ou instalar CUPS');
}

// Executar debug se chamado diretamente
if (require.main === module) {
  debugCompleto().catch(console.error);
}

module.exports = { debugCompleto };