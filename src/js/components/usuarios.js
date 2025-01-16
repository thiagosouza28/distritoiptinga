export class Usuarios {
    constructor(dashboard) {
        this.dashboard = dashboard;
    }

    renderUsuarios(data) {
        return `
        <div class="page-header">
            <h2>Usuários</h2>
            <button class="btn-add" onclick="dashboard.openModal('usuario', null)">
                <i class="fas fa-plus"></i> Novo Usuário
            </button>
        </div>
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Email</th>
                        <th>Cargo</th>
                        <th>Igreja</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(user => `
                        <tr>
                            <td>${user.nome}</td>
                            <td>${user.email}</td>
                            <td>${user.cargo}</td>
                            <td>${user.igreja}</td>
                            <td class="actions">
                                <button onclick="dashboard.openModal('usuario', '${user._id}')" class="btn-edit">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="dashboard.deleteItem('usuarios', '${user._id}')" class="btn-delete">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>`;
    }

    async renderUsuarioModalContent(itemId = null) {
        let html = `
            <form id="usuarioForm">
                <div class="input-group">
                   <label for="nome">Nome:</label>
                   <input type="text" id="nome" name="nome" required>
               </div>
                <div class="input-group">
                   <label for="email">Email:</label>
                    <input type="email" id="email" name="email" required>
                </div>
                <div class="input-group">
                    <label for="senha">Senha:</label>
                    <input type="password" id="senha" name="senha" ${itemId ? "" : 'required'}>
                </div>
                <div class="input-group">
                    <label for="nascimento">Data de Nascimento:</label>
                    <input type="date" id="nascimento" name="nascimento" required>
                </div>
                <div class="input-group">
                    <label for="cargo">Cargo:</label>
                    <select id="cargo" name="cargo" required>
                       <option value="administrador geral">Administrador</option>
                       <option value="diretor jovem">Diretor Jovem</option>
                       <option value="anciao">Ancião</option>
                       <option value="tesoureiro do catre">Tesoureiro</option>
                     </select>
                 </div>
                <div class="input-group">
                      <label for="igreja">Igreja:</label>
                     <select id="igreja" name="igreja" required>
                           <option value="">Selecione uma Igreja</option>
                      </select>
                  </div>
                <button type="submit" class="btn-submit">${itemId ? 'Salvar' : 'Adicionar'} Usuário</button>
            </form>`;

        if (itemId) {
            try {
                const user = await this.dashboard.fetchItem('usuarios', itemId);
                const igrejas = await this.dashboard.fetchItem('igrejas');
                const options = igrejas.map(igreja => {
                    const isSelected = user.igreja && user.igreja === igreja.igreja;
                    return `<option value="${igreja.igreja}" ${isSelected ? 'selected' : ''}>${igreja.igreja}</option>`;
                }).join('');

                html = `
                   <form id="usuarioForm">
                       <div class="input-group">
                            <label for="nome">Nome:</label>
                           <input type="text" id="nome" name="nome" value="${user.nome}" required>
                        </div>
                       <div class="input-group">
                            <label for="email">Email:</label>
                            <input type="email" id="email" name="email" value="${user.email}" required>
                        </div>
                        <div class="input-group">
                            <label for="senha">Senha:</label>
                            <input type="password" id="senha" name="senha">
                        </div>
                        <div class="input-group">
                            <label for="nascimento">Data de Nascimento:</label>
                            <input type="date" id="nascimento" name="nascimento" value="${user.nascimento ? user.nascimento.substring(0, 10) : ''}" required>
                        </div>
                        <div class="input-group">
                            <label for="cargo">Cargo:</label>
                            <select id="cargo" name="cargo" required>
                                <option value="administrador geral" ${user.cargo === 'administrador geral' ? 'selected' : ''}>Administrador</option>
                                <option value="diretor jovem" ${user.cargo === 'diretor jovem' ? 'selected' : ''}>Diretor Jovem</option>
                                <option value="anciao" ${user.cargo === 'anciao' ? 'selected' : ''}>Ancião</option>
                                <option value="tesoureiro do catre" ${user.cargo === 'tesoureiro do catre' ? 'selected' : ''}>Tesoureiro</option>
                            </select>
                        </div>
                       <div class="input-group">
                            <label for="igreja">Igreja:</label>
                            <select id="igreja" name="igreja" required>
                                  ${options}
                             </select>
                         </div>
                         <button type="submit" class="btn-submit">Salvar Usuário</button>
                   </form>
                   `;
            } catch (error) {
                console.error('Erro ao carregar usuário para edição:', error);
                this.dashboard.showNotification('Erro ao carregar usuário para edição', 'error');
            }
        }

        setTimeout(async () => {
            const form = document.getElementById('usuarioForm');
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const selectIgreja = document.getElementById('igreja');
                    const selectedIgrejaId = selectIgreja.value;
                    const formData = new FormData(form);
        
                    // Verifica se uma igreja foi selecionada
                    if (!selectedIgrejaId) {
                        this.dashboard.showNotification('Por favor, selecione uma igreja.', 'error');
                        return; // Interrompe o envio do formulário se nenhuma igreja for selecionada
                    }
        
                    // Continua com a criação do objeto data
                    const data = {
                        nome: formData.get('nome'),
                        email: formData.get('email'),
                        cargo: formData.get('cargo'),
                        nascimento: formData.get('nascimento'),
                        igreja: selectedIgrejaId,
                        igreja: selectIgreja.options[selectIgreja.selectedIndex].text
                    };

                    if (!itemId) {
                        data.senha = formData.get('senha'); // Adiciona a senha apenas na criação
                    }

                    try {
                        let method = 'POST';
                        let url = '/usuarios';
                        if (itemId) {
                            method = 'PUT';
                            url += `/${itemId}`;
                        }

                        const response = await this.dashboard.makeRequest(url, {
                            method,
                            body: JSON.stringify(data)
                        });

                        if (response.ok) {
                            this.dashboard.showNotification(`Usuário ${itemId ? 'atualizado' : 'adicionado'} com sucesso!`, 'success');
                            this.dashboard.closeModal();
                            await this.dashboard.loadPage('usuarios');
                        } else {
                            const errorData = await response.json();
                            this.dashboard.showNotification(`Erro ao ${itemId ? 'atualizar' : 'adicionar'} usuário: ${errorData.message || 'Erro Desconhecido'}`, 'error');
                        }
                    } catch (error) {
                        console.error(`Erro ao ${itemId ? 'atualizar' : 'adicionar'} usuário:`, error);
                        this.dashboard.showNotification(`Erro ao ${itemId ? 'atualizar' : 'adicionar'} usuário: ${error.message || 'Erro Desconhecido'}`, 'error');
                    }
                });
            }

            // Carrega as igrejas e preenche o select
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
