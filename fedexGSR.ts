const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
import { Browser, Page } from "puppeteer";
const fs = require("fs");

puppeteer.use(StealthPlugin());
const url =
  "https://www.fedex.com/servlet/InvoiceServlet?link=4&jsp_name=adjustment&orig_country=US&language=english/";

const gsr = async () => {
  const browser: Browser = await puppeteer.launch({ headless: false });
  const page: Page = await browser.newPage();

  await page.goto(url);

  await page.screenshot({ path: "FxWebsite.jpg" });

  await page.click('input[value="E"]');
  await wait(1000);

  await page.click('input[value="invoice"]');
  await wait(1000);

  await page.click('input[name="StatusReq"]');
  await wait(3000);

  await page.type('input[name="tracking_nbr"]', "774788231996");
  await wait(3000);

  await page.type('input[name="invoice_nbr"]', "837987211");
  await wait(3000);

  await page.click('input[value="Send Request"]');
  await wait(100000);

//   var viewSource = await page.goto("https://www.fedex.com/servlet/INVService");
//   fs.writeFile("testGSR.jpg", await viewSource.buffer(), function (err: any) {
//     if (err) {
//         return console.log(err);
//     }
//     console.log("The file was saved!");
// });



  await browser.close();
};

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

gsr();
