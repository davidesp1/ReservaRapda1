import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useTranslation } from 'react-i18next';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/components/layouts/AdminLayout';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const DatabaseSettingsSchema = z.object({
  supabaseUrl: z.string().url({ message: "URL inválida" }).min(1, { 
    message: "URL do Supabase é obrigatória" 
  }),
  supabaseKey: z.string().min(1, { 
    message: "Chave de API do Supabase é obrigatória" 
  }),
  databaseUrl: z.string().min(1, { 
    message: "URL de conexão do banco de dados é obrigatória" 
  }),
  databasePassword: z.string().min(1, {
    message: "Senha do banco de dados é obrigatória"
  }),
  databaseHost: z.string().min(1, {
    message: "Host do banco de dados é obrigatório"
  }),
  databasePort: z.string().min(1, {
    message: "Porta do banco de dados é obrigatória"
  }),
  databaseName: z.string().min(1, {
    message: "Nome do banco de dados é obrigatório"
  }),
  databaseUser: z.string().min(1, {
    message: "Usuário do banco de dados é obrigatório"
  }),
});

type DatabaseSettingsFormValues = z.infer<typeof DatabaseSettingsSchema>;

export default function DatabaseSettings() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>('supabase');

  const { data: dbSettings, isLoading } = useQuery({
    queryKey: ['/api/settings/database'],
    retry: false,
  });

  const updateDatabaseSettings = useMutation({
    mutationFn: async (data: DatabaseSettingsFormValues) => {
      const response = await apiRequest('PUT', '/api/settings/database', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('settings.database.success'),
        description: t('settings.database.successDescription'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings/database'] });
    },
    onError: (error) => {
      toast({
        title: t('settings.database.error'),
        description: error.message || t('settings.database.errorDescription'),
        variant: 'destructive',
      });
    },
  });

  const testConnection = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/settings/database/test', form.getValues());
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: t('settings.database.testSuccess'),
          description: t('settings.database.testSuccessDesc'),
        });
      } else {
        toast({
          title: t('settings.database.testError'),
          description: data.message || t('settings.database.testErrorDesc'),
          variant: 'destructive',
        });
      }
    },
    onError: (error) => {
      toast({
        title: t('settings.database.testError'),
        description: error.message || t('settings.database.testErrorDesc'),
        variant: 'destructive',
      });
    },
  });

  const form = useForm<DatabaseSettingsFormValues>({
    resolver: zodResolver(DatabaseSettingsSchema),
    defaultValues: {
      supabaseUrl: '',
      supabaseKey: '',
      databaseUrl: '',
      databasePassword: '',
      databaseHost: '',
      databasePort: '',
      databaseName: '',
      databaseUser: '',
    },
  });

  useEffect(() => {
    if (dbSettings) {
      form.reset({
        supabaseUrl: dbSettings.supabaseUrl || '',
        supabaseKey: dbSettings.supabaseKey || '',
        databaseUrl: dbSettings.databaseUrl || '',
        databasePassword: dbSettings.databasePassword || '',
        databaseHost: dbSettings.databaseHost || '',
        databasePort: dbSettings.databasePort || '',
        databaseName: dbSettings.databaseName || '',
        databaseUser: dbSettings.databaseUser || '',
      });
    }
  }, [dbSettings, form]);

  function onSubmit(data: DatabaseSettingsFormValues) {
    updateDatabaseSettings.mutate(data);
  }

  if (isLoading) {
    return <div className="flex justify-center p-10">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" 
      aria-label={t('common.loading')}/>
    </div>;
  }

  return (
    <AdminLayout>
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>{t('settings.database.title')}</CardTitle>
          <CardDescription>
            {t('settings.database.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Tabs 
                value={activeTab} 
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="supabase">{t('settings.database.supabaseTab')}</TabsTrigger>
                  <TabsTrigger value="connection">{t('settings.database.connectionTab')}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="supabase" className="pt-4 space-y-4">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="supabaseUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('settings.database.supabaseUrl')}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://your-project-id.supabase.co" />
                          </FormControl>
                          <FormDescription>
                            {t('settings.database.supabaseUrlDesc')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="supabaseKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('settings.database.supabaseKey')}</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" />
                          </FormControl>
                          <FormDescription>
                            {t('settings.database.supabaseKeyDesc')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="bg-blue-50 p-4 rounded-md border border-blue-200 mt-4">
                      <h3 className="font-medium text-blue-800 mb-2">
                        {t('settings.database.supabaseInstructions')}
                      </h3>
                      <ol className="list-decimal list-inside text-sm text-blue-700 space-y-2">
                        <li>{t('settings.database.supabaseStep1')}</li>
                        <li>{t('settings.database.supabaseStep2')}</li>
                        <li>{t('settings.database.supabaseStep3')}</li>
                        <li>{t('settings.database.supabaseStep4')}</li>
                        <li>{t('settings.database.supabaseStep5')}</li>
                      </ol>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="connection" className="pt-4 space-y-4">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="databaseUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('settings.database.databaseUrl')}</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} />
                          </FormControl>
                          <FormDescription>
                            {t('settings.database.databaseUrlDesc')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="databaseHost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('settings.database.databaseHost')}</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="databasePort"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('settings.database.databasePort')}</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="databaseName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('settings.database.databaseName')}</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="databaseUser"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('settings.database.databaseUser')}</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="databasePassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('settings.database.databasePassword')}</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex flex-col sm:flex-row gap-2 justify-between">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => testConnection.mutate()}
                  disabled={testConnection.isPending}
                >
                  {testConnection.isPending ? (
                    <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mr-2" />
                  ) : null}
                  {t('settings.database.testConnection')}
                </Button>
                
                <Button 
                  type="submit" 
                  disabled={updateDatabaseSettings.isPending}
                >
                  {updateDatabaseSettings.isPending ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  ) : null}
                  {t('common.save')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}