import { Browser, Page } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { createWorker } from "tesseract.js";
import XLSX from "xlsx";
import * as fs from "fs";

import gsrList from "./gsrList.json";
import { rejectReasons } from "./reasons";
import { GsrInterface } from "./gsr.interface";

puppeteer.use(StealthPlugin());
const url = "https://www.fedex.com/servlet/InvoiceServlet?link=4&jsp_name=adjustment&orig_country=US&language=english/";
const gsrResultArray: string[] = [];
const clip = { x: 290, y: 190, width: 700, height: 120 };

async function initialPage(page: Page) {
    await page.goto(url);
    await page.click('input[value="E"]');
    await page.click('input[value="invoice"]');
    await page.click('input[name="NewReq"]');
    await delay(2000);
}

async function formPage( page: Page, trackingNumber: string, invoiceNumber: string) {
    await page.click('input[name="tracking_nbr"]', { clickCount: 3 });
    await page.type('input[name="tracking_nbr"]', trackingNumber);

    await page.click('input[name="invoice_nbr"]', { clickCount: 3 });
    await page.type('input[name="invoice_nbr"]', invoiceNumber);

    await page.click('input[value="Send Request"]');

    await refinedWaitForNavigation(page);
}

async function readMessage( page: Page, trackingNumber: string, invoiceNumber: string) {
  const buffImg = await page.screenshot({
      encoding: "binary",
      clip: clip,
      path: `./GSRimgs/${trackingNumber}_${invoiceNumber}.png`,
  });

  const worker = await createWorker("eng");
  const scanedData = await worker.recognize(buffImg);
  await worker.terminate();
  
  return scanedData.data.text.toUpperCase();
}

async function getDenyReason(message: string) {
    for (const palabra in rejectReasons) {
        if (message.includes(palabra)) {
            return rejectReasons[palabra as keyof typeof rejectReasons];
        }
    }
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
        const partes = dataString.split(" | ");

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

async function refinedWaitForNavigation(page: Page) {
    await Promise.race([
        page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }),
        new Promise((resolve, reject) => {
            setTimeout(
                () => reject(new Error("Timeout waiting for navigation")),
                20000
            );
        }),
    ]);
}

//START GSR
async function gsr(gsr: GsrInterface, array: string[]) {
    let counter = 0;
    const trackingNumber: string = gsr["TRACKING NUMBER"];
    const invoiceNumber: string = gsr["INVOICE NUMBER"];
    const browser: Browser = await puppeteer.launch({ headless: false });
    const page: Page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    try {
        await Promise.race([
            page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }),
            new Promise((resolve, reject) => {
                setTimeout(
                    () => reject(new Error("Timeout waiting for navigation")),
                    20000
                );
            }),
        ]);
        
        await initialPage(page);

        await formPage(page, trackingNumber, invoiceNumber);

        let message: string = await readMessage(
            page,
            trackingNumber,
            invoiceNumber
        );

        console.log(
            `Iteration 1, Track#: ${trackingNumber}, includes track#? ${message.includes(
                trackingNumber
            )}, message: ${message}`
        ); //TODO REMOVER ESTE LOG

        if (!message.includes(trackingNumber)) {
            while (counter < 1) {
                await page.goBack();
                await delay(2000);
                await page.click('input[value="Send Request"]');
                await refinedWaitForNavigation(page);
                message = await readMessage(
                    page,
                    trackingNumber,
                    invoiceNumber
                );
                console.log(
                    `Iteration ${
                        counter + 2
                    }, Track#: ${trackingNumber}, includes track#? ${message.includes(
                        trackingNumber
                    )}, message: ${message}`
                ); //TODO REMOVER ESTE LOG

                if (message.includes(trackingNumber)) break;

                counter++;
            }
        }
        array.push(`${trackingNumber} | ${await getDenyReason(message)}`);
    } catch {
        console.log(
            `Error catched on ${gsr["TRACKING NUMBER"]}_${gsr["INVOICE NUMBER"]}`
        );
        array.push(`${trackingNumber} | Page didn't load.`);
        return;
    } finally {
        await browser.close();
    }
}

function saveData(finalArray: string[]) {
    const jsonData = JSON.stringify(finalArray, null, 2);
    fs.writeFileSync("datos.json", jsonData);
    createExcelFile(finalArray);
}

async function main(invoices: GsrInterface[], responses: string[]) {
    for (const gsrInfo of invoices) {
        await gsr(gsrInfo, responses);
    }
    saveData(responses);
}

main(gsrList, gsrResultArray);