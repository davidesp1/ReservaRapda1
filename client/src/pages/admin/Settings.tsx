import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const [activeTab, setActiveTab] = useState(1);
  const { toast } = useToast();

  const switchTab = (tabNumber: number) => {
    setActiveTab(tabNumber);
  };

  const handleSubmit = async (formType: string, event: React.FormEvent) => {
    event.preventDefault();
    
    // Simulate form submission
    toast({
      title: 'Sucesso',
      description: `Configurações de ${formType} salvas com sucesso!`
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 font-montserrat">Configurações</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button className="relative">
              <i className="fa-regular fa-bell text-xl text-gray-600"></i>
              <span className="absolute -top-1 -right-1 bg-brasil-red text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">3</span>
            </button>
          </div>
          <div className="flex items-center">
            <img 
              src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg" 
              alt="User Avatar" 
              className="w-10 h-10 rounded-full border-2 border-brasil-yellow" 
            />
            <div className="ml-2">
              <p className="text-sm font-medium text-gray-800">Carlos Silva</p>
              <p className="text-xs text-gray-500">Administrador</p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Tabs Section */}
      <div className="bg-white rounded-xl shadow-md p-8">
        {/* Tabs Navigation */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => switchTab(1)}
            className={`flex items-center px-5 py-3 font-semibold border-b-4 -mb-px rounded-t-md font-montserrat transition-all ${
              activeTab === 1
                ? 'text-brasil-blue border-brasil-blue bg-gray-50'
                : 'text-gray-600 hover:text-brasil-blue border-transparent bg-gray-50'
            }`}
          >
            <i className="fa-solid fa-building text-brasil-green mr-2"></i>
            Configurações Gerais
          </button>
          <button
            onClick={() => switchTab(2)}
            className={`flex items-center px-5 py-3 font-medium border-b-4 -mb-px rounded-t-md font-montserrat transition-all ${
              activeTab === 2
                ? 'text-brasil-blue border-brasil-blue bg-gray-50'
                : 'text-gray-600 hover:text-brasil-blue border-transparent bg-gray-50'
            }`}
          >
            <i className="fa-solid fa-globe text-brasil-yellow mr-2"></i>
            Configurações de Página
          </button>
          <button
            onClick={() => switchTab(3)}
            className={`flex items-center px-5 py-3 font-medium border-b-4 -mb-px rounded-t-md font-montserrat transition-all ${
              activeTab === 3
                ? 'text-brasil-blue border-brasil-blue bg-gray-50'
                : 'text-gray-600 hover:text-brasil-blue border-transparent bg-gray-50'
            }`}
          >
            <i className="fa-solid fa-calendar-check text-brasil-blue mr-2"></i>
            Configurações de Reservas
          </button>
          <button
            onClick={() => switchTab(4)}
            className={`flex items-center px-5 py-3 font-medium border-b-4 -mb-px rounded-t-md font-montserrat transition-all ${
              activeTab === 4
                ? 'text-brasil-blue border-brasil-blue bg-gray-50'
                : 'text-gray-600 hover:text-brasil-blue border-transparent bg-gray-50'
            }`}
          >
            <i className="fa-solid fa-credit-card text-brasil-green mr-2"></i>
            Configurações de Pagamento
          </button>
          <button
            onClick={() => switchTab(5)}
            className={`flex items-center px-5 py-3 font-medium border-b-4 -mb-px rounded-t-md font-montserrat transition-all ${
              activeTab === 5
                ? 'text-brasil-blue border-brasil-blue bg-gray-50'
                : 'text-gray-600 hover:text-brasil-blue border-transparent bg-gray-50'
            }`}
          >
            <i className="fa-solid fa-bell text-brasil-yellow mr-2"></i>
            Configuração de Notificações
          </button>
          <button
            onClick={() => switchTab(6)}
            className={`flex items-center px-5 py-3 font-medium border-b-4 -mb-px rounded-t-md font-montserrat transition-all ${
              activeTab === 6
                ? 'text-brasil-blue border-brasil-blue bg-gray-50'
                : 'text-gray-600 hover:text-brasil-blue border-transparent bg-gray-50'
            }`}
          >
            <i className="fa-solid fa-cash-register text-brasil-blue mr-2"></i>
            Configurações POS
          </button>
        </div>

        {/* Tab Content 1 - Configurações Gerais */}
        {activeTab === 1 && (
          <div className="tab-content">
            <form onSubmit={(e) => handleSubmit('gerais', e)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label htmlFor="restaurante-nome" className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                    Nome do Restaurante
                  </label>
                  <input
                    id="restaurante-nome"
                    type="text"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brasil-blue focus:outline-none font-semibold bg-gray-50"
                    placeholder="Opa que delicia"
                  />
                </div>
                <div>
                  <label htmlFor="restaurante-email" className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                    Email
                  </label>
                  <input
                    id="restaurante-email"
                    type="email"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brasil-blue focus:outline-none font-semibold bg-gray-50"
                    placeholder="contato@opaquedelicia.com"
                  />
                </div>
                <div>
                  <label htmlFor="restaurante-telefone" className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                    Telefone
                  </label>
                  <input
                    id="restaurante-telefone"
                    type="tel"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brasil-blue focus:outline-none font-semibold bg-gray-50"
                    placeholder="(11) 98765-4321"
                  />
                </div>
                <div>
                  <label htmlFor="restaurante-website" className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                    Website
                  </label>
                  <input
                    id="restaurante-website"
                    type="url"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brasil-blue focus:outline-none font-semibold bg-gray-50"
                    placeholder="https://opaquedelicia.com"
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="restaurante-endereco" className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                    Endereço
                  </label>
                  <input
                    id="restaurante-endereco"
                    type="text"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brasil-blue focus:outline-none font-semibold bg-gray-50"
                    placeholder="Rua da Gastronomia, 123 - São Paulo, SP"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                    Horário de Funcionamento
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-gray-500">Abertura</span>
                    <input
                      id="restaurante-abertura"
                      type="time"
                      className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brasil-blue focus:outline-none bg-gray-50 font-semibold w-24"
                    />
                    <span className="text-xs font-medium text-gray-500">Fechamento</span>
                    <input
                      id="restaurante-fechamento"
                      type="time"
                      className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brasil-blue focus:outline-none bg-gray-50 font-semibold w-24"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="restaurante-descricao" className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                    Descrição
                  </label>
                  <textarea
                    id="restaurante-descricao"
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brasil-blue focus:outline-none font-semibold bg-gray-50 resize-none"
                    placeholder="Conte um pouco sobre o restaurante, especialidades, história, etc."
                  />
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="flex items-center px-6 py-3 bg-brasil-green text-white font-bold rounded-lg shadow hover:bg-green-700 transition-colors text-base font-montserrat"
                >
                  <i className="fa-solid fa-floppy-disk mr-2"></i>
                  Salvar Configurações
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab Content 2 - Configurações de Página */}
        {activeTab === 2 && (
          <div className="tab-content">
            <form onSubmit={(e) => handleSubmit('página', e)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label htmlFor="page-title" className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                    Título da Página
                  </label>
                  <input
                    id="page-title"
                    type="text"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brasil-blue focus:outline-none font-semibold bg-gray-50"
                    placeholder="Opa que delicia - Restaurante Brasileiro"
                  />
                </div>
                <div className="flex flex-col space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                      Insira a Logo
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        id="page-logo"
                        type="file"
                        accept="image/*"
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brasil-blue file:text-white hover:file:bg-brasil-green"
                      />
                      <img
                        id="logo-preview"
                        className="w-12 h-12 object-contain bg-gray-100 rounded-md border hidden"
                        src=""
                        alt=""
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                      Insira o Favicon
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        id="page-favicon"
                        type="file"
                        accept="image/*"
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brasil-yellow file:text-brasil-blue hover:file:bg-brasil-green"
                      />
                      <img
                        id="favicon-preview"
                        className="w-8 h-8 object-contain bg-gray-100 rounded-md border hidden"
                        src=""
                        alt=""
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label htmlFor="nav-bar" className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                    Barra de Navegação
                  </label>
                  <textarea
                    id="nav-bar"
                    rows={2}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brasil-blue focus:outline-none font-semibold bg-gray-50 resize-none"
                    placeholder="Ex: Home, Cardápio, Reservas, Sobre, Contato"
                  />
                </div>
                <div>
                  <label htmlFor="about-section" className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                    Sobre
                  </label>
                  <textarea
                    id="about-section"
                    rows={2}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brasil-blue focus:outline-none font-semibold bg-gray-50 resize-none"
                    placeholder="Descrição da história, missão, valores, equipe"
                  />
                </div>
                <div>
                  <label htmlFor="location-contact" className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                    Localização e Contato
                  </label>
                  <textarea
                    id="location-contact"
                    rows={2}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brasil-blue focus:outline-none font-semibold bg-gray-50 resize-none"
                    placeholder="Endereço, telefone, email"
                  />
                </div>
                <div>
                  <label htmlFor="testimonials" className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                    Testemunhos
                  </label>
                  <textarea
                    id="testimonials"
                    rows={2}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brasil-blue focus:outline-none font-semibold bg-gray-50 resize-none"
                    placeholder="Comentários de clientes, avaliações"
                  />
                </div>
              </div>
              
              <div className="col-span-2">
                <label htmlFor="footer" className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                  Footer
                </label>
                <textarea
                  id="footer"
                  rows={2}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brasil-blue focus:outline-none font-semibold bg-gray-50 resize-none"
                  placeholder="Informações de copyright, links, redes sociais"
                />
              </div>
              
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="flex items-center px-6 py-3 bg-brasil-green text-white font-bold rounded-lg shadow hover:bg-green-700 transition-colors text-base font-montserrat"
                >
                  <i className="fa-solid fa-floppy-disk mr-2"></i>
                  Salvar Configurações
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab Content 3 - Configurações de Reservas */}
        {activeTab === 3 && (
          <div className="tab-content">
            <form onSubmit={(e) => handleSubmit('reservas', e)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label htmlFor="tempo-minimo" className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                    Tempo mínimo para reserva (min)
                  </label>
                  <input
                    id="tempo-minimo"
                    type="number"
                    min="0"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brasil-blue focus:outline-none font-semibold bg-gray-50"
                    placeholder="30"
                  />
                </div>
                <div>
                  <label htmlFor="dias-antecedencia" className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                    Dias de reserva máxima antecipada
                  </label>
                  <input
                    id="dias-antecedencia"
                    type="number"
                    min="1"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brasil-blue focus:outline-none font-semibold bg-gray-50"
                    placeholder="30"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="permite-cancelamento"
                    className="accent-brasil-green w-5 h-5 rounded-md border border-gray-300"
                  />
                  <label htmlFor="permite-cancelamento" className="text-sm font-semibold text-gray-700 font-montserrat">
                    Permitir que os clientes cancelem
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="requer-confirmacao"
                    className="accent-brasil-yellow w-5 h-5 rounded-md border border-gray-300"
                  />
                  <label htmlFor="requer-confirmacao" className="text-sm font-semibold text-gray-700 font-montserrat">
                    Requer confirmação
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="confirmacao-automatica"
                    className="accent-brasil-blue w-5 h-5 rounded-md border border-gray-300"
                  />
                  <label htmlFor="confirmacao-automatica" className="text-sm font-semibold text-gray-700 font-montserrat">
                    Confirmação automática da reserva
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="flex items-center px-6 py-3 bg-brasil-green text-white font-bold rounded-lg shadow hover:bg-green-700 transition-colors text-base font-montserrat"
                >
                  <i className="fa-solid fa-floppy-disk mr-2"></i>
                  Salvar Configurações
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab Content 4 - Configurações de Pagamento */}
        {activeTab === 4 && (
          <div className="tab-content">
            <form onSubmit={(e) => handleSubmit('pagamento', e)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label htmlFor="moeda-sistema" className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                    Moeda do Sistema
                  </label>
                  <select
                    id="moeda-sistema"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brasil-blue focus:outline-none font-semibold bg-gray-50"
                  >
                    <option value="BRL">Real Brasileiro (BRL)</option>
                    <option value="EUR">Euro (EUR)</option>
                    <option value="USD">Dólar Americano (USD)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="taxa-impostos" className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                    Taxa de Impostos (%)
                  </label>
                  <input
                    id="taxa-impostos"
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brasil-blue focus:outline-none font-semibold bg-gray-50"
                    placeholder="10.0"
                  />
                </div>
              </div>
              
              <div className="bg-brasil-yellow/20 border-l-4 border-brasil-yellow px-4 py-3 rounded-lg flex items-center mb-2">
                <i className="fa-solid fa-lock text-brasil-yellow mr-3 text-lg"></i>
                <span className="text-sm font-semibold text-brasil-yellow">
                  Chave de API para o serviço de pagamento EuPago. Esta informação é sensível e deve ser mantida segura.
                </span>
              </div>
              
              <div className="mb-2">
                <label htmlFor="eupago-api-key" className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                  Chave API do EuPago
                </label>
                <input
                  id="eupago-api-key"
                  type="password"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brasil-blue focus:outline-none font-semibold bg-gray-50"
                  placeholder="Insira sua chave API"
                />
                <span className="block text-xs text-gray-400 mt-2">
                  Requer chave API do EuPago para ativação para métodos de pagamento online
                </span>
              </div>
              
              <div className="mb-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                  Métodos de Pagamento
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="metodo-cc"
                      className="accent-brasil-green w-5 h-5 rounded-md border border-gray-300"
                    />
                    <label htmlFor="metodo-cc" className="text-sm text-gray-700 font-montserrat">
                      Cartão de Crédito/Débito
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="metodo-mbway"
                      className="accent-brasil-yellow w-5 h-5 rounded-md border border-gray-300"
                    />
                    <label htmlFor="metodo-mbway" className="text-sm text-gray-700 font-montserrat">
                      MBWay
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="metodo-multibanco"
                      className="accent-brasil-blue w-5 h-5 rounded-md border border-gray-300"
                    />
                    <label htmlFor="metodo-multibanco" className="text-sm text-gray-700 font-montserrat">
                      Multibanco
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="metodo-transferencia"
                      className="accent-brasil-green w-5 h-5 rounded-md border border-gray-300"
                    />
                    <label htmlFor="metodo-transferencia" className="text-sm text-gray-700 font-montserrat">
                      Transferência Bancária
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="metodo-dinheiro"
                      className="accent-brasil-yellow w-5 h-5 rounded-md border border-gray-300"
                    />
                    <label htmlFor="metodo-dinheiro" className="text-sm text-gray-700 font-montserrat">
                      Dinheiro
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="flex items-center px-6 py-3 bg-brasil-green text-white font-bold rounded-lg shadow hover:bg-green-700 transition-colors text-base font-montserrat"
                >
                  <i className="fa-solid fa-floppy-disk mr-2"></i>
                  Salvar Configurações
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab Content 5 - Configurações de Notificações */}
        {activeTab === 5 && (
          <div className="text-center py-16">
            <i className="fa-solid fa-bell text-6xl text-gray-400 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Configurações de Notificações</h3>
            <p className="text-gray-500">Esta seção estará disponível em breve.</p>
          </div>
        )}

        {/* Tab Content 6 - Configurações POS */}
        {activeTab === 6 && (
          <div className="text-center py-16">
            <i className="fa-solid fa-cash-register text-6xl text-gray-400 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Configurações POS</h3>
            <p className="text-gray-500">Esta seção estará disponível em breve.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;