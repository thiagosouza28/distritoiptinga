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
                        ${data.map(participante => this.renderParticipanteRow(participante)).join('')}
                    </tbody>
                </table>
            </div>`;
    }

    renderParticipanteRow(participante) {
        const dataNascimento = participante.nascimento ? new Date(participante.nascimento) : null;
        const dataFormatada = dataNascimento
            ? this.dashboard.formatDate(participante.nascimento)
            : 'N/A';
        const idade = dataNascimento ? this.dashboard.calculateAge(participante.nascimento) : 'N/A';
        const igrejaNome = participante.igreja ? participante.igreja.igreja : 'N/A'; // Corrected to use 'nome'
        const dataInscricaoFormatada = participante.data_inscricao ? this.dashboard.formatDate(participante.data_inscricao) : 'N/A';
        const dataConfirmacaoFormatada = participante.data_confirmacao ? this.dashboard.formatDate(participante.data_confirmacao) : 'Pendente';


        return `
            <tr>
                <td>${participante.id_participante || 'N/A'}</td>
                <td>${participante.nome}</td>
                <td>${dataFormatada}</td>
                <td>${idade}</td>
                <td>${igrejaNome}</td>  <!-- Corrected to use igreja.nome -->
                <td>${dataInscricaoFormatada}</td>
                <td>${dataConfirmacaoFormatada}</td>
                <td class="actions">
                    <button onclick="dashboard.openModal('participante', '${participante.id_participante}')" class="btn-edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="dashboard.deleteItem('participantes', '${participante.id_participante}')" class="btn-delete">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button onclick="dashboard.toggleConfirmPayment('${participante.id_participante}')" class="btn-confirm">
                        <i class="fas fa-${participante.data_confirmacao ? 'times' : 'check'}"></i> ${participante.data_confirmacao ? 'Cancelar Confirmação' : 'Confirmar Pagamento'}
                    </button>
                </td>
            </tr>`;
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
                const igrejas = await this.dashboard.fetchItems('igrejas'); // fetchItems instead of fetchItem

                const options = igrejas.map(igreja => `<option value="${igreja._id}" ${participante.igreja && participante.igreja._id === igreja._id ? 'selected' : ''}>${igreja.nome}</option>`).join('');

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
                            <input type="date" id="nascimento" name="nascimento" value="${this.dashboard.formatDateForInput(participante.nascimento)}" required>
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
                    const formData = new FormData(form);
                    const data = {
                        nome: formData.get('nome'),
                        email: formData.get('email'),
                        nascimento: formData.get('nascimento'),
                        igreja: formData.get('igreja'), // Get the church ID
                        id_usuario: this.dashboard.userId
                    };

                    try {
                        await this.dashboard.handleFormSubmit(e, 'participantes', data); // Use the dashboard's function
                    } catch (error) {
                        console.error("Erro no handleSubmit:", error);
                        this.dashboard.showNotification("Erro ao salvar o participante.", "error");
                    }
                });
            }

            // Carrega as igrejas
            try {
                const igrejas = await this.dashboard.fetchItems('igrejas');
                const selectIgreja = document.getElementById('igreja');
                if (selectIgreja) {
                    igrejas.forEach(igreja => {
                        const option = document.createElement('option');
                        option.value = igreja._id; // Use the _id
                        option.text = igreja.igreja; // Use the nome
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
