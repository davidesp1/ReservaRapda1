import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// This is a simplified implementation of i18n
// In a real app, translations would be in separate files

const resources = {
  pt: {
    translation: {
      // Header
      Home: "Início",
      About: "Sobre",
      Menu: "Menu",
      ContactHeader: "Contato",
      Login: "Entrar",
      Register: "Cadastrar",

      // Hero
      FlavorsOfBrazil: "Sabores do Brasil na Convenção MSBN Europa",
      AuthenticCuisine:
        "O restaurante Opa que delicia traz a autêntica culinária brasileira para Convenção MSBN Europa",
      BookNow: "Faça já sua reserva!",

      // About
      AboutUs: "Sobre o Opa que delícia!",
      AboutText1:
        "Nascido no Carregado com a missão de trazer a autêntica culinária brasileira para Portugal, o Opa que delícia! encanta os clientes com sabores genuínos e ambiente acolhedor.",
      AboutText2:
        "Para a Convenção MSBN Europa 2025, estamos orgulhosos de anunciar nossa parceria especial com a MSBN Portugal, trazendo o melhor da gastronomia brasileira para este evento único.",
      SpecialPartnership: "Parceria Especial",
      PartnershipText:
        "Estamos orgulhosos em fazer parte da Convenção MSBN Europa 2025, trazendo sabores brasileiros autênticos para todos os participantes deste evento inesquecível.",

      // Menu
      SpecialMenu: "Menu Especial para o Evento",
      ExclusiveSelection: "Seleção exclusiva para a Convenção MSBN Europa",
      Appetizers: "Entradas",
      MainDishes: "Pratos Principais",
      Desserts: "Sobremesas",
      Drinks: "Bebidas",
      ViewFullMenu: "Ver Menu Completo",
      All: "Todos",
      SpiceLevel: "Nível de Picante",
      NoItemsInCategory: "Não há itens nesta categoria",
      ViewAllItems: "Ver todos os itens",
      ErrorLoadingMenu:
        "Ocorreu um erro ao carregar o menu. Por favor, tente novamente.",

      // Testimonials
      CustomerSay: "O que Nossos Clientes Dizem",
      SinceYear: "Cliente desde",

      // Location
      LocationContact: "Localização e Contato",
      EventInfo: "Informações do Evento",
      Address: "Endereço",
      EventDate: "Data do Evento",
      Hours: "Horário de Funcionamento",
      ContactInfo: "Contato",
      WhatsAppContact: "Fale conosco no WhatsApp",

      // CTA
      EnjoyBrazil: "Venha Desfrutar da Autêntica Gastronomia Brasileira!",
      GuaranteeTable:
        "Garanta já sua mesa e experimente os sabores que fazem do Brasil um país tão especial. Faça sua reserva agora e assegure uma experiência gastronômica única durante a Convenção MSBN Europa!",
      BookNowCTA: "Reservar Agora",

      // Footer
      QuickLinks: "Links Rápidos",
      Languages: "Idiomas",
      Newsletter: "Newsletter",
      YourEmail: "Seu email",
      AllRightsReserved: "Todos os direitos reservados",
      PrivacyPolicy: "Política de Privacidade",
      TermsOfUse: "Termos de Uso",

      // Auth
      AccessAccount: "Acessar Conta",
      CreateAccount: "Criar uma conta",
      Email: "Email",
      Password: "Senha",
      ConfirmPassword: "Confirmar Senha",
      ForgotPassword: "Esqueceu a senha?",
      AlreadyHaveAccount: "Já tem uma conta?",
      DontHaveAccount: "Não tem uma conta?",
      FirstName: "Nome",
      LastName: "Sobrenome",
      Phone: "Telefone",
      AgreeTerms: "Concordo com os",
      TermsAndPolicy: "Termos de Uso e Política de Privacidade",

      // Dashboard
      Dashboard: "Dashboard",
      Profile: "Perfil",
      Reservations: "Reservas",
      Payments: "Pagamentos",
      Support: "Suporte",
      Logout: "Sair",
      Hello: "Olá",
      Client: "Cliente",
      Guest: "Convidado",
      CustomerSince: "Cliente desde",
      WelcomeToOpaQueDelicia: "Bem-vindo ao Opa que delicia!",
      AuthenticBrazilianCuisineWaitingForYou:
        "Sabores autênticos da culinária brasileira esperando por você.",
      MakeReservation: "Fazer Reserva",
      YourUpcomingReservations: "Suas Próximas Reservas",
      NoUpcomingReservations: "Não há reservas futuras",
      NoReservationsToday: "Não há reservas para hoje",
      NoReservationsFound: "Nenhuma reserva encontrada",
      TodaysReservations: "Reservas de Hoje",
      TimeAgo: "{{time}} {{unit}} atrás",
      Minutes: "minutos",
      HoursUnit: "horas",
      BookTable: "Reservar Mesa",
      ViewAllReservations: "Ver todas reservas",
      ViewAll: "Ver tudo",
      SpecialOffers: "Promoções Especiais",
      ViewPromotions: "Ver Promoções",
      MenuHighlights: "Destaques do Cardápio",
      POPULAR: "POPULAR",
      AddToOrder: "Adicionar",
      people: "pessoas",
      People: "Pessoas",
      Dinner: "Jantar",
      Details: "Detalhes",
      Table: "Mesa",

      // Admin
      AdminPanel: "Painel Administrativo",
      Customers: "Clientes",
      MenuManagement: "Gestão do Menu",
      Tables: "Mesas",
      Finance: "Finanças",
      Reports: "Relatórios",
      Settings: "Configurações",

      // Stats
      TodayReservations: "Reservas Hoje",
      CancelledReservations: "Reservas Canceladas",
      TotalCustomers: "Total de Clientes",
      DailyRevenue: "Receita Diária",
      WeeklyReservations: "Reservas na Semana",
      PopularItems: "Pratos Populares",
      PendingPayments: "Pagamentos Pendentes",
      ExportReports: "Exportar Relatórios",
      GenerateAndDownloadReports: "Gere e baixe relatórios em PDF ou Excel",
      ReportType: "Tipo de Relatório",
      ExportFormat: "Formato de Exportação",
      SelectReportType: "Selecione o tipo de relatório",
      SelectExportFormat: "Selecione o formato de exportação",
      StartDate: "Data de Início",
      EndDate: "Data de Fim",
      ExportReport: "Exportar Relatório",
      Exporting: "Exportando",
      ReportExported: "Relatório Exportado",
      ReportExportedSuccessfully: "Relatório exportado com sucesso",
      ReportExportError: "Erro na Exportação",
      ErrorExportingReport: "Ocorreu um erro ao exportar o relatório",
      InvalidDates: "Datas Inválidas",
      PleaseSelectValidDates: "Por favor, selecione datas válidas",
      SelectDate: "Selecione uma data",
      ReservationsReport: "Relatório de Reservas",
      SalesReport: "Relatório de Vendas",
      CustomersReport: "Relatório de Clientes",
      MenuPerformanceReport: "Relatório de Desempenho do Menu",
      Performance: "Desempenho",
      Last7Days: "Últimos 7 dias",
      Last30Days: "Últimos 30 dias",
      ThisYear: "Este ano",
      AlertsNotifications: "Alertas e Notificações",
      LowInventory: "Estoque Baixo",
      LowInventoryItems: "Alguns itens estão com estoque baixo",
      VIPReservation: "Reserva VIP",
      VIPConfirmedTonight: "Cliente VIP confirmado para hoje à noite",
      ago: "atrás",

      // Forms
      Save: "Salvar",
      Cancel: "Cancelar",
      Delete: "Excluir",
      Edit: "Editar",
      Add: "Adicionar",
      Search: "Buscar",
      Filter: "Filtrar",
      List: "Lista",
      Layout: "Layout",
      RestaurantLayout: "Layout do Restaurante",
      VisualRepresentationOfTables: "Representação visual das mesas",
      Legend: "Legenda",
      Date: "Data",
      Time: "Hora",
      PartySize: "Número de Pessoas",
      TableNumber: "Número da Mesa",
      Status: "Status",
      Amount: "Valor",
      PaymentMethod: "Método de Pagamento",
      Notes: "Observações",
      Submit: "Enviar",

      // User Profile
      City: "Cidade",
      PostalCode: "Código Postal",
      Country: "País",
      Biography: "Biografia",
      MemberSince: "Membro desde",
      LoyaltyPoints: "Pontos de Fidelidade",
      PersonalInformation: "Informações Pessoais",
      ManageYourPersonalDetails: "Gerencie suas informações pessoais",
      PreferredLanguage: "Idioma Preferido",
      EditProfile: "Editar Perfil",

      // Dietary Preferences
      DietaryPreferences: "Preferências Alimentares",
      Vegetarian: "Vegetariano",
      Vegan: "Vegano",
      Glutenfree: "Sem Glúten",
      Lactosefree: "Sem Lactose",
      Pescatarian: "Pescetariano",
      Halal: "Halal",
      Kosher: "Kosher",
      None: "Nenhuma",
      Allergies: "Alergias",
      SpicePreference: "Preferência de Tempero",
      Mild: "Suave",
      Medium: "Médio",
      Hot: "Picante",
      PreferredSeating: "Assento Preferido",
      Indoor: "Interior",
      Outdoor: "Exterior",
      NoPreference: "Sem Preferência",
      NotificationPreferences: "Preferências de Notificação",

      // Reservation
      Duration: "Duração",
      ReservationHours: "horas",
      DurationDescription: "Tempo previsto para sua reserva",
      SelectDuration: "Selecione a duração",
      Occasion: "Ocasião",
      SelectOccasion: "Selecione a ocasião",
      Birthday: "Aniversário",
      Anniversary: "Aniversário de Casamento",
      BusinessMeeting: "Reunião de Negócios",
      DateNight: "Encontro Romântico",
      Other: "Outra",
      OccasionDescription: "Ocasião especial para sua visita",
      DietaryRequirements: "Requisitos Alimentares",
      DietaryRequirementsPlaceholder:
        "Descreva quaisquer requisitos alimentares especiais",
      DietaryRequirementsDescription:
        "Informe-nos sobre qualquer restrição alimentar",
      SpecialRequests: "Pedidos Especiais",
      EnterSpecialRequests: "Digite seus pedidos especiais",
      SpecialRequestsDescription:
        "Informe-nos sobre qualquer solicitação especial",
      ConfirmReservation: "Confirmar Reserva",

      // Errors
      Error: "Erro",
      NotFound: "Página não encontrada",
      ServerError: "Erro do servidor",
      ValidationError: "Erro de validação",
      TryAgain: "Tente novamente",
      GoBack: "Voltar",
      GoHome: "Ir para o início",

      // Support
      ContactUs: "Contate-nos",
      FAQ: "Perguntas Frequentes",
      ContactInformation: "Informações de Contato",
      GetInTouchWithUs: "Entre em contato conosco",
      SendMessage: "Enviar Mensagem",
      FillFormBelow: "Preencha o formulário abaixo",
      Subject: "Assunto",
      Message: "Mensagem",
      Category: "Categoria",
      SelectCategory: "Selecione uma categoria",
      ReservationQuestion: "Dúvida sobre Reserva",
      MenuQuestion: "Dúvida sobre o Menu",
      PaymentQuestion: "Dúvida sobre Pagamento",
      EventQuestion: "Dúvida sobre o Evento",
      OtherQuestion: "Outra Dúvida",
      MessageSent: "Mensagem Enviada",
      SupportTeamWillContactYou:
        "Nossa equipe de suporte entrará em contato com você em breve.",
      FrequentlyAskedQuestions: "Perguntas Frequentes",
      FindAnswersToCommonQuestions: "Encontre respostas para perguntas comuns",
      MoreQuestionsText:
        "Ainda tem perguntas? Nossa equipe está pronta para ajudar.",
      ContactSupportTeam: "Contatar Equipe de Suporte",
      EventHours: "Horário do Evento",
      ConventionDates: "Datas da Convenção",
      MayShort: "Mai",
      JuneShort: "Jun",
      LunchTime: "Almoço",
      DinnerTime: "Jantar",
      EventHoursQuestion:
        "Quais são os horários de funcionamento do restaurante durante o evento?",
      EventHoursAnswer:
        "O restaurante estará aberto durante todos os dias do evento (29 de maio a 1 de junho de 2025). Servimos almoço das 12h às 15h e jantar das 19h às 23h.",
      ReservationCancellationQuestion:
        "Como posso cancelar ou modificar minha reserva?",
      ReservationCancellationAnswer:
        "Você pode cancelar ou modificar sua reserva através da seção 'Reservas' em seu painel do cliente até 24 horas antes do horário reservado. Para alterações em um prazo menor, entre em contato diretamente com nossa equipe.",
      DietaryRestrictionsQuestion:
        "Vocês acomodam restrições alimentares especiais?",
      DietaryRestrictionsAnswer:
        "Sim! Temos opções vegetarianas, veganas, sem glúten e sem lactose em nosso cardápio. Recomendamos informar suas restrições alimentares no momento da reserva para que possamos preparar sua experiência da melhor forma possível.",
      LargeGroupsQuestion: "É possível fazer reservas para grupos grandes?",
      LargeGroupsAnswer:
        "Sim, podemos acomodar grupos de até 20 pessoas. Para grupos maiores, recomendamos entrar em contato com antecedência para garantir que possamos oferecer o melhor serviço.",
      PaymentMethodsQuestion: "Quais métodos de pagamento são aceitos?",
      PaymentMethodsAnswer:
        "Aceitamos cartões de crédito/débito, MBWay, Multibanco e transferências bancárias. Lamentamos informar que não aceitamos cheques.",
      ParkingQuestion: "Há estacionamento disponível próximo ao local?",
      ParkingAnswer:
        "Sim, há estacionamento disponível no local do evento. Também existem opções de estacionamento público nas proximidades.",
      ChildrenMenuQuestion: "Vocês têm menu infantil?",
      ChildrenMenuAnswer:
        "Sim, oferecemos opções especiais para crianças com porções adequadas e sabores que agradam aos pequenos.",
      AlcoholServingQuestion: "Vocês servem bebidas alcoólicas?",
      AlcoholServingAnswer:
        "Sim, temos uma seleção de vinhos portugueses e brasileiros, além de caipirinhas tradicionais e outras bebidas alcoólicas. Lembramos que servimos apenas para maiores de 18 anos.",

      // Payment
      SelectPaymentMethod: "Selecione o método de pagamento",
      PaymentAmount: "Valor a pagar",
      PaymentSettings: "Configurações de Pagamento",
      ManageAvailablePaymentMethods:
        "Gerencie os métodos de pagamento disponíveis",
      ProcessedByStripe: "Processado por Stripe",
      ProcessedByEuPago: "Processado por EuPago",
      ManualVerification: "Verificação manual",
      PaidAtRestaurant: "Pago no restaurante",
      HideSettings: "Ocultar Configurações",
      ManageYourPaymentPreferences: "Gerencie suas preferências de pagamento",
      DefaultPaymentMethods: "Métodos de Pagamento Padrão",
      Default: "Padrão",
      ExpiresOn: "Expira em",
      Remove: "Remover",
      MakeDefault: "Tornar Padrão",
      AddPaymentMethod: "Adicionar Método de Pagamento",
      BillingInformation: "Informações de Cobrança",
      BillingName: "Nome para Cobrança",
      BillingAddress: "Endereço de Cobrança",
      BillingEmail: "Email de Cobrança",
      Preferences: "Preferências",
      AutomaticReceipts: "Recibos Automáticos",
      AutomaticReceiptsDescription:
        "Enviar recibos automaticamente para seu email após cada pagamento",
      PaymentNotifications: "Notificações de Pagamento",
      PaymentMethods: "Métodos de Pagamento",
      AcceptCard: "Aceitar Cartão de Crédito/Débito",
      AcceptMBWay: "Aceitar MBWay",
      AcceptMultibanco: "Aceitar Multibanco",
      AcceptBankTransfer: "Aceitar Transferência Bancária",
      AcceptCash: "Aceitar Dinheiro",
      RequirePrepayment: "Exigir Pré-pagamento",
      RequirePrepaymentsForReservations: "Exigir pagamento antecipado para reservas",
      PaymentGatewaySettings: "Configurações do Gateway de Pagamento",
      PaymentSettingsDescription: "Configure os métodos de pagamento disponíveis e as configurações da API do EuPago",
      SettingsSaved: "Configurações salvas",
      PaymentSettingsSavedDescription: "As configurações de pagamento foram atualizadas com sucesso",
      SettingsSaveError: "Erro ao salvar configurações",
      SettingsSaveErrorDescription: "Houve um erro ao salvar as configurações de pagamento",
      Saving: "Salvando...",
      OnlyVisibleToAdmin: "Visível apenas para administradores e no POS",
      CashPaymentVisibleOnlyToAdmin: "Pagamentos em dinheiro são visíveis apenas para administradores e no modo POS, nunca expostos como opção ao cliente.",
      ImportantNote: "Nota Importante",
      EuPagoAPIKey: "Chave API do EuPago",
      EuPagoAPIKeyDescription: "Chave de API para o serviço de pagamento EuPago. Esta informação é sensível e deve ser mantida segura.",
      PaymentSettingsDescription: "Configure os métodos de pagamento disponíveis e as integrações de serviços de pagamento.",
      Currency: "Moeda",
      SelectCurrency: "Selecione a moeda",
      TaxRate: "Taxa de Imposto",
      PercentageValue: "Valor em percentagem (%)",
      PaymentNotificationsDescription:
        "Receber notificações sobre pagamentos e status de transações",
      SavePaymentMethods: "Salvar Métodos de Pagamento",
      SavePaymentMethodsDescription:
        "Guardar informações de pagamento para uso futuro",
      SaveSettings: "Salvar Configurações",
      DateNewest: "Data (mais recente)",
      DateOldest: "Data (mais antigo)",
      AmountHighest: "Valor (maior)",
      AmountLowest: "Valor (menor)",
      NoPaymentsFound: "Nenhum pagamento encontrado",
      NoPaymentsMatchingSearch:
        "Nenhum pagamento correspondente à sua pesquisa",
      NoPaymentsMessage: "Você ainda não realizou nenhum pagamento",
      ClearSearch: "Limpar pesquisa",
      Receipt: "Recibo",
      Generate: "Gerar",
      CopyDetails: "Copiar Detalhes",
      Card: "Cartão",
      Multibanco: "Multibanco",
      Transfer: "Transferência",
      Pay: "Pagar",
      Processing: "Processando",
      PaymentTimeout: "Tempo Expirado",
      PaymentTimeoutDescription:
        "O tempo para pagamento expirou. Por favor, faça uma nova reserva.",
      ReservationPending: "Reserva Pendente",
      ReservationPendingDescription:
        "Sua reserva está pendente de confirmação de pagamento.",
      MultibancoCTA:
        "Use estes dados para realizar o pagamento através do Multibanco ou aplicativo bancário.",
      PaymentPendingApproval: "Pagamento pendente de aprovação",
      TimeRemaining: "Tempo restante",
      PaymentConfirmed: "Pagamento Confirmado",
      PaymentConfirmedDescription: "Seu pagamento foi confirmado com sucesso.",
      Reference: "Referência",
      ExpirationDate: "Data de Expiração",
      PendingTransaction: "Transação pendente",
      MultibancoPay: "Pagar com Multibanco",
      ReservationQRCode: "QR Code da Reserva",
      ReservationBarcode: "Código de Barras da Reserva",
      MultibancoPaymentDescription:
        "Faça o pagamento usando os dados abaixo no Multibanco ou aplicativo bancário.",
      MultibancoPaymentDetails: "Detalhes do Pagamento Multibanco",
      CardPaymentRedirect:
        "Você será redirecionado para a página de pagamento seguro.",
      PhoneNumber: "Número de telefone",
      MBWayInstructions:
        "Você receberá uma notificação no seu aplicativo MBWay para confirmar o pagamento.",
      MultibancoInstructions:
        "Você receberá os detalhes para pagamento no Multibanco.",
      TransferInstructions:
        "Você receberá os detalhes para transferência bancária.",
      PaymentInitiated: "Pagamento iniciado",
      PaymentInitiatedDescription: "O seu pagamento foi iniciado com sucesso.",
      MBWayPaymentInitiated: "Pagamento MBWay iniciado",
      CheckYourMobilePhone:
        "Verifique o seu telemóvel para confirmar o pagamento.",
      PaymentError: "Erro no pagamento",
      PaymentProcessingError: "Ocorreu um erro ao processar o pagamento.",
      ValidPhoneNumberRequired: "É necessário um número de telefone válido.",
      PaymentDetails: "Detalhes do pagamento",
      Entity: "Entidade",
      BankName: "Banco",
      IBAN: "IBAN",
      ImportantInformation: "Informação importante",
      MultibancoInstruction1:
        "Utilize o Multibanco ou app bancária para efetuar o pagamento.",
      MultibancoInstruction2:
        "Use a entidade e referência exatamente como mostrado.",
      TransferInstruction1: "Faça a transferência para a conta indicada.",
      TransferInstruction2:
        "Inclua a referência no campo de descrição da transferência.",
      ValidFor: "Válido por",
      Days: "dias",
      BankTransfer: "Transferência Bancária",
      CopiedToClipboard: "Copiado para a área de transferência",
      RefreshStatus: "Atualizar status",
      BackToReservations: "Voltar para reservas",
      PaymentSuccessful: "Pagamento bem-sucedido",
      PaymentSuccessfulDescription:
        "O seu pagamento foi processado com sucesso.",
      ThankYouForYourOrder: "Obrigado pelo seu pedido.",
      ReservationConfirmationInfo:
        "A sua reserva está confirmada. Pode ver os detalhes na sua página de reservas.",
      ViewReservations: "Ver reservas",
      PaymentCancelled: "Pagamento cancelado",
      PaymentCancelledDescription: "O seu pagamento foi cancelado.",
      NoChargesMade: "Nenhum valor foi cobrado.",
      TryAgainInstructions:
        "Você pode tentar novamente ou escolher outro método de pagamento.",
      Completed: "Concluído",
      Pending: "Pendente",
      Failed: "Falhou",
      Paid: "Pago",
      ExpiresIn: "Expira em",
      PaymentExpired: "Pagamento expirado",
      Barcode: "Código de barras",
      PaymentNotFound: "Pagamento não encontrado",
      PaymentNotFoundDescription:
        "Não foi possível encontrar os detalhes deste pagamento.",
    },
  },
  en: {
    translation: {
      // Header
      Home: "Home",
      About: "About",
      Menu: "Menu",
      ContactHeader: "Contact",
      Login: "Login",
      Register: "Sign Up",

      // Hero
      FlavorsOfBrazil: "Flavors of Brazil at MSBN Europe Convention",
      AuthenticCuisine:
        "The restaurant Opa que delicia brings authentic Brazilian cuisine to the MSBN Europe Convention",
      BookNowHero: "Book your table now!",

      // About
      AboutUs: "About Opa que delícia!",
      AboutText1:
        "Born in Carregado with the mission of bringing authentic Brazilian cuisine to Portugal, Opa que delícia! delights customers with genuine flavors and a welcoming atmosphere.",
      AboutText2:
        "For the MSBN Europe Convention 2025, we are proud to announce our special partnership with MSBN Portugal, bringing the best of Brazilian gastronomy to this unique event.",
      SpecialPartnership: "Special Partnership",
      PartnershipText:
        "We are proud to be part of the MSBN Europe Convention 2025, bringing authentic Brazilian flavors to all participants of this unforgettable event.",

      // Menu
      SpecialMenu: "Special Menu for the Event",
      ExclusiveSelection: "Exclusive selection for the MSBN Europe Convention",
      Appetizers: "Appetizers",
      MainDishes: "Main Dishes",
      Desserts: "Desserts",
      Drinks: "Drinks",
      ViewFullMenu: "View Full Menu",
      All: "All",
      SpiceLevel: "Spice Level",
      NoItemsInCategory: "No items in this category",
      ViewAllItems: "View all items",
      ErrorLoadingMenu:
        "An error occurred while loading the menu. Please try again.",

      // Testimonials
      CustomerSay: "What Our Customers Say",
      SinceYear: "Customer since",

      // Location
      LocationContact: "Location and Contact",
      EventInfo: "Event Information",
      Address: "Address",
      EventDate: "Event Date",
      Hours: "Opening Hours",
      ContactInfo: "Contact",
      WhatsAppContact: "Contact us on WhatsApp",

      // CTA
      EnjoyBrazil: "Come Enjoy Authentic Brazilian Gastronomy!",
      GuaranteeTable:
        "Reserve your table and experience the flavors that make Brazil such a special country. Book now and ensure a unique gastronomic experience during the MSBN Europe Convention!",
      BookNowCTA: "Book Now",

      // Footer
      QuickLinks: "Quick Links",
      Languages: "Languages",
      Newsletter: "Newsletter",
      YourEmail: "Your email",
      AllRightsReserved: "All rights reserved",
      PrivacyPolicy: "Privacy Policy",
      TermsOfUse: "Terms of Use",

      // Auth
      AccessAccount: "Access Account",
      CreateAccount: "Create an account",
      Email: "Email",
      Password: "Password",
      ConfirmPassword: "Confirm Password",
      ForgotPassword: "Forgot password?",
      AlreadyHaveAccount: "Already have an account?",
      DontHaveAccount: "Don't have an account?",
      FirstName: "First Name",
      LastName: "Last Name",
      Phone: "Phone",
      AgreeTerms: "I agree to the",
      TermsAndPolicy: "Terms of Use and Privacy Policy",

      // Dashboard
      Dashboard: "Dashboard",
      Profile: "Profile",
      Reservations: "Reservations",
      Payments: "Payments",
      Support: "Support",
      Logout: "Logout",
      Hello: "Hello",
      Client: "Client",
      CustomerSince: "Customer since",
      WelcomeToOpaQueDelicia: "Welcome to Opa que delicia!",
      AuthenticBrazilianCuisineWaitingForYou:
        "Authentic Brazilian cuisine flavors waiting for you.",
      MakeReservation: "Make a Reservation",
      YourUpcomingReservations: "Your Upcoming Reservations",
      NoUpcomingReservations: "No upcoming reservations",
      NoReservationsToday: "No reservations for today",
      NoReservationsFound: "No reservations found",
      TodaysReservations: "Today's Reservations",
      Minutes: "minutes",
      HoursUnit: "hours",
      ago: "ago",
      BookTable: "Book a Table",
      ViewAllReservations: "View all reservations",
      ViewAll: "View all",
      SpecialOffers: "Special Offers",
      ViewPromotions: "View Promotions",
      MenuHighlights: "Menu Highlights",
      POPULAR: "POPULAR",
      AddToOrder: "Add to Order",
      people: "people",
      People: "People",
      Dinner: "Dinner",
      Details: "Details",
      Table: "Table",
      Guest: "Guest",
      Performance: "Performance",
      Last7Days: "Last 7 days",
      Last30Days: "Last 30 days",
      ThisYear: "This year",
      AlertsNotifications: "Alerts & Notifications",
      LowInventory: "Low Inventory",
      LowInventoryItems: "Some items are running low on inventory",
      VIPReservation: "VIP Reservation",
      VIPConfirmedTonight: "VIP customer confirmed for tonight",

      // Admin
      AdminPanel: "Admin Panel",
      Customers: "Customers",
      MenuManagement: "Menu Management",
      Tables: "Tables",
      Finance: "Finance",
      Reports: "Reports",
      Settings: "Settings",

      // Stats
      TodayReservations: "Today's Reservations",
      CancelledReservations: "Cancelled Reservations",
      TotalCustomers: "Total Customers",
      DailyRevenue: "Daily Revenue",
      WeeklyReservations: "Weekly Reservations",
      PopularItems: "Popular Items",
      PendingPayments: "Pending Payments",

      // Forms
      Save: "Save",
      Cancel: "Cancel",
      Delete: "Delete",
      Edit: "Edit",
      Add: "Add",
      Search: "Search",
      Filter: "Filter",
      List: "List",
      Layout: "Layout",
      RestaurantLayout: "Restaurant Layout",
      VisualRepresentationOfTables: "Visual representation of tables",
      Legend: "Legend",
      Date: "Date",
      Time: "Time",
      PartySize: "Party Size",
      TableNumber: "Table Number",
      Status: "Status",
      Amount: "Amount",
      PaymentMethod: "Payment Method",
      Notes: "Notes",
      Submit: "Submit",

      // User Profile
      City: "City",
      PostalCode: "Postal Code",
      Country: "Country",
      Biography: "Biography",
      MemberSince: "Member since",
      LoyaltyPoints: "Loyalty Points",
      PersonalInformation: "Personal Information",
      ManageYourPersonalDetails: "Manage your personal details",
      PreferredLanguage: "Preferred Language",
      EditProfile: "Edit Profile",

      // Dietary Preferences
      DietaryPreferences: "Dietary Preferences",
      Vegetarian: "Vegetarian",
      Vegan: "Vegan",
      Glutenfree: "Gluten-free",
      Lactosefree: "Lactose-free",
      Pescatarian: "Pescatarian",
      Halal: "Halal",
      Kosher: "Kosher",
      None: "None",
      Allergies: "Allergies",
      SpicePreference: "Spice Preference",
      Mild: "Mild",
      Medium: "Medium",
      Hot: "Hot",
      PreferredSeating: "Preferred Seating",
      Indoor: "Indoor",
      Outdoor: "Outdoor",
      NoPreference: "No Preference",
      NotificationPreferences: "Notification Preferences",

      // Reservation
      Duration: "Duration",
      ReservationHours: "hours",
      DurationDescription: "Expected time for your reservation",
      SelectDuration: "Select duration",
      Occasion: "Occasion",
      SelectOccasion: "Select occasion",
      Birthday: "Birthday",
      Anniversary: "Anniversary",
      BusinessMeeting: "Business Meeting",
      DateNight: "Date Night",
      Other: "Other",
      OccasionDescription: "Special occasion for your visit",
      DietaryRequirements: "Dietary Requirements",
      DietaryRequirementsPlaceholder:
        "Describe any special dietary requirements",
      DietaryRequirementsDescription:
        "Let us know about any dietary restrictions",
      SpecialRequests: "Special Requests",
      EnterSpecialRequests: "Enter your special requests",
      SpecialRequestsDescription: "Let us know about any special requests",
      ConfirmReservation: "Confirm Reservation",

      // Errors
      Error: "Error",
      NotFound: "Page not found",
      ServerError: "Server error",
      ValidationError: "Validation error",
      TryAgain: "Try again",
      GoBack: "Go back",
      GoHome: "Go home",

      // Support
      ContactUs: "Contact Us",
      FAQ: "Frequently Asked Questions",
      ContactInformation: "Contact Information",
      GetInTouchWithUs: "Get in touch with us",
      SendMessage: "Send Message",
      FillFormBelow: "Fill in the form below",
      Subject: "Subject",
      Message: "Message",
      Category: "Category",
      SelectCategory: "Select a category",
      ReservationQuestion: "Reservation Question",
      MenuQuestion: "Menu Question",
      PaymentQuestion: "Payment Question",
      EventQuestion: "Event Question",
      OtherQuestion: "Other Question",
      MessageSent: "Message Sent",
      SupportTeamWillContactYou: "Our support team will contact you shortly.",
      FrequentlyAskedQuestions: "Frequently Asked Questions",
      FindAnswersToCommonQuestions: "Find answers to common questions",
      MoreQuestionsText: "Still have questions? Our team is ready to help.",
      ContactSupportTeam: "Contact Support Team",
      EventHours: "Event Hours",
      ConventionDates: "Convention Dates",
      MayShort: "May",
      JuneShort: "Jun",
      LunchTime: "Lunch",
      DinnerTime: "Dinner",
      EventHoursQuestion:
        "What are the restaurant's operating hours during the event?",
      EventHoursAnswer:
        "The restaurant will be open throughout the event (May 29 to June 1, 2025). We serve lunch from 12pm to 3pm and dinner from 7pm to 11pm.",
      ReservationCancellationQuestion:
        "How can I cancel or modify my reservation?",
      ReservationCancellationAnswer:
        "You can cancel or modify your reservation through the 'Reservations' section in your customer dashboard up to 24 hours before your reserved time. For changes within a shorter timeframe, please contact our team directly.",
      DietaryRestrictionsQuestion:
        "Do you accommodate special dietary restrictions?",
      DietaryRestrictionsAnswer:
        "Yes! We have vegetarian, vegan, gluten-free, and lactose-free options on our menu. We recommend informing us of your dietary restrictions at the time of booking so we can prepare your experience in the best possible way.",
      LargeGroupsQuestion:
        "Is it possible to make reservations for large groups?",
      LargeGroupsAnswer:
        "Yes, we can accommodate groups of up to 20 people. For larger groups, we recommend contacting us in advance to ensure we can provide the best service.",
      PaymentMethodsQuestion: "What payment methods are accepted?",
      PaymentMethodsAnswer:
        "We accept credit/debit cards, MBWay, Multibanco, and bank transfers. We regret to inform that we do not accept checks.",
      ParkingQuestion: "Is there parking available near the venue?",
      ParkingAnswer:
        "Yes, there is parking available at the event venue. There are also public parking options nearby.",
      ChildrenMenuQuestion: "Do you have a children's menu?",
      ChildrenMenuAnswer:
        "Yes, we offer special options for children with appropriate portions and flavors that appeal to the little ones.",
      AlcoholServingQuestion: "Do you serve alcoholic beverages?",
      AlcoholServingAnswer:
        "Yes, we have a selection of Portuguese and Brazilian wines, as well as traditional caipirinhas and other alcoholic beverages. We remind you that we only serve to those over 18 years of age.",

      // Payment
      SelectPaymentMethod: "Select payment method",
      PaymentAmount: "Payment amount",
      Card: "Card",
      Multibanco: "Multibanco",
      Transfer: "Bank Transfer",
      Pay: "Pay",
      Processing: "Processing",
      CardPaymentRedirect: "You will be redirected to a secure payment page.",
      PhoneNumber: "Phone number",
      MBWayInstructions:
        "You will receive a notification in your MBWay app to confirm the payment.",
      MultibancoInstructions:
        "You will receive the details for payment at Multibanco.",
      TransferInstructions: "You will receive the bank transfer details.",
      PaymentInitiated: "Payment initiated",
      PaymentInitiatedDescription:
        "Your payment has been successfully initiated.",
      MBWayPaymentInitiated: "MBWay payment initiated",
      CheckYourMobilePhone: "Check your mobile phone to confirm the payment.",
      PaymentError: "Payment error",
      PaymentProcessingError:
        "An error occurred while processing your payment.",
      ValidPhoneNumberRequired: "A valid phone number is required.",
      IBAN: "IBAN",
      ImportantInformation: "Important information",
      MultibancoInstruction1:
        "Use Multibanco or banking app to make the payment.",
      MultibancoInstruction2: "Use the entity and reference exactly as shown.",
      TransferInstruction1: "Make the transfer to the indicated account.",
      TransferInstruction2:
        "Include the reference in the transfer description field.",
      ValidFor: "Valid for",
      Days: "days",
      BankTransfer: "Bank Transfer",
      CopiedToClipboard: "Copied to clipboard",
      RefreshStatus: "Refresh status",
      BackToReservations: "Back to reservations",
      PaymentSuccessful: "Payment successful",
      PaymentSuccessfulDescription:
        "Your payment has been processed successfully.",
      ThankYouForYourOrder: "Thank you for your order.",
      ReservationConfirmationInfo:
        "Your reservation is confirmed. You can view the details on your reservations page.",
      ViewReservations: "View reservations",
      PaymentCancelled: "Payment cancelled",
      PaymentCancelledDescription: "Your payment has been cancelled.",
      NoChargesMade: "No charges have been made.",
      PaymentNotFound: "Payment not found",
      PaymentNotFoundDescription: "Could not find details for this payment.",
    },
  },
  es: {
    translation: {
      // Header
      Home: "Inicio",
      About: "Sobre Nosotros",
      Menu: "Menú",
      ContactHeader: "Contacto",
      Login: "Iniciar Sesión",
      Register: "Registrarse",

      // Hero
      FlavorsOfBrazil: "Sabores de Brasil en la Convención MSBN Europa",
      AuthenticCuisine:
        "El restaurante Opa que delicia trae la auténtica cocina brasileña a la Convención MSBN Europa",
      BookNowHero: "¡Reserva tu mesa ahora!",

      // About
      AboutUs: "Sobre Opa que delícia!",
      AboutText1:
        "Nacido en Carregado con la misión de traer la auténtica cocina brasileña a Portugal, Opa que delícia! encanta a los clientes con sabores genuinos y un ambiente acogedor.",
      AboutText2:
        "Para la Convención MSBN Europa 2025, estamos orgullosos de anunciar nuestra asociación especial con MSBN Portugal, trayendo lo mejor de la gastronomía brasileña a este evento único.",
      SpecialPartnership: "Asociación Especial",
      PartnershipText:
        "Estamos orgullosos de ser parte de la Convención MSBN Europa 2025, trayendo auténticos sabores brasileños a todos los participantes de este evento inolvidable.",

      // Menu
      SpecialMenu: "Menú Especial para el Evento",
      ExclusiveSelection: "Selección exclusiva para la Convención MSBN Europa",
      Appetizers: "Entrantes",
      MainDishes: "Platos Principales",
      Desserts: "Postres",
      Drinks: "Bebidas",
      ViewFullMenu: "Ver Menú Completo",
      All: "Todos",
      SpiceLevel: "Nivel de Picante",
      NoItemsInCategory: "No hay elementos en esta categoría",
      ViewAllItems: "Ver todos los elementos",
      ErrorLoadingMenu:
        "Se produjo un error al cargar el menú. Por favor, inténtelo de nuevo.",

      // Testimonials
      CustomerSay: "Lo que Dicen Nuestros Clientes",
      SinceYear: "Cliente desde",

      // Location
      LocationContact: "Ubicación y Contacto",
      EventInfo: "Información del Evento",
      Address: "Dirección",
      EventDate: "Fecha del Evento",
      Hours: "Horario de Apertura",
      ContactInfo: "Contacto",
      WhatsAppContact: "Contáctanos por WhatsApp",

      // CTA
      EnjoyBrazil: "¡Ven a Disfrutar de la Auténtica Gastronomía Brasileña!",
      GuaranteeTable:
        "Reserva tu mesa y experimenta los sabores que hacen de Brasil un país tan especial. ¡Reserva ahora y asegura una experiencia gastronómica única durante la Convención MSBN Europa!",
      BookNowCTA: "Reservar Ahora",

      // Footer
      QuickLinks: "Enlaces Rápidos",
      Languages: "Idiomas",
      Newsletter: "Boletín",
      YourEmail: "Tu email",
      AllRightsReserved: "Todos los derechos reservados",
      PrivacyPolicy: "Política de Privacidad",
      TermsOfUse: "Términos de Uso",

      // Auth
      AccessAccount: "Acceder a la Cuenta",
      CreateAccount: "Crear una cuenta",
      Email: "Email",
      Password: "Contraseña",
      ConfirmPassword: "Confirmar Contraseña",
      ForgotPassword: "¿Olvidaste la contraseña?",
      AlreadyHaveAccount: "¿Ya tienes una cuenta?",
      DontHaveAccount: "¿No tienes una cuenta?",
      FirstName: "Nombre",
      LastName: "Apellido",
      Phone: "Teléfono",
      AgreeTerms: "Acepto los",
      TermsAndPolicy: "Términos de Uso y Política de Privacidad",

      // Dashboard
      Dashboard: "Panel",
      Profile: "Perfil",
      Reservations: "Reservas",
      Payments: "Pagos",
      Support: "Soporte",
      Logout: "Cerrar Sesión",
      Hello: "Hola",
      Client: "Cliente",
      CustomerSince: "Cliente desde",
      WelcomeToOpaQueDelicia: "¡Bienvenido a Opa que delicia!",
      AuthenticBrazilianCuisineWaitingForYou:
        "Auténticos sabores de la cocina brasileña esperándote.",
      MakeReservation: "Hacer una Reserva",
      YourUpcomingReservations: "Tus Próximas Reservas",
      NoUpcomingReservations: "No hay reservas futuras",
      BookTable: "Reservar Mesa",
      ViewAllReservations: "Ver todas las reservas",
      SpecialOffers: "Ofertas Especiales",
      ViewPromotions: "Ver Promociones",
      MenuHighlights: "Destacados del Menú",
      POPULAR: "POPULAR",
      AddToOrder: "Añadir",
      people: "personas",
      Dinner: "Cena",
      Details: "Detalles",
      Table: "Mesa",

      // Admin
      AdminPanel: "Panel de Administración",
      Customers: "Clientes",
      MenuManagement: "Gestión del Menú",
      Tables: "Mesas",
      Finance: "Finanzas",
      Reports: "Informes",
      Settings: "Configuración",

      // Stats
      TodayReservations: "Reservas de Hoy",
      CancelledReservations: "Reservas Canceladas",
      TotalCustomers: "Total de Clientes",
      DailyRevenue: "Ingresos Diarios",
      WeeklyReservations: "Reservas Semanales",
      PopularItems: "Platos Populares",
      PendingPayments: "Pagos Pendientes",

      // Forms
      Save: "Guardar",
      Cancel: "Cancelar",
      Delete: "Eliminar",
      Edit: "Editar",
      Add: "Añadir",
      Search: "Buscar",
      Filter: "Filtrar",
      List: "Lista",
      Layout: "Disposición",
      RestaurantLayout: "Disposición del Restaurante",
      VisualRepresentationOfTables: "Representación visual de las mesas",
      Legend: "Leyenda",
      Date: "Fecha",
      Time: "Hora",
      PartySize: "Número de Personas",
      TableNumber: "Número de Mesa",
      Status: "Estado",
      Amount: "Importe",
      PaymentMethod: "Método de Pago",
      Notes: "Notas",
      Submit: "Enviar",

      // User Profile
      City: "Ciudad",
      PostalCode: "Código Postal",
      Country: "País",
      Biography: "Biografía",
      MemberSince: "Miembro desde",
      LoyaltyPoints: "Puntos de Fidelidad",
      PersonalInformation: "Información Personal",
      ManageYourPersonalDetails: "Gestione sus datos personales",
      PreferredLanguage: "Idioma Preferido",
      EditProfile: "Editar Perfil",

      // Dietary Preferences
      DietaryPreferences: "Preferencias Alimentarias",
      Vegetarian: "Vegetariano",
      Vegan: "Vegano",
      Glutenfree: "Sin Gluten",
      Lactosefree: "Sin Lactosa",
      Pescatarian: "Pescetariano",
      Halal: "Halal",
      Kosher: "Kosher",
      None: "Ninguna",
      Allergies: "Alergias",
      SpicePreference: "Preferencia de Picante",
      Mild: "Suave",
      Medium: "Medio",
      Hot: "Picante",
      PreferredSeating: "Asiento Preferido",
      Indoor: "Interior",
      Outdoor: "Exterior",
      NoPreference: "Sin Preferencia",
      NotificationPreferences: "Preferencias de Notificación",

      // Reservation
      Duration: "Duración",
      ReservationHours: "horas",
      DurationDescription: "Tiempo previsto para su reserva",
      SelectDuration: "Seleccione duración",
      Occasion: "Ocasión",
      SelectOccasion: "Seleccione ocasión",
      Birthday: "Cumpleaños",
      Anniversary: "Aniversario",
      BusinessMeeting: "Reunión de Negocios",
      DateNight: "Cita Romántica",
      Other: "Otra",
      OccasionDescription: "Ocasión especial para su visita",
      DietaryRequirements: "Requisitos Alimentarios",
      DietaryRequirementsPlaceholder:
        "Describa cualquier requisito alimentario especial",
      DietaryRequirementsDescription:
        "Háblenos sobre cualquier restricción alimentaria",
      SpecialRequests: "Solicitudes Especiales",
      EnterSpecialRequests: "Ingrese sus solicitudes especiales",
      SpecialRequestsDescription: "Háblenos sobre cualquier solicitud especial",
      ConfirmReservation: "Confirmar Reserva",

      // Errors
      Error: "Error",
      NotFound: "Página no encontrada",
      ServerError: "Error del servidor",
      ValidationError: "Error de validación",
      TryAgain: "Intentar de nuevo",
      GoBack: "Volver",
      GoHome: "Ir al inicio",

      // Support
      ContactUs: "Contáctenos",
      FAQ: "Preguntas Frecuentes",
      ContactInformation: "Información de Contacto",
      GetInTouchWithUs: "Póngase en contacto con nosotros",
      SendMessage: "Enviar Mensaje",
      FillFormBelow: "Complete el formulario a continuación",
      Subject: "Asunto",
      Message: "Mensaje",
      Category: "Categoría",
      SelectCategory: "Seleccione una categoría",
      ReservationQuestion: "Pregunta sobre Reserva",
      MenuQuestion: "Pregunta sobre el Menú",
      PaymentQuestion: "Pregunta sobre Pago",
      EventQuestion: "Pregunta sobre el Evento",
      OtherQuestion: "Otra Pregunta",
      MessageSent: "Mensaje Enviado",
      SupportTeamWillContactYou:
        "Nuestro equipo de soporte se pondrá en contacto con usted pronto.",
      FrequentlyAskedQuestions: "Preguntas Frecuentes",
      FindAnswersToCommonQuestions: "Encuentre respuestas a preguntas comunes",
      MoreQuestionsText:
        "¿Todavía tiene preguntas? Nuestro equipo está listo para ayudar.",
      ContactSupportTeam: "Contactar al Equipo de Soporte",
      EventHours: "Horario del Evento",
      ConventionDates: "Fechas de la Convención",
      MayShort: "Mayo",
      JuneShort: "Jun",
      LunchTime: "Almuerzo",
      DinnerTime: "Cena",
      EventHoursQuestion:
        "¿Cuáles son los horarios del restaurante durante el evento?",
      EventHoursAnswer:
        "El restaurante estará abierto durante todos los días del evento (29 de mayo al 1 de junio de 2025). Servimos almuerzo de 12pm a 3pm y cena de 7pm a 11pm.",
      ReservationCancellationQuestion:
        "¿Cómo puedo cancelar o modificar mi reserva?",
      ReservationCancellationAnswer:
        "Puede cancelar o modificar su reserva a través de la sección 'Reservas' en su panel de cliente hasta 24 horas antes de la hora reservada. Para cambios en un plazo menor, póngase en contacto directamente con nuestro equipo.",
      DietaryRestrictionsQuestion:
        "¿Acomodan restricciones dietéticas especiales?",
      DietaryRestrictionsAnswer:
        "¡Sí! Tenemos opciones vegetarianas, veganas, sin gluten y sin lactosa en nuestro menú. Recomendamos informar sus restricciones dietéticas al momento de la reserva para que podamos preparar su experiencia de la mejor manera posible.",
      LargeGroupsQuestion: "¿Es posible hacer reservas para grupos grandes?",
      LargeGroupsAnswer:
        "Sí, podemos acomodar grupos de hasta 20 personas. Para grupos más grandes, recomendamos ponerse en contacto con anticipación para garantizar que podamos ofrecer el mejor servicio.",
      PaymentMethodsQuestion: "¿Qué métodos de pago se aceptan?",
      PaymentMethodsAnswer:
        "Aceptamos tarjetas de crédito/débito, MBWay, Multibanco y transferencias bancarias. Lamentamos informar que no aceptamos cheques.",
      ParkingQuestion: "¿Hay estacionamiento disponible cerca del lugar?",
      ParkingAnswer:
        "Sí, hay estacionamiento disponible en el lugar del evento. También hay opciones de estacionamiento público en las cercanías.",
      ChildrenMenuQuestion: "¿Tienen menú infantil?",
      ChildrenMenuAnswer:
        "Sí, ofrecemos opciones especiales para niños con porciones adecuadas y sabores que agradan a los pequeños.",
      AlcoholServingQuestion: "¿Sirven bebidas alcohólicas?",
      AlcoholServingAnswer:
        "Sí, tenemos una selección de vinos portugueses y brasileños, además de caipirinhas tradicionales y otras bebidas alcohólicas. Recordamos que solo servimos a mayores de 18 años.",

      // Payment
      SelectPaymentMethod: "Seleccione método de pago",
      PaymentAmount: "Importe a pagar",
      Card: "Tarjeta",
      Multibanco: "Multibanco",
      Transfer: "Transferencia Bancaria",
      Pay: "Pagar",
      Processing: "Procesando",
      CardPaymentRedirect: "Será redirigido a una página de pago segura.",
      PhoneNumber: "Número de teléfono",
      MBWayInstructions:
        "Recibirá una notificación en su aplicación MBWay para confirmar el pago.",
      MultibancoInstructions:
        "Recibirá los detalles para el pago en Multibanco.",
      TransferInstructions:
        "Recibirá los detalles para la transferencia bancaria.",
      PaymentInitiated: "Pago iniciado",
      PaymentInitiatedDescription: "Su pago ha sido iniciado con éxito.",
      MBWayPaymentInitiated: "Pago MBWay iniciado",
      CheckYourMobilePhone:
        "Verifique su teléfono móvil para confirmar el pago.",
      PaymentError: "Error en el pago",
      PaymentProcessingError: "Ocurrió un error al procesar su pago.",
      ValidPhoneNumberRequired: "Se requiere un número de teléfono válido.",
      IBAN: "IBAN",
      ImportantInformation: "Información importante",
      MultibancoInstruction1:
        "Utilice Multibanco o app bancaria para realizar el pago.",
      MultibancoInstruction2:
        "Use la entidad y referencia exactamente como se muestra.",
      TransferInstruction1: "Realice la transferencia a la cuenta indicada.",
      TransferInstruction2:
        "Incluya la referencia en el campo de descripción de la transferencia.",
      ValidFor: "Válido por",
      Days: "días",
      BankTransfer: "Transferencia Bancaria",
      CopiedToClipboard: "Copiado al portapapeles",
      RefreshStatus: "Actualizar estado",
      BackToReservations: "Volver a reservas",
      PaymentSuccessful: "Pago exitoso",
      PaymentSuccessfulDescription: "Su pago ha sido procesado con éxito.",
      ThankYouForYourOrder: "Gracias por su pedido.",
      ReservationConfirmationInfo:
        "Su reserva está confirmada. Puede ver los detalles en su página de reservas.",
      ViewReservations: "Ver reservas",
      PaymentCancelled: "Pago cancelado",
      PaymentCancelledDescription: "Su pago ha sido cancelado.",
      NoChargesMade: "No se han realizado cargos.",
      PaymentNotFound: "Pago no encontrado",
      PaymentNotFoundDescription:
        "No se pudieron encontrar los detalles de este pago.",
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "pt",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
