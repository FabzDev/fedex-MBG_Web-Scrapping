# Fedex Money-Back-Guarantee Assistant

![Fedex Logo](https://www.fedex.com/content/dam/fedex-com/logos/logo.svg)

### Website: https://www.fedex.com/servlet/InvoiceServlet?link=4&jsp_name=adjustment&orig_country=US&language=english/

## Overview

The Fedex Money-Back-Guarantee Assistant is a JavaScript-based application that acts as a web scraper to insert information into forms and obtain results. It is designed to help you manage your shipments and determine if they are eligible to receive the full benefit of Fedex's money-back guarantee policy. With this assistant, powered by libraries such as Puppeteer for its scraping capabilities, including functions of Puppeteer, Puppeteer-extra-plugin-stealth to avoid bot detection by websites, Tesseract.js for Optical Character Recognition since Fedex responses are in image format, XLSX for creating and storing information in Excel files, and fs for saving output data to disk. This tool allows you to easily identify shipments that qualify for refunds and streamline the process of submitting refund requests to Fedex.

## Features

- Identify shipments that qualify for a refund under Fedex's money-back guarantee policy.
- Streamline the process of submitting refund requests to Fedex.
- Generate an Excel file listing shipments with their approval/denial status and reasons for denial.
- Saves the screenshots of Fedex's responses to each Money Back Guarantee request.

## Getting Started

To get started with the Fedex Money-Back-Guarantee Assistant, follow these steps:

1. Clone the repository:
 ```
   git clone https://github.com/tuusuario/fedex-money-back-guarantee-assistant.git
```

2. Install dependencies:
 ```
   npm install
```

3. Use the website [TableConvert](https://tableconvert.com/excel-to-json) to convert the datasheet to a JSON file. Follow this table format:

    | TRACKING NUMBER | INVOICE NUMBER|
    |-----------------|---------------|
    | 274215589081    | 227462392     |
    | 67890589081     | 227462123     |  
    

    3.1.  To run the program in headless mode, navigate to line 146 of fedexGSR.ts in the root directory and change await puppeteer.launch({ headless: false }) to true.
  
  
4. Start the application:
 ```
   npm start or npm run gsr
```  
  
5. Open the resulting report saved in /data/out. The file is named results.xlsx. In case of a file system exception, the Excel file will be saved as results-backup.xlsx. Additionally, you can find the results in JSON format in the same folder as JSONresults.json.

## Contributing

Contributions to the Fedex Money-Back-Guarantee Assistant are welcome! If you'd like to contribute, please fork the repository, make your changes, and submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
