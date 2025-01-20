document.addEventListener('DOMContentLoaded', function () {
    carregarIgrejas();
});

async function carregarIgrejas() {
    try {
        console.log("Iniciando carregarIgrejas");
        const response = await fetch('https://api-ckry.onrender.com/api/igrejas');
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao carregar igrejas. Verifique a conexão com o servidor.');
        }
        const igrejas = await response.json();
        const selectIgreja = document.getElementById('igreja');
        console.log("Elemento selectIgreja:", selectIgreja);

        if (!selectIgreja) {
            console.error("Erro: Elemento select com id 'igreja' não encontrado no DOM.");
            exibirNotificacao('Erro ao carregar igrejas. Elemento select não encontrado.', 'error');
            return;
        }

        selectIgreja.innerHTML = '<option value="">Selecione uma Igreja</option>';
        igrejas.forEach(igreja => {
            const option = document.createElement('option');
            option.value = igreja._id;
            option.text = igreja.nome;
            selectIgreja.appendChild(option);
        });
        console.log("Igrejas carregadas com sucesso!");
    } catch (error) {
        console.error('Erro ao carregar igrejas:', error);
        exibirNotificacao(error.message, 'error');
    }
}

document.getElementById('inscricaoForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    const data = {
        nome: formData.get('nome'),
        email: formData.get('email'),
        nascimento: formData.get('nascimento'),
        igreja: formData.get('igreja')
    };

    const emailInput = document.getElementById('email');
    const emailValue = emailInput.value;
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!emailRegex.test(emailValue)) {
        exibirNotificacao('Por favor, insira um email válido.', 'error');
        return;
    }

    const nascimentoInput = document.getElementById('nascimento');
    const nascimentoValue = nascimentoInput.value;
    const nascimento = new Date(nascimentoValue);

    if (isNaN(nascimento.getTime())) {
        exibirNotificacao('Data de nascimento inválida.', 'error');
        return;
    }

    const hoje = new Date();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
    }

    showProcessingOverlay();
    try {
        const response = await fetch('https://api-ckry.onrender.com/api/participantes/inscricao', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao realizar inscrição. Verifique os dados inseridos.');
        }

        const result = await response.json();
        console.log('Success:', result);
        exibirNotificacao('Inscrição realizada com sucesso!', 'success');
        document.getElementById('inscricaoForm').reset();
        carregarIgrejas();
        exibirModalDeConfirmacao();
    } catch (error) {
        console.error('Error:', error);
        exibirNotificacao(error.message, 'error');
    } finally {
        hideProcessingOverlay();
    }
});

function exibirNotificacao(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `<i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i> ${message}`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function showProcessingOverlay() {
    const overlay = document.getElementById('processingOverlay');
    if (overlay) overlay.style.display = 'flex';
}

function hideProcessingOverlay() {
    const overlay = document.getElementById('processingOverlay');
    if (overlay) overlay.style.display = 'none';
}

function exibirModalDeConfirmacao() {
    const modal = document.getElementById('confirmationModal');
    if (modal) modal.style.display = 'flex';
    const button = document.createElement('button');
    button.textContent = 'Nova Inscrição';
    button.className = 'btn';
    button.onclick = () => {
        hideConfirmationModal();
    };
    modal.querySelector('.modal-body').appendChild(button);
}

function hideConfirmationModal() {
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
