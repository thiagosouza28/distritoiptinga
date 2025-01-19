export class Participantes {
    constructor(dashboard) {
        this.dashboard = dashboard;
    }

   renderParticipantes(data) {
        return `
            <div class="page-header">
                <h2>Participantes</h2>
                <button class="btn-add" onclick="dashboard.openModal('participante', null)">
                    <i class="fas fa-plus"></i> Novo Participante
                </button>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nome</th>
                            <th>Data de Nascimento</th>
                            <th>Idade</th>
                            <th>Igreja</th>
                            <th>Data de Inscrição</th>
                            <th>Data de Confirmação</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
dd/mm/aaaa: ${data.map(participante => {
    const dataNascimento = participante.nascimento ? new Date(participante.nascimento) : null;
    const dataFormatada = dataNascimento 
        ? `${dataNascimento.getDate().toString().padStart(2, '0')}/${(dataNascimento.getMonth() + 1).toString().padStart(2, '0')}/${dataNascimento.getFullYear()}`
        : 'N/A';
    const idade = dataNascimento ? this.dashboard.calculateAge(dataNascimento) : 'N/A';

    return {
                                <tr>
                                    <td>${participante.id_participante || 'N/A'}</td>
                                    <td>${participante.nome}</td>
                                    <td>${dataFormatada}</td>
                                    <td>${idade}</td>
                                    <td>${participante.id_usuario ? participante.id_usuario.nome : 'N/A'}</td>
                                    <td>${participante.id_usuario ? participante.id_usuario.email : 'N/A'}</td>
                                    <td>${participante.igreja ? participante.igreja.igreja : 'N/A'}</td>
                                    <td>${participante.data_inscricao ? this.dashboard.formatDate(participante.data_inscricao) : 'N/A'}</td>
                                    <td>${participante.data_confirmacao ? this.dashboard.formatDate(participante.data_confirmacao) : 'Pendente'}</td>
                                    <td class="actions">
                                        <button onclick="dashboard.openModal('participante', '${participante.id_participante}')" class="btn-edit">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button onclick="dashboard.deleteItem('participantes', '${participante.id_participante}')" class="btn-delete">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                        <button onclick="dashboard.confirmPayment('${participante.id_participante}')" class="btn-confirm">
                                            <i class="fas fa-check"></i> Confirmar Pagamento
                                        </button>
                                    </td>
                                </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>`;
    }

    async renderParticipanteModalContent(itemId = null) {
        let html = `
            <form id="participanteForm">
                <div class="input-group">
                    <label for="nome">Nome:</label>
                    <input type="text" id="nome" name="nome" required>
                </div>
                <div class="input-group">
                    <label for="email">Email:</label>
                    <input type="email" id="email" name="email" required>
                </div>
                <div class="input-group">
                    <label for="nascimento">Data de Nascimento:</label>
                    <input type="date" id="nascimento" name="nascimento" required>
                </div>
                <div class="input-group">
                    <label for="igreja">Igreja:</label>
                    <select id="igreja" name="igreja" required>
                        <option value="">Selecione uma Igreja</option>
                    </select>
                </div>
                <button type="submit" class="btn-submit">${itemId ? 'Salvar' : 'Adicionar'} Participante</button>
            </form>`;

        if (itemId) {
            try {
                const participante = await this.dashboard.fetchItem('participantes', itemId);
                const igrejas = await this.dashboard.fetchItem('igrejas');
                const options = igrejas.map(igreja => {
                    const isSelected = participante.igreja && participante.igreja === igreja.igreja;
                    return `<option value="${igreja.igreja}" ${isSelected ? 'selected' : ''}>${igreja.igreja}</option>`;
                }).join('');

                html = `
                    <form id="participanteForm">
                        <div class="input-group">
                            <label for="nome">Nome:</label>
                            <input type="text" id="nome" name="nome" value="${participante.nome}" required>
                        </div>
                        <div class="input-group">
                            <label for="email">Email:</label>
                            <input type="email" id="email" name="email" value="${participante.email}" required>
                        </div>
                        <div class="input-group">
                            <label for="nascimento">Data de Nascimento:</label>
                            <input type="date" id="nascimento" name="nascimento" value="${participante.nascimento ? this.dashboard.formatDateForInput(participante.nascimento) : ''}" required>
                        </div>
                        <div class="input-group">
                            <label for="igreja">Igreja:</label>
                            <select id="igreja" name="igreja" required>
                                ${options}
                            </select>
                        </div>
                        <button type="submit" class="btn-submit">Salvar Participante</button>
                    </form>
                `;
            } catch (error) {
                console.error('Erro ao carregar participante para edição:', error);
                this.dashboard.showNotification('Erro ao carregar participante para edição', 'error');
            }
        }

        setTimeout(async () => {
            const form = document.getElementById('participanteForm');
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const selectIgreja = document.getElementById('igreja');
                    const selectedIgrejaId = selectIgreja.value;
                    const formData = new FormData(form);

                    if (!selectedIgrejaId) {
                        this.dashboard.showNotification('Por favor, selecione uma igreja.', 'error');
                        return;
                    }

                    // Aqui você vai pegar o ID do usuário logado
                    const userId = this.dashboard.userId;

                    const data = {
                        nome: formData.get('nome'),
                        email: formData.get('email'),
                        nascimento: formData.get('nascimento'),
                        igreja: selectedIgrejaId,
                        igreja: selectIgreja.options[selectIgreja.selectedIndex].text,
                        idade: this.dashboard.calculateAge(formData.get('nascimento')),
                        id_usuario: userId
                    };

                    try {
                        let method = 'POST';
                        let url = '/participantes';
                        if (itemId) {
                            method = 'PUT';
                            url += `/${itemId}`;
                        }

                        const response = await this.dashboard.makeRequest(url, {
                            method,
                            body: JSON.stringify(data)
                        });

                        if (response.ok) {
                            this.dashboard.showNotification(`Participante ${itemId ? 'atualizado' : 'adicionado'} com sucesso!`, 'success');
                            this.dashboard.closeModal();
                            await this.dashboard.loadPage('participantes');
                        } else {
                            const errorData = await response.json();
                            this.dashboard.showNotification(`Erro ao ${itemId ? 'atualizar' : 'adicionar'} participante: ${errorData.message || 'Erro Desconhecido'}`, 'error');
                        }
                    } catch (error) {
                        console.error(`Erro ao ${itemId ? 'atualizar' : 'adicionar'} participante:`, error);
                        this.dashboard.showNotification(`Erro ao ${itemId ? 'atualizar' : 'adicionar'} participante: ${error.message || 'Erro Desconhecido'}`, 'error');
                    }
                });
            }

            // Carrega as igrejas
            try {
                const igrejas = await this.dashboard.fetchItem('igrejas');
                const selectIgreja = document.getElementById('igreja');
                if (selectIgreja) {
                    igrejas.forEach(igreja => {
                        const option = document.createElement('option');
                        option.value = igreja.igreja;
                        option.text = igreja.igreja;
                        selectIgreja.appendChild(option);
                    });
                }
            } catch (error) {
                console.error('Erro ao carregar igrejas:', error);
                this.dashboard.showNotification('Erro ao carregar igrejas', 'error');
            }
        }, 0);

        return html;
    }
}
