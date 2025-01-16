export class Transacoes {
    constructor(dashboard) {
        this.dashboard = dashboard;
    }

 renderTransacoes(data) {
        return `
            <div class="page-header">
                <h2>Transações</h2>
                <button class="btn-add" onclick="dashboard.openModal('transacao', null)">
                    <i class="fas fa-plus"></i> Nova Transação
                </button>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Descrição</th>
                            <th>Tipo</th>
                            <th>Valor</th>
                            <th>Igreja</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(transacao => {
                            const valorNumerico = parseFloat(transacao.valor);
                            const valorFormatado = this.dashboard.formatCurrency(
                                transacao.tipo === 'saida' ? -valorNumerico : valorNumerico
                            );
                            return `
                                <tr class="${transacao.tipo}">
                                    <td>${this.formatDate(transacao.data)}</td>
                                    <td>${transacao.descricao}</td>
                                    <td>${transacao.tipo === 'entrada' ? 'Entrada' : 'Saída'}</td>
                                    <td style="color: ${transacao.tipo === 'saida' ? 'red' : 'green'}">${valorFormatado}</td>
                                    <td>${transacao.igreja || 'N/A'}</td>
                                    <td class="actions">
                                        <button onclick="dashboard.openModal('transacao', '${transacao._id}')" class="btn-edit">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button onclick="dashboard.deleteItem('transacoes', '${transacao._id}')" class="btn-delete">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>`;
    }

    // Função auxiliar para formatar a data dentro do componente
    formatDate(dateString) {
        if (!dateString) return 'Data Inválida';

        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Data Inválida';

        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    }

    async renderTransacaoModalContent(itemId = null) {
        let html = `
            <form id="transacaoForm">
                <div class="input-group">
                    <label for="data">Data:</label>
                    <input type="date" id="data" name="data" required>
                </div>
                <div class="input-group">
                    <label for="descricao">Descrição:</label>
                    <input type="text" id="descricao" name="descricao" required>
                </div>
                <div class="input-group">
                    <label for="tipo">Tipo:</label>
                    <select id="tipo" name="tipo" required>
                        <option value="entrada">Entrada</option>
                        <option value="saida">Saída</option>
                    </select>
                </div>
                <div class="input-group">
                    <label for="valor">Valor:</label>
                    <input type="number" id="valor" name="valor" required>
                </div>
                <div class="input-group">
                    <label for="igreja">Igreja:</label>
                    <select id="igreja" name="igreja" required>
                        <option value="">Selecione uma Igreja</option>
                    </select>
                </div>
                <button type="submit" class="btn-submit">${itemId ? 'Salvar' : 'Adicionar'} Transação</button>
            </form>`;

        if (itemId) {
            try {
                const transacao = await this.dashboard.fetchItem('transacoes', itemId);
                const igrejas = await this.dashboard.fetchItem('igrejas');

                const options = igrejas.map(igreja => {
                    const isSelected = transacao.id_igreja && transacao.id_igreja.$oid === igreja._id.$oid;
                    return `<option value="${igreja._id.$oid}" ${isSelected ? 'selected' : ''}>${igreja.nome}</option>`;
                }).join('');

                html = `
                    <form id="transacaoForm">
                        <div class="input-group">
                            <label for="data">Data:</label>
                            <input type="date" id="data" name="data" value="${transacao.data ? this.dashboard.formatDateForInput(transacao.data) : ''}" required>
                        </div>
                        <div class="input-group">
                            <label for="descricao">Descrição:</label>
                            <input type="text" id="descricao" name="descricao" value="${transacao.descricao}" required>
                        </div>
                        <div class="input-group">
                            <label for="tipo">Tipo:</label>
                            <select id="tipo" name="tipo" required>
                                <option value="entrada" ${transacao.tipo === 'entrada' ? 'selected' : ''}>Entrada</option>
                                <option value="saida" ${transacao.tipo === 'saida' ? 'selected' : ''}>Saída</option>
                            </select>
                        </div>
                        <div class="input-group">
                            <label for="valor">Valor:</label>
                            <input type="number" id="valor" name="valor" value="${transacao.valor}" required>
                        </div>
                        <div class="input-group">
                            <label for="igreja">Igreja:</label>
                            <select id="igreja" name="igreja" required>
                                ${options}
                            </select>
                        </div>
                        <button type="submit" class="btn-submit">Salvar Transação</button>
                    </form>
                `;
            } catch (error) {
                console.error('Erro ao carregar transação para edição:', error);
                this.dashboard.showNotification('Erro ao carregar transação para edição', 'error');
            }
        }

        setTimeout(async () => {
            const form = document.getElementById('transacaoForm');
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

                    // Aqui você pega o ID do usuário logado do localStorage
                    const token = localStorage.getItem('token');
                    const payload = token.split('.')[1];
                    const decodedPayload = atob(payload);
                    const userId = JSON.parse(decodedPayload).userId;

                    const data = {
                        id_usuario: userId, // Adiciona o ID do usuário logado
                        data: formData.get('data'),
                        descricao: formData.get('descricao'),
                        tipo: formData.get('tipo'),
                        valor: parseFloat(formData.get('valor')),
                        id_igreja: selectedIgrejaId
                    };

                    try {
                        let method = 'POST';
                        let url = '/transacoes';
                        if (itemId) {
                            method = 'PUT';
                            url += `/${itemId}`;
                        }

                        const response = await this.dashboard.makeRequest(url, {
                            method,
                            body: JSON.stringify(data)
                        });

                        if (response.ok) {
                            this.dashboard.showNotification(`Transação ${itemId ? 'atualizada' : 'adicionada'} com sucesso!`, 'success');
                            this.dashboard.closeModal();
                            await this.dashboard.loadPage('transacoes');
                        } else {
                            const errorData = await response.json();
                            this.dashboard.showNotification(`Erro ao ${itemId ? 'atualizar' : 'adicionar'} transação: ${errorData.message || 'Erro Desconhecido'}`, 'error');
                        }
                    } catch (error) {
                        console.error(`Erro ao ${itemId ? 'atualizar' : 'adicionar'} transação:`, error);
                        this.dashboard.showNotification(`Erro ao ${itemId ? 'atualizar' : 'adicionar'} transação: ${error.message || 'Erro Desconhecido'}`, 'error');
                    }
                });
            }

            // Carrega as igrejas apenas se estiver criando uma nova transação
            if (!itemId) {
                try {
                    const igrejas = await this.dashboard.fetchItem('igrejas');
                    const selectIgreja = document.getElementById('igreja');
                    if (selectIgreja) {
                        igrejas.forEach(igreja => {
                            const option = document.createElement('option');
                            option.value = igreja._id.$oid;
                            option.text = igreja.nome;
                            selectIgreja.appendChild(option);
                        });
                    }
                } catch (error) {
                    console.error('Erro ao carregar igrejas:', error);
                    this.dashboard.showNotification('Erro ao carregar igrejas', 'error');
                }
            }
        }, 0);

        return html;
    }
}