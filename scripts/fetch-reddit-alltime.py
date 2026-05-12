import requests
import json

headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
}

subreddits = ['antiwork', 'recruitinghell', 'WorkReform', 'jobs', 'funny', 'TikTokCringe']
results = []

for sub in subreddits:
    url = f"https://www.reddit.com/r/{sub}/top.json?sort=top&t=all&limit=50"
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            for post in data['data']['children']:
                p = post['data']
                # Try to get job-related keywords for generic subs
                title_lower = p['title'].lower()
                is_job_related = any(k in title_lower for k in ['job', 'boss', 'work', 'interview', 'manager', 'resume', 'salary', 'pay', 'quit', 'fired'])
                
                if sub in ['funny', 'TikTokCringe'] and not is_job_related:
                    continue
                    
                if p['ups'] >= 90000:
                    media_url = p.get('url', '')
                    is_video = p.get('is_video', False)
                    
                    if is_video and 'reddit_video' in p.get('media', {}):
                        media_url = p['media']['reddit_video'].get('fallback_url', media_url)
                    elif 'preview' in p and 'reddit_video_preview' in p['preview']:
                        media_url = p['preview']['reddit_video_preview'].get('fallback_url', media_url)
                        is_video = True
                        
                    results.append({
                        'subreddit': sub,
                        'title': p['title'],
                        'upvotes': p['ups'],
                        'url': 'https://reddit.com' + p['permalink'],
                        'is_video': is_video,
                        'media_url': media_url
                    })
    except Exception as e:
        print(f"Error on {sub}: {e}")

results = sorted(results, key=lambda x: x['upvotes'], reverse=True)

with open('/Users/vedang/PDFtoWebsite/scripts/viral-alltime-full.json', 'w') as f:
    json.dump(results, f, indent=2)

print(f"Fetched {len(results)} viral posts >= 90k upvotes")
