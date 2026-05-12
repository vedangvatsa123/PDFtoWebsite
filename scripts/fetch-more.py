import json

with open('/Users/vedang/PDFtoWebsite/scripts/viral-alltime.json', 'r') as f:
    results = json.load(f)

# Let's write the whole list to a new file so we can view it
with open('/Users/vedang/PDFtoWebsite/scripts/viral-alltime-full.json', 'w') as f:
    json.dump(results, f, indent=2)

print("Dumped all to viral-alltime-full.json")
