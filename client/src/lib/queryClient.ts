import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    
    // Capturar o texto da resposta primeiro para validar
    const responseText = await res.text();
    
    // Verificar se o texto parece HTML ou DOCTYPE
    if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
      console.error('Recebida resposta HTML quando esperava JSON');
      return [];  // Retornar array vazio para arrays ou objeto vazio para objetos
    }
    
    // Se não for JSON válido ou estiver vazio, retornar valor seguro
    if (!responseText.trim() || 
        (!responseText.trim().startsWith('{') && 
         !responseText.trim().startsWith('['))) {
      console.error('Resposta não é JSON válido:', responseText.substring(0, 100));
      return responseText.trim().startsWith('[') ? [] : {};
    }
    
    try {
      // Agora é seguro parsear como JSON
      return JSON.parse(responseText);
    } catch (error) {
      console.error('Erro ao parsear JSON:', error);
      // Retornar valor seguro baseado no início do texto
      return responseText.trim().startsWith('[') ? [] : {};
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
      staleTime: 30000, // 30 segundos antes de considerar dados obsoletos
      retry: 1,
      retryDelay: 3000,
    },
    mutations: {
      retry: 1,
    },
  },
});
