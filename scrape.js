const website = "https://www.houseofdestiny.org/prophecy/";
const puppeteer = require("puppeteer");

async function scrapeTableData() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });
  const page = await browser.newPage();
  await page.goto(website);

  let allData = [];
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function processPage(pageNum) {
    await page.evaluate((num) => {
      getPage(num);
    }, pageNum);

    await delay(2000);

    for (let rowNum = 0; rowNum <= 13; rowNum++) {
      try {
        const rowSelector = `#prophRow${rowNum}`;
        await page.waitForSelector(rowSelector, { timeout: 5000 });
        await page.click(rowSelector);
        await delay(1000);

        const rowData = await page.evaluate(() => {
          // Get the date-location data
          const dateLocation = document.evaluate(
            '//*[@id="prophecy_html"]/b',
            document,  // Changed from document.body
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          ).singleNodeValue;

          // Get the link to prophecy
          const linkLocation = document.evaluate(
            '//*[@id="prophecy_html"]/a',
            document,  // Changed from document.body
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          ).singleNodeValue;

          // get paragraph data to array
          const paragraphs = [];
          const iterator = document.evaluate(
            '//*[@id="prophecy_html"]/p',
            document,
            null,
            XPathResult.ORDERED_NODE_ITERATOR_TYPE,
            null
          );

          let paragraph;
          while ((paragraph = iterator.iterateNext())) {
            paragraphs.push(paragraph.textContent.trim());
          }

          return {
            dateLocation: dateLocation ? dateLocation.textContent : null,  // Added .textContent
            linkLocation: linkLocation ? linkLocation.href : null,         // Added .href
            paragraphs: paragraphs
          };
        });

        // Changed condition to check if any data exists
        if (rowData.dateLocation || rowData.linkLocation || rowData.paragraphs.length > 0) {
          allData.push({
            page: pageNum,
            row: rowNum,
            link: rowData.linkLocation,           // Removed .trim since it's already a string
            dateLocation: rowData.dateLocation,   // Changed from titleDate to match the returned object
            paragraphs: rowData.paragraphs
          });
        }

        await delay(1000);
      } catch (error) {
        console.log(`Error on page ${pageNum}, row ${rowNum}:`, error.message);
        continue;
      }
    }
  }

  const totalPages = await page.evaluate(() => {
    const pageLinks = document.querySelectorAll('a[onclick*="getPage"]');
    return Math.max(
      ...Array.from(pageLinks).map((link) => {
        const num = link.getAttribute("onclick").match(/getPage\((\d+)\)/);
        return num ? parseInt(num[1]) : 0;
      })
    );
  });

  for (let i = 1; i <= totalPages; i++) {
    console.log(`Processing page ${i} of ${totalPages}`);
    await processPage(i);
    await delay(1500);
  }

  await browser.close();
  return allData;
}

scrapeTableData()
  .then((data) => {
    console.log("Scraped data:", data);
    require("fs").writeFileSync(
      "scraped_data.json",
      JSON.stringify(data, null, 2)
    );
  })
  .catch((error) => console.error("Error:", error));