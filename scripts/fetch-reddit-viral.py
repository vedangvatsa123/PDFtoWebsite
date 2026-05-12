import requests
import json

headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
}

subreddits = ['recruitinghell', 'antiwork', 'jobs', 'ProgrammerHumor']
results = []

for sub in subreddits:
    url = f"https://www.reddit.com/r/{sub}/top.json?sort=top&t=year&limit=5"
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            for post in data['data']['children']:
                p = post['data']
                if p['ups'] > 20000: # high bar of virality
                    results.append({
                        'subreddit': sub,
                        'title': p['title'],
                        'upvotes': p['ups'],
                        'comments': p['num_comments'],
                        'url': 'https://reddit.com' + p['permalink'],
                        'text': p.get('selftext', '')[:500],
                        'is_video': p.get('is_video', False),
                        'image_url': p.get('url', '') if p.get('post_hint') == 'image' else ''
                    })
    except Exception as e:
        print(f"Error on {sub}: {e}")

# Sort by upvotes
results = sorted(results, key=lambda x: x['upvotes'], reverse=True)

# Save to file
with open('/Users/vedang/PDFtoWebsite/scripts/viral-posts.json', 'w') as f:
    json.dump(results[:15], f, indent=2)

print(f"Fetched {len(results)} viral posts")
