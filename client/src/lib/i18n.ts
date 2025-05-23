import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  pt: {
    translation: {
      // Navegação
      "Home": "Início",
      "Menu": "Menu",
      "Reservations": "Reservas",
      "Contact": "Contacto",
      "Login": "Entrar",
      "Logout": "Sair",
      "Admin": "Administração",
      "Dashboard": "Painel de Controlo",
      "Profile": "Perfil",

      // Menu Management
      "MenuManagement": "Gestão de Menu",
      "MenuItems": "Itens do Menu",
      "Categories": "Categorias",
      "ManageMenuItems": "Gerir Itens do Menu",
      "AddEditRemoveMenuItems": "Adicionar, editar e remover itens do menu",
      "ManageCategories": "Gerir Categorias",
      "AddEditRemoveCategories": "Adicionar, editar e remover categorias",
      "SearchMenuItems": "Pesquisar itens do menu",
      "AllCategories": "Todas as Categorias",
      "AddMenuItem": "Adicionar Item",
      "EditMenuItem": "Editar Item",
      "AddMenuItemDescription": "Preencha os dados para adicionar um novo item ao menu",
      "EditMenuItemDescription": "Edite os dados do item do menu",
      "AddCategory": "Adicionar Categoria",
      "EditCategory": "Editar Categoria",
      "AddCategoryDescription": "Preencha os dados para adicionar uma nova categoria",
      "EditCategoryDescription": "Edite os dados da categoria",

      // Formulários
      "Name": "Nome",
      "Description": "Descrição",
      "Price": "Preço",
      "Category": "Categoria",
      "Featured": "Destaque",
      "ImageURL": "URL da Imagem",
      "EnterImageURL": "Inserir URL da imagem",
      "ItemName": "Nome do item",
      "ItemDescription": "Descrição do item",
      "SelectCategory": "Selecionar categoria",
      "CategoryName": "Nome da categoria",
      "CategoryDescription": "Descrição da categoria",
      "FeaturedItemsDescription": "Itens em destaque aparecem no topo da lista",
      "Save": "Guardar",
      "Cancel": "Cancelar",
      "SaveChanges": "Guardar Alterações",
      "AddItem": "Adicionar Item",
      "Saving": "A guardar...",
      "Delete": "Eliminar",
      "Deleting": "A eliminar...",

      // Estados
      "Yes": "Sim",
      "No": "Não",
      "Available": "Disponível",
      "Unavailable": "Indisponível",
      "InStock": "Em Stock",
      "OutOfStock": "Sem Stock",
      "LowStock": "Stock Baixo",

      // Ações
      "Actions": "Ações",
      "Edit": "Editar",
      "Remove": "Remover",
      "View": "Ver",
      "Add": "Adicionar",

      // Mensagens
      "NoMenuItems": "Nenhum item do menu encontrado",
      "NoMenuItemsFound": "Nenhum item encontrado com os critérios de pesquisa",
      "NoCategories": "Nenhuma categoria encontrada",
      "ConfirmDelete": "Confirmar Eliminação",
      "DeleteItemConfirmation": "Tem a certeza que deseja eliminar este item? Esta ação não pode ser desfeita.",
      "DeleteCategoryConfirmation": "Tem a certeza que deseja eliminar esta categoria? Esta ação não pode ser desfeita.",

      // Notificações
      "ItemCreated": "Item Criado",
      "ItemCreatedMessage": "Item do menu criado com sucesso",
      "ItemUpdated": "Item Atualizado",
      "ItemUpdatedMessage": "Item do menu atualizado com sucesso",
      "ItemDeleted": "Item Eliminado",
      "ItemDeletedMessage": "Item do menu eliminado com sucesso",
      "CategoryCreated": "Categoria Criada",
      "CategoryCreatedMessage": "Categoria criada com sucesso",
      "CategoryUpdated": "Categoria Atualizada",
      "CategoryUpdatedMessage": "Categoria atualizada com sucesso",
      "CategoryDeleted": "Categoria Eliminada",
      "CategoryDeletedMessage": "Categoria eliminada com sucesso",

      // Erros
      "ItemCreateError": "Erro ao Criar Item",
      "ItemCreateErrorMessage": "Ocorreu um erro ao criar o item do menu",
      "ItemUpdateError": "Erro ao Atualizar Item",
      "ItemUpdateErrorMessage": "Ocorreu um erro ao atualizar o item do menu",
      "ItemDeleteError": "Erro ao Eliminar Item",
      "ItemDeleteErrorMessage": "Ocorreu um erro ao eliminar o item do menu",
      "CategoryCreateError": "Erro ao Criar Categoria",
      "CategoryCreateErrorMessage": "Ocorreu um erro ao criar a categoria",
      "CategoryUpdateError": "Erro ao Atualizar Categoria",
      "CategoryUpdateErrorMessage": "Ocorreu um erro ao atualizar a categoria",
      "CategoryDeleteError": "Erro ao Eliminar Categoria",
      "CategoryDeleteErrorMessage": "Ocorreu um erro ao eliminar a categoria",

      // Stock
      "StockManagement": "Gestão de Stock",
      "TrackStock": "Controlar Stock",
      "StockQuantity": "Quantidade em Stock",
      "MinStockLevel": "Stock Mínimo",
      "MaxStockLevel": "Stock Máximo",
      "StockControl": "Controlo de Stock",
      "StockControlDescription": "Ativar controlo de stock para este item",

      // Dashboard específico
      "WelcomeToAdminPanel": "Bem-vindo ao painel administrativo do Opa que delicia",
      "TodayRevenue": "Receita de Hoje",
      "TotalReservations": "Total de Reservas",
      "PendingOrders": "Pedidos Pendentes",
      "RecentReservations": "Reservas Recentes",
      "RevenueChart": "Gráfico de Receitas",
      "SalesOverview": "Visão Geral das Vendas",
      
      // Finance
      "Finance": "Finanças",
      "FinanceManagement": "Gestão Financeira",
      "TrackRevenueExpensesAndAnalysis": "Acompanhe receitas, despesas e análise financeira",
      "Revenue": "Receita",
      "Expenses": "Despesas",
      "Balance": "Saldo",
      "DateFilter": "Filtro de Data",
      "From": "De",
      "To": "Até",
      "Apply": "Aplicar",
      "Clear": "Limpar",
      
      // Reservations
      "ReservationManagement": "Gestão de Reservas",
      "ViewAndManageReservations": "Visualize e gerencie todas as reservas do restaurante",
      "NewReservation": "Nova Reserva",
      "CreateReservation": "Criar Reserva",
      "CustomerName": "Nome do Cliente",
      "TableNumber": "Número da Mesa",
      "ReservationDate": "Data da Reserva",
      "ReservationTime": "Hora da Reserva",
      "NumberOfGuests": "Número de Convidados",
      "PaymentMethod": "Método de Pagamento",
      "Cash": "Dinheiro",
      "Status": "Estado",
      "Confirmed": "Confirmada",
      "Pending": "Pendente",
      "Cancelled": "Cancelada",
    }
  },
  en: {
    translation: {
      // Navigation
      "Home": "Home",
      "Menu": "Menu",
      "Reservations": "Reservations",
      "Contact": "Contact",
      "Login": "Login",
      "Logout": "Logout",
      "Admin": "Admin",
      "Dashboard": "Dashboard",
      "Profile": "Profile",

      // Menu Management
      "MenuManagement": "Menu Management",
      "MenuItems": "Menu Items",
      "Categories": "Categories",
      "ManageMenuItems": "Manage Menu Items",
      "AddEditRemoveMenuItems": "Add, edit and remove menu items",
      "ManageCategories": "Manage Categories",
      "AddEditRemoveCategories": "Add, edit and remove categories",
      "SearchMenuItems": "Search menu items",
      "AllCategories": "All Categories",
      "AddMenuItem": "Add Item",
      "EditMenuItem": "Edit Item",
      "AddMenuItemDescription": "Fill in the details to add a new menu item",
      "EditMenuItemDescription": "Edit the menu item details",
      "AddCategory": "Add Category",
      "EditCategory": "Edit Category",
      "AddCategoryDescription": "Fill in the details to add a new category",
      "EditCategoryDescription": "Edit the category details",

      // Forms
      "Name": "Name",
      "Description": "Description",
      "Price": "Price",
      "Category": "Category",
      "Featured": "Featured",
      "ImageURL": "Image URL",
      "EnterImageURL": "Enter image URL",
      "ItemName": "Item name",
      "ItemDescription": "Item description",
      "SelectCategory": "Select category",
      "CategoryName": "Category name",
      "CategoryDescription": "Category description",
      "FeaturedItemsDescription": "Featured items appear at the top of the list",
      "Save": "Save",
      "Cancel": "Cancel",
      "SaveChanges": "Save Changes",
      "AddItem": "Add Item",
      "Saving": "Saving...",
      "Delete": "Delete",
      "Deleting": "Deleting...",

      // States
      "Yes": "Yes",
      "No": "No",
      "Available": "Available",
      "Unavailable": "Unavailable",
      "InStock": "In Stock",
      "OutOfStock": "Out of Stock",
      "LowStock": "Low Stock",

      // Actions
      "Actions": "Actions",
      "Edit": "Edit",
      "Remove": "Remove",
      "View": "View",
      "Add": "Add",

      // Messages
      "NoMenuItems": "No menu items found",
      "NoMenuItemsFound": "No items found matching the search criteria",
      "NoCategories": "No categories found",
      "ConfirmDelete": "Confirm Delete",
      "DeleteItemConfirmation": "Are you sure you want to delete this item? This action cannot be undone.",
      "DeleteCategoryConfirmation": "Are you sure you want to delete this category? This action cannot be undone.",

      // Notifications
      "ItemCreated": "Item Created",
      "ItemCreatedMessage": "Menu item created successfully",
      "ItemUpdated": "Item Updated",
      "ItemUpdatedMessage": "Menu item updated successfully",
      "ItemDeleted": "Item Deleted",
      "ItemDeletedMessage": "Menu item deleted successfully",
      "CategoryCreated": "Category Created",
      "CategoryCreatedMessage": "Category created successfully",
      "CategoryUpdated": "Category Updated",
      "CategoryUpdatedMessage": "Category updated successfully",
      "CategoryDeleted": "Category Deleted",
      "CategoryDeletedMessage": "Category deleted successfully",

      // Errors
      "ItemCreateError": "Item Creation Error",
      "ItemCreateErrorMessage": "An error occurred while creating the menu item",
      "ItemUpdateError": "Item Update Error",
      "ItemUpdateErrorMessage": "An error occurred while updating the menu item",
      "ItemDeleteError": "Item Deletion Error",
      "ItemDeleteErrorMessage": "An error occurred while deleting the menu item",
      "CategoryCreateError": "Category Creation Error",
      "CategoryCreateErrorMessage": "An error occurred while creating the category",
      "CategoryUpdateError": "Category Update Error",
      "CategoryUpdateErrorMessage": "An error occurred while updating the category",
      "CategoryDeleteError": "Category Deletion Error",
      "CategoryDeleteErrorMessage": "An error occurred while deleting the category",

      // Stock
      "StockManagement": "Stock Management",
      "TrackStock": "Track Stock",
      "StockQuantity": "Stock Quantity",
      "MinStockLevel": "Min Stock Level",
      "MaxStockLevel": "Max Stock Level",
      "StockControl": "Stock Control",
      "StockControlDescription": "Enable stock control for this item",
    }
  },
  es: {
    translation: {
      // Navegación
      "Home": "Inicio",
      "Menu": "Menú",
      "Reservations": "Reservas",
      "Contact": "Contacto",
      "Login": "Iniciar Sesión",
      "Logout": "Cerrar Sesión",
      "Admin": "Administración",
      "Dashboard": "Panel",
      "Profile": "Perfil",

      // Gestión del Menú
      "MenuManagement": "Gestión del Menú",
      "MenuItems": "Elementos del Menú",
      "Categories": "Categorías",
      "ManageMenuItems": "Gestionar Elementos del Menú",
      "AddEditRemoveMenuItems": "Agregar, editar y eliminar elementos del menú",
      "ManageCategories": "Gestionar Categorías",
      "AddEditRemoveCategories": "Agregar, editar y eliminar categorías",
      "SearchMenuItems": "Buscar elementos del menú",
      "AllCategories": "Todas las Categorías",
      "AddMenuItem": "Agregar Elemento",
      "EditMenuItem": "Editar Elemento",
      "AddMenuItemDescription": "Complete los detalles para agregar un nuevo elemento al menú",
      "EditMenuItemDescription": "Edite los detalles del elemento del menú",
      "AddCategory": "Agregar Categoría",
      "EditCategory": "Editar Categoría",
      "AddCategoryDescription": "Complete los detalles para agregar una nueva categoría",
      "EditCategoryDescription": "Edite los detalles de la categoría",

      // Formularios
      "Name": "Nombre",
      "Description": "Descripción",
      "Price": "Precio",
      "Category": "Categoría",
      "Featured": "Destacado",
      "ImageURL": "URL de la Imagen",
      "EnterImageURL": "Ingresar URL de la imagen",
      "ItemName": "Nombre del elemento",
      "ItemDescription": "Descripción del elemento",
      "SelectCategory": "Seleccionar categoría",
      "CategoryName": "Nombre de la categoría",
      "CategoryDescription": "Descripción de la categoría",
      "FeaturedItemsDescription": "Los elementos destacados aparecen en la parte superior de la lista",
      "Save": "Guardar",
      "Cancel": "Cancelar",
      "SaveChanges": "Guardar Cambios",
      "AddItem": "Agregar Elemento",
      "Saving": "Guardando...",
      "Delete": "Eliminar",
      "Deleting": "Eliminando...",

      // Estados
      "Yes": "Sí",
      "No": "No",
      "Available": "Disponible",
      "Unavailable": "No Disponible",
      "InStock": "En Stock",
      "OutOfStock": "Agotado",
      "LowStock": "Stock Bajo",

      // Acciones
      "Actions": "Acciones",
      "Edit": "Editar",
      "Remove": "Eliminar",
      "View": "Ver",
      "Add": "Agregar",

      // Mensajes
      "NoMenuItems": "No se encontraron elementos del menú",
      "NoMenuItemsFound": "No se encontraron elementos que coincidan con los criterios de búsqueda",
      "NoCategories": "No se encontraron categorías",
      "ConfirmDelete": "Confirmar Eliminación",
      "DeleteItemConfirmation": "¿Está seguro de que desea eliminar este elemento? Esta acción no se puede deshacer.",
      "DeleteCategoryConfirmation": "¿Está seguro de que desea eliminar esta categoría? Esta acción no se puede deshacer.",

      // Notificaciones
      "ItemCreated": "Elemento Creado",
      "ItemCreatedMessage": "Elemento del menú creado exitosamente",
      "ItemUpdated": "Elemento Actualizado",
      "ItemUpdatedMessage": "Elemento del menú actualizado exitosamente",
      "ItemDeleted": "Elemento Eliminado",
      "ItemDeletedMessage": "Elemento del menú eliminado exitosamente",
      "CategoryCreated": "Categoría Creada",
      "CategoryCreatedMessage": "Categoría creada exitosamente",
      "CategoryUpdated": "Categoría Actualizada",
      "CategoryUpdatedMessage": "Categoría actualizada exitosamente",
      "CategoryDeleted": "Categoría Eliminada",
      "CategoryDeletedMessage": "Categoría eliminada exitosamente",

      // Errores
      "ItemCreateError": "Error al Crear Elemento",
      "ItemCreateErrorMessage": "Ocurrió un error al crear el elemento del menú",
      "ItemUpdateError": "Error al Actualizar Elemento",
      "ItemUpdateErrorMessage": "Ocurrió un error al actualizar el elemento del menú",
      "ItemDeleteError": "Error al Eliminar Elemento",
      "ItemDeleteErrorMessage": "Ocurrió un error al eliminar el elemento del menú",
      "CategoryCreateError": "Error al Crear Categoría",
      "CategoryCreateErrorMessage": "Ocurrió un error al crear la categoría",
      "CategoryUpdateError": "Error al Actualizar Categoría",
      "CategoryUpdateErrorMessage": "Ocurrió un error al actualizar la categoría",
      "CategoryDeleteError": "Error al Eliminar Categoría",
      "CategoryDeleteErrorMessage": "Ocurrió un error al eliminar la categoría",

      // Stock
      "StockManagement": "Gestión de Stock",
      "TrackStock": "Controlar Stock",
      "StockQuantity": "Cantidad en Stock",
      "MinStockLevel": "Nivel Mínimo de Stock",
      "MaxStockLevel": "Nivel Máximo de Stock",
      "StockControl": "Control de Stock",
      "StockControlDescription": "Habilitar control de stock para este elemento",
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

export default i18n;