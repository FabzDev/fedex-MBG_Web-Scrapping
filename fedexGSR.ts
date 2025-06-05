import { Browser, Page } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

import { createWorker } from "tesseract.js";
import XLSX from "xlsx";

import { DictionaryDisputeResults } from "./DictionaryDisputeResults";
import { GsrInterface } from "./Interfaces/GsrInterface";

import path from "path";
import * as fs from "fs";

import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("📝 Please insert the Late Deliveries Input file: \n", (filePath) => {

  const fedexWebsiteUrl: string =
    "https://www.fedex.com/servlet/InvoiceServlet?link=4&jsp_name=adjustment&orig_country=US&language=english/";
  const resultDisputesArray: string[] = [];
  const disputeScreenshotSize = { x: 290, y: 190, width: 700, height: 120 };
  let inputFile_lateDeliveries = filePath.replace(/"/g, "");
  // let inputFile_lateDeliveries: string = path.join("C:\\Users\\fabio\\Documents\\SAN\\Automatization", "FDX_LATE DELIVERIES.xlsx");
  const lateDeliveries_excelObj: XLSX.WorkBook = XLSX.readFile(inputFile_lateDeliveries, { cellStyles: true });
  const lateDeliveries_sheetObj: XLSX.WorkSheet = lateDeliveries_excelObj.Sheets[lateDeliveries_excelObj.SheetNames[0]];
  const jsonLateDeliveries = XLSX.utils.sheet_to_json(lateDeliveries_sheetObj, {
    header: 1,
  }); //return an array with just the value of each cell, ignoring metadata information like format, i.e. [ ['TRACKING NUMBER', 'INVOICE NUMBER'],[426785379527, 887489952]... ]
  const unfilteredShipments = jsonLateDeliveries.filter(
    (row: any, index: number) => row[0] != "TRACKING NUMBER" && !isRowHidden(lateDeliveries_sheetObj, index)
  );
  const jsonShipmentsList = unfilteredShipments.map((row: any) => ({
    "TRACKING NUMBER": row[0].toString(),
    "INVOICE NUMBER": row[1].toString(),
  }));

  function isRowHidden(sheetObject: XLSX.WorkSheet, rowIndex: number) {
    if (sheetObject["!rows"] && sheetObject["!rows"][rowIndex]) return true; //'!rows' is a Key from XLSX.WorkSheet obj, that is present only if rows are filtered or hidden. i.e '!rows': [<1 empty item>,   { hidden: true }...
    return false;
  }

  async function scrappingMainPage(mainFedexWebsite: Page) {
    await mainFedexWebsite.goto(fedexWebsiteUrl);
    await mainFedexWebsite.click('input[value="E"]');
    await applyDelay(500 + 700 * Math.random());
    await mainFedexWebsite.click('input[value="invoice"]');
    await applyDelay(500 + 700 * Math.random());
    await mainFedexWebsite.click('input[name="NewReq"]');
    await refinedWaitForNavigation(mainFedexWebsite);
  }

  async function scrappingFormPage(formFedexWebsite: Page, trackingNumber: string, invoiceNumber: string) {
    await formFedexWebsite.click('input[name="tracking_nbr"]', { clickCount: 3 });
    await applyDelay(500 + 700 * Math.random());
    await formFedexWebsite.type('input[name="tracking_nbr"]', trackingNumber);
    await applyDelay(500 + 700 * Math.random());
    await formFedexWebsite.click('input[name="invoice_nbr"]', { clickCount: 3 });
    await applyDelay(500 + 700 * Math.random());
    await formFedexWebsite.type('input[name="invoice_nbr"]', invoiceNumber);
    await applyDelay(500 + 700 * Math.random());
    await formFedexWebsite.click('input[value="Send Request"]');
    await refinedWaitForNavigation(formFedexWebsite);
  }

  async function convertImgDisputeResultToTxt(resolutionFedexWebsite: Page, trackingNumber: string, invoiceNumber: string) {
    await applyDelay(500 + 700 * Math.random());
    const bufferedImage: Buffer<ArrayBufferLike> = await resolutionFedexWebsite.screenshot({
      encoding: "binary",
      clip: disputeScreenshotSize,
      path: `./GSRimgs/${trackingNumber}_${invoiceNumber}.png`,
    });
    const tesseractWorker: Tesseract.Worker = await createWorker("eng");
    const tesseractScannerResult: Tesseract.RecognizeResult = await tesseractWorker.recognize(bufferedImage);
    await tesseractWorker.terminate();
    return tesseractScannerResult.data.text.toUpperCase();
  }

  async function getDisputeResult(tesseractScannerResult: string) {
    for (const dictionaryKey in DictionaryDisputeResults) {
      if (tesseractScannerResult.includes(dictionaryKey)) {
        return DictionaryDisputeResults[dictionaryKey as keyof typeof DictionaryDisputeResults]; // i,e.  DictionaryDisputeResults["FL WEATHER DELAY"] = "DENIED - FL WEATHER DELAY - FLOOD "
      }
    }
  }

  async function webScrappingProcess(website: Page, trackingNumber: string, invoiceNumber: string, resultDisputesArr: string[]) {
    let counter = 0;
    await scrappingMainPage(website);
    await scrappingFormPage(website, trackingNumber, invoiceNumber);
    let textDisputeResult: string = await convertImgDisputeResultToTxt(website, trackingNumber, invoiceNumber);

    //User visualization: Track Number: 881427520774 | Invoice Number: 887517189
    console.log(`\nIteration 1\nIncludes Track#: ${textDisputeResult.includes(trackingNumber)}\n${textDisputeResult}`);

    if (!textDisputeResult.includes(trackingNumber)) {
      while (counter < 1) {
        await website.goBack();
        await applyDelay(1000 + 500 * Math.random());
        await website.click('input[value="Send Request"]');
        await refinedWaitForNavigation(website);

        // Repeat convertion process of Img Dispute Result To Txt
        textDisputeResult = await convertImgDisputeResultToTxt(website, trackingNumber, invoiceNumber);

        //User visualization
        console.log(`\nIteration ${counter + 2}\nIncludes Track#: ${textDisputeResult.includes(trackingNumber)}\n${textDisputeResult}`);

        if (textDisputeResult.includes(trackingNumber)) break;
        counter++;
      }
    }

    resultDisputesArr.push(`${trackingNumber} | ${invoiceNumber} | ${await getDisputeResult(textDisputeResult)}`);
  }

  function createDisputeResultsFiles(resultDisputesAr: string[]) {
    // Creating disputResults.json file
    const jsonDisputeResults = JSON.stringify(resultDisputesAr, null, 2);
    fs.writeFileSync("./data/disputeResults.json", jsonDisputeResults);

    // Creating disputeResults.xlsx file
    const resultsExcelObject = XLSX.utils.book_new();
    const resultsSheetObject = XLSX.utils.aoa_to_sheet([["TRACKING NUMBER", "INVOICE NUMBER", "DESCRIPTION"]]); // Adding headers to the table

    resultDisputesAr.forEach((shipmentRow) => {
      const splitedShipmentData = shipmentRow.split(" | "); //Split the string by | character

      // Adding a Row with the Shipment Result information to the resultsSheetObject
      XLSX.utils.sheet_add_aoa(resultsSheetObject, [splitedShipmentData], {
        origin: -1,
      });
    });

    // Adding the sheet created in the previos step to the resultsExcelObject
    XLSX.utils.book_append_sheet(resultsExcelObject, resultsSheetObject, "Dispute Results");

    try {
      // Saving the XLSX object as an Excel file
      XLSX.writeFile(resultsExcelObject, "./data/disputeResults.xlsx");
    } catch (error) {
      console.log(error);
      // Saving a backup file in case an exception occurs, the information won't be lost
      XLSX.writeFile(resultsExcelObject, "./data/backup-disputeResults.xlsx");
    }
  }

  async function refinedWaitForNavigation(website: Page) {
    //function to make sure the page loads before continuing with the algorithm
    await Promise.race([
      website.waitForNavigation({ waitUntil: "networkidle2", timeout: 25000 }),
      new Promise((resolve, reject) => {
        setTimeout(() => reject(new Error("Timeout waiting for navigation")), 20000);
      }),
    ]);
  }

  async function applyDelay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function runGsrDisputeProcess(interfaceGSR: GsrInterface, finalResultDisputeArray: string[]) {
    const trackingNumber: string = interfaceGSR["TRACKING NUMBER"]; // Typescript asignments
    const invoiceNumber: string = interfaceGSR["INVOICE NUMBER"]; // Typescript asignments

    const browser: Browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-blink-features=AutomationControlled"],
    });

    const webpage: Page = await browser.newPage();
    await webpage.setViewport({ width: 1200, height: 800 });

    //User visualization to inform the user by console whe shipment in dispute process
    console.log(`\n\nTrack Number: ${interfaceGSR["TRACKING NUMBER"]} | Invoice Number: ${interfaceGSR["INVOICE NUMBER"]}`);

    try {
      await Promise.race([
        webScrappingProcess(webpage, trackingNumber, invoiceNumber, resultDisputesArray),
        new Promise((resolve, reject) => {
          setTimeout(() => reject(new Error("Timeout waiting for navigation")), 60000);
        }),
      ]);
    } catch (error) {
      //User visualization to inform the user the error generated
      console.log(`Error catched on ${interfaceGSR["TRACKING NUMBER"]}_${interfaceGSR["INVOICE NUMBER"]}`);
      console.log(error);
      finalResultDisputeArray.push(`${trackingNumber} | ${invoiceNumber} | Page didn't load - Timeout waiting for navigation`);
      return;
    } finally {
      await browser.close();
    }
  }

  async function main(listOfShipmentsJson: GsrInterface[], arrayResultDisputes: string[]) {
    puppeteer.use(StealthPlugin());
    for (const shipment of listOfShipmentsJson) {
      await applyDelay(2000 + 1000 * Math.random());
      await runGsrDisputeProcess(shipment, arrayResultDisputes);
    }
    createDisputeResultsFiles(arrayResultDisputes);
  }

  main(jsonShipmentsList, resultDisputesArray);

  rl.close();
});
