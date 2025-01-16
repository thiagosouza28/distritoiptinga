export class Perfil {
    constructor(dashboard) {
       this.dashboard = dashboard;
    }
     renderProfileModalContent(){
         return `
           <p><strong>Nome:</strong> <span id="modalProfileName">${this.dashboard.modal.elements.modalProfileName.textContent}</span></p>
           <p><strong>Email:</strong> <span id="modalProfileEmail">${this.dashboard.modal.elements.modalProfileEmail.textContent}</span></p>
           <p><strong>Função:</strong> <span id="modalProfileRole">${this.dashboard.modal.elements.modalProfileRole.textContent}</span></p>
        `;
     }
 }