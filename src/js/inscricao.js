document.addEventListener('DOMContentLoaded', carregarIgrejas);

async function carregarIgrejas() {
    const selectIgreja = document.getElementById('igreja');
    if (!selectIgreja) {
        console.error("Erro: Elemento select com id 'igreja' não encontrado no DOM.");
        exibirNotificacao('Erro ao carregar igrejas. Elemento select não encontrado.', 'error');
        return;
    }

    try {
        const response = await fetch('https://api-ckry.onrender.com/api/igrejas');
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao carregar igrejas. Verifique a conexão com o servidor.');
        }
        const igrejas = await response.json();
        selectIgreja.innerHTML = '<option value="">Selecione uma Igreja</option>'; // Limpa o select antes de adicionar novas opções

        igrejas.forEach(igreja => { // Assumindo que a API retorna um array de objetos com um campo 'nome'
            const option = document.createElement('option');
            option.value = igreja._id; // Use o ID da igreja, não o nome
            option.text = igreja.nome; // Use o nome da igreja, não o ID
            selectIgreja.appendChild(option);
        });
        console.log("Igrejas carregadas com sucesso!");
    } catch (error) {
        console.error('Erro ao carregar igrejas:', error);
        exibirNotificacao(error.message, 'error');
    }
}


document.getElementById('inscricaoForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const formData = new FormData(this);
    const data = {
        nome: formData.get('nome'),
        email: formData.get('email'),
        nascimento: formData.get('nascimento'),
        igreja: formData.get('igreja')
    };

    // Validação do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Regex mais simples e eficaz
    if (!emailRegex.test(data.email)) {
        exibirNotificacao('Por favor, insira um email válido.', 'error');
        return;
    }

    // Validação da data de nascimento
    const nascimento = new Date(data.nascimento);
    if (isNaN(nascimento.getTime())) {
        exibirNotificacao('Data de nascimento inválida.', 'error');
        return;
    }

    // Cálculo da idade
    const hoje = new Date();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
    }

    // Mensagem de menor de idade (ajuste a idade conforme necessário)
    if (idade < 18) {
        exibirNotificacao('Inscrição realizada com sucesso!\nParticipante: Menor de 18 anos.', 'success');
        this.reset();
        carregarIgrejas();
        exibirModalDeConfirmacao();
        return;
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
        this.reset();
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
        notification.innerHTML = `
             <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
           ${message}
       `;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
}


function showProcessingOverlay() {
    const overlay = document.getElementById('processingOverlay');
        if(overlay) overlay.style.display = 'flex';
 }

 function hideProcessingOverlay() {
    const overlay = document.getElementById('processingOverlay');
      if(overlay) overlay.style.display = 'none';
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
