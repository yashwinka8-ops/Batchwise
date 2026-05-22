chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "start_auto_extract") {
        startAutoExtract(request.limit || 300); // Safety limit default 300 iterations
        sendResponse({ status: "started" });
    } else if (request.action === "extract_single") {
        extractSingle().then(() => sendResponse({ status: "single_extracted" }));
        return true; // async response
    }
});

function drawOverlay() {
    let overlay = document.getElementById('scraper-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'scraper-overlay';
        overlay.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); color:white; display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:9999999; font-family:"Segoe UI", sans-serif; font-size:24px; pointer-events:none;';
        document.body.appendChild(overlay);
    }
    return overlay;
}

function removeOverlay() {
    const overlay = document.getElementById('scraper-overlay');
    if (overlay) overlay.remove();
}

async function startAutoExtract(limit) {
    const overlay = drawOverlay();
    let allData = [];
    let lastQ = "";
    let sameCount = 0;

    for (let i = 0; i < limit; i++) {
        overlay.innerHTML = `<div style="font-weight:bold;font-size:32px;">Scraping Question ${i + 1}...</div><div style="font-size:16px; margin-top:15px; color:#ddd;">Do not interact with the page or change tabs!</div><div style="font-size:14px; margin-top:20px;">Found ${allData.length} questions so far...</div>`;

        await toggleShowAnswer(true); // turn on solution
        // Wait briefly for the explanation to mount on the page
        await new Promise(r => setTimeout(r, 150));

        const data = extractFromDataLayer() || extractDataFromDOM();

        // Strip out HTML tags for a clean string compare
        let cleanQ = data.question.replace(/<[^>]*>?/gm, '').trim();

        if (cleanQ === lastQ && cleanQ !== "") {
            sameCount++;
            if (sameCount >= 3) { // increased tolerance due to speed
                console.log("Stuck on same question, stopping automator.");
                break; // Stop if we keep fetching the same question
            }
        } else {
            sameCount = 0;
            lastQ = cleanQ;
            if (data.question.trim().length > 0) {
                allData.push(data);
            }
        }

        const hasNext = await clickNextButton();
        if (!hasNext) {
            console.log("No Next button found, finish.");
            break;
        }

        // Smart polling: Wait ONLY until the next question appears on screen (max 1.5s)
        let waited = 0;
        while (waited < 1500) {
            await new Promise(r => setTimeout(r, 100));
            waited += 100;
            let checkQ = extractDataFromDOM().question.replace(/<[^>]*>?/gm, '').trim();
            if (checkQ !== lastQ && checkQ !== "") {
                break; // New question loaded, proceed immediately!
            }
        }
    }

    overlay.innerHTML = `<div style="font-weight:bold;font-size:32px;color:#4CAF50;">Scraping Complete!</div><div style="font-size:18px; margin-top:15px;">Indexed ${allData.length} questions.</div><div style="font-size:16px; margin-top:20px;">Opening PDF tab...</div>`;

    await new Promise(r => setTimeout(r, 1500));
    removeOverlay();

    chrome.runtime.sendMessage({ action: "generate_pdf", data: allData });
}

async function extractSingle() {
    await toggleShowAnswer(true);
    await new Promise(r => setTimeout(r, 600));
    const data = extractDataFromDOM();

    // We expect the popup to close immediately, so we message background to open a new tab
    chrome.runtime.sendMessage({ action: "generate_pdf", data: [data] }, (res) => {
        // success
    });
}

function getShowAnswerLabelEl() {
    let checkNodes = Array.from(document.querySelectorAll('label, span, div, p'));
    let ansLbl = checkNodes.find(n => {
        return (n.childNodes.length === 1 && n.childNodes[0].nodeType === Node.TEXT_NODE && n.textContent.trim().toLowerCase() === 'show answer')
            || n.innerText?.trim().toLowerCase() === 'show answer';
    });
    return ansLbl;
}

async function toggleShowAnswer(forceShow) {
    let lbl = getShowAnswerLabelEl();
    if (lbl) {
        let parent = lbl.parentElement || lbl;
        // Search parent or preceding element for toggle switch/checkbox
        let switchEl = parent.querySelector('button[role="switch"], input[type="checkbox"], .switch') || document.querySelector('button[role="switch"]');

        if (switchEl) {
            let isChecked = switchEl.checked || switchEl.getAttribute('aria-checked') === 'true';
            if ((forceShow && !isChecked) || (!forceShow && isChecked)) {
                switchEl.click();
            }
        } else {
            // fallback: let's just click the wrapper
            // note: this might incorrectly toggle if it's already shown and we blindly click. 
            // So we first check if solution exists in DOM.
            const SOL_CHECK = '.solution, .explanation, div[class*="solution"], div[class*="solution-box"], [id*="solution"]';
            let hasSolution = document.querySelector(SOL_CHECK) !== null;

            if ((forceShow && !hasSolution) || (!forceShow && hasSolution)) {
                lbl.click();
                if (parent !== lbl) parent.click();
            }
        }
    }
}

async function clickNextButton() {
    // Looks for explicit next text button
    const buttons = Array.from(document.querySelectorAll('button, a'));
    const nextBtn = buttons.find(b => {
        const t = b.innerText.trim().toLowerCase();
        return t === 'next' || t === 'next question';
    });

    if (nextBtn && !nextBtn.disabled && (!nextBtn.getAttribute('aria-disabled') || nextBtn.getAttribute('aria-disabled') === 'false')) {
        nextBtn.click();
        return true;
    }
    return false;
}

/**
 * DEEP SCRAPER: Directly extracts the raw JSON data from the portal's memory.
 * This is 100% accurate and contains the pure LaTeX.
 */
function extractFromDataLayer() {
    try {
        // 1. Look for Next.js Data (Common in modern portals like ExamGoal)
        const nextDataEl = document.getElementById('__NEXT_DATA__');
        if (nextDataEl) {
            const json = JSON.parse(nextDataEl.textContent);
            // Search for question object deeper in the state (varies by portal layout)
            // This is a generic "deep search" to find any object that looks like a question
            const findQuestionInObject = (obj) => {
                if (!obj || typeof obj !== 'object') return null;
                if (obj.questionText || obj.question_text || obj.question_content) return obj;
                for (let key in obj) {
                    const found = findQuestionInObject(obj[key]);
                    if (found) return found;
                }
                return null;
            };

            if (rawQ) {
                console.log("Deep Scraper: Found raw JSON data!", rawQ);
                // Wrap in $ if not already wrapped
                const wrap = (s) => {
                    if (!s) return "";
                    let str = String(s);
                    if (str.includes('\\') || str.includes('^') || str.includes('_')) {
                        if (!str.startsWith('$')) return `$${str}$`;
                    }
                    return str;
                };

                return {
                    question: wrap(rawQ.questionText || rawQ.question_text || rawQ.text || ""),
                    options: (rawQ.options || rawQ.choices || []).map(o => wrap(o)),
                    solution: wrap(rawQ.solution || rawQ.explanation || ""),
                    subject: rawQ.subject || "Physics",
                    correctIndex: rawQ.correctIndex !== undefined ? rawQ.correctIndex : (rawQ.answer || ""),
                    image: rawQ.imageUrl || rawQ.image || ""
                };
            }
        }
    } catch (e) {
        console.warn("Deep Scraper: Not found or failed", e);
    }
    return null; // Fallback to DOM scraping
}

function cleanHtml(htmlOrNode) {
    if (!htmlOrNode) return "";
    let container;
    if (typeof htmlOrNode === 'string') {
        container = document.createElement('div');
        container.innerHTML = htmlOrNode;
    } else {
        container = htmlOrNode.cloneNode(true);
    }

    // 1. LATEX PRESERVATION STEP
    // Before removing anything, try to find original TeX in MathJax elements
    // MathJax 3+ often uses MJX-CONTAINER with an aria-label containing the TeX
    // MathJax 2 often uses <script type="math/tex">
    
    // 1. ADVANCED LATEX PRESERVATION & CONVERSION
    // a) Process MathJax scripts/containers (already there)
    container.querySelectorAll('script[type^="math/tex"]').forEach(script => {
        const tex = script.textContent || script.innerText;
        const isDisplay = script.type.includes('display');
        const wrapper = isDisplay ? `$$${tex}$$` : `$${tex}$`;
        script.replaceWith(document.createTextNode(wrapper));
    });

    container.querySelectorAll('mjx-container[aria-label]').forEach(mjx => {
        const tex = mjx.getAttribute('aria-label');
        if (tex) mjx.replaceWith(document.createTextNode(`$${tex}$`));
    });

    container.querySelectorAll('.katex-mathml, .katex-html').forEach(k => {
        const annotation = k.querySelector('annotation');
        if (annotation) {
            k.replaceWith(document.createTextNode(`$${annotation.textContent}$`));
        } else if (k.classList.contains('katex-html')) {
            k.remove();
        }
    });

    // b) Convert RAW HTML Math (superscripts, subscripts, Greek)
    const processRawHtmlMath = (node) => {
        // Convert <sup> to ^{...}
        node.querySelectorAll('sup').forEach(sup => {
            const content = sup.innerHTML.trim();
            // Wrap in LaTeX markers immediately
            sup.replaceWith(document.createTextNode(`^{${content}}`));
        });
        // Convert <sub> to _{...}
        node.querySelectorAll('sub').forEach(sub => {
            const content = sub.innerHTML.trim();
            sub.replaceWith(document.createTextNode(`_{${content}}`));
        });
        
        node.querySelectorAll('br').forEach(br => br.replaceWith(document.createTextNode('\n')));
    };
    processRawHtmlMath(container);

    // c) Convert common HTML entities to LaTeX commands
    let html = container.innerHTML;
    const entityMap = {
        '&alpha;': '\\alpha', '&beta;': '\\beta', '&gamma;': '\\gamma', '&delta;': '\\delta',
        '&epsilon;': '\\epsilon', '&theta;': '\\theta', '&lambda;': '\\lambda', '&mu;': '\\mu',
        '&pi;': '\\pi', '&sigma;': '\\sigma', '&phi;': '\\phi', '&omega;': '\\omega',
        '&rho;': '\\rho', '&tau;': '\\tau', '&eta;': '\\eta', '&zeta;': '\\zeta',
        '&Omega;': '\\Omega', '&Delta;': '\\Delta', '&Theta;': '\\Theta',
        '&le;': '\\le', '&ge;': '\\ge', '&plusmn;': '\\pm', '&times;': '\\times',
        '&divide;': '\\div', '&prop;': '\\propto', '&infin;': '\\infty', '&radic;': '\\sqrt',
        '&int;': '\\int', '&sum;': '\\sum', '&prod;': '\\prod', '&pi;': '\\pi'
    };
    
    Object.keys(entityMap).forEach(entity => {
        const regex = new RegExp(entity, 'g');
        html = html.replace(regex, entityMap[entity]);
    });
    
    // Final check for symbols in plain text
    html = html.replace(/α/g, '\\alpha').replace(/β/g, '\\beta').replace(/γ/g, '\\gamma')
               .replace(/δ/g, '\\delta').replace(/θ/g, '\\theta').replace(/λ/g, '\\lambda')
               .replace(/μ/g, '\\mu').replace(/π/g, '\\pi').replace(/σ/g, '\\sigma')
               .replace(/φ/g, '\\phi').replace(/ω/g, '\\omega');

    container.innerHTML = html;

    // 2. CLEANUP STEP
    // List of selectors that often contain duplicate or assistive text/math
    const toRemove = [
        '.mjx-assistive-mml',
        '.MJX_Assistive_MathML',
        'annotation',
        '.sr-only',
        '.MathJax_Preview',
        '.MathJax_Message',
        '.hidden',
        '.d-none',
        '[aria-hidden="true"]',
        '.video-suggestion',
        '.print-ignore'
    ];

    toRemove.forEach(selector => {
        container.querySelectorAll(selector).forEach(el => el.remove());
    });

    return container.innerHTML.trim();
}

function extractDataFromDOM() {
    let subject = "Physics"; // Default as requested
    let correctIndex = "";
    let image = "";
    let questionHtml = "<i>No question extracted.</i>";
    let optionsHtmlArr = [];
    let solutionHtml = "";

    try {
        // 1. Find QUESTION
        // Broaden search for common question containers
        let qEls = document.querySelectorAll('.question-content, .question_text, [class*="QuestionText"], .q-text, .question, .question-text, div[class*="Question_"]');
        let questionEl = null;

        if (qEls.length > 0) {
            // Find the one that actually contains text/content
            questionEl = Array.from(qEls).find(el => el.innerText.trim().length > 5) || qEls[0];
            questionHtml = cleanHtml(questionEl);
        } else {
            // Fallback: look for large bold text or first div in body slot
            let bodySlot = document.querySelector('[data-slot="body"], .body-content');
            if (bodySlot) {
                questionEl = bodySlot;
                questionHtml = cleanHtml(bodySlot);
            }
        }

        // 2. Find IMAGES within the question
        if (questionEl) {
            // Check for <img>, <svg>, or background-images in some cases
            let img = questionEl.querySelector('img, svg');
            if (img) {
                if (img.tagName.toLowerCase() === 'img' && img.src) {
                    image = img.src;
                } else if (img.tagName.toLowerCase() === 'svg') {
                    // SVGs are tricky for CSV, but we can't really "link" them unless they have an href
                }
            }
        }

        // 3. Find OPTIONS
        // Options usually belong to a list or a grid
        let optContainers = document.querySelectorAll('.options-list, .grid, .choices, [class*="Options"], [class*="grid"]');
        let chosenGrid = null;

        for (let container of optContainers) {
            let possibleOpts = Array.from(container.children).filter(el => el.innerText.trim().length > 0);
            if (possibleOpts.length >= 2 && possibleOpts.length <= 6) {
                chosenGrid = container;
                optionsHtmlArr = possibleOpts.map(el => cleanHtml(el));
                
                // Try to find correctIndex
                possibleOpts.forEach((opt, idx) => {
                    // Check self and all children for "correct" indicators
                    const hasGreenColor = (el) => {
                        const style = window.getComputedStyle(el);
                        return style.backgroundColor.includes('rgb(0, 128, 0)') || 
                               style.backgroundColor.includes('rgb(34, 197, 94)') || 
                               style.color.includes('rgb(0, 128, 0)') ||
                               style.borderColor.includes('rgb(0, 128, 0)');
                    };

                    const hasCorrectClass = (el) => {
                        const cls = el.className.toString().toLowerCase();
                        return cls.includes('correct') || cls.includes('success') || cls.includes('green');
                    };

                    const hasCheckmark = opt.querySelector('svg[class*="check"], i[class*="check"], .check-icon');

                    if (hasGreenColor(opt) || hasCorrectClass(opt) || hasCheckmark || 
                        Array.from(opt.querySelectorAll('*')).some(child => hasGreenColor(child) || hasCorrectClass(child))) {
                        correctIndex = idx;
                    }
                });
                break;
            }
        }

        // 4. Handle NUMERICAL questions if no options were found
        if (optionsHtmlArr.length < 2) {
            // Search for numerical answer patterns
            // Patterns: "Correct answer is 3", "Correct Answer: 25", "Answer: 12.5", "Ans 5", etc.
            const patterns = [
                /correct answer\s+(?:is|was|:)?\s*([\d.-]+)/i, 
                /answer\s+(?:is|was|:)?\s*([\d.-]+)/i, 
                /ans\s*[:\s]*([\d.-]+)/i,
                /result\s*[:\s]*([\d.-]+)/i
            ];
            
            // First, try to find the specific "Answer" section container content
            let ansSectionHeader = Array.from(document.querySelectorAll('div, span, p, h1, h2, h3, h4, b, strong')).find(el => {
                return el.innerText && el.innerText.trim().toLowerCase() === 'answer';
            });

            if (ansSectionHeader) {
                let ansContainer = ansSectionHeader.nextElementSibling || ansSectionHeader.parentElement.nextElementSibling;
                if (ansContainer) {
                    let ansText = ansContainer.innerText.trim();
                    for (let pattern of patterns) {
                        const match = ansText.match(pattern);
                        if (match && match[1]) {
                            correctIndex = match[1];
                            break;
                        }
                    }
                    // If no regex match but the box just contains a number
                    if (!correctIndex && !isNaN(parseFloat(ansText)) && ansText.length < 10) {
                        correctIndex = ansText;
                    }
                }
            }

            // Fallback: search the entire body text
            if (!correctIndex) {
                const allText = document.body.innerText;
                for (let pattern of patterns) {
                    const match = allText.match(pattern);
                    if (match && match[1]) {
                        correctIndex = match[1];
                        break;
                    }
                }
            }

            // Final Fallback: look for specific answer badges
            if (!correctIndex) {
                const answerBadge = document.querySelector('.answer, .correct-answer, [class*="AnswerValue"], [class*="correct_answer"]');
                if (answerBadge && !isNaN(parseFloat(answerBadge.innerText.trim()))) {
                    correctIndex = answerBadge.innerText.trim();
                }
            }
        }

        // 5. Find SOLUTION
        let explanationWords = ['explanation', 'solution', 'answer key', 'step-by-step'];
        let solHeader = Array.from(document.querySelectorAll('div, span, p, h1, h2, h3, h4, b, strong')).find(el => {
            return el.innerText && explanationWords.some(word => el.innerText.trim().toLowerCase() === word);
        });

        if (solHeader) {
            let nextEl = solHeader.nextElementSibling;
            if (nextEl) {
                solutionHtml = cleanHtml(nextEl);
            } else if (solHeader.parentElement && solHeader.parentElement.nextElementSibling) {
                solutionHtml = cleanHtml(solHeader.parentElement.nextElementSibling);
            }
        }

        if (!solutionHtml) {
            let solEls = document.querySelectorAll('.solution, .explanation, [id*="explanation"], [id*="solution"], [class*="solution"], [class*="explanation"]');
            if (solEls.length > 0) {
                solutionHtml = cleanHtml(solEls[0]);
            }
        }

    } catch (e) {
        console.error("DOM Extraction error", e);
    }

    return {
        question: questionHtml,
        options: optionsHtmlArr,
        solution: solutionHtml,
        subject: subject,
        correctIndex: correctIndex,
        image: image
    };
}
