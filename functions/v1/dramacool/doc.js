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
    .icon-container {
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 14px; /* Added 4px top margin */
      gap: 16px;
      animation: fadeInIcons 1.5s ease-in-out;
    }
    .icon-container a {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: white;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      animation: bounce 2s infinite ease-in-out;
    }
    .icon-container a:hover {
      transform: scale(1.2) rotate(10deg);
      box-shadow: 0 6px 8px rgba(0, 0, 0, 0.2);
    }
    .icon-container svg {
      width: 24px;
      height: 24px;
      fill: #5865F2;
    }
    .icon-container a.github svg {
      fill: black;
    }
    .icon-container a.home svg {
      fill: #6a5acd;
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
      margin-top: -5px; /* Adjusted top margin to reduce the space below the icons */
      margin-bottom: 1rem;
      background: linear-gradient(to right, #6a5acd, #483d8b);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: zoomIn 1.5s ease-in-out;
    }

    h2 {
      color:  #5865F2;
    }
    p {
      font-size: 1rem;
      line-height: 1.6;
      margin-bottom: 1.5rem;
      color: #333;
    }
    pre {
      background: #f4f4f4;
      color: #333;
      font-family: Consolas, monospace;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      white-space: pre-wrap;
      word-wrap: break-word;
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
      background:rgb(238, 231, 231);
      color: #333;
      font-family: Consolas, monospace;
      padding: 2px;
      border-radius: 3px;
      overflow-x: auto;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      white-space: pre-wrap;
      word-wrap: break-word;
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
    // @keyframes bounce {
    //   0%, 100% {
    //     transform: translateY(0);
    //   }
    //   50% {
    //     transform: translateY(-8px);
    //   }
    // }
    @keyframes fadeInIcons {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
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
        const code = codeBlock.querySelector('pre').innerText; // Get the code content inside <pre>
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
  <div class="icon-container">
    <a href="https://discord.gg/cwDTVKyKJz" target="_blank" aria-label="Discord">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path d="M20.317 4.369a19.791 19.791 0 0 0-4.885-1.518.074.074 0 0 0-.079.037c-.21.37-.444.856-.608 1.237a19.021 19.021 0 0 0-5.486 0 12.239 12.239 0 0 0-.617-1.237.077.077 0 0 0-.08-.037A19.571 19.571 0 0 0 3.683 4.37a.069.069 0 0 0-.032.027C.533 9.039-.319 13.578.099 18.057a.082.082 0 0 0 .031.056 19.984 19.984 0 0 0 5.992 3.041.077.077 0 0 0 .084-.026c.46-.63.869-1.3 1.226-2a.076.076 0 0 0-.041-.104 13.13 13.13 0 0 1-1.872-.883.075.075 0 0 1-.008-.126 9.584 9.584 0 0 0 .372-.293.074.074 0 0 1 .076-.01 15.613 15.613 0 0 0 10.534 0 .074.074 0 0 1 .076.009c.121.095.247.195.373.294a.075.075 0 0 1-.006.126 13.167 13.167 0 0 1-1.873.882.076.076 0 0 0-.041.105c.36.7.769 1.37 1.227 2a.075.075 0 0 0 .084.026 19.958 19.958 0 0 0 5.993-3.04.076.076 0 0 0 .031-.056c.5-5.146-.838-9.631-3.552-13.661a.062.062 0 0 0-.033-.028Zm-12.12 9.584c-1.182 0-2.156-1.08-2.156-2.408 0-1.327.955-2.408 2.156-2.408 1.21 0 2.175 1.1 2.156 2.408 0 1.328-.955 2.408-2.156 2.408Zm7.609 0c-1.182 0-2.156-1.08-2.156-2.408 0-1.327.955-2.408 2.156-2.408 1.21 0 2.175 1.1 2.156 2.408 0 1.328-.946 2.408-2.156 2.408Z"/>
      </svg>
    </a>
    <a href="/" target="_self" class="home" aria-label="Home">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path d="M12 2.1 1 12h3v9h16v-9h3L12 2.1zm1 18v-7h-2v7H6v-8.3L12 5.7l6 6v8.3h-5z"/>
      </svg>
    </a>
    <a href="https://github.com/junioralive/xyra-api" target="_blank" class="github" aria-label="GitHub">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path d="M12 .5a12 12 0 0 0-3.79 23.4c.6.1.82-.26.82-.58v-2.04c-3.34.72-4.05-1.6-4.05-1.6a3.18 3.18 0 0 0-1.35-1.78c-1.11-.74.08-.73.08-.73a2.53 2.53 0 0 1 1.85 1.23 2.57 2.57 0 0 0 3.49 1 2.6 2.6 0 0 1 .77-1.62C6.48 16.91 3.94 15.9 3.94 11.8a4.6 4.6 0 0 1 1.22-3.2 4.29 4.29 0 0 1 .11-3.15s1-.31 3.26 1.21a11.08 11.08 0 0 1 5.94 0c2.3-1.53 3.26-1.21 3.26-1.21a4.3 4.3 0 0 1 .11 3.15 4.6 4.6 0 0 1 1.22 3.2c0 4.1-2.55 5.11-4.98 5.37a2.89 2.89 0 0 1 .82 2.24v3.34c0 .32.22.69.82.58A12 12 0 0 0 12 .5Z"/>
      </svg>
    </a>
  </div>
  <main class="main">
    <h1 class="header">Welcome to the Xyra - Drama API</h1>

    <div class="muted">🔒 Every request requires an API key. No Drama!</div>

    <div class="card">
      <h2>Code Example for Noobs 🚀</h2>
      <p>
        Welcome to the land of <strong>POST</strong> and <strong>GET</strong>! We support both—because why not? 😎<br>
        Wanna send data? Use <strong>POST</strong>. Wanna just peek? Use <strong>GET</strong>. Simple, right?<br>
        Below is an example of how to use POST in case you're like, "What's that?" (Spoiler: It's not a parcel service.)
      </p>

      <pre>
        <b>POST Example:</b> 
        You’re sending data like:
        {
            "username": "coolcoder",
            "password": "superSecret123"
        }
        ...and the server’s like, "Got it! Here’s your response." 📨

        <b>GET Example:</b> 
        You’re just browsing—like asking, "Hey server, what’s up?" 🤔
        Server: "Not much, here’s the data you wanted." 📜
      </pre>

      <p>
        Remember: POST is for when you want to <strong>do something</strong> (like sign up for free pizza 🍕). GET is for when you’re just snooping around, politely, of course.
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
import json

url = "https://api.xyrastream.live/v1/dramacool/search"
payload = {"api_key": "your_api_key", "query": "Your Drama Title"}
headers = {"Content-Type": "application/json"}

response = requests.post(url, data=json.dumps(payload), headers=headers)
print(response.json())
        </pre>
      </div>

      <div id="curl" class="code-block">
        <button class="copy-button" onclick="copyToClipboard(this, 'curl')">Copy</button>
        <pre>
curl -X POST \
https://api.dramacool.com/search \
-H "Content-Type: application/json" \
-d '{"api_key": "your_api_key", "query": "Your Drama Title"}'
        </pre>
      </div>

      <div id="javascript" class="code-block">
        <button class="copy-button" onclick="copyToClipboard(this, 'javascript')">Copy</button>
        <pre>
fetch("https://api.xyrastream.live/v1/dramacool/search", {
  method: "POST", // Specify the HTTP method
  headers: {
    "Content-Type": "application/json", // Define the content type
  },
  body: JSON.stringify({
    api_key: "key1", // Replace with your actual API key
    query: "Your Drama Title",
  }),
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error(error));
        </pre>
      </div>
    </div>

    <div class="card">
      <h2>GET<a href="/v1/dramacool/home?api_key=">/home</a></h2>
      <p>
        Retrieve the home page using the POST/GET method.<br> 
        This will return results for the Drama home page.
      </p>
    </div>

    <div class="card">
      <h2>GET<a href="/v1/dramacool/search?api_key=&query=">/search</a></h2>
      <p>
        Search for dramas using the POST/GET method.<br> 
        This requires three parameters: <span class="highlight"><code>api_key</code></span>, <span class="highlight"><code>query</code></span>, and <span class="highlight"><code>page</code></span> (optional, default is 1).<br> 
        This will return results based on the search query.
      </p>
    </div>

    <div class="card">
      <h2>GET<a href="/v1/dramacool/latest?api_key=&page=">/latest</a></h2>
      <p>
        Retrieve the latest dramas using the POST/GET method.<br> 
        This requires two parameters: <span class="highlight"><code>api_key</code></span> and <span class="highlight"><code>page</code></span> (optional, default is 1).<br> 
        This will return the latest drama episodes or movies.
      </p>
    </div>

    <div class="card">
      <h2>GET<a href="/v1/dramacool/latest_kdrama?api_key=&page=">/latest_kdrama</a></h2>
      <p>
        Retrieve the latest K-dramas using the POST/GET method.<br> 
        This requires two parameters: <span class="highlight"><code>api_key</code></span> and <span class="highlight"><code>page</code></span> (optional, default is 1).<br> 
        This will return the latest K-drama episodes or movies.
      </p>
    </div>

    <div class="card">
      <h2>GET<a href="/v1/dramacool/popular?api_key=&page=">/popular</a></h2>
      <p>
        Retrieve popular dramas using the POST/GET method.<br> 
        This requires two parameters: <span class="highlight"><code>api_key</code></span> and <span class="highlight"><code>page</code></span> (optional, default is 1).<br> 
        This will return popular dramas.
      </p>
    </div>

    <div class="card">
      <h2>GET<a href="/v1/dramacool/ongoing?api_key=&page=">/ongoing</a></h2>
      <p>
        Retrieve ongoing dramas using the POST/GET method.<br> 
        This requires two parameters: <span class="highlight"><code>api_key</code></span> and <span class="highlight"><code>page</code></span> (optional, default is 1).<br> 
        This will return ongoing dramas.
      </p>
    </div>

    <div class="card">
      <h2>GET<a href="/v1/dramacool/upcoming?api_key=&page=">/upcoming</a></h2>
      <p>
        Retrieve upcoming dramas using the POST/GET method.<br> 
        This requires two parameters: <span class="highlight"><code>api_key</code></span> and <span class="highlight"><code>page</code></span> (optional, default is 1).<br> 
        This will return upcoming dramas.
      </p>
    </div>

    <div class="card">
      <h2>GET<a href="/v1/dramacool/discover?api_key=&page=">/discover</a></h2>
      <p>
        Discover dramas using the POST/GET method.<br> 
        This requires two parameters: <span class="highlight"><code>api_key</code></span> and <span class="highlight"><code>page</code></span> (optional, default is 1).<br>
        Additionally, use filter parameters such as <span class="highlight"><code>type</code></span>, <span class="highlight"><code>country</code></span>, <span class="highlight"><code>genre</code></span>, and <span class="highlight"><code>release_year</code></span>.<br> 
        (Pro tip: use the <a href="/discover-info">/discover-info</a> route to find available options for type, country, genre, and release year.)<br>
        This will return results based on the applied filters.
      </p>
    </div>

    <div class="card">
      <h2>GET<a href="/v1/dramacool/info?api_key=&id=">/info</a></h2>
      <p>
        Retrieve detailed drama information using the POST/GET method.<br> 
        This requires two parameters: <span class="highlight"><code>api_key</code></span> and <span class="highlight"><code>id</code></span>.<br> 
        This will return detailed information about a specific drama.
      </p>
    </div>

    <div class="card">
      <h2>GET<a href="/v1/dramacool/stream?api_key=&episode_id=">/stream</a></h2>
      <p>
        Retrieve streaming information using the POST/GET method.<br> 
        This requires two parameters: <span class="highlight"><code>api_key</code></span> and <span class="highlight"><code>episode_id</code></span>.<br> 
        This will return the streaming link, subtitles, and embedded link for a specific episode.
      </p>
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
