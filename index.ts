const puppeteer = require("puppeteer");
const fs = require("fs");
import { Browser } from "puppeteer";

const url = "https://books.toscrape.com/";

const main = async () => {
  const browser: Browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(url);

  const bookData = await page.evaluate((urlScope) => {
    const bookPods = Array.from(document.querySelectorAll(".product_pod"));

    const convPrice = (price: string) => parseFloat(price.replace("£", ""));

    const data = bookPods.map((book: any) => ({
      title: book.querySelector("h3 a").getAttribute("title"),
      price: convPrice(book.querySelector(".price_color").innerText),
      imgSrc: urlScope + book.querySelector("div a img").getAttribute("src"),
      rating: book.querySelector(".star-rating").classList[1],
    }));
    return data;
  }, url);

  console.log(bookData);

  await browser.close();

  fs.writeFile("data.json", JSON.stringify(bookData), ((err: any) => {
    if (err) throw err;
    console.log("File saved");
  }));

};

main();
