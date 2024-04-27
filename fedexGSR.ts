const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
import { Browser, Page } from "puppeteer";
import bufferList from "./gsrList.json";
import { GsrInterface } from "./gsr.interface";
import { createWorker } from "tesseract.js";
var XLSX = require("xlsx");
import * as fs from 'fs';


// PREPARANDO PUPPETEER Y VARIABLES.
puppeteer.use(StealthPlugin());
const url =
  "https://www.fedex.com/servlet/InvoiceServlet?link=4&jsp_name=adjustment&orig_country=US&language=english/";
const gsrArray: string[] = [];
const clip = { x: 290, y: 190, width: 700, height: 120 };

// MAIN ALGORITM
async function gsr(gsr: GsrInterface, array: string[]) {
  const trackingNumber: string = gsr["TRACKING NUMBER"];
  const invoiceNumber: string = gsr["INVOICE NUMBER"];

  const browser: Browser = await puppeteer.launch({ headless: false });
  const page: Page = await browser.newPage();

  await page.setViewport({ width: 1200, height: 800 });

  // START PUPPET PAGE 1
  await page.goto(url);

  // await delay(500);
  await page.click('input[value="E"]');

  // await delay(500);
  await page.click('input[value="invoice"]');

  // await delay(500);
  await page.click('input[name="NewReq"]');
  await delay(2000);
  // END PUPPET PAGE 1

  // try {
    // START PUPPET PAGE 2
    await page.click('input[name="tracking_nbr"]', { clickCount: 3 });
    await page.keyboard.press("Backspace");
    await page.type('input[name="tracking_nbr"]', trackingNumber);
    // await delay(500);

    await page.click('input[name="invoice_nbr"]', { clickCount: 3 });
    await page.keyboard.press("Backspace");
    await page.type('input[name="invoice_nbr"]', invoiceNumber);
    // await delay(500);

    await page.click('input[value="Send Request"]');
    // await page.waitForNavigation({ timeout: 15000 });
    // END PUPPET PAGE 2

    // START PUPPET PAGE 3 (SCREENSHOT)
    // await delay(2000);
    // const buffImg = await page.screenshot({
    //   encoding: "binary",
    //   clip: clip,
    //   // path: `./GSRimgs/${trackingNumber}_${invoiceNumber}.png`,
    // });

    // const worker = await createWorker("eng");
    // const ret = await worker.recognize(buffImg);
    // array.push("\n<-----Inicio\n" + ret.data.text + "\nFin----->");
    // console.log("\n<-----Inicio\n" + ret.data.text + "\nFin----->");
    // await worker.terminate();
    // await delay(1000);
    // END PUPPET PAGE 3 (SCREENSHOT)
  // } catch {
  //   console.log(
  //     "Error catched on " + gsr["TRACKING NUMBER"] + "_" + gsr["INVOICE NUMBER"]
  //   );
  // }
  await delay(5000)
  await page.goBack()
  await delay(5000)
  await page.click('input[value="Send Request"]');
  
  await delay(5000)
  await page.goBack()
  await delay(5000)
  await page.click('input[value="Send Request"]');


  await delay(10000)
  await browser.close();
}

function mapData(strArr: string[]) {
  const finalArray = strArr.map((message) => {
    const motivoRegex = /reason: (.*?)(?=\n)/;
    const motivoMatch = message.match(motivoRegex);
    const motivo = motivoMatch ? motivoMatch[1] : "";

    const trackNumberRegex = /Tracking Number:\s+(.*?)(?=\s)/;
    const trackNumberMatch = message.match(trackNumberRegex);
    const trackNumber = trackNumberMatch ? trackNumberMatch[1] : "";

    if (message.includes("ADJUSTED")) return `${trackNumber} - APPROVED`;

    // console.log(`${trackNumber} - ${motivo}`);
    
    return `${trackNumber} - ${motivo}`;
  });
  const jsonData = JSON.stringify(finalArray, null, 2);
  fs.writeFileSync('datos.json', jsonData);
  createExcelFile(finalArray);
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createExcelFile(dataArray: string[]) {
  // Crear un nuevo libro de Excel
  const workbook = XLSX.utils.book_new();

  // Crear una nueva hoja
  const worksheet = XLSX.utils.aoa_to_sheet([
    ["Tracking Number", "Description"],
  ]);

  // Iterar sobre cada elemento del arreglo
  dataArray.forEach((dataString) => {
    // Separar el string por el caracter "-"
    const partes = dataString.split(" - ");

    // Agregar una fila con los datos a la hoja
    const lastRow = XLSX.utils.sheet_add_aoa(worksheet, [partes], {
      origin: -1,
    });
  });

  // Agregar la hoja al libro
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  try {
    // Guardar el libro como archivo Excel
    XLSX.writeFile(workbook, "test.xlsx");
  } catch (error) {
    console.log(error);
    XLSX.writeFile(workbook, "test2.xlsx");
  }
}

async function main(buffList: GsrInterface[], gsrArr: string[]) {
  for (const gsrInfo of buffList) {
    await gsr(gsrInfo, gsrArr);
  }

  // mapData(gsrArr);
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