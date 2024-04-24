const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
import { Browser, Page } from "puppeteer";
import bufferList from "./bufferGsrList.json";
import { GsrInterface } from "./gsr.interface";
import { createWorker } from 'tesseract.js';

puppeteer.use(StealthPlugin());

const url = "https://www.fedex.com/servlet/InvoiceServlet?link=4&jsp_name=adjustment&orig_country=US&language=english/";

const gsrArray: string[] = [];

const gsr = async () => {
  const browser: Browser = await puppeteer.launch({ headless: false });
  const page: Page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });

  await page.goto(url);

  await page.click('input[value="E"]');
  await wait(500);

  await page.click('input[value="invoice"]');
  await wait(500);

  await page.click('input[name="NewReq"]');
  await wait(2000);

  for (const gsr of bufferList as GsrInterface[]) {
    try{
      await takeScreenshot(gsr["Tracking Number"], gsr.INVOICE_NUMBER, page);
    } catch {
      console.log("Catch Error: " + gsr["Tracking Number"] + "_" + gsr.INVOICE_NUMBER);
    }
  }

  printGSRArr(gsrArray);

  await wait(5000);
  await browser.close();
};

gsr();


async function takeScreenshot( trackNumber: string, invoiceNumber: string, page: Page) {
  const clip = {
    x: 290,
    y: 190,
    width: 550,
    height: 120,
  };

  // const isDisabled = await page.evaluate((selector) => {
  //   const element = document.querySelector(selector)as HTMLInputElement;
  //   return element && element.disabled;
  // },'input[value="Send Request"]');

  await typeInfoAndSendRequest(trackNumber, invoiceNumber, page);
  await page.waitForNavigation({ timeout: 33000 });

  console.log("continue! " + trackNumber + " - " + invoiceNumber);

  const buffImg = await page.screenshot({
    encoding: "binary",
    clip: clip,
    path: `./GSRimgs/${trackNumber}_${invoiceNumber}.png`
  });
  await wait(1000);
  
  scanText(buffImg);

  await wait(1000);


  await page.goBack();
}

async function typeInfoAndSendRequest(trackNumber: string, invoiceNumber: string, page: Page) {
  await page.click('input[name="tracking_nbr"]', { clickCount: 3 });
  await page.keyboard.press("Backspace");
  await page.type('input[name="tracking_nbr"]', trackNumber);
  await wait(500);

  await page.click('input[name="invoice_nbr"]', { clickCount: 3 });
  await page.keyboard.press("Backspace");
  await page.type('input[name="invoice_nbr"]', invoiceNumber);
  await wait(500);

  await page.click('input[value="Send Request"]');

  
}

async function scanText(bufferDeImagen: Buffer) {
  const worker = await createWorker('eng');
  const ret = await worker.recognize(bufferDeImagen);
  gsrArray.push("\nInicio: " + ret.data.text + " \nFin");
  // console.log(ret.data.text);
  await worker.terminate();
}

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function printGSRArr(strArr: string[]){
  for(const str of strArr){
    console.log(str);
  }
}
