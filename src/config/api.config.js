const API_BASE_URL = 'http://localhost:4000/api';

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

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro na requisição');
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Auth endpoints
    async login(credentials) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    }

    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    // Users endpoints
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
            body: JSON.stringify(userData)
        });
    }

    async updateUser(id, userData) {
        return this.request(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    async deleteUser(id) {
        return this.request(`/users/${id}`, {
            method: 'DELETE'
        });
    }

    // Districts endpoints
    async getDistricts() {
        return this.request('/districts');
    }

    async getDistrict(id) {
        return this.request(`/districts/${id}`);
    }

    async createDistrict(districtData) {
        return this.request('/districts', {
            method: 'POST',
            body: JSON.stringify(districtData)
        });
    }

    async updateDistrict(id, districtData) {
        return this.request(`/districts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(districtData)
        });
    }

    async deleteDistrict(id) {
        return this.request(`/districts/${id}`, {
            method: 'DELETE'
        });
    }

    // Churches endpoints
    async getChurches() {
        return this.request('/churches');
    }

    async getChurch(id) {
        return this.request(`/churches/${id}`);
    }

    async createChurch(churchData) {
        return this.request('/churches', {
            method: 'POST',
            body: JSON.stringify(churchData)
        });
    }

    async updateChurch(id, churchData) {
        return this.request(`/churches/${id}`, {
            method: 'PUT',
            body: JSON.stringify(churchData)
        });
    }

    async deleteChurch(id) {
        return this.request(`/churches/${id}`, {
            method: 'DELETE'
        });
    }

    // Participants endpoints
    async getParticipants() {
        return this.request('/participants');
    }

    async getParticipant(id) {
        return this.request(`/participants/${id}`);
    }

    async createParticipant(participantData) {
        return this.request('/participants', {
            method: 'POST',
            body: JSON.stringify(participantData)
        });
    }

    async updateParticipant(id, participantData) {
        return this.request(`/participants/${id}`, {
            method: 'PUT',
            body: JSON.stringify(participantData)
        });
    }

    async deleteParticipant(id) {
        return this.request(`/participants/${id}`, {
            method: 'DELETE'
        });
    }

    // Transactions endpoints
    async getTransactions() {
        return this.request('/transactions');
    }

    async getTransaction(id) {
        return this.request(`/transactions/${id}`);
    }

    async createTransaction(transactionData) {
        return this.request('/transactions', {
            method: 'POST',
            body: JSON.stringify(transactionData)
        });
    }

    async updateTransaction(id, transactionData) {
        return this.request(`/transactions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(transactionData)
        });
    }

    async deleteTransaction(id) {
        return this.request(`/transactions/${id}`, {
            method: 'DELETE'
        });
    }

    // Dashboard endpoints
    async getDashboardStats() {
        return this.request('/dashboard/stats');
    }
}

export default new ApiService();
