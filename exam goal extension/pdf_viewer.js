document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['extractedQuestions'], (result) => {
        const data = result.extractedQuestions;
        const contentDiv = document.getElementById('content');
        const excelBtn = document.getElementById('excelBtn');
        const jsonBtn = document.getElementById('jsonBtn');
        const htmlBtn = document.getElementById('htmlBtn');
        const txtBtn = document.getElementById('txtBtn');

        if (!data || data.length === 0) {
            contentDiv.innerHTML = `<div style="text-align:center; padding: 40px;">
                <h2>No data found!</h2>
                <p>Please make sure you extracted a page successfully before opening this tab.</p>
             </div>`;
            return;
        }

        // CSV/Excel Logic
        if (excelBtn) {
            excelBtn.addEventListener('click', () => {
                const stripHtml = (html) => {
                    if (!html) return "";
                    const tmp = document.createElement("DIV");
                    tmp.innerHTML = html;
                    return (tmp.textContent || tmp.innerText || "").replace(/\s+/g, ' ').trim();
                };

                const chosenSubject = document.getElementById('subjectInput')?.value || "Physics";
                
                // Prepare data for SheetJS (Array of Arrays)
                const worksheetData = [
                    ["text", "subject", "optA", "optB", "optC", "optD", "correctIndex", "solution", "difficulty", "image"]
                ];

                data.forEach(item => {
                    const row = [
                        stripHtml(item.question),              // text
                        chosenSubject,                         // subject
                        stripHtml(item.options[0] || ""),      // optA
                        stripHtml(item.options[1] || ""),      // optB
                        stripHtml(item.options[2] || ""),      // optC
                        stripHtml(item.options[3] || ""),      // optD
                        item.correctIndex !== undefined ? item.correctIndex : "", // correctIndex
                        stripHtml(item.solution || ""),        // solution
                        "Medium",                              // difficulty
                        item.image || ""                       // image
                    ];
                    worksheetData.push(row);
                });

                // Create Workbook using SheetJS
                const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Questions");

                // Download XLSX
                XLSX.writeFile(workbook, `mock_test_${new Date().getTime()}.xlsx`);
            });
        }

        // CSV Export Logic
        if (csvBtn) {
            csvBtn.addEventListener('click', () => {
                const stripHtmlForCsv = (html) => {
                    if (!html) return "";
                    let clean = html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
                    
                    // Ultra-inclusive math detection
                    const mathPatterns = [/\\\w+/, /\^/, /\_/, /\$/, /\{/, /\}/, /log/, /sin/, /cos/, /tan/, /lim/];
                    const hasMath = mathPatterns.some(p => p.test(clean));
                    
                    if (hasMath && !clean.includes('$')) return `$${clean}$`;
                    return clean;
                };

                const chosenSubject = document.getElementById('subjectInput')?.value || "Physics";
                const worksheetData = [["text", "subject", "optA", "optB", "optC", "optD", "correctIndex", "solution", "difficulty", "image"]];

                data.forEach(item => {
                    const row = [
                        stripHtmlForCsv(item.question),
                        chosenSubject,
                        stripHtmlForCsv(item.options[0] || ""),
                        stripHtmlForCsv(item.options[1] || ""),
                        stripHtmlForCsv(item.options[2] || ""),
                        stripHtmlForCsv(item.options[3] || ""),
                        item.correctIndex !== undefined ? item.correctIndex : "",
                        stripHtmlForCsv(item.solution || ""),
                        "Medium",
                        item.image || ""
                    ];
                    worksheetData.push(row);
                });

                const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
                const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
                const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.setAttribute("href", url);
                link.setAttribute("download", `mock_test_${new Date().getTime()}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
        }

        // JSON Logic
        if (jsonBtn) {
            jsonBtn.addEventListener('click', () => {
                // Modified stripHtml for JSON to preserve & wrap LaTeX math markers
                const stripHtmlForJson = (html) => {
                    if (!html) return "";
                    
                    // 1. Clean up tags but keep content
                    let clean = html.replace(/<[^>]*>?/gm, ' ')
                                    .replace(/\s+/g, ' ')
                                    .trim();
                                    
                    // 2. Intelligence: If the string has math symbols but NO delimiters, wrap it!
                    // Common symbols: ^, _, \sum, \log, \pm, \alpha, \beta, \int, etc.
                    const mathPatterns = [/\\\w+/, /\^\{/, /\_\{/, /\$\$/, /\$\$/];
                    const hasMathMarkers = mathPatterns.some(p => p.test(clean));
                    
                    // If it has math but isn't wrapped in $, wrap the whole thing
                    if (hasMathMarkers && !clean.includes('$')) {
                        return `$${clean}$`;
                    }
                    
                    return clean;
                };

                const chosenSubject = document.getElementById('subjectInput')?.value || "Physics";
                
                const jsonOutput = data.map(item => {
                    const isNumerical = !item.options || item.options.length < 2;
                    const baseObj = {
                        text: stripHtmlForJson(item.question),
                        subject: chosenSubject,
                        type: isNumerical ? "Numerical" : "MCQ",
                        difficulty: "Medium",
                        solution: stripHtmlForJson(item.solution || "")
                    };

                    if (isNumerical) {
                        baseObj.ans = (item.correctIndex !== "" && item.correctIndex !== undefined) ? item.correctIndex.toString() : "";
                    } else {
                        baseObj.options = (item.options || []).map(o => stripHtmlForJson(o));
                        baseObj.correctIndex = (item.correctIndex !== "" && item.correctIndex !== undefined) ? parseInt(item.correctIndex) : null;
                    }

                    if (item.image) baseObj.image = item.image;
                    
                    return baseObj;
                });

                const blob = new Blob([JSON.stringify(jsonOutput, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.setAttribute("href", url);
                link.setAttribute("download", `questions_${new Date().getTime()}.json`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
        }

        // TXT Logic
        if (txtBtn) {
            txtBtn.addEventListener('click', () => {
                const stripHtmlForTxt = (html) => {
                    if (!html) return "";
                    
                    let clean = html.replace(/<[^>]*>?/gm, ' ')
                                    .replace(/\s+/g, ' ')
                                    .trim();
                                    
                    const mathPatterns = [/\\\w+/, /\^\{/, /\_\{/, /\$\$/, /\$\$/];
                    const hasMathMarkers = mathPatterns.some(p => p.test(clean));
                    
                    if (hasMathMarkers && !clean.includes('$')) {
                        return `$${clean}$`;
                    }
                    
                    return clean;
                };

                let txtOutput = "";
                data.forEach((item, index) => {
                    txtOutput += `Question ${index + 1}:\n${stripHtmlForTxt(item.question)}\n\n`;

                    const isNumerical = !item.options || item.options.length < 2;
                    if (!isNumerical) {
                        (item.options || []).forEach((opt, i) => {
                            txtOutput += `(${String.fromCharCode(65 + i)}) ${stripHtmlForTxt(opt)}\n`;
                        });
                        
                        let correctLabel = "N/A";
                        if (item.correctIndex !== "" && item.correctIndex !== undefined) {
                            correctLabel = String.fromCharCode(65 + parseInt(item.correctIndex));
                        }
                        txtOutput += `\nCorrect Answer: ${correctLabel}\n`;
                    } else {
                        let correctLabel = (item.correctIndex !== "" && item.correctIndex !== undefined) ? item.correctIndex : "N/A";
                        txtOutput += `\nCorrect Answer: ${correctLabel}\n`;
                    }

                    if (item.solution && item.solution.trim() !== '') {
                        txtOutput += `\nSolution:\n${stripHtmlForTxt(item.solution)}\n`;
                    }
                    
                    txtOutput += `\n---------------------------------------------------\n\n`;
                });

                const blob = new Blob([txtOutput], { type: 'text/plain;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.setAttribute("href", url);
                link.setAttribute("download", `questions_${new Date().getTime()}.txt`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
        }

        let questionsHtml = "";
        let answerKeyHtml = `<div class="answer-key-section">
            <h2 class="section-title">Answer Key</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; margin-bottom: 40px;">`;
        
        let answersHtml = `<div class="solutions-section">
            <h2 class="section-title">Solutions & Explanations</h2>
        </div>`;
        let hasAnySolution = false;

        data.forEach((item, index) => {
            let optsHtml = "";
            let correctLabel = "N/A";

            // Determine Answer Key Label
            if (item.options && item.options.length >= 2) {
                // MCQ case
                if (item.correctIndex !== "" && item.correctIndex !== undefined) {
                    correctLabel = String.fromCharCode(65 + parseInt(item.correctIndex));
                }
            } else {
                // Numerical case
                correctLabel = item.correctIndex || "N/A";
            }

            answerKeyHtml += `
                <div style="background: #f8fafc; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; text-align: center;">
                    <strong>Q${index + 1}:</strong> <span style="color: #2563eb; font-weight: bold;">${correctLabel}</span>
                </div>
            `;

            // Loop over options
            item.options.forEach((o, i) => {
                let lbl = String.fromCharCode(65 + i); // (A), (B), (C), (D)
                optsHtml += `<div class="option-box">
                    <strong>(${lbl})&nbsp;&nbsp;</strong> 
                    <div style="flex:1;">${o}</div>
                 </div>`;
            });

            questionsHtml += `
              <div class="q-container">
                <div class="q-header">Question ${index + 1}</div>
                <div class="q-body">${item.question}</div>
                <div class="options-container">
                   ${optsHtml}
                </div>
              </div>
            `;

            if (item.solution && item.solution.trim() !== '') {
                hasAnySolution = true;
                answersHtml += `
                  <div class="solution-box">
                    <div class="solution-header">Solution for Question ${index + 1}</div>
                    <div class="solution-content">${item.solution}</div>
                  </div>
                `;
            }
        });

        answerKeyHtml += `</div></div>`;
        const finalHtml = questionsHtml + answerKeyHtml + (hasAnySolution ? answersHtml : "");
        contentDiv.innerHTML = finalHtml;

        // HTML Logic
        if (htmlBtn) {
            htmlBtn.addEventListener('click', () => {
                let htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Extracted Questions</title>
    <!-- Load KaTeX CSS for pre-rendered MathJax/KaTeX elements from ExamGoal -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
    <!-- Load MathJax Core to re-render any dynamically missing expressions -->
    <script>
        window.MathJax = {
            tex: {
                inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
                displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']]
            },
            svg: { fontCache: 'global' },
            startup: {
                pageReady: () => {
                    return MathJax.startup.defaultPageReady();
                }
            }
        };
    </script>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    <style>
        body { font-family: "Inter", "Segoe UI", Roboto, sans-serif; padding: 30px; color: #1a1a1a; max-width: 900px; margin: 0 auto; line-height: 1.6; background: #fdfdfd; }
        .q-container { background: #fff; border: 1px solid #e0e0e0; padding: 24px; margin-bottom: 30px; page-break-inside: avoid; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .q-header { font-weight: 700; font-size: 1.1rem; margin-bottom: 12px; border-bottom: 2px solid #f0f0f0; padding-bottom: 8px; color: #0f172a; }
        .q-body { font-size: 1.05rem; margin-bottom: 20px; }
        .options-container { display: grid; gap: 12px; margin-top: 15px; grid-template-columns: 1fr; }
        .option-box { background: #f8fafc; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 6px; display: flex; align-items: flex-start; gap: 10px; }
        .solution-box { margin-top: 15px; padding: 20px; background: #fdfdfd; border: 1px solid #e0e0e0; border-left: 5px solid #22c55e; border-radius: 6px; font-size: 0.95rem; margin-bottom: 25px; page-break-inside: avoid; }
        .solution-header { font-weight: 700; color: #166534; margin-bottom: 12px; font-size: 1.1rem; border-bottom: 1px solid #dcfce7; padding-bottom: 6px; }
        .section-title { font-size: 1.8rem; color: #0f172a; margin: 40px 0 20px 0; padding-bottom: 10px; border-bottom: 3px solid #0f172a; text-align: center; page-break-before: always; }
        .solutions-section { margin-top: 50px; }
        img, svg { max-width: 100%; height: auto; display: inline-block; vertical-align: middle; }
        .math-inline { padding: 0 4px; }
        .math-block { margin: 10px 0; text-align: center; }
        h1 { margin: 0 0 20px 0; font-size: 1.5rem; color: #1e3a8a; }
    </style>
</head>
<body>
    <h1>Extracted Questions</h1>
    <div id="content">
        ${finalHtml}
    </div>
</body>
</html>`;

                const blob = new Blob([htmlTemplate], { type: 'text/html;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.setAttribute("href", url);
                link.setAttribute("download", `questions_${new Date().getTime()}.html`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
        }

        // Wait a brief moment to ensure browser layout and images render, then prompt print automatically
        setTimeout(() => {
            if (window.MathJax && window.MathJax.typesetPromise) {
                window.MathJax.typesetPromise([contentDiv]).then(() => {
                    setTimeout(() => window.print(), 500);
                });
            } else {
                window.print();
            }
        }, 800);
    });
});
