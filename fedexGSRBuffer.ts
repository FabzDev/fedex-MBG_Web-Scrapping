const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
import { Browser, Page } from "puppeteer";
import bufferList from "./bufferGsrList.json";
import { GsrInterface } from "./gsr.interface";
import { createWorker } from "tesseract.js";

// PREPARANDO PUPPETEER Y VARIABLES.
puppeteer.use(StealthPlugin());
const url =
  "https://www.fedex.com/servlet/InvoiceServlet?link=4&jsp_name=adjustment&orig_country=US&language=english/";
const gsrArray: string[] = [];
const clip = { x: 290, y: 190, width: 550, height: 120 };


// MAIN ALGORITM
async function gsr(gsr: GsrInterface, array: string[]){
  const trackingNumber: string = gsr["TRACKING NUMBER"];
  const invoiceNumber: string = gsr["INVOICE NUMBER"];

  const browser: Browser = await puppeteer.launch({ headless: true });
  const page: Page = await browser.newPage();

  await page.setViewport({ width: 1200, height: 800 });

  // START PUPPET PAGE 1
  await page.goto(url);

  await delay(500);
  await page.click('input[value="E"]');

  await delay(500);
  await page.click('input[value="invoice"]');

  await delay(500);
  await page.click('input[name="NewReq"]');
  await delay(2000);
  // END PUPPET PAGE 1
  
  try {
    // START PUPPET PAGE 2
    await page.click('input[name="tracking_nbr"]', { clickCount: 3 });
    await page.keyboard.press("Backspace");
    await page.type('input[name="tracking_nbr"]', trackingNumber);
    await delay(500);

    await page.click('input[name="invoice_nbr"]', { clickCount: 3 });
    await page.keyboard.press("Backspace");
    await page.type('input[name="invoice_nbr"]', invoiceNumber);
    await delay(500);

    await page.click('input[value="Send Request"]');
    await page.waitForNavigation({ timeout: 33000 });
    // END PUPPET PAGE 2

    // START PUPPET PAGE 3 (SCREENSHOT)
    await delay(2000);
    const buffImg = await page.screenshot({
      encoding: "binary",
      clip: clip,
      path: `./GSRimgs/${trackingNumber}_${invoiceNumber}.png`,
    });

    const worker = await createWorker("eng");
    const ret = await worker.recognize(buffImg);
    array.push("\n<-----Inicio\n" + ret.data.text + "\nFin----->");
    console.log("\n<-----Inicio\n" + ret.data.text + "\nFin----->");
    await worker.terminate();
    await delay(1000);
    // END PUPPET PAGE 3 (SCREENSHOT)

  } catch {
    console.log(
      "Error catched on " + gsr["TRACKING NUMBER"] + "_" + gsr["INVOICE NUMBER"]
    );
  }
  
  await browser.close();

  
};

function printGSRArr(strArr: string[]) {
  for (const str of strArr) {
    console.log(str);
  }
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(buffList: GsrInterface[], gsrArr: string[] ) {
  
  for(const gsrInfo of buffList){
    await gsr(gsrInfo, gsrArr);    
  }

  printGSRArr(gsrArr)
}

main(bufferList, gsrArray);


// console.log("continue! " + trackNumber + " - " + invoiceNumber);

// async function takeScreenshot( trackNumber: string, invoiceNumber: string, page: Page) {
// const clip = {
//   x: 290,
//   y: 190,
//   width: 550,
//   height: 120,
// };

// await typeInfoAndSendRequest(trackNumber, invoiceNumber, page);
// await page.waitForNavigation({ timeout: 33000 });

// console.log("continue! " + trackNumber + " - " + invoiceNumber);

// const buffImg = await page.screenshot({
//   encoding: "binary",
//   clip: clip,
//   path: `./GSRimgs/${trackNumber}_${invoiceNumber}.png`
// });
// await wait(1000);

// scanText(buffImg);

// await wait(1000);

// await page.goBack();
// }

// async function typeInfoAndSendRequest(trackNumber: string, invoiceNumber: string, page: Page) {
// await page.click('input[name="tracking_nbr"]', { clickCount: 3 });
// await page.keyboard.press("Backspace");
// await page.type('input[name="tracking_nbr"]', trackNumber);
// await wait(500);

// await page.click('input[name="invoice_nbr"]', { clickCount: 3 });
// await page.keyboard.press("Backspace");
// await page.type('input[name="invoice_nbr"]', invoiceNumber);
// await wait(500);

// await page.click('input[value="Send Request"]');

// }
// async function scanText(bufferDeImagen: Buffer) {
//   const worker = await createWorker('eng');
//   const ret = await worker.recognize(bufferDeImagen);
//   gsrArray.push("\nInicio: " + ret.data.text + " \nFin");
//   // console.log(ret.data.text);
//   await worker.terminate();
// }
