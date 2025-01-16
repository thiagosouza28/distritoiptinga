export class Configuracoes {
    constructor(dashboard) {
      this.dashboard = dashboard;
     }
      renderSettingsModalContent() {
          return `
                <p><strong>Idioma:</strong> <select name="lang" id="lang" >
                      <option value="pt-br">Português(BR)</option>
                      <option value="en">Inglês</option>
                  </select></p>
                  <p><strong>Notificações:</strong>
                      <input type="checkbox" name="notifications" id="notifications" >
                      </p>
          `;
      }
  }