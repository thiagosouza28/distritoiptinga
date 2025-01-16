document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const messageDiv = document.getElementById('message');
    const togglePassword = document.querySelector('.toggle-password');
    const passwordInput = document.getElementById('password');
    const rememberCheckbox = document.getElementById('remember');

    // Verificar se há email salvo
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
        document.getElementById('email').value = savedEmail;
        rememberCheckbox.checked = true;
    }

    // Toggle password visibility
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.className = `fas ${type === 'password' ? 'fa-eye-slash' : 'fa-eye'} toggle-password`;
    });

    // Função para mostrar mensagens
    function showMessage(message, type) {
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        setTimeout(() => {
            messageDiv.className = 'message';
        }, 5000);
    }

    // Handle form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('https://api-ckry.onrender.com/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    senha: password
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Salvar email se "lembrar-me" estiver marcado
                if (rememberCheckbox.checked) {
                    localStorage.setItem('rememberedEmail', email);
                } else {
                    localStorage.removeItem('rememberedEmail');
                }

                // Salvar token
                localStorage.setItem('token', data.token);
                
                showMessage('Login realizado com sucesso!', 'success');
                
                // Redirecionar para o dashboard
                setTimeout(() => {
                    window.location.href = './dashboard/index.html';
                }, 1500);
            } else {
                showMessage(data.message || 'Erro ao fazer login', 'error');
            }
        } catch (error) {
            console.error('Erro:', error);
            showMessage('Erro ao conectar com o servidor', 'error');
        }
    });
});
