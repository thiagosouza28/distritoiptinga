export class Modal {
    constructor(dashboard) {
        this.dashboard = dashboard;
        this.elements = {};
    }

    setElements(
        profileModal, settingsModal, modalOverlay, modalProfileName, modalProfileEmail, modalProfileRole, langSelect, notificationsCheckbox, modal, modalTitle, modalContent
    ) {
        this.elements = {
            profileModal,
            settingsModal,
            modalOverlay,
            modalProfileName,
            modalProfileEmail,
            modalProfileRole,
            langSelect,
            notificationsCheckbox,
            modal,
            modalTitle,
            modalContent
        };
    }

    openModal(modalId, itemId = null) {
        this.dashboard.currentModal = modalId;
        this.dashboard.selectedItemId = itemId;
    
        this.elements.modalTitle.textContent = (itemId ? 'Editar' : 'Novo') + ' ' + modalId;
        this.renderModalContent(modalId, itemId).then(html => {
            if (this.elements.modalContent) {
                this.elements.modalContent.innerHTML = html;
                this.elements.modal.classList.add('active');
                this.elements.modalOverlay.classList.add('active');
            }
        }).catch(error => {
            console.error("Erro ao carregar o modal", error);
            this.dashboard.showNotification('Erro ao abrir modal: ' + error.message || 'Erro Desconhecido', 'error');
        });
    }
    

    closeModal() {
        if (this.elements.modal) {
            this.elements.modal.classList.remove('active');
            this.elements.modalOverlay.classList.remove('active');
            this.dashboard.currentModal = null;
            this.dashboard.selectedItemId = null;
        }
    }

    openProfileModal() {
        this.openModal('profile', null);
    }

    closeProfileModal() {
        this.closeModal();
    }

    openSettingsModal() {
        this.openModal('settings', null);
    }

    closeSettingsModal() {
        this.closeModal();
    }

    async renderModalContent(modalId, itemId = null) {
        const modalRenderers = {
            'usuario': itemId => this.dashboard.usuarios.renderUsuarioModalContent(itemId),
            'igreja': itemId => this.dashboard.igrejas.renderIgrejaModalContent(itemId),
            'distrito': itemId => this.dashboard.distritos.renderDistritoModalContent(itemId),
            'participante': itemId => this.dashboard.participantes.renderParticipanteModalContent(itemId),
            'transacao': itemId => this.dashboard.transacoes.renderTransacaoModalContent(itemId),
            'profile': itemId => this.dashboard.perfil.renderProfileModalContent(itemId),
            'settings': itemId => this.dashboard.configuracoes.renderSettingsModalContent(itemId)
        };
    
        const renderer = modalRenderers[modalId];
    
        if (renderer) {
            try {
                return await renderer(itemId);
            } catch (error) {
                console.error(`Erro ao renderizar o modal ${modalId}:`, error);
                this.dashboard.showNotification(`Erro ao renderizar o modal ${modalId}: ${error.message || 'Erro Desconhecido'}`, 'error');
                return `<div>Erro ao carregar o modal ${modalId}</div>`;
            }
        } else {
            console.error(`Renderizador não encontrado para o modal: ${modalId}`);
            this.dashboard.showNotification(`Renderizador não encontrado para o modal: ${modalId}`, 'error');
            return '<div>Erro: Modal não encontrado.</div>';
        }
    }

    updateModalProfile(userData) {
        if (userData && this.elements.modalProfileName && this.elements.modalProfileEmail && this.elements.modalProfileRole) {
            this.elements.modalProfileName.textContent = userData.nome || 'Usuário';
            this.elements.modalProfileEmail.textContent = userData.email || 'Email não definido';
            this.elements.modalProfileRole.textContent = userData.cargo || 'Cargo não definido';
        }
    }

    handleLanguageChange() {
        if (this.elements.langSelect) {
            const selectedLanguage = this.elements.langSelect.value;
            console.log('Idioma selecionado:', selectedLanguage);
            // Aqui você pode salvar ou usar o valor selecionado
        }
    }

    handleNotificationChange() {
        if (this.elements.notificationsCheckbox) {
            const notificationsEnabled = this.elements.notificationsCheckbox.checked;
            console.log('Notificações habilitadas:', notificationsEnabled);
            // Aqui você pode salvar ou usar o valor selecionado
        }
    }
}