import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/components/layouts/AdminLayout';
import { apiRequest } from '@/lib/queryClient';

// Form schema
const formSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  firstName: z.string().min(1, { message: 'First name is required' }),
  lastName: z.string().min(1, { message: 'Last name is required' }),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  birthDate: z.string().optional(),
  biography: z.string().optional(),
  dietaryRestrictions: z.string().optional(),
  allergies: z.string().optional(),
  preferredCuisine: z.string().optional(),
  seatingPreference: z.string().optional(),
  isAdmin: z.boolean().default(false),
  preferredLanguage: z.string().default('pt'),
});

type FormValues = z.infer<typeof formSchema>;

const CustomersAdd: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isAdmin } = useAuth();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      address: '',
      city: '',
      country: '',
      postalCode: '',
      birthDate: '',
      biography: '',
      dietaryRestrictions: '',
      allergies: '',
      preferredCuisine: '',
      seatingPreference: '',
      isAdmin: false,
      preferredLanguage: 'pt',
    },
  });

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    try {
      const response = await apiRequest('POST', '/api/auth/register', data);
      
      if (response.ok) {
        toast({
          title: t('Success'),
          description: t('CustomerAddedSuccessfully'),
        });
        // Redirect to customers list
        setLocation('/admin/customers');
      } else {
        const errorData = await response.json();
        toast({
          variant: 'destructive',
          title: t('Error'),
          description: errorData.message || t('FailedToAddCustomer'),
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('Error'),
        description: t('FailedToAddCustomer'),
      });
    }
  };

  return (
    <AdminLayout title={t('AddNewCustomer')}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-montserrat font-bold">{t('AddNewCustomer')}</h1>
        <Button 
          variant="outline" 
          onClick={() => setLocation('/admin/customers')}
        >
          {t('Back')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('CustomerInformation')}</CardTitle>
          <CardDescription>{t('FillCustomerDetails')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Account Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">{t('AccountInformation')}</h3>
                  
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('Username')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('EnterUsername')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('Email')}</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder={t('EnterEmail')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('Password')}</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder={t('EnterPassword')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isAdmin"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>{t('AdminPrivileges')}</FormLabel>
                          <FormDescription>
                            {t('GrantAdminAccess')}
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="preferredLanguage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('PreferredLanguage')}</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('SelectLanguage')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pt">Português</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Español</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">{t('PersonalInformation')}</h3>
                  
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('FirstName')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('EnterFirstName')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('LastName')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('EnterLastName')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('Phone')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('EnterPhone')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('BirthDate')}</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t('AddressInformation')}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('Address')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('EnterAddress')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('City')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('EnterCity')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('Country')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('EnterCountry')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('PostalCode')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('EnterPostalCode')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              {/* Preferences & Additional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t('PreferencesAndNotes')}</h3>
                
                <FormField
                  control={form.control}
                  name="biography"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Biography')}</FormLabel>
                      <FormControl>
                        <Textarea placeholder={t('EnterBiography')} className="min-h-[100px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dietaryRestrictions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('DietaryRestrictions')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('EnterDietaryRestrictions')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="allergies"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('Allergies')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('EnterAllergies')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="preferredCuisine"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('PreferredCuisine')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('EnterPreferredCuisine')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="seatingPreference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('SeatingPreference')}</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('SelectSeatingPreference')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="window">Window</SelectItem>
                            <SelectItem value="terrace">Terrace</SelectItem>
                            <SelectItem value="bar">Bar</SelectItem>
                            <SelectItem value="quiet">Quiet Area</SelectItem>
                            <SelectItem value="any">No Preference</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  type="button"
                  onClick={() => setLocation('/admin/customers')}
                >
                  {t('Cancel')}
                </Button>
                <Button 
                  type="submit" 
                  className="bg-brasil-green text-white hover:bg-brasil-green/90"
                >
                  {t('SaveCustomer')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default CustomersAdd;