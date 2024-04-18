const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth")
import { Browser } from "puppeteer";

puppeteer.use(StealthPlugin());
const url = "https://bot.sannysoft.com/"



const main = async() => {
    const browser: Browser = await puppeteer.launch({headless: true})
    const page = await browser.newPage();
    
    await page.goto( url );
    await page.screenshot({path: 'ssBot.jpg'})





    await browser.close();
}

main();