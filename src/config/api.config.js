const API_BASE_URL = 'https://api-ckry.onrender.com';

class ApiService {
    constructor() {
        this.baseUrl = API_BASE_URL;
    }

    async request(endpoint, options = {}) {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers
        };

        let url = `${this.baseUrl}${endpoint}`;

        // Adiciona query parameters, se existirem
        if (options.params) {
            const queryParams = new URLSearchParams(options.params).toString();
            url += `?${queryParams}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers,
                body: options.body ? JSON.stringify(options.body) : null
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Erro na requisição para ${url}: ${response.status}`);
            }

            // Trata respostas vazias (204 No Content)
            return response.status === 204 ? null : response.json();
        } catch (error) {
            console.error('Erro na API:', error);
            throw error;
        }
    }

    // Autenticação
    async login(credentials) {
        return this.request('/auth/login', {
            method: 'POST',
            body: credentials
        });
    }

    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: userData
        });
    }

    // Usuários
    async getProfile() {
        return this.request('/users/profile');
    }

    async getUsers() {
        return this.request('/users');
    }

    async getUser(id) {
        return this.request(`/users/${id}`);
    }

    async createUser(userData) {
        return this.request('/users', {
            method: 'POST',
            body: userData
        });
    }

    async updateUser(id, userData) {
        return this.request(`/users/${id}`, {
            method: 'PUT',
            body: userData
        });
    }

    async deleteUser(id) {
        return this.request(`/users/${id}`, {
            method: 'DELETE'
        });
    }

    // Distritos (removido, pois não é mais usado)

    // Igrejas
    async getChurches() {
        return this.request('/igrejas');
    }

    async getChurch(id) {
        return this.request(`/igrejas/${id}`);
    }

    async createChurch(churchData) {
        return this.request('/igrejas', {
            method: 'POST',
            body: churchData
        });
    }

    async updateChurch(id, churchData) {
        return this.request(`/igrejas/${id}`, {
            method: 'PUT',
            body: churchData
        });
    }

    async deleteChurch(id) {
        return this.request(`/igrejas/${id}`, {
            method: 'DELETE'
        });
    }

    // Participantes
    async getParticipants() {
        return this.request('/participantes');
    }

    async getParticipant(id) {
        return this.request(`/participantes/${id}`);
    }

    async createParticipant(participantData) {
        return this.request('/participantes', {
            method: 'POST',
            body: participantData
        });
    }

    async updateParticipant(id, participantData) {
        return this.request(`/participantes/${id}`, {
            method: 'PUT',
            body: participantData
        });
    }

    async deleteParticipant(id) {
        return this.request(`/participantes/${id}`, {
            method: 'DELETE'
        });
    }
    
    async confirmPayment(participantId) {
        return this.request(`/participantes/${participanteId}/confirmar-pagamento`, {
            method: 'PUT'
        });
    }

    async unconfirmPayment(participantId) {
        return this.request(`/participantes/${participanteId}/confirmar-pagamento`, {
            method: 'DELETE'
        });
    }

    // Transações
    async getTransactions() {
        return this.request('/transacoes');
    }

    async getTransaction(id) {
        return this.request(`/transacoes/${id}`);
    }

    async createTransaction(transactionData) {
        return this.request('/transacoes', {
            method: 'POST',
            body: transactionData
        });
    }

    async updateTransaction(id, transactionData) {
        return this.request(`/transacoes/${id}`, {
            method: 'PUT',
            body: transactionData
        });
    }

    async deleteTransaction(id) {
        return this.request(`/transacoes/${id}`, {
            method: 'DELETE'
        });
    }

    // Dashboard
    async getDashboardStats() {
        return this.request('/dashboard/stats');
    }
}

export default new ApiService();
