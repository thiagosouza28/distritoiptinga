export class Igrejas {
    constructor(dashboard) {
        this.dashboard = dashboard;
    }

     renderIgrejas(data) {
        return `
            <div class="page-header">
                <h2>Igrejas</h2>
                <button class="btn-add" onclick="dashboard.openModal('igreja', null)">
                    <i class="fas fa-plus"></i> Nova Igreja
                </button>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Distrito</th>
                            <th>Membros</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(igreja => `
                            <tr>
                                <td>${igreja.igreja}</td>
                                <td>${igreja.distrito}</td>
                                <td>${igreja.membros || 0}</td>
                                <td class="actions">
                                    <button onclick="dashboard.openModal('igreja', '${igreja.igreja}')" class="btn-edit">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button onclick="dashboard.deleteItem('igrejas', '${igreja.igreja}')" class="btn-delete">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>`;
    }
}
