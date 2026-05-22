chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "generate_pdf") {
        // Save the extracted data to local storage so the new tab can access it
        chrome.storage.local.set({ extractedQuestions: request.data }, () => {
            // Open the PDF viewer HTML page provided within the extension
            chrome.tabs.create({ url: chrome.runtime.getURL('pdf_viewer.html') });
        });
        sendResponse({ status: "success" });
    }
});
