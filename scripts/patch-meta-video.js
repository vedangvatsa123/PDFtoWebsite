const fs = require('fs');

const file = '.github/scripts/meta-post.mjs';
let content = fs.readFileSync(file, 'utf8');

// Replace postToFacebook to handle video
const fbOld = /async function postToFacebook\(text, imagePath\) \{[\s\S]*?\n\}[\n]/;
const fbNew = `async function postToFacebook(text, imagePath) {
  if (!META_PAGE_ID || !META_PAGE_TOKEN) return { ok: false, imageUrl: null };
  try {
    if (imagePath && fs.existsSync(imagePath)) {
      const isVideo = imagePath.endsWith('.mp4');
      const fileData = fs.readFileSync(imagePath);
      const formData = new FormData();
      
      if (isVideo) {
        formData.append('description', text);
        formData.append('source', new Blob([fileData], { type: 'video/mp4' }), require('path').basename(imagePath));
      } else {
        formData.append('message', text);
        formData.append('source', new Blob([fileData], { type: 'image/jpeg' }), require('path').basename(imagePath));
      }
      formData.append('access_token', META_PAGE_TOKEN);

      const endpoint = isVideo ? 'videos' : 'photos';
      const url = \`\${GRAPH_URL}/\${META_PAGE_ID}/\${endpoint}\`;
      
      const res = await fetch(url, { method: 'POST', body: formData });
      const data = await res.json();

      if (data.id) {
        console.log(\`✅ Facebook: posted \${isVideo ? 'video' : 'photo'} \${data.id}\`);
        let imageUrl = null;
        if (!isVideo) {
          try {
            const imgRes = await fetch(\`\${GRAPH_URL}/\${data.id}?fields=images&access_token=\${META_PAGE_TOKEN}\`);
            const imgData = await imgRes.json();
            if (imgData.images && imgData.images.length > 0) imageUrl = imgData.images[0].source;
          } catch (e) {}
        }
        return { ok: true, imageUrl };
      } else {
        console.error('❌ Facebook error:', JSON.stringify(data));
        return { ok: false, imageUrl: null };
      }
    } else {
      const url = \`\${GRAPH_URL}/\${META_PAGE_ID}/feed\`;
      const params = new URLSearchParams({ message: text, access_token: META_PAGE_TOKEN });
      const res = await fetch(url, { method: 'POST', body: params });
      const data = await res.json();
      return { ok: !!data.id, imageUrl: null };
    }
  } catch (e) {
    console.error('❌ Facebook exception:', e.message);
    return { ok: false, imageUrl: null };
  }
}
`;
content = content.replace(fbOld, fbNew);

// Replace postToInstagram to handle video
const igOld = /async function postToInstagram\(text, imageUrl\) \{[\s\S]*?\n\}[\n]/;
const igNew = `async function postToInstagram(text, mediaUrl, isVideo = false) {
  if (!META_IG_USER_ID || !META_PAGE_TOKEN) return false;
  if (!mediaUrl) return false;

  try {
    const createParams = new URLSearchParams({
      caption: text,
      access_token: META_PAGE_TOKEN,
    });
    
    if (isVideo) {
      createParams.append('media_type', 'REELS');
      createParams.append('video_url', mediaUrl);
    } else {
      createParams.append('image_url', mediaUrl);
    }

    const createRes = await fetch(\`\${GRAPH_URL}/\${META_IG_USER_ID}/media\`, { method: 'POST', body: createParams });
    const createData = await createRes.json();

    if (!createData.id) {
      console.error('❌ Instagram container error:', JSON.stringify(createData));
      return false;
    }

    console.log(\`📦 Instagram: container created \${createData.id}\`);
    // Wait longer for video processing
    let ready = false;
    for (let i = 0; i < (isVideo ? 6 : 2); i++) {
        await new Promise(r => setTimeout(r, 5000));
        if (isVideo) {
           const statusRes = await fetch(\`\${GRAPH_URL}/\${createData.id}?fields=status_code&access_token=\${META_PAGE_TOKEN}\`);
           const statusData = await statusRes.json();
           if (statusData.status_code === 'FINISHED') { ready = true; break; }
        } else {
           ready = true; break;
        }
    }

    const publishParams = new URLSearchParams({ creation_id: createData.id, access_token: META_PAGE_TOKEN });
    const pubRes = await fetch(\`\${GRAPH_URL}/\${META_IG_USER_ID}/media_publish\`, { method: 'POST', body: publishParams });
    const pubData = await pubRes.json();

    if (pubData.id) {
      console.log(\`✅ Instagram: published \${pubData.id}\`);
      return true;
    } else {
      console.error('❌ Instagram publish error:', JSON.stringify(pubData));
      return false;
    }
  } catch (e) {
    console.error('❌ Instagram exception:', e.message);
    return false;
  }
}
`;
content = content.replace(igOld, igNew);

// Replace postToThreads to handle video
const thOld = /async function postToThreads\(text, imageUrl\) \{[\s\S]*?\n\}[\n]/;
const thNew = `async function postToThreads(text, mediaUrl, isVideo = false) {
  if (!THREADS_USER_ID || !THREADS_TOKEN) return false;

  try {
    const createParams = new URLSearchParams({ text, access_token: THREADS_TOKEN });
    
    if (mediaUrl) {
      createParams.append('media_type', isVideo ? 'VIDEO' : 'IMAGE');
      if (isVideo) createParams.append('video_url', mediaUrl);
      else createParams.append('image_url', mediaUrl);
    } else {
      createParams.append('media_type', 'TEXT');
    }

    const createRes = await fetch(\`https://graph.threads.net/v1.0/\${THREADS_USER_ID}/threads\`, { method: 'POST', body: createParams });
    const createData = await createRes.json();

    if (!createData.id) {
      console.error('❌ Threads container error:', JSON.stringify(createData));
      return false;
    }

    let ready = false;
    for (let i = 0; i < (isVideo ? 6 : 2); i++) {
        await new Promise(r => setTimeout(r, 5000));
        if (isVideo) {
           const statusRes = await fetch(\`https://graph.threads.net/v1.0/\${createData.id}?fields=status&access_token=\${THREADS_TOKEN}\`);
           const statusData = await statusRes.json();
           if (statusData.status === 'FINISHED') { ready = true; break; }
        } else {
           ready = true; break;
        }
    }

    const pubParams = new URLSearchParams({ creation_id: createData.id, access_token: THREADS_TOKEN });
    const pubRes = await fetch(\`https://graph.threads.net/v1.0/\${THREADS_USER_ID}/threads_publish\`, { method: 'POST', body: pubParams });
    const pubData = await pubRes.json();

    if (pubData.id) {
      console.log(\`✅ Threads: published \${pubData.id}\`);
      return true;
    } else {
      console.error('❌ Threads publish error:', JSON.stringify(pubData));
      return false;
    }
  } catch (e) {
    console.error('❌ Threads exception:', e.message);
    return false;
  }
}
`;
content = content.replace(thOld, thNew);

// Replace main call to use isVideo and cvin.bio URL
const mainOld = /const fb = await postToFacebook\(text, imagePath\);[\s\S]*?await postToThreads\(text, imageUrl\);/;
const mainNew = `const fb = await postToFacebook(text, imagePath);
  
  const isVideo = imagePath && imagePath.endsWith('.mp4');
  // For video, we use the public URL directly from the repo. For images, we use FB's CDN link.
  const mediaUrl = isVideo ? \`https://cvin.bio\${item.img}\` : fb.imageUrl;

  await postToInstagram(text, mediaUrl, isVideo);
  await postToThreads(text, mediaUrl, isVideo);`;
content = content.replace(mainOld, mainNew);

fs.writeFileSync(file, content);
console.log('Patched meta-post.mjs for video');
