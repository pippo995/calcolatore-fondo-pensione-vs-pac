import { FinancialController } from './controllers/FinancialController.js';

document.addEventListener('DOMContentLoaded', () => {
  const app = new FinancialController();
  app.updateResults();

});