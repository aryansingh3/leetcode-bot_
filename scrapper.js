import clipboardy from "clipboardy";
import fs from "fs";
import { getElementBySelector, getElementByXPath, sleep } from "./utils.js";
import {
  SCRAPPER_SUBMITTED_CODE_DIV_XPATH,
  SCRAPPER_SUBMITTED_CODE_LANGUAGE_XPATH,
  SCRAPPER_SUBMITTED_CODE_NAME_XPATH,
} from "./constants.js";

const scrapAndSaveCodeFromSubmissionId = async (page, id) => {
  try {
    await page.goto(`https://leetcode.com/submissions/detail/${id}/`, {
      waitUntil: "networkidle2",
    });

    // Get name from the link in the name href
    const nameDiv = await getElementByXPath(page, SCRAPPER_SUBMITTED_CODE_NAME_XPATH, 3, 0);
    const hrefHandle = await nameDiv[0].getProperty("href");
    const href = await hrefHandle.jsonValue();
    const arr = await href.split("/");
    const nameDivValue = arr[arr.length - 2];

    // Get the language from the submission page
    const languageDiv = await getElementByXPath(page, SCRAPPER_SUBMITTED_CODE_LANGUAGE_XPATH, 3, 0);
    const languageDivValue = await languageDiv[0].evaluate((el) => el.textContent);

    // Get Code from the code  div
    const codeDiv = await getElementByXPath(page, SCRAPPER_SUBMITTED_CODE_DIV_XPATH, 3, 0);
    await codeDiv[0].click();

    await page.keyboard.down("Control");
    await page.keyboard.press("KeyA");
    await page.keyboard.up("Control");

    await page.keyboard.down("Control");
    await page.keyboard.press("KeyC");
    await page.keyboard.up("Control");

    const copiedText = clipboardy.readSync();
    var fileContent = { problemName: nameDivValue, language: languageDivValue, code: copiedText };

    sleep(1.5);
    //Saving the scrap details
    const filePath = `problems/${nameDivValue}.json`;
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(fileContent));
      console.log(`Code ${nameDivValue} saved`);
    } else {
      console.log(`Code ${nameDivValue} already exists.`);
    }
  } catch (e) {
    console.error(e);
  }
};

const scrapSubmissionIdsFromPageId = async (page, id) => {
  await page.goto(`https://leetcode.com/submissions/#/${id}`, {
    waitUntil: "networkidle2",
  });

  const rows = await getElementBySelector(page, ".text-success", 10);
  const accepted_hrefs = await Promise.all(
    rows.map(async (row) => {
      return await row.evaluate((el) => el.getAttribute("href"));
    })
  );
  const submission_ids = await Promise.all(
    accepted_hrefs.map(async (href) => {
      const arr = await href.split("/");
      return arr[arr.length - 2];
    })
  );
  return submission_ids;
};
const scrapCodeFromAllSubmissions = async (page) => {
  for (var page_no = 1; page_no <= 1000; page_no++) {
    try {
      const submission_ids = await scrapSubmissionIdsFromPageId(page, page_no);
      console.log(`Submission ids fetched from page number ${page_no}`, submission_ids);
      for (var idx = 0; idx < submission_ids.length; idx++) {
        await scrapAndSaveCodeFromSubmissionId(page, submission_ids[idx]);
      }
    } catch (e) {
      console.error(e + "\nMost likely invalid page id");
      return;
    }
  }
};

export const scrap = async (page) => {
  await scrapCodeFromAllSubmissions(page);
  // var content = fs.readFileSync(filePath);
  // content = JSON.parse(content);
  // console.log(content.code);
};