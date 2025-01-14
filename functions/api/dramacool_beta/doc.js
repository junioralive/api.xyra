export async function onRequest(context) {
    return new Response(
        `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dramacool API Documentation</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
      min-height: 100vh;
      background: linear-gradient(to bottom right, #f0f0f0, #d3d3d3);
      color: black;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      overflow-x: hidden;
    }
    .main {
      max-width: 90%;
      margin: auto;
      text-align: center;
      animation: fadeIn 2s ease-in-out;
    }
    .header {
      font-size: 3rem;
      font-weight: bold;
      margin-bottom: 1.5rem;
      background: linear-gradient(to right, #6a5acd, #483d8b);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: zoomIn 1.5s ease-in-out;
    }
    .muted {
      color: #7d7d7d;
      font-size: 1.2rem;
      animation: fadeIn 3s ease-in-out;
    }
    .card {
      background: white;
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      margin: 16px auto;
      animation: slideUp 1.5s ease-in-out;
    }
    .highlight {
        background-color: #ffeb3b;
        color: #000;
        font-weight: bold;
        padding: 2px 4px;
        border-radius: 4px;
    }
    .language-switch {
      display: flex;
      justify-content: center;
      margin: 16px 0;
    }
    .language-switch button {
      margin: 0 8px;
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 1rem;
      background-color: #ddd;
      transition: background-color 0.3s ease;
    }
    .language-switch button.active {
      background-color: #5865F2;
      color: white;
    }
    .language-switch button:hover {
      background-color: #bbb;
    }
    .code-block {
      position: relative;
      width: 90%;
      max-width: 800px;
      height: 200px;
      padding: 16px;
      background: #f4f4f4;
      border-radius: 8px;
      text-align: left;
      font-family: monospace;
      overflow-y: auto;
      margin: 16px auto;
      box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
      display: none;
    }
    .code-block.active {
      display: block;
    }
    .code-block .copy-button {
      position: absolute;
      top: 8px;
      right: 8px;
      background: #5865F2;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 4px 8px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: background-color 0.3s ease;
    }
    .code-block .copy-button:hover {
      background: #4752C4;
    }
    .code-block .copy-button.copied {
      background: #28a745;
    }
    .small-text {
      font-size: 0.875rem;
      color: #7d7d7d;
    }
    .footer {
      margin-top: 2rem;
      font-size: 0.875rem;
      color: #7d7d7d;
      animation: fadeInUp 2s ease-in-out;
    }
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    @keyframes zoomIn {
      from {
        transform: scale(0.5);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }
    @keyframes slideUp {
      from {
        transform: translateY(50px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
    @keyframes fadeInUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  </style>
  <script>
    function switchLanguage(language) {
      document.querySelectorAll('.code-block').forEach(block => block.classList.remove('active'));
      document.getElementById(language).classList.add('active');
      document.querySelectorAll('.language-switch button').forEach(btn => btn.classList.remove('active'));
      document.querySelector('[data-language="' + language + '"]').classList.add('active');
    }

    function copyToClipboard(button, language) {
      const codeBlock = document.getElementById(language);
      const code = codeBlock.innerText;
      navigator.clipboard.writeText(code).then(() => {
        button.classList.add('copied');
        button.textContent = 'Copied!';
        setTimeout(() => {
          button.classList.remove('copied');
          button.textContent = 'Copy';
        }, 2000);
      });
    }
  </script>
</head>
<body>
  <main class="main">
    <h1 class="header">Welcome to the Xyra - Drama API</h1>

    <div class="muted">🔒 Every request requires an API key. No exceptions!</div>

    <div class="card">
      <h2><a href="/search?api_key=&url=" target="_blank">GET /search</a></h2>
        <p>
            Search for dramas using the POST/GET method.<br> 
            This requires two parameters: <span class="highlight"><code>api_key</code></span> and <span class="highlight"><code>query</code></span>.<br> 
            Below is an example of how to use it in various programming languages:
        </p>
        <div class="language-switch">
        <button data-language="python" onclick="switchLanguage('python')">Python</button>
        <button data-language="curl" onclick="switchLanguage('curl')">cURL</button>
        <button data-language="javascript" onclick="switchLanguage('javascript')">JavaScript</button>
      </div>

      <div id="python" class="code-block">
        <button class="copy-button" onclick="copyToClipboard(this, 'python')">Copy</button>
        <pre>
import requests

url = "https://api.dramacool.com/search"
payload = {"api_key": "your_api_key", "query": "Your Drama Title"}
response = requests.post(url, json=payload)
print(response.json())
        </pre>
      </div>

      <div id="curl" class="code-block">
        <button class="copy-button" onclick="copyToClipboard(this, 'curl')">Copy</button>
        <pre>
curl -X POST \<br>
  https://api.dramacool.com/search \<br>
  -H "Content-Type: application/json" \<br>
  -d '{"api_key": "your_api_key", "query": "Your Drama Title"}'
        </pre>
      </div>

      <div id="javascript" class="code-block">
        <button class="copy-button" onclick="copyToClipboard(this, 'javascript')">Copy</button>
        <pre>
fetch("https://api.dramacool.com/search", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    api_key: "your_api_key",
    query: "Your Drama Title"
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error(error));
        </pre>
      </div>
    </div>

    <p class="small-text">
      PS: Always keep your API key secure. Sharing it with others may result in unexpected drama. 🌟
    </p>
  </main>
  <footer class="footer">
    © 2025 Xyra API - Brought to you by drama-loving coder JuniorAlive. 🎭
  </footer>
</body>
</html>
        `,
        { headers: { "Content-Type": "text/html" } }
    );
}
