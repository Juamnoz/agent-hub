import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  console.log('🚀 Iniciando navegador Playwright (modo headless)...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  const apiData = [];

  page.on('response', async (response) => {
    const url = response.url();
    const type = response.request().resourceType();
    
    // Interceptar solo llamadas a la API (fetch/xhr)
    if ((type === 'fetch' || type === 'xhr') && response.ok() && response.request().method() === 'GET') {
      try {
        const json = await response.json();
        // Filtrar cosas muy grandes o irrelevantes si es necesario
        apiData.push({ url, data: json });
      } catch (e) {
        // Ignorar respuestas que no son JSON válido
      }
    }
  });

  try {
    console.log('🌐 Navegando a Ycloud Login...');
    await page.goto('https://www.ycloud.com/console/#/entry/login');
    await page.waitForTimeout(3000);

    console.log('🔑 Ingresando credenciales...');
    const inputs = await page.$$('input');
    if (inputs.length >= 2) {
      await inputs[0].fill('juamnoze@gmail.com');
      await inputs[1].fill('AICstudioi123_');
      await page.keyboard.press('Enter');
    } else {
      console.log('❌ No se encontraron los campos de input.');
      await browser.close();
      return;
    }

    console.log('⏳ Esperando a que el inicio de sesión se complete...');
    await page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(5000);

    console.log('📱 Navegando a Cuentas de WhatsApp...');
    await page.goto('https://www.ycloud.com/console/#/app/whatsapp/accounts');
    await page.waitForTimeout(5000); 

    console.log('📝 Navegando a Plantillas...');
    await page.goto('https://www.ycloud.com/console/#/app/whatsapp/templates');
    await page.waitForTimeout(5000);

    console.log('💾 Guardando TODO el tráfico interceptado...');
    fs.writeFileSync('ycloud_all_api_data.json', JSON.stringify(apiData, null, 2));
    console.log('✅ Scraping completado con éxito!');

  } catch (error) {
    console.error('❌ Error durante el scraping:', error);
  } finally {
    await browser.close();
  }
})();
