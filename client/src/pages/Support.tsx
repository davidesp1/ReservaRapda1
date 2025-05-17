import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CustomerLayout } from '@/components/layouts/CustomerLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Mail, Phone, MessageSquare, HelpCircle } from 'lucide-react';

const SupportPage = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('contact');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Aqui você normalmente enviaria os dados para o backend
    // Em vez disso, vamos apenas mostrar um toast de sucesso
    
    toast({
      title: t('MessageSent'),
      description: t('SupportTeamWillContactYou'),
    });
    
    // Limpar o formulário
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: '',
      category: ''
    });
  };

  // FAQs comuns para o restaurante durante o evento
  const faqs = [
    {
      question: t('EventHoursQuestion'),
      answer: t('EventHoursAnswer')
    },
    {
      question: t('ReservationCancellationQuestion'),
      answer: t('ReservationCancellationAnswer')
    },
    {
      question: t('DietaryRestrictionsQuestion'),
      answer: t('DietaryRestrictionsAnswer')
    },
    {
      question: t('LargeGroupsQuestion'),
      answer: t('LargeGroupsAnswer')
    },
    {
      question: t('PaymentMethodsQuestion'),
      answer: t('PaymentMethodsAnswer')
    },
    {
      question: t('ParkingQuestion'),
      answer: t('ParkingAnswer')
    },
    {
      question: t('ChildrenMenuQuestion'),
      answer: t('ChildrenMenuAnswer')
    },
    {
      question: t('AlcoholServingQuestion'),
      answer: t('AlcoholServingAnswer')
    }
  ];

  return (
    <CustomerLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6 text-center font-montserrat">{t('Support')}</h1>
        
        <Tabs defaultValue="contact" value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <div className="flex justify-center mb-6">
            <TabsList>
              <TabsTrigger value="contact" className="flex items-center">
                <MessageSquare className="mr-2 h-4 w-4" />
                {t('ContactUs')}
              </TabsTrigger>
              <TabsTrigger value="faq" className="flex items-center">
                <HelpCircle className="mr-2 h-4 w-4" />
                {t('FAQ')}
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="contact">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('ContactInformation')}</CardTitle>
                    <CardDescription>{t('GetInTouchWithUs')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center">
                      <Phone className="mr-3 h-5 w-5 text-brasil-blue" />
                      <span>+351 964 555 123</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="mr-3 h-5 w-5 text-brasil-blue" />
                      <span>contato@opaquedeicia.pt</span>
                    </div>
                    <div className="mt-6">
                      <h3 className="font-semibold mb-2">{t('EventHours')}</h3>
                      <p className="text-sm text-gray-600">
                        {t('ConventionDates')}: 29 {t('MayShort')} - 1 {t('JuneShort')} 2025<br />
                        {t('LunchTime')}: 12:00 - 15:00<br />
                        {t('DinnerTime')}: 19:00 - 23:00
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('SendMessage')}</CardTitle>
                    <CardDescription>{t('FillFormBelow')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">{t('FirstName')}</Label>
                          <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">{t('Email')}</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="category">{t('Category')}</Label>
                        <Select 
                          value={formData.category} 
                          onValueChange={(value) => handleSelectChange('category', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('SelectCategory')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="reservation">{t('ReservationQuestion')}</SelectItem>
                            <SelectItem value="menu">{t('MenuQuestion')}</SelectItem>
                            <SelectItem value="payment">{t('PaymentQuestion')}</SelectItem>
                            <SelectItem value="event">{t('EventQuestion')}</SelectItem>
                            <SelectItem value="other">{t('OtherQuestion')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="subject">{t('Subject')}</Label>
                        <Input
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="message">{t('Message')}</Label>
                        <Textarea
                          id="message"
                          name="message"
                          rows={5}
                          value={formData.message}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </form>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={handleSubmit}
                      className="w-full bg-brasil-green text-white hover:bg-brasil-green/90"
                    >
                      {t('SendMessage')}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="faq">
            <Card>
              <CardHeader>
                <CardTitle>{t('FrequentlyAskedQuestions')}</CardTitle>
                <CardDescription>{t('FindAnswersToCommonQuestions')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left font-medium">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-600">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
              <CardFooter className="flex flex-col items-start space-y-4">
                <p className="text-sm text-gray-600">{t('MoreQuestionsText')}</p>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('contact')}
                  className="text-brasil-blue border-brasil-blue hover:bg-brasil-blue/10"
                >
                  {t('ContactSupportTeam')}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </CustomerLayout>
  );
};

export default SupportPage;