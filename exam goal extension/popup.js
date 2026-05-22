document.getElementById('extractAllBtn').addEventListener('click', () => runExtractor("start_auto_extract"));
document.getElementById('extractSingleBtn').addEventListener('click', () => runExtractor("extract_single"));
document.getElementById('viewLastBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('pdf_viewer.html') });
});

async function runExtractor(actionType) {
    const statusEl = document.getElementById('status');
    const btnAll = document.getElementById('extractAllBtn');
    const btnSingle = document.getElementById('extractSingleBtn');

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab || tab.url.startsWith("chrome://")) {
            statusEl.innerText = "Error: Open a mock test webpage first!";
            return;
        }

        btnAll.disabled = true;
        btnSingle.disabled = true;

        if (actionType === "start_auto_extract") {
            statusEl.innerText = "Auto-extract started! Please check the webpage and do not click anything. (You can safely close this popup)";
        } else {
            statusEl.innerText = "Extracting current question and opening PDF tab...";
        }

        const limit = parseInt(document.getElementById('limitInput').value) || 300;
        // Send message to the content script running on the active page
        chrome.tabs.sendMessage(tab.id, { action: actionType, limit: limit }, (response) => {
            if (chrome.runtime.lastError) {
                // Usually means content script hasn't been injected or page reloaded
                statusEl.innerText = "Error connecting to page. Try refreshing the Mock Test page and click again.";
                btnAll.disabled = false;
                btnSingle.disabled = false;
            } else if (response && response.status === "single_extracted") {
                statusEl.innerText = "Extracted successfully! PDF tab opened.";
                btnAll.disabled = false;
                btnSingle.disabled = false;
            }
        });

    } catch (err) {
        statusEl.innerText = `Error: ${err.message}`;
        btnAll.disabled = false;
        btnSingle.disabled = false;
    }
}
