const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
import { Browser, Page } from "puppeteer";
import gsrList from './gsrList.json';
import { GsrInterface } from './gsr.interface';

puppeteer.use(StealthPlugin());
const url =
  "https://www.fedex.com/servlet/InvoiceServlet?link=4&jsp_name=adjustment&orig_country=US&language=english/";


const clip = {
    x: 290,
    y: 190,
    width: 550,
    height: 120,
  };


const gsr = async () => {
  const browser: Browser = await puppeteer.launch({ headless: false });
  const page: Page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });

  await page.goto(url);

  await page.screenshot({ path: "FxWebsite.jpg" });

  await page.click('input[value="E"]');
  await wait(500);

  await page.click('input[value="invoice"]');
  await wait(500);

  await page.click('input[name="StatusReq"]');
  await wait(3000);

  for( const gsr of gsrList as GsrInterface[]){
    await takeScreenshot(gsr["Tracking Number"], gsr.INVOICE_NUMBER, page);
  }
  
  await browser.close();
};

async function takeScreenshot(trackNumber: string, invoiceNumber: string, page: Page){
  
  typeInfoAndSendRequest(trackNumber, invoiceNumber, page);
  
  try{
    await page.waitForNavigation({timeout: 33000})
  } catch {
    console.log('catch! ' + trackNumber + ' - ' + invoiceNumber);
    await page.reload();
    typeInfoAndSendRequest(trackNumber, invoiceNumber, page);
  }

  console.log('continue! ' + trackNumber +' - '+  invoiceNumber);

  await page.screenshot({
    path: `./imgs_GSR/${trackNumber}_${invoiceNumber}.jpg`,
    clip: clip,
  });
  await wait(1000);

  await page.goBack()
}

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function typeInfoAndSendRequest(trackNumber: string, invoiceNumber: string, page: Page){
  await page.click('input[name="tracking_nbr"]', { clickCount: 3 }); 
    await page.keyboard.press('Backspace');
    await page.type('input[name="tracking_nbr"]', trackNumber);
    await wait(1000);

    await page.click('input[name="invoice_nbr"]', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('input[name="invoice_nbr"]', invoiceNumber);
    await wait(1000);
    
    await page.click('input[value="Send Request"]');
}


gsr();