# Mock Test Question Extractor

## How to Install the Extension
1. Open Google Chrome.
2. Go to the extensions page by navigating to `chrome://extensions/`.
3. Enable **Developer mode** at the top right corner.
4. Click on **Load unpacked** in the top left.
5. Select this folder (`exam goal extension`) and click **Select Folder**.
6. The extension is now installed. You should see its icon in the Chrome toolbar (you might need to pin it from the puzzle piece menu).

## How to Use
1. Open up the mock test site (where the questions and choices are visible).
2. Click on the extension icon.
3. Click "Extract Question".
4. The question, options, and solutions will appear in the popup.
5. You can click "Copy to Clipboard" to easily save it.

## Customizing the Extraction Logic
Since every website is coded differently, the extraction logic may need to be slightly modified to uniquely identify the text on your portal. 
To do this:
1. Open `popup.js` in a text editor.
2. Find the function `extractDataFromPage()` near the bottom.
3. You will see some dummy CSS selectors for headers, classes, and options:
   ```javascript
   const QUES_SELECTOR = '.question-text, .q-text, div[role="document"], div:not([class]) > p:first-child';
   const OPTIONS_SELECTOR = '.option-text, .options > div, label[class*="option"], div[class*="Option"]';
   const SOLUTION_SELECTOR = '.solution, .explanation, .correct-ans';
   ```
4. Right-click on the question text in Chrome and select **Inspect**. Look for a `class` or `id` associated with the question block. 
5. Replace the `QUES_SELECTOR`, `OPTIONS_SELECTOR`, or `SOLUTION_SELECTOR` string with the correct Class Name (preceded by a `.`) or ID (preceded by `#`).
6. Save the `popup.js` file.
7. Go back to `chrome://extensions/` and hit the **Refresh** button on your extension card to apply the updates.
