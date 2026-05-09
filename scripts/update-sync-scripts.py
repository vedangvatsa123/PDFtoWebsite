import sqlite3
import os
import re

def get_slugs():
    db_path = os.path.join('/Users/vedang/PDFtoWebsite/scratch/OpenPostings', 'jobs.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    slugs = {
        'ashbyhq': set(),
        'leverco': set(),
        'greenhouse': set(),
        'bamboohr': set(),
        'personio': set(),
        'breezy': set()
    }
    
    cursor.execute("SELECT ATS_name, url_string FROM companies WHERE ATS_name IN ('ashbyhq', 'leverco', 'greenhouse', 'bamboohr', 'personio', 'breezy')")
    results = cursor.fetchall()
    
    for ats, url in results:
        if not url: continue
        
        slug = None
        if ats == 'ashbyhq' and 'jobs.ashbyhq.com/' in url:
            slug = url.rstrip('/').split('/')[-1]
        elif ats == 'leverco' and 'jobs.lever.co/' in url:
            slug = url.rstrip('/').split('/')[-1]
        elif ats == 'greenhouse' and 'job-boards.greenhouse.io/' in url:
            slug = url.rstrip('/').split('/')[-1]
        elif ats == 'bamboohr' and '.bamboohr.com' in url:
            slug = url.split('://')[-1].split('.')[0]
        elif ats == 'personio' and '.jobs.personio.de' in url:
            slug = url.split('://')[-1].split('.')[0]
        elif ats == 'breezy' and '.breezy.hr' in url:
            slug = url.split('://')[-1].split('.')[0]
            
        if slug and len(slug) < 100:
            slugs[ats].add(slug)
            
    conn.close()
    return slugs

def update_file(slugs):
    file_path = '/Users/vedang/PDFtoWebsite/.github/scripts/jobs-sync.mjs'
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    def replace_array(array_name, new_slugs_set):
        nonlocal content
        pattern = r"(const " + array_name + r" = \[)(.*?)(\];)"
        match = re.search(pattern, content, flags=re.DOTALL)
        if not match:
            print(f"Could not find {array_name}")
            return
        
        # Parse existing
        existing_str = match.group(2)
        # Find all strings inside quotes
        existing_list = re.findall(r"'(.*?)'", existing_str)
        
        combined = set(existing_list) | new_slugs_set
        sorted_combined = sorted(list(combined))
        
        # Format the new array content nicely
        new_content_lines = []
        current_line = "  "
        for slug in sorted_combined:
            item = f"'{slug}',"
            if len(current_line) + len(item) > 100:
                new_content_lines.append(current_line)
                current_line = "  " + item
            else:
                current_line += item
        if current_line.strip():
            new_content_lines.append(current_line)
            
        new_str = "\n" + "\n".join(new_content_lines) + "\n"
        
        content = content[:match.start(2)] + new_str + content[match.end(2):]

    replace_array('GREENHOUSE_SLUGS', slugs['greenhouse'])
    replace_array('ASHBY_SLUGS', slugs['ashbyhq'])
    replace_array('LEVER_SLUGS', slugs['leverco'])
    replace_array('BAMBOOHR_SLUGS', slugs['bamboohr'])
    replace_array('PERSONIO_SLUGS', slugs['personio'])
    replace_array('BREEZY_SLUGS', slugs['breezy'])

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print(f"Updated {file_path} successfully!")
    print(f"Added Ashby: {len(slugs['ashbyhq'])}")
    print(f"Added Lever: {len(slugs['leverco'])}")
    print(f"Added Greenhouse: {len(slugs['greenhouse'])}")
    print(f"Added BambooHR: {len(slugs['bamboohr'])}")
    print(f"Added Personio: {len(slugs['personio'])}")
    print(f"Added Breezy: {len(slugs['breezy'])}")

if __name__ == '__main__':
    slugs = get_slugs()
    update_file(slugs)
