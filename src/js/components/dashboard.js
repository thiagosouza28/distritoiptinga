import { Usuarios } from './usuarios.js';
import { Igrejas } from './igrejas.js';
import { Participantes } from './participantes.js';
import { Transacoes } from './transacoes.js';
import { Perfil } from './perfil.js';
import { Configuracoes } from './configuracoes.js';
import { Modal } from './modal.js';

export default class Dashboard {
    constructor() {
        this.currentPage = 'usuarios';
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
        };
        // Passa os elementos para o modal
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
        // Navegação
        this.elements.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.currentTarget.getAttribute('data-page');
                this.handleNavigation(page);
            });
        });
        // Logout
        this.elements.logoutBtn.addEventListener('click', this.handleLogout.bind(this));
        document.getElementById('logoutBtnTop').addEventListener('click', this.handleLogout.bind(this));
        // Menu hamburguer
        this.elements.sidebarCollapse.addEventListener('click', this.toggleSidebar.bind(this));
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

            // Carrega as igrejas se a página for de transações
            if (page === 'transacoes') {
                try {
                    this.igrejasData = await this.fetchItems('igrejas');
                } catch (error) {
                    console.error('Erro ao carregar igrejas:', error);
                    this.showNotification('Erro ao carregar lista de igrejas', 'error');
                    return;
                }
            }

            if (this.userRole === 'diretor_jovem' && page === 'participantes') {
                queryParams = {
                    igreja: this.userChurch,
                    usuario: this.userId
                };
                endpoint += '?' + new URLSearchParams(queryParams).toString();
            }

            const response = await this.makeRequest(endpoint);
            if (response.ok) {
                const data = await response.json();
                 if (page === 'transacoes') {
                   this.renderPage(page, data, this.igrejasData);
                 } else {
                   this.renderPage(page, data);
                }
            } else {
                const errorData = await response.json();
                throw new Error(`Erro na requisição para ${endpoint}: ${errorData.message || 'Erro Desconhecido'}`);
            }
        } catch (error) {
            console.error(`Erro ao carregar a página ${page}:`, error);
            this.showNotification(`Erro ao carregar a página ${page}`, 'error');
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

    // Métodos auxiliares
    async makeRequest(endpoint, options = {}) {
        const token = localStorage.getItem('token');
        const defaultOptions = {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
    
        let url = `${this.baseUrl}${endpoint}`;
        if (options.params) {
            const queryParams = new URLSearchParams(options.params).toString();
            url += `?${queryParams}`;
        }
    
        try {
            const response = await fetch(url, {
                ...defaultOptions,
                ...options,
                body: options.body ? JSON.stringify(options.body) : null
            });
    
            if (!response.ok) {
                let errorMsg = `Erro na requisição para ${url}: Status ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMsg += `: ${errorData.message || 'Erro Desconhecido'}`;
                } catch (e) {
                    errorMsg += ' - Resposta não é um JSON válido';
                }
                throw new Error(errorMsg);
            }
    
            // Verifica se a resposta tem conteúdo antes de tentar fazer o parse
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                return await response.json();
            } else {
                return null; // Retorna null se a resposta não for JSON
            }
        } catch (error) {
            console.error(`Erro na requisição para ${url}:`, error);
            throw error;
        }
    }

    showLoading() {
        const spinner = document.querySelector('.loading-spinner');
        if (spinner) spinner.style.display = 'flex';
    }

    hideLoading() {
        const spinner = document.querySelector('.loading-spinner');
        if (spinner) spinner.style.display = 'none';
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
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
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

    // Métodos de modal
    openModal(modalId, itemId = null) {
        this.modal.openModal(modalId, itemId);
    }

    closeModal() {
        this.modal.closeModal();
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

        // Adiciona o id da igreja ao objeto de dados, se disponível
        const selectIgreja = form.querySelector('#igreja');
        if (selectIgreja) {
            const selectedIgrejaId = selectIgreja.value;
            if (selectedIgrejaId) {
                data.igreja = selectedIgrejaId;
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
                method,
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

        const response = await this.makeRequest(endpoint);
        if (!response.ok) {
            throw new Error(`Erro ao carregar o item ${itemId} de ${page}`);
        }
        return response.json();
    }

    async fetchItems(page) {
        const response = await this.makeRequest(`/${page}`);
        if (!response.ok) {
            throw new Error(`Erro ao carregar itens de ${page}`);
        }
        return response.json();
    }

    formatDateForInput(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}
