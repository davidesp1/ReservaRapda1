import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// This is a simplified implementation of i18n
// In a real app, translations would be in separate files

const resources = {
  pt: {
    translation: {
      // Header
      "Home": "Início",
      "About": "Sobre",
      "Menu": "Menu",
      "ContactHeader": "Contato",
      "Login": "Entrar",
      "Register": "Cadastrar",
      
      // Hero
      "FlavorsOfBrazil": "Sabores do Brasil na Convenção MSBN Europa",
      "AuthenticCuisine": "O restaurante Opa que delicia traz a autêntica culinária brasileira para Convenção MSBN Europa",
      "BookNow": "Faça já sua reserva!",
      
      // About
      "AboutUs": "Sobre o Opa que delícia!",
      "AboutText1": "Nascido no Carregado com a missão de trazer a autêntica culinária brasileira para Portugal, o Opa que delícia! encanta os clientes com sabores genuínos e ambiente acolhedor.",
      "AboutText2": "Para a Convenção MSBN Europa 2025, estamos orgulhosos de anunciar nossa parceria especial com a MSBN Portugal, trazendo o melhor da gastronomia brasileira para este evento único.",
      "SpecialPartnership": "Parceria Especial",
      "PartnershipText": "Estamos orgulhosos em fazer parte da Convenção MSBN Europa 2025, trazendo sabores brasileiros autênticos para todos os participantes deste evento inesquecível.",
      
      // Menu
      "SpecialMenu": "Menu Especial para o Evento",
      "ExclusiveSelection": "Seleção exclusiva para a Convenção MSBN Europa",
      "Appetizers": "Entradas",
      "MainDishes": "Pratos Principais",
      "Desserts": "Sobremesas",
      "Drinks": "Bebidas",
      "ViewFullMenu": "Ver Menu Completo",
      
      // Testimonials
      "CustomerSay": "O que Nossos Clientes Dizem",
      "SinceYear": "Cliente desde",
      
      // Location
      "LocationContact": "Localização e Contato",
      "EventInfo": "Informações do Evento",
      "Address": "Endereço",
      "EventDate": "Data do Evento",
      "Hours": "Horário de Funcionamento",
      "ContactInfo": "Contato",
      "WhatsAppContact": "Fale conosco no WhatsApp",
      
      // CTA
      "EnjoyBrazil": "Venha Desfrutar da Autêntica Gastronomia Brasileira!",
      "GuaranteeTable": "Garanta já sua mesa e experimente os sabores que fazem do Brasil um país tão especial. Faça sua reserva agora e assegure uma experiência gastronômica única durante a Convenção MSBN Europa!",
      "BookNowCTA": "Reservar Agora",
      
      // Footer
      "QuickLinks": "Links Rápidos",
      "Languages": "Idiomas",
      "Newsletter": "Newsletter",
      "YourEmail": "Seu email",
      "AllRightsReserved": "Todos os direitos reservados",
      "PrivacyPolicy": "Política de Privacidade",
      "TermsOfUse": "Termos de Uso",
      
      // Auth
      "AccessAccount": "Acessar Conta",
      "CreateAccount": "Criar uma conta",
      "Email": "Email",
      "Password": "Senha",
      "ConfirmPassword": "Confirmar Senha",
      "ForgotPassword": "Esqueceu a senha?",
      "AlreadyHaveAccount": "Já tem uma conta?",
      "DontHaveAccount": "Não tem uma conta?",
      "FirstName": "Nome",
      "LastName": "Sobrenome",
      "Phone": "Telefone",
      "AgreeTerms": "Concordo com os",
      "TermsAndPolicy": "Termos de Uso e Política de Privacidade",
      
      // Dashboard
      "Dashboard": "Painel",
      "Profile": "Perfil",
      "Reservations": "Reservas",
      "Payments": "Pagamentos",
      "Support": "Suporte",
      "Logout": "Sair",
      
      // Admin
      "AdminPanel": "Painel Administrativo",
      "Customers": "Clientes",
      "MenuManagement": "Gestão do Menu",
      "Tables": "Mesas",
      "Finance": "Finanças",
      "Reports": "Relatórios",
      "Settings": "Configurações",
      
      // Stats
      "TodayReservations": "Reservas Hoje",
      "CancelledReservations": "Reservas Canceladas",
      "TotalCustomers": "Total de Clientes",
      "DailyRevenue": "Receita Diária",
      "WeeklyReservations": "Reservas na Semana",
      "PopularItems": "Pratos Populares",
      "PendingPayments": "Pagamentos Pendentes",
      "ExportReports": "Exportar Relatórios",
      "GenerateAndDownloadReports": "Gere e baixe relatórios em PDF ou Excel",
      "ReportType": "Tipo de Relatório",
      "ExportFormat": "Formato de Exportação",
      "SelectReportType": "Selecione o tipo de relatório",
      "SelectExportFormat": "Selecione o formato de exportação",
      "StartDate": "Data de Início",
      "EndDate": "Data de Fim",
      "ExportReport": "Exportar Relatório",
      "Exporting": "Exportando",
      "ReportExported": "Relatório Exportado",
      "ReportExportedSuccessfully": "Relatório exportado com sucesso",
      "ReportExportError": "Erro na Exportação",
      "ErrorExportingReport": "Ocorreu um erro ao exportar o relatório",
      "InvalidDates": "Datas Inválidas",
      "PleaseSelectValidDates": "Por favor, selecione datas válidas",
      "SelectDate": "Selecione uma data",
      "ReservationsReport": "Relatório de Reservas",
      "SalesReport": "Relatório de Vendas",
      "CustomersReport": "Relatório de Clientes",
      "MenuPerformanceReport": "Relatório de Desempenho do Menu",
      
      // Forms
      "Save": "Salvar",
      "Cancel": "Cancelar",
      "Delete": "Excluir",
      "Edit": "Editar",
      "Add": "Adicionar",
      "Search": "Buscar",
      "Filter": "Filtrar",
      "List": "Lista",
      "Layout": "Layout",
      "RestaurantLayout": "Layout do Restaurante",
      "VisualRepresentationOfTables": "Representação visual das mesas",
      "Legend": "Legenda",
      "Date": "Data",
      "Time": "Hora",
      "PartySize": "Número de Pessoas",
      "TableNumber": "Número da Mesa",
      "Status": "Status",
      "Amount": "Valor",
      "PaymentMethod": "Método de Pagamento",
      "Notes": "Observações",
      "Submit": "Enviar",
      
      // Errors
      "Error": "Erro",
      "NotFound": "Página não encontrada",
      "ServerError": "Erro do servidor",
      "ValidationError": "Erro de validação",
      "TryAgain": "Tente novamente",
      "GoBack": "Voltar",
      "GoHome": "Ir para o início"
    }
  },
  en: {
    translation: {
      // Header
      "Home": "Home",
      "About": "About",
      "Menu": "Menu",
      "ContactHeader": "Contact",
      "Login": "Login",
      "Register": "Sign Up",
      
      // Hero
      "FlavorsOfBrazil": "Flavors of Brazil at MSBN Europe Convention",
      "AuthenticCuisine": "The restaurant Opa que delicia brings authentic Brazilian cuisine to the MSBN Europe Convention",
      "BookNowHero": "Book your table now!",
      
      // About
      "AboutUs": "About Opa que delícia!",
      "AboutText1": "Born in Carregado with the mission of bringing authentic Brazilian cuisine to Portugal, Opa que delícia! delights customers with genuine flavors and a welcoming atmosphere.",
      "AboutText2": "For the MSBN Europe Convention 2025, we are proud to announce our special partnership with MSBN Portugal, bringing the best of Brazilian gastronomy to this unique event.",
      "SpecialPartnership": "Special Partnership",
      "PartnershipText": "We are proud to be part of the MSBN Europe Convention 2025, bringing authentic Brazilian flavors to all participants of this unforgettable event.",
      
      // Menu
      "SpecialMenu": "Special Menu for the Event",
      "ExclusiveSelection": "Exclusive selection for the MSBN Europe Convention",
      "Appetizers": "Appetizers",
      "MainDishes": "Main Dishes",
      "Desserts": "Desserts",
      "Drinks": "Drinks",
      "ViewFullMenu": "View Full Menu",
      
      // Testimonials
      "CustomerSay": "What Our Customers Say",
      "SinceYear": "Customer since",
      
      // Location
      "LocationContact": "Location and Contact",
      "EventInfo": "Event Information",
      "Address": "Address",
      "EventDate": "Event Date",
      "Hours": "Opening Hours",
      "ContactInfo": "Contact",
      "WhatsAppContact": "Contact us on WhatsApp",
      
      // CTA
      "EnjoyBrazil": "Come Enjoy Authentic Brazilian Gastronomy!",
      "GuaranteeTable": "Reserve your table and experience the flavors that make Brazil such a special country. Book now and ensure a unique gastronomic experience during the MSBN Europe Convention!",
      "BookNowCTA": "Book Now",
      
      // Footer
      "QuickLinks": "Quick Links",
      "Languages": "Languages",
      "Newsletter": "Newsletter",
      "YourEmail": "Your email",
      "AllRightsReserved": "All rights reserved",
      "PrivacyPolicy": "Privacy Policy",
      "TermsOfUse": "Terms of Use",
      
      // Auth
      "AccessAccount": "Access Account",
      "CreateAccount": "Create an account",
      "Email": "Email",
      "Password": "Password",
      "ConfirmPassword": "Confirm Password",
      "ForgotPassword": "Forgot password?",
      "AlreadyHaveAccount": "Already have an account?",
      "DontHaveAccount": "Don't have an account?",
      "FirstName": "First Name",
      "LastName": "Last Name",
      "Phone": "Phone",
      "AgreeTerms": "I agree to the",
      "TermsAndPolicy": "Terms of Use and Privacy Policy",
      
      // Dashboard
      "Dashboard": "Dashboard",
      "Profile": "Profile",
      "Reservations": "Reservations",
      "Payments": "Payments",
      "Support": "Support",
      "Logout": "Logout",
      
      // Admin
      "AdminPanel": "Admin Panel",
      "Customers": "Customers",
      "MenuManagement": "Menu Management",
      "Tables": "Tables",
      "Finance": "Finance",
      "Reports": "Reports",
      "Settings": "Settings",
      
      // Stats
      "TodayReservations": "Today's Reservations",
      "CancelledReservations": "Cancelled Reservations",
      "TotalCustomers": "Total Customers",
      "DailyRevenue": "Daily Revenue",
      "WeeklyReservations": "Weekly Reservations",
      "PopularItems": "Popular Items",
      "PendingPayments": "Pending Payments",
      
      // Forms
      "Save": "Save",
      "Cancel": "Cancel",
      "Delete": "Delete",
      "Edit": "Edit",
      "Add": "Add",
      "Search": "Search",
      "Filter": "Filter",
      "List": "List",
      "Layout": "Layout",
      "RestaurantLayout": "Restaurant Layout",
      "VisualRepresentationOfTables": "Visual representation of tables",
      "Legend": "Legend",
      "Date": "Date",
      "Time": "Time",
      "PartySize": "Party Size",
      "TableNumber": "Table Number",
      "Status": "Status",
      "Amount": "Amount",
      "PaymentMethod": "Payment Method",
      "Notes": "Notes",
      "Submit": "Submit",
      
      // Errors
      "Error": "Error",
      "NotFound": "Page not found",
      "ServerError": "Server error",
      "ValidationError": "Validation error",
      "TryAgain": "Try again",
      "GoBack": "Go back",
      "GoHome": "Go home"
    }
  },
  es: {
    translation: {
      // Header
      "Home": "Inicio",
      "About": "Sobre Nosotros",
      "Menu": "Menú",
      "ContactHeader": "Contacto",
      "Login": "Iniciar Sesión",
      "Register": "Registrarse",
      
      // Hero
      "FlavorsOfBrazil": "Sabores de Brasil en la Convención MSBN Europa",
      "AuthenticCuisine": "El restaurante Opa que delicia trae la auténtica cocina brasileña a la Convención MSBN Europa",
      "BookNowHero": "¡Reserva tu mesa ahora!",
      
      // About
      "AboutUs": "Sobre Opa que delícia!",
      "AboutText1": "Nacido en Carregado con la misión de traer la auténtica cocina brasileña a Portugal, Opa que delícia! encanta a los clientes con sabores genuinos y un ambiente acogedor.",
      "AboutText2": "Para la Convención MSBN Europa 2025, estamos orgullosos de anunciar nuestra asociación especial con MSBN Portugal, trayendo lo mejor de la gastronomía brasileña a este evento único.",
      "SpecialPartnership": "Asociación Especial",
      "PartnershipText": "Estamos orgullosos de ser parte de la Convención MSBN Europa 2025, trayendo auténticos sabores brasileños a todos los participantes de este evento inolvidable.",
      
      // Menu
      "SpecialMenu": "Menú Especial para el Evento",
      "ExclusiveSelection": "Selección exclusiva para la Convención MSBN Europa",
      "Appetizers": "Entrantes",
      "MainDishes": "Platos Principales",
      "Desserts": "Postres",
      "Drinks": "Bebidas",
      "ViewFullMenu": "Ver Menú Completo",
      
      // Testimonials
      "CustomerSay": "Lo que Dicen Nuestros Clientes",
      "SinceYear": "Cliente desde",
      
      // Location
      "LocationContact": "Ubicación y Contacto",
      "EventInfo": "Información del Evento",
      "Address": "Dirección",
      "EventDate": "Fecha del Evento",
      "Hours": "Horario de Apertura",
      "ContactInfo": "Contacto",
      "WhatsAppContact": "Contáctanos por WhatsApp",
      
      // CTA
      "EnjoyBrazil": "¡Ven a Disfrutar de la Auténtica Gastronomía Brasileña!",
      "GuaranteeTable": "Reserva tu mesa y experimenta los sabores que hacen de Brasil un país tan especial. ¡Reserva ahora y asegura una experiencia gastronómica única durante la Convención MSBN Europa!",
      "BookNowCTA": "Reservar Ahora",
      
      // Footer
      "QuickLinks": "Enlaces Rápidos",
      "Languages": "Idiomas",
      "Newsletter": "Boletín",
      "YourEmail": "Tu email",
      "AllRightsReserved": "Todos los derechos reservados",
      "PrivacyPolicy": "Política de Privacidad",
      "TermsOfUse": "Términos de Uso",
      
      // Auth
      "AccessAccount": "Acceder a la Cuenta",
      "CreateAccount": "Crear una cuenta",
      "Email": "Email",
      "Password": "Contraseña",
      "ConfirmPassword": "Confirmar Contraseña",
      "ForgotPassword": "¿Olvidaste la contraseña?",
      "AlreadyHaveAccount": "¿Ya tienes una cuenta?",
      "DontHaveAccount": "¿No tienes una cuenta?",
      "FirstName": "Nombre",
      "LastName": "Apellido",
      "Phone": "Teléfono",
      "AgreeTerms": "Acepto los",
      "TermsAndPolicy": "Términos de Uso y Política de Privacidad",
      
      // Dashboard
      "Dashboard": "Panel",
      "Profile": "Perfil",
      "Reservations": "Reservas",
      "Payments": "Pagos",
      "Support": "Soporte",
      "Logout": "Cerrar Sesión",
      
      // Admin
      "AdminPanel": "Panel de Administración",
      "Customers": "Clientes",
      "MenuManagement": "Gestión del Menú",
      "Tables": "Mesas",
      "Finance": "Finanzas",
      "Reports": "Informes",
      "Settings": "Configuración",
      
      // Stats
      "TodayReservations": "Reservas de Hoy",
      "CancelledReservations": "Reservas Canceladas",
      "TotalCustomers": "Total de Clientes",
      "DailyRevenue": "Ingresos Diarios",
      "WeeklyReservations": "Reservas Semanales",
      "PopularItems": "Platos Populares",
      "PendingPayments": "Pagos Pendientes",
      
      // Forms
      "Save": "Guardar",
      "Cancel": "Cancelar",
      "Delete": "Eliminar",
      "Edit": "Editar",
      "Add": "Añadir",
      "Search": "Buscar",
      "Filter": "Filtrar",
      "List": "Lista",
      "Layout": "Disposición",
      "RestaurantLayout": "Disposición del Restaurante",
      "VisualRepresentationOfTables": "Representación visual de las mesas",
      "Legend": "Leyenda",
      "Date": "Fecha",
      "Time": "Hora",
      "PartySize": "Número de Personas",
      "TableNumber": "Número de Mesa",
      "Status": "Estado",
      "Amount": "Importe",
      "PaymentMethod": "Método de Pago",
      "Notes": "Notas",
      "Submit": "Enviar",
      
      // Errors
      "Error": "Error",
      "NotFound": "Página no encontrada",
      "ServerError": "Error del servidor",
      "ValidationError": "Error de validación",
      "TryAgain": "Intentar de nuevo",
      "GoBack": "Volver",
      "GoHome": "Ir al inicio"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
