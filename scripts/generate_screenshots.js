const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const posts = [
  {
    id: 1,
    type: 'slack',
    sender: 'CEO',
    time: '11:32 AM',
    content: `As a family, we expect everyone to work this weekend to meet the deadline. No PTO will be approved.`
  },
  {
    id: 2,
    type: 'linkedin',
    sender: 'Tech Recruiter',
    content: `We are looking for an Entry-Level Developer.<br><br>You must have 8 years of experience in Generative AI.<br><br>The pay is mostly equity.`
  },
  {
    id: 3,
    type: 'email',
    title: 'Return to Office Policy Update',
    sender: 'HR',
    content: `Starting Monday, badge swipes will be monitored.<br><br>Minimum 9 hours required in office.<br><br>Anyone spending more than 15 minutes in the restroom will be flagged.`
  },
  {
    id: 4,
    type: 'email',
    title: 'Important Team Update',
    sender: 'Leadership',
    content: `We are laying off 15 percent of the team.<br><br>As an AI language model, I do not have personal feelings, but I offer sympathy.`
  },
  {
    id: 5,
    type: 'email',
    title: 'Immediate Revision Needed!',
    sender: 'Director',
    content: `<b>Sent: Saturday, 2:14 AM</b><br><br>I don't like the shade of blue on the button. Please drop whatever you are doing with your family and fix this immediately.`
  },
  {
    id: 6,
    type: 'slack',
    sender: 'Management',
    time: '4:12 PM',
    content: `While we do have unlimited PTO, taking 3 days off in a row shows a lack of dedication to the startup. Request denied.`
  },
  {
    id: 7,
    type: 'linkedin',
    sender: 'Startup Founder',
    content: `I can't pay a salary right now but I offer 0.5 percent equity.<br><br>You will need to work weekends but the exposure will be huge. You in?`
  },
  {
    id: 8,
    type: 'alert',
    title: 'Productivity Alert',
    content: `<b>Your mouse has not moved for 4 minutes.</b><br><br>Your status is Away. Your manager has been notified.`
  },
  {
    id: 9,
    type: 'email',
    title: 'Application Update',
    sender: 'Talent Acquisition',
    content: `Thank you for completing our 8-hour take-home assignment and 5 rounds of interviews.<br><br>Unfortunately, we are moving forward with an unpaid intern.`
  },
  {
    id: 10,
    type: 'imessage',
    sender: 'Manager',
    content: `I know you have the flu, but can you just join the 10 AM zoom meeting from bed with your camera off?<br><br>We really need you.`
  }
];

const htmlTemplate = (post) => {
  let contentHtml = '';

  if (post.type === 'email') {
    contentHtml = \`
      <div style="background: #ffffff; color: #333; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px; border-radius: 12px; width: 800px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 1px solid #e0e0e0;">
        <div style="border-bottom: 2px solid #f0f0f0; padding-bottom: 25px; margin-bottom: 25px;">
          <h2 style="margin: 0 0 15px 0; font-size: 32px; font-weight: 600; color: #111;">\${post.title}</h2>
          <div style="color: #666; font-size: 22px;">From: <strong>\${post.sender}</strong> &lt;\${post.sender.toLowerCase().replace(/ /g, '.')}@company.com&gt;</div>
        </div>
        <div style="font-size: 28px; line-height: 1.6; color: #222;">
          \${post.content}
        </div>
      </div>
    \`;
  } else if (post.type === 'alert') {
    contentHtml = \`
      <div style="background: #f3f2f1; color: #323130; font-family: 'Segoe UI', sans-serif; width: 600px; border: 2px solid #ccc; box-shadow: 0 16px 32px rgba(0,0,0,0.2); border-radius: 8px;">
        <div style="background: #fff; padding: 20px 24px; border-bottom: 2px solid #eee; display: flex; align-items: center;">
          <span style="color: #d13438; font-size: 36px; margin-right: 16px;">⚠️</span>
          <span style="font-weight: 600; font-size: 24px;">\${post.title}</span>
        </div>
        <div style="padding: 30px 24px; background: #fff; font-size: 24px; line-height: 1.5;">
          \${post.content}
        </div>
        <div style="padding: 20px 24px; background: #f3f2f1; text-align: right; border-top: 2px solid #e1dfdd;">
          <button style="background: #0078d4; color: white; border: none; padding: 12px 24px; border-radius: 4px; font-weight: 600; font-size: 20px;">Acknowledge</button>
        </div>
      </div>
    \`;
  } else if (post.type === 'linkedin') {
    contentHtml = \`
      <div style="background: #fff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; width: 650px; border: 2px solid #e0dfdc; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="padding: 20px 24px; border-bottom: 2px solid #e0dfdc; font-weight: 600; font-size: 24px; display: flex; align-items: center; background: #f8f9fa;">
          <div style="width: 48px; height: 48px; border-radius: 50%; background: #0a66c2; color: white; display: flex; align-items: center; justify-content: center; margin-right: 16px; font-size: 20px;">\${post.sender.charAt(0)}</div>
          \${post.sender}
        </div>
        <div style="padding: 30px;">
          <div style="display: flex;">
            <div style="width: 48px; height: 48px; border-radius: 50%; background: #0a66c2; margin-right: 16px; flex-shrink: 0; color: white; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 600;">\${post.sender.charAt(0)}</div>
            <div style="background: #f2f2f2; padding: 24px 30px; border-radius: 0 16px 16px 16px; font-size: 26px; line-height: 1.5; color: #1f1f1f; max-width: 80%;">
              \${post.content}
            </div>
          </div>
        </div>
      </div>
    \`;
  } else if (post.type === 'slack') {
    contentHtml = \`
      <div style="background: #fff; font-family: 'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; width: 800px; padding: 30px; border: 1px solid #e8e8e8; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
        <div style="display: flex;">
          <div style="width: 56px; height: 56px; border-radius: 6px; background: #e01e5a; color: white; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; margin-right: 16px; flex-shrink: 0;">\${post.sender.charAt(0)}</div>
          <div>
            <div style="margin-bottom: 8px; display: flex; align-items: baseline;">
              <strong style="font-size: 26px; color: #1d1c1d; font-weight: 900;">\${post.sender}</strong>
              <span style="color: #616061; font-size: 18px; margin-left: 12px;">\${post.time}</span>
            </div>
            <div style="font-size: 28px; color: #1d1c1d; line-height: 1.5;">
              \${post.content}
            </div>
          </div>
        </div>
      </div>
    \`;
  } else if (post.type === 'imessage') {
    contentHtml = \`
      <div style="background: #fff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; width: 500px; border: 1px solid #e5e5ea; border-radius: 20px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
        <div style="text-align: center; color: #8e8e93; font-size: 16px; margin-bottom: 20px;">Today 9:41 AM</div>
        <div style="display: flex; flex-direction: column;">
          <div style="background: #e9e9eb; color: #000; padding: 16px 22px; border-radius: 24px; border-bottom-left-radius: 4px; font-size: 26px; line-height: 1.4; max-width: 85%; align-self: flex-start; margin-bottom: 8px;">
            \${post.content}
          </div>
        </div>
      </div>
    \`;
  }

  return \`
    <!DOCTYPE html>
    <html>
    <head><style>body { background: #f0f2f5; display: flex; align-items: center; justify-content: center; margin: 0; padding: 60px; min-height: 100vh; zoom: 1.2; }</style></head>
    <body>
      <div id="capture">\${contentHtml}</div>
    </body>
    </html>
  \`;
};

async function generateScreenshots() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Set a large viewport so the zoom works well
  await page.setViewport({ width: 1200, height: 1000, deviceScaleFactor: 2 });
  
  const outDir = '/Users/vedang/Desktop/linkedin_viral_posts';
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const fileNames = [
    '1_toxic_slack.png',
    '2_delusional_recruiter.png',
    '3_unhinged_rto.png',
    '4_chatgpt_firing.png',
    '5_weekend_email.png',
    '6_unlimited_pto_trap.png',
    '7_unpaid_startup.png',
    '8_mouse_tracker.png',
    '9_automated_rejection.png',
    '10_sick_day_zoom.png'
  ];

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    await page.setContent(htmlTemplate(post));
    const element = await page.$('#capture');
    const outputPath = path.join(outDir, fileNames[i]);
    await element.screenshot({ path: outputPath });
    console.log(\`Generated \${outputPath}\`);
  }

  await browser.close();
}

generateScreenshots().catch(console.error);
