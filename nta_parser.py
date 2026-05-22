import re
import csv
import os

def extract_nta_questions():
    # Input and Output paths
    html_file = r"c:\Users\Yashwin\Downloads\AP010200267_2083O25249S5D9036E1.html"
    output_file = r"c:\Users\Yashwin\Documents\Batchwise\nta_import.csv"
    base_url = "https://cdn3.digialm.com"
    
    if not os.path.exists(html_file):
        print(f"Error: HTML file not found at {html_file}")
        return

    print(f"Parsing {html_file}...")
    with open(html_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split into individual question blocks
    panels = re.split(r'<div class="question-pnl"', content)[1:]
    
    questions_data = []
    for panel in panels:
        # 1. Extract Question ID
        qid_match = re.search(r'Question ID\s*:\s*</td><td class="bold">(\d+)', panel)
        if not qid_match: continue
        qid = qid_match.group(1)

        # 2. Determine Subject
        subject = "Physics"
        if "Mathematics Section" in panel: subject = "Mathematics"
        elif "Chemistry Section" in panel: subject = "Chemistry"

        # 3. Determine Question Type (MCQ vs SA/Numerical)
        is_numerical = "Numerical" in panel or "Question Type :</td><td class=\"bold\" >SA" in panel
        
        # 4. Extract Images
        # The first image is the main question, subsequent are options
        imgs = re.findall(r'src="([^"]+)"', panel)
        if not imgs: continue
        
        # Prepend base URL to all images
        full_imgs = []
        for img in imgs:
            if img.startswith('/'):
                full_imgs.append(base_url + img)
            else:
                full_imgs.append(img)
            
        q_image_url = full_imgs[0]
        opt1, opt2, opt3, opt4 = "", "", "", ""
        
        # If it's an MCQ and we have multiple images, they are likely options
        if not is_numerical and len(full_imgs) >= 5:
            opt1, opt2, opt3, opt4 = full_imgs[1:5]
            
        # 5. Extract Chosen Option as a reference for the key
        chosen_match = re.search(r'Chosen Option\s*:\s*</td><td class="bold">([^<]+)', panel)
        chosen = chosen_match.group(1).strip() if chosen_match else ""
        
        # We'll map "Chosen Option" to correctOptionIndex so the user has a starting point
        try:
            if is_numerical:
                correct_idx = 0
                correct_val = chosen # Store the value directly for numericals
            else:
                correct_idx = int(chosen) - 1 if (chosen and chosen.isdigit()) else 0
                correct_val = ""
        except:
            correct_idx = 0
            correct_val = ""

        questions_data.append({
            'type': 'NUMERICAL' if is_numerical else 'MCQ',
            'subject': subject,
            'text': '', 
            'option1': opt1,
            'option2': opt2,
            'option3': opt3,
            'option4': opt4,
            'correctoptionindex': correct_idx,
            'correctnumericanswer': correct_val,
            'imageurl': q_image_url,
            'difficulty': 'Mains'
        })
    
    # Write to CSV
    headers = ['type', 'subject', 'text', 'option1', 'option2', 'option3', 'option4', 'correctoptionindex', 'correctnumericanswer', 'imageurl', 'difficulty']
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(questions_data)
    
    print(f"--- SUCCESS ---")
    print(f"Extracted {len(questions_data)} questions.")
    print(f"Import file created at: {output_file}")
    print(f"Note: Digialm image links may expire in a few days. Import them soon!")

if __name__ == "__main__":
    extract_nta_questions()
