import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  const frameHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SpeakEasy Tasks - Voice-Powered Productivity</title>
  
  <!-- Farcaster Frame Meta Tags -->
  <meta property="fc:frame" content="vNext" />
  <meta property="fc:frame:image" content="${baseUrl}/frame-image.png" />
  <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
  <meta property="fc:frame:button:1" content="🎤 Create Task" />
  <meta property="fc:frame:button:1:action" content="link" />
  <meta property="fc:frame:button:1:target" content="${baseUrl}" />
  <meta property="fc:frame:button:2" content="📅 View Calendar" />
  <meta property="fc:frame:button:2:action" content="link" />
  <meta property="fc:frame:button:2:target" content="${baseUrl}?view=calendar" />
  
  <!-- Open Graph Meta Tags -->
  <meta property="og:title" content="SpeakEasy Tasks" />
  <meta property="og:description" content="Turn your voice into organized to-do lists and calendar events with AI-powered transcription." />
  <meta property="og:image" content="${baseUrl}/frame-image.png" />
  <meta property="og:url" content="${baseUrl}" />
  <meta property="og:type" content="website" />
  
  <!-- Twitter Card Meta Tags -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="SpeakEasy Tasks" />
  <meta name="twitter:description" content="Voice-powered productivity app built on Base" />
  <meta name="twitter:image" content="${baseUrl}/frame-image.png" />
</head>
<body>
  <div style="
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: white;
    text-align: center;
    padding: 20px;
  ">
    <div>
      <h1 style="font-size: 3rem; margin-bottom: 1rem; font-weight: bold;">
        🎤 SpeakEasy Tasks
      </h1>
      <p style="font-size: 1.5rem; margin-bottom: 2rem; opacity: 0.9;">
        Turn your voice into organized to-do lists and calendar events
      </p>
      <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
        <a href="${baseUrl}" style="
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          padding: 1rem 2rem;
          border-radius: 12px;
          text-decoration: none;
          color: white;
          font-weight: 600;
          transition: all 0.3s ease;
        ">
          🎤 Create Task
        </a>
        <a href="${baseUrl}?view=calendar" style="
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          padding: 1rem 2rem;
          border-radius: 12px;
          text-decoration: none;
          color: white;
          font-weight: 600;
          transition: all 0.3s ease;
        ">
          📅 View Calendar
        </a>
      </div>
      <p style="margin-top: 2rem; opacity: 0.7; font-size: 1rem;">
        Built on Base • Powered by AI
      </p>
    </div>
  </div>
</body>
</html>`;

  return new NextResponse(frameHtml, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { untrustedData } = body;
    
    // Handle frame button interactions
    const buttonIndex = untrustedData?.buttonIndex;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    let redirectUrl = baseUrl;
    
    switch (buttonIndex) {
      case 1:
        // Create Task button
        redirectUrl = `${baseUrl}?view=voice`;
        break;
      case 2:
        // View Calendar button
        redirectUrl = `${baseUrl}?view=calendar`;
        break;
      default:
        redirectUrl = baseUrl;
    }
    
    // Return frame response with redirect
    const frameResponse = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta property="fc:frame" content="vNext" />
  <meta property="fc:frame:image" content="${baseUrl}/frame-success.png" />
  <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
  <meta property="fc:frame:button:1" content="🚀 Open App" />
  <meta property="fc:frame:button:1:action" content="link" />
  <meta property="fc:frame:button:1:target" content="${redirectUrl}" />
</head>
<body>
  <p>Redirecting to SpeakEasy Tasks...</p>
</body>
</html>`;

    return new NextResponse(frameResponse, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
    
  } catch (error) {
    console.error('Frame POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process frame interaction' },
      { status: 500 }
    );
  }
}
