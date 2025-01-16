import { Usuarios } from './usuarios.js';
import { Igrejas } from './igrejas.js';
import { Participantes } from './participantes.js';
import { Transacoes } from './transacoes.js';
import { Perfil } from './perfil.js';
import { Configuracoes } from './configuracoes.js';
import { Modal } from './modal.js';

export default class Dashboard {
    constructor() {
        this.currentPage = 'transacoes';
        this.baseUrl = 'https://api-ckry.onrender.com/api';
        this.userRole = null;
        this.userId = null;
        this.userChurch = null;
        this.modal = new Modal(this);
        this.usuarios = new Usuarios(this);
        this.igrejas = new Igrejas(this);
        this.participantes = new Participantes(this);
        this.transacoes = new Transacoes(this);
        this.perfil = new Perfil(this);
        this.configuracoes = new Configuracoes(this);
        this.selectedItemId = null;
        this.initializeElements();
        this.initializeEventListeners();
        this.checkAuth();
    }

    initializeElements() {
        this.elements = {
            sidebar: document.getElementById('sidebar'),
            content: document.getElementById('content'),
            navLinks: document.querySelectorAll('.nav-links .nav-item a'),
            logoutBtn: document.getElementById('logoutBtn'),
            sidebarCollapse: document.getElementById('sidebarCollapse'),
            userInfo: {
                name: document.getElementById('userName'),
                role: document.getElementById('userRole'),
                avatar: document.getElementById('userAvatar')
            },
            loadingSpinner: document.querySelector('.loading-spinner'),
             confirmationModal: document.getElementById('confirmationModal'),
        };
        this.modal.setElements(
            document.getElementById('profileModal'),
            document.getElementById('settingsModal'),
            document.querySelector('.modal-overlay'),
            document.getElementById('modalProfileName'),
            document.getElementById('modalProfileEmail'),
            document.getElementById('modalProfileRole'),
            document.getElementById('lang'),
            document.getElementById('notifications'),
            document.querySelector('.modal'),
            document.querySelector('.modal-header h2'),
            document.querySelector('.modal-body')
        );
    }

    initializeEventListeners() {
        this.elements.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.currentTarget.getAttribute('data-page');
                this.handleNavigation(page);
            });
        });
        this.elements.logoutBtn.addEventListener('click', () => this.handleLogout());
        document.getElementById('logoutBtnTop').addEventListener('click', () => this.handleLogout());
        this.elements.sidebarCollapse.addEventListener('click', () => this.toggleSidebar());

    }

    async checkAuth() {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/index.html';
            return;
        }
        await this.loadUserInfo();
        await this.loadPage(this.currentPage);
    }

    async confirmPayment(participanteId) {
        try {
             this.showConfirmationModal("Processando Pagamento", 'Aguarde enquanto confirmamos o pagamento...');
            const response = await this.makeRequest(`/participantes/${participanteId}/confirmar-pagamento`, {
                method: 'PUT'
            });
            if (response.ok) {
                 this.showConfirmationModal('Pagamento confirmado com sucesso!', 'Pagamento confirmado com sucesso!');
                await this.loadPage('participantes');
            } else {
                 const errorData = await response.json();
                 this.showNotification(`Erro ao confirmar pagamento: ${errorData.message || 'Erro Desconhecido'}`, 'error');
             }
        } catch (error) {
             console.error('Erro ao confirmar pagamento:', error);
             this.showNotification('Erro ao confirmar pagamento', 'error');
         } finally {
             this.hideConfirmationModal();
        }
    }

    async unconfirmPayment(id_participante) {
        try {
              this.showConfirmationModal("Processando Cancelamento", 'Aguarde enquanto cancelamos a confirmação de pagamento...');
            const response = await this.makeRequest(`/participantes/${id_participante}/cancelar-confirmacao`, {
                method: 'PUT'
            });

             if (response.ok) {
                 this.showConfirmationModal('Confirmação de pagamento cancelada!', 'Confirmação de pagamento cancelada com sucesso!');
                await this.loadPage('participantes');
            } else {
                 const errorData = await response.json();
                this.showNotification(`Erro ao cancelar confirmação de pagamento: ${errorData.message || 'Erro Desconhecido'}`, 'error');
            }
       } catch (error) {
            console.error('Erro ao cancelar confirmação de pagamento:', error);
             this.showNotification('Erro ao cancelar confirmação de pagamento', 'error');
        } finally {
            this.hideConfirmationModal();
       }
    }
   
    async deleteItem(page, itemId) {
        if (!confirm(`Tem certeza que deseja excluir este item?`)) {
            return;
       }

        try {
          this.showConfirmationModal("Processando Exclusão", 'Aguarde enquanto excluímos o item...');
            const response = await this.makeRequest(`/${page}/${itemId}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                this.showNotification(`Item excluído com sucesso da página ${page}!`, 'success');
                await this.loadPage(page);
           } else {
                const errorData = await response.json();
                this.showNotification(`Erro ao excluir item da página ${page}: ${errorData.message || 'Erro Desconhecido'}`, 'error');
            }
       } catch (error) {
           console.error(`Erro ao excluir item da página ${page}:`, error);
           this.showNotification(`Erro ao excluir item da página ${page}: ${error.message || 'Erro Desconhecido'}`, 'error');
       } finally {
          this.hideConfirmationModal();
       }
    }

    async toggleConfirmPayment(id_participante) {
        if (!confirm(`Tem certeza que deseja alterar o status de pagamento deste participante?`)) {
            return;
        }

        try {
            const participante = await this.fetchItem('participantes', id_participante);
            if (!participante) {
                this.showNotification('Participante não encontrado', 'error');
                return;
            }

            if (participante.data_confirmacao) {
                await this.unconfirmPayment(id_participante);
            } else {
                await this.confirmPayment(id_participante);
            }
        } catch (error) {
            console.error('Erro ao alterar status de pagamento:', error);
           this.showNotification('Erro ao alterar status de pagamento', 'error');
       }
    }

    async loadUserInfo() {
        try {
            const response = await this.makeRequest('/auth/profile');
            if (response.ok) {
                const userData = await response.json();
                this.userRole = userData.cargo;
                this.userId = userData._id;
                this.userChurch = userData.igreja;
                this.updateUserInterface(userData);
                this.updateModalProfile(userData);
                this.filterNavigation();
            }
        } catch (error) {
            console.error('Erro ao carregar dados do usuário:', error);
            this.showNotification('Erro ao carregar dados do usuário', 'error');
        }
    }

    updateUserInterface(userData) {
        if (userData) {
            this.elements.userInfo.name.textContent = userData.nome || 'Usuário';
            this.elements.userInfo.role.textContent = userData.cargo || 'Cargo não definido';
            if (userData.avatar) {
                this.elements.userInfo.avatar.src = userData.avatar;
            } else {
                this.elements.userInfo.avatar.src = 'assets/default-avatar.png';
            }
        }
    }

    updateModalProfile(userData) {
        this.modal.updateModalProfile(userData);
    }

    filterNavigation() {
        const navLinks = Array.from(this.elements.navLinks);
        navLinks.forEach(link => {
            link.parentElement.style.display = 'none';
        });

        if (this.userRole === 'diretor_jovem') {
            const participantesLink = navLinks.find(link => link.getAttribute('data-page') === 'participantes');
            if (participantesLink) {
                participantesLink.parentElement.style.display = 'block';
            }
        } else {
            navLinks.forEach(link => {
                link.parentElement.style.display = 'block';
            });
        }
    }

    async handleNavigation(page) {
        this.elements.navLinks.forEach(link => {
            link.parentElement.classList.remove('active');
            if (link.getAttribute('data-page') === page) {
                link.parentElement.classList.add('active');
            }
        });

        this.currentPage = page;
        await this.loadPage(page);
    }

    async loadPage(page) {
        try {
            this.showLoading();
            let endpoint = `/${page}`;
            let queryParams = {};

            if (page === 'transacoes') {
                try {
                    this.igrejasData = await this.fetchItems('igrejas');
                } catch (error) {
                    console.error('Erro ao carregar igrejas:', error);
                    this.showNotification('Erro ao carregar lista de igrejas', 'error');
                    return;
                }
            }


             if (page === 'participantes' && this.userRole === 'diretor_jovem' && this.userChurch ) {
                queryParams = {
                    igreja: this.userChurch,
                 };
                endpoint += '?' + new URLSearchParams(queryParams).toString();
            }

            console.log(`Chamando: ${endpoint}`);
            const response = await this.makeRequest(endpoint);

            if (response && response.ok) {
                const data = await response.json();
                if (page === 'transacoes' && typeof data === 'object' && data.transactions && Array.isArray(data.transactions)) {
                    this.renderPage(page, data.transactions, this.igrejasData);
                } else {
                    this.renderPage(page, data);
               }
           }
            else {
                let errorMessage = `Erro na requisição para ${endpoint}: `;
               if(response){
                   try {
                       const errorData = await response.json();
                       errorMessage += errorData.message || 'Erro Desconhecido';
                   } catch (error) {
                       errorMessage +=  'Erro ao processar resposta do servidor';
                   }
               } else {
                    errorMessage += 'Sem resposta do servidor';
               }
                throw new Error(errorMessage);
            }
       } catch (error) {
           console.error(`Erro ao carregar a página ${page}:`, error);
           this.showNotification(`Erro ao carregar a página ${page}: ${error.message || 'Erro Desconhecido'}`, 'error');
       } finally {
            this.hideLoading();
       }
    }

    renderPage(page, data, igrejasData = null) {
         let html;
        switch (page) {
            case 'usuarios':
                html = this.usuarios.renderUsuarios(data);
                break;
            case 'igrejas':
                html = this.igrejas.renderIgrejas(data);
                break;
             case 'participantes':
                html = this.participantes.renderParticipantes(data);
                break;
             case 'transacoes':
                html = this.transacoes.renderTransacoes(data, igrejasData);
                break;
            default:
                html = '<div>Página não encontrada</div>';
                break;
        }

        this.elements.content.innerHTML = html;
    }

    async makeRequest(endpoint, options = {}) {
        const token = localStorage.getItem('token');
        const defaultOptions = {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...defaultOptions,
                ...options
            });
            if (!response.ok) {
                const errorData = await response.json()
                 throw new Error(`Erro na requisição para ${endpoint}: ${errorData.message || 'Erro Desconhecido'}`);
            }
           return response;
        } catch (error) {
           console.error(`Erro na requisição para ${endpoint}:`, error);
            throw error;
        }
    }

    showLoading() {
       if (this.elements.loadingSpinner) {
          this.elements.loadingSpinner.style.display = 'flex';
      }
   }

    hideLoading() {
         if(this.elements.loadingSpinner){
           this.elements.loadingSpinner.style.display = 'none';
       }
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    formatCurrency(value) {
        if (typeof value === 'number') {
            return value.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });
        } else {
           return 'Valor Inválido';
        }
    }

    calculateAge(birthDate) {
        const birth = new Date(birthDate);
        const today = new Date();
       let age = today.getFullYear() - birth.getFullYear();
        if (
            today.getMonth() - birth.getMonth() <= 0 &&
           today.getDate() - birth.getDate() <= 0
        ) age--;
        return age;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
       notification.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
            ${message}
       `;
       document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }


    handleLogout() {
        localStorage.removeItem('token');
        window.location.href = '/index.html';
    }

    toggleSidebar() {
        this.elements.sidebar.classList.toggle('active');
    }

     openModal(modalId, itemId = null) {
         this.selectedItemId = itemId;
        this.modal.openModal(modalId, itemId);
    }

     closeModal() {
         this.modal.closeModal();
        this.selectedItemId = null;
    }

    openProfileModal() {
        this.modal.openProfileModal();
    }

    closeProfileModal() {
        this.modal.closeProfileModal();
    }

    openSettingsModal() {
       this.modal.openSettingsModal();
    }

    closeSettingsModal() {
       this.modal.closeSettingsModal();
   }


   async handleFormSubmit(e, page) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        const selectIgreja = form.querySelector('#igreja');
        if(selectIgreja && selectIgreja.value) {
             const selectedIgrejaId = selectIgreja.value;
           if (selectedIgrejaId) {
                data.id_igreja = selectedIgrejaId;
                data.igreja = selectIgreja.options[selectIgreja.selectedIndex].text;
            }
       }

      try {
            let method = 'POST';
            let url = `/${page}`;
           if (this.selectedItemId) {
                method = 'PUT';
               url += `/${this.selectedItemId}`;
            }

            const response = await this.makeRequest(url, {
               method: method,
              body: JSON.stringify(data)
          });

           if (response.ok) {
                this.showNotification(`Item ${this.selectedItemId ? 'atualizado' : 'adicionado'} com sucesso na página ${page}!`, 'success');
               this.closeModal();
               await this.loadPage(page);
            } else {
                const errorData = await response.json();
                this.showNotification(`Erro ao ${this.selectedItemId ? 'atualizar' : 'adicionar'} item na página ${page}: ${errorData.message || 'Erro Desconhecido'}`, 'error');
           }
       } catch (error) {
           console.error(`Erro ao ${this.selectedItemId ? 'atualizar' : 'adicionar'} item na página ${page}:`, error);
            this.showNotification(`Erro ao ${this.selectedItemId ? 'atualizar' : 'adicionar'} item na página ${page}: ${error.message || 'Erro Desconhecido'}`, 'error');
        }
   }

  isValidObjectId(id) {
        const ObjectId = (m = (id) => {
            if (!m.Types.ObjectId.isValid(id)) {
                throw new Error('ID inválido');
           }
             return id;
       })(mongoose);

        try {
           ObjectId(id);
           return true;
       } catch (error) {
           return false;
        }
   }

    async deleteItem(page, itemId) {
        if (!confirm(`Tem certeza que deseja excluir este item?`)) {
            return;
        }
         try {
             const response = await this.makeRequest(`/${page}/${itemId}`, {
                method: 'DELETE'
           });
            if (response.ok) {
                 this.showNotification(`Item excluído com sucesso da página ${page}!`, 'success');
               await this.loadPage(page);
           } else {
               const errorData = await response.json();
               this.showNotification(`Erro ao excluir item da página ${page}: ${errorData.message || 'Erro Desconhecido'}`, 'error');
           }
       } catch (error) {
           console.error(`Erro ao excluir item da página ${page}:`, error);
           this.showNotification(`Erro ao excluir item da página ${page}: ${error.message || 'Erro Desconhecido'}`, 'error');
        } finally {
             this.hideConfirmationModal();
        }
    }
    handleLanguageChange() {
        this.modal.handleLanguageChange();
    }

     handleNotificationChange() {
        this.modal.handleNotificationChange();
    }

     async fetchItem(page, itemId = null) {
        let endpoint = `/${page}`;
        if (itemId) {
           endpoint += `/${itemId}`;
       }
        else if (page !== 'usuarios' && page !== 'transacoes' && page !== 'igrejas' && page !== 'participantes') {
            throw new Error(`ID do item é obrigatório para a página ${page}`);
       }

        const response = await this.makeRequest(endpoint);
        if (!response.ok) {
            throw new Error(`Erro ao carregar o item ${itemId} de ${page}`);
        }
        return response.json();
    }

     async fetchItems(page) {
        try {
            const response = await this.makeRequest(`/${page}`);
           if (!response.ok) {
                throw new Error(`Erro ao carregar itens de ${page}`);
          }
           return response.json();
        }
       catch(error){
             console.error(`Erro ao buscar itens de ${page}:`, error)
            this.showNotification(`Erro ao buscar itens de ${page}`, 'error');
       }
    }

   formatDateForInput(dateString) {
         if (!dateString) return '';
        const date = new Date(dateString);
       const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }


    async updateItem(resource, itemId, data) {
        try {
            const response = await this.makeRequest(`/${resource}/${itemId}`, {
                method: 'PUT',
               body: JSON.stringify(data)
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.error || `Erro ao atualizar ${resource}.`);
            }

            this.showNotification(`${resource.charAt(0).toUpperCase() + resource.slice(1)} atualizado(a) com sucesso!`, 'success');
            this.closeModal();
            this.loadPage(this.currentPage);
           return responseData;
        } catch (error) {
           console.error(`Erro ao atualizar ${resource}:`, error);
            this.showNotification(error.message, 'error');
        }
    }

    showProcessingPaymentOverlay() {
        const overlay = document.getElementById('processingPaymentOverlay');
        if(overlay) overlay.style.display = 'flex';
      }
   
    hideProcessingPaymentOverlay() {
       const overlay = document.getElementById('processingPaymentOverlay');
        if(overlay) overlay.style.display = 'none';
    }
    
     showConfirmationModal(title, message){
        const modal = document.getElementById('confirmationModal');
          if(modal){
             modal.style.display = 'flex';
           const modalTitle = modal.querySelector('#confirmationModalLabel');
            const modalBody = modal.querySelector('.modal-body p');
          if(modalTitle) modalTitle.textContent = title;
           if(modalBody) modalBody.textContent = message;
          const button = document.createElement('button');
           button.textContent = 'Nova Inscrição';
          button.className = 'btn';
           button.onclick = () => {
            this.hideConfirmationModal();
          };
          modal.querySelector('.modal-body').appendChild(button);
        }
    }

     hideConfirmationModal() {
        const modal = document.getElementById('confirmationModal');
       if (modal) {
            modal.style.display = 'none';
            const modalBody = modal.querySelector('.modal-body');
            const existingButton = modalBody.querySelector('.btn');
             if (existingButton) {
                 modalBody.removeChild(existingButton);
            }
        }
    }
}
