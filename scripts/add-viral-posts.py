import json

viral_posts = [
    {
        "id": "viral_001",
        "text": "Walking out mid shift over the intercom is iconic. You do not owe toxic managers anything.\n\nhttps://www.youtube.com/watch?v=hHfsHDwQ80I\n\ncvin.bio/jobs"
    },
    {
        "id": "viral_002",
        "text": "HR could not even explain why she was laid off. Loyalty to a company is a trap.\n\nhttps://www.youtube.com/watch?v=u7G7OpgKROw\n\ncvin.bio"
    },
    {
        "id": "viral_003",
        "text": "When the whole team walks out, it is never about the work. It is about management.\n\nhttps://www.youtube.com/watch?v=a7JkVSZ4fLg\n\ncvin.bio/jobs"
    },
    {
        "id": "viral_004",
        "text": "Waking up to make breakfast for your kids > logging into a toxic job. cvin.bio/jobs",
        "img": "viral/quit_breakfast.jpg"
    },
    {
        "id": "viral_005",
        "text": "Nothing beats watching a bad manager realize you have options. cvin.bio",
        "img": "viral/boss_text.jpg"
    },
    {
        "id": "viral_006",
        "text": "The hardest part of working from home is putting on real pants. Never go back to a cubicle. cvin.bio/jobs",
        "img": "viral/wfh_pants.png"
    },
    {
        "id": "viral_007",
        "text": "HR forcing culture on people who just want to do their jobs and go home is peak corporate. cvin.bio/jobs",
        "img": "viral/forced_party.jpg"
    },
    {
        "id": "viral_008",
        "text": "Managers who text you on your day off expecting a fast reply are a massive red flag. cvin.bio/jobs",
        "img": "viral/shocking_text.jpg"
    },
    {
        "id": "viral_009",
        "text": "Standing up to a toxic boss feels amazing. Just make sure your resume is ready first. cvin.bio",
        "img": "viral/ultimatum.jpg"
    },
    {
        "id": "viral_010",
        "text": "\"No one wants to work\" is corporate for \"we refuse to pay what you are worth\". Stop settling. cvin.bio/jobs",
        "img": "viral/turnover.jpg"
    }
]

# Add to x-content.json
with open('/Users/vedang/PDFtoWebsite/.github/scripts/x-content.json', 'r') as f:
    x_data = json.load(f)

# Randomize the insertion of viral posts into the engagement array
import random
random.shuffle(viral_posts)
x_data['engagement'].extend(viral_posts)

with open('/Users/vedang/PDFtoWebsite/.github/scripts/x-content.json', 'w') as f:
    json.dump(x_data, f, indent=2)

# Add to buffer-content.json
with open('/Users/vedang/PDFtoWebsite/.github/scripts/buffer-content.json', 'r') as f:
    buffer_data = json.load(f)

# The structure of buffer-content.json is {"posts": [...]}
# But wait, buffer has specific formats sometimes. Let's check format of buffer_data.
