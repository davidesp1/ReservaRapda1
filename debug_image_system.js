// Sistema completo de debug para upload de imagens
// Este arquivo vai diagnosticar todo o fluxo de upload

console.log("=== INICIANDO DEBUG COMPLETO DO SISTEMA DE IMAGENS ===");

// 1. Verificar se o Supabase está configurado
function checkSupabaseConfig() {
    console.log("\n1. VERIFICANDO CONFIGURAÇÃO DO SUPABASE:");
    
    const supabaseUrl = import.meta?.env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta?.env?.VITE_SUPABASE_KEY || process.env.VITE_SUPABASE_KEY;
    
    console.log("- SUPABASE_URL:", supabaseUrl ? "✓ Definido" : "✗ NÃO DEFINIDO");
    console.log("- SUPABASE_KEY:", supabaseKey ? "✓ Definido" : "✗ NÃO DEFINIDO");
    
    if (!supabaseUrl || !supabaseKey) {
        console.log("❌ PROBLEMA: Variáveis de ambiente do Supabase não definidas!");
        console.log("Solução: Definir VITE_SUPABASE_URL e VITE_SUPABASE_KEY no arquivo .env");
        return false;
    }
    
    return true;
}

// 2. Verificar conexão com Supabase Storage
async function checkSupabaseStorage() {
    console.log("\n2. VERIFICANDO SUPABASE STORAGE:");
    
    try {
        // Importar cliente Supabase
        const { createClient } = await import('@supabase/supabase-js');
        
        const supabaseUrl = import.meta?.env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta?.env?.VITE_SUPABASE_KEY || process.env.VITE_SUPABASE_KEY;
        
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        console.log("- Cliente Supabase criado: ✓");
        
        // Listar buckets
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        
        if (bucketsError) {
            console.log("❌ ERRO ao listar buckets:", bucketsError);
            return false;
        }
        
        console.log("- Buckets encontrados:", buckets?.length || 0);
        buckets?.forEach(bucket => {
            console.log(`  • ${bucket.name} (${bucket.public ? 'público' : 'privado'})`);
        });
        
        // Verificar se o bucket restaurant-images existe
        const restaurantBucket = buckets?.find(b => b.name === 'restaurant-images');
        if (!restaurantBucket) {
            console.log("⚠️  AVISO: Bucket 'restaurant-images' não encontrado!");
            console.log("Solução: Criar bucket no painel do Supabase Storage");
        } else {
            console.log("✓ Bucket 'restaurant-images' encontrado");
        }
        
        return true;
    } catch (error) {
        console.log("❌ ERRO na verificação do Storage:", error);
        return false;
    }
}

// 3. Testar upload de arquivo
async function testFileUpload() {
    console.log("\n3. TESTANDO UPLOAD DE ARQUIVO:");
    
    try {
        const { createClient } = await import('@supabase/supabase-js');
        
        const supabaseUrl = import.meta?.env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta?.env?.VITE_SUPABASE_KEY || process.env.VITE_SUPABASE_KEY;
        
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Criar arquivo de teste (imagem Base64 pequena)
        const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
        
        // Converter Base64 para Blob
        const response = await fetch(testImageBase64);
        const blob = await response.blob();
        
        console.log("- Arquivo de teste criado:", blob.size, "bytes");
        
        const fileName = `test-${Date.now()}.png`;
        const filePath = `debug/${fileName}`;
        
        console.log("- Tentando upload para:", filePath);
        
        const { data, error } = await supabase.storage
            .from('restaurant-images')
            .upload(filePath, blob, {
                cacheControl: '3600',
                upsert: false
            });
        
        if (error) {
            console.log("❌ ERRO no upload:", error);
            console.log("Detalhes do erro:");
            console.log("  - Código:", error.statusCode);
            console.log("  - Mensagem:", error.message);
            
            if (error.message.includes('row-level security')) {
                console.log("💡 SOLUÇÃO: Configurar políticas RLS no Supabase Storage");
            }
            
            if (error.message.includes('Bucket not found')) {
                console.log("💡 SOLUÇÃO: Criar bucket 'restaurant-images' no Supabase");
            }
            
            return false;
        }
        
        console.log("✓ Upload realizado com sucesso!");
        console.log("- Caminho do arquivo:", data.path);
        
        // Tentar obter URL pública
        const { data: urlData } = supabase.storage
            .from('restaurant-images')
            .getPublicUrl(filePath);
        
        console.log("- URL pública:", urlData.publicUrl);
        
        return true;
    } catch (error) {
        console.log("❌ ERRO no teste de upload:", error);
        return false;
    }
}

// 4. Verificar banco de dados
async function checkDatabase() {
    console.log("\n4. VERIFICANDO BANCO DE DADOS:");
    
    try {
        // Fazer request para API do servidor
        const response = await fetch('/api/test-image-upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: 'Produto Debug Test',
                description: 'Teste automatizado de debug',
                price: 999,
                category_id: 1,
                image_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
            })
        });
        
        if (!response.ok) {
            console.log("❌ ERRO na API:", response.status, response.statusText);
            return false;
        }
        
        const result = await response.json();
        console.log("✓ Teste no banco realizado com sucesso!");
        console.log("- Produto criado:", result.product?.name);
        console.log("- ID:", result.product?.id);
        
        return true;
    } catch (error) {
        console.log("❌ ERRO no teste do banco:", error);
        return false;
    }
}

// 5. Função principal de debug
async function runCompleteDebug() {
    console.log("🔍 EXECUTANDO DIAGNÓSTICO COMPLETO...\n");
    
    let allOk = true;
    
    // Executar todas as verificações
    if (!checkSupabaseConfig()) allOk = false;
    if (!await checkSupabaseStorage()) allOk = false;
    if (!await testFileUpload()) allOk = false;
    if (!await checkDatabase()) allOk = false;
    
    console.log("\n=== RESUMO DO DIAGNÓSTICO ===");
    
    if (allOk) {
        console.log("🎉 TUDO FUNCIONANDO! O sistema de imagens está operacional.");
    } else {
        console.log("⚠️  PROBLEMAS ENCONTRADOS. Verifique os logs acima para soluções.");
    }
    
    console.log("\n=== PRÓXIMOS PASSOS ===");
    console.log("1. Se há problemas com Supabase, configure as variáveis de ambiente");
    console.log("2. Se há problemas com Storage, crie os buckets necessários");
    console.log("3. Se há problemas com RLS, configure as políticas de segurança");
    console.log("4. Se o banco funciona mas o Storage não, use fallback Base64");
}

// Exportar para uso no console do navegador
if (typeof window !== 'undefined') {
    window.debugImageSystem = {
        runCompleteDebug,
        checkSupabaseConfig,
        checkSupabaseStorage,
        testFileUpload,
        checkDatabase
    };
    
    console.log("🚀 Sistema de debug carregado!");
    console.log("Execute: debugImageSystem.runCompleteDebug() para diagnóstico completo");
}

export { runCompleteDebug, checkSupabaseConfig, checkSupabaseStorage, testFileUpload, checkDatabase };