#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Testando configuração para deploy na Vercel...\n');

// Verificar arquivos necessários
const requiredFiles = [
  'vercel.json',
  'api/index.js',
  '.env.production.example',
  'DEPLOY_VERCEL.md',
  'backup_restaurante_2025-06-06.sql'
];

console.log('📋 Verificando arquivos necessários:');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - AUSENTE`);
  }
});

// Testar build do frontend
console.log('\n🔨 Testando build do frontend...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build do frontend bem-sucedida');
} catch (error) {
  console.log('❌ Erro no build do frontend:', error.message);
}

// Verificar estrutura dist
if (fs.existsSync('dist')) {
  console.log('✅ Pasta dist criada');
  const distFiles = fs.readdirSync('dist');
  console.log(`📁 Arquivos em dist: ${distFiles.join(', ')}`);
} else {
  console.log('❌ Pasta dist não encontrada');
}

// Verificar configuração Vercel
console.log('\n⚙️ Verificando configuração Vercel...');
try {
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  console.log('✅ vercel.json válido');
  console.log(`📝 Builds configuradas: ${vercelConfig.builds?.length || 0}`);
  console.log(`🛣️ Rotas configuradas: ${vercelConfig.routes?.length || 0}`);
} catch (error) {
  console.log('❌ Erro na configuração Vercel:', error.message);
}

console.log('\n🎯 Configuração para Vercel concluída!');
console.log('\n📋 Próximos passos:');
console.log('1. Conectar repositório à Vercel');
console.log('2. Configurar variáveis de ambiente');
console.log('3. Fazer deploy');
console.log('\n📖 Consulte DEPLOY_VERCEL.md para instruções detalhadas');