const fs = require('fs');
const path = require('path');

const mdPath = path.join(__dirname, '..', '..', '..', 'PROJECT_REPORT_MEETIOR.md');
const outHtmlPath = path.join(__dirname, '..', '..', '..', 'PROJECT_REPORT_MEETIOR.html');

const md = fs.readFileSync(mdPath, 'utf8');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>MEETIOR - Project Report (CE-502 / PRJ-701)</title>
<script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
<script>mermaid.initialize({ startOnLoad: false, theme: 'neutral' });</script>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<style>
  @page {
    size: A4;
    margin: 25mm 20mm 25mm 20mm;
  }
  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 12pt;
    line-height: 1.5;
    color: #111;
    max-width: 900px;
    margin: 0 auto;
    padding: 30px 24px;
    text-align: justify;
    background: #fff;
  }
  h1 {
    font-size: 16pt;
    font-weight: bold;
    text-align: center;
    margin-top: 32px;
    margin-bottom: 16px;
    text-transform: uppercase;
    border-bottom: 2px solid #222;
    padding-bottom: 6px;
  }
  h2 {
    font-size: 14pt;
    font-weight: bold;
    margin-top: 24px;
    margin-bottom: 12px;
    border-bottom: 1px solid #777;
    padding-bottom: 4px;
  }
  h3 {
    font-size: 13pt;
    font-weight: bold;
    margin-top: 18px;
    margin-bottom: 8px;
  }
  p, li {
    font-size: 12pt;
    margin-bottom: 8px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 18px 0 22px;
    font-size: 10.5pt;
  }
  th, td {
    border: 1px solid #333;
    padding: 7px 10px;
    text-align: left;
  }
  th {
    background-color: #f2f2f2;
    font-weight: bold;
    text-align: center;
  }
  pre {
    background: #f8f9fa;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 12px;
    overflow-x: auto;
    font-family: 'Courier New', Courier, monospace;
    font-size: 10pt;
    line-height: 1.4;
  }
  code {
    font-family: 'Courier New', Courier, monospace;
    background: #f4f4f4;
    padding: 2px 4px;
    border-radius: 3px;
    font-size: 10.5pt;
  }
  pre code {
    background: none;
    padding: 0;
  }
  .mermaid {
    text-align: center;
    margin: 22px 0;
    background: #fafafa;
    padding: 16px;
    border: 1px solid #ddd;
    border-radius: 6px;
  }
  blockquote {
    border-left: 4px solid #2c3e50;
    padding-left: 14px;
    margin: 14px 0;
    color: #444;
    font-style: italic;
  }
  .action-bar {
    background: #e8f4fd;
    border: 1.5px solid #0d6efd;
    border-radius: 10px;
    padding: 14px 20px;
    margin-bottom: 28px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 6px rgba(0,0,0,0.08);
  }
  .btn-print {
    background: #0d6efd;
    color: #fff;
    border: none;
    padding: 10px 22px;
    border-radius: 6px;
    font-weight: bold;
    font-size: 13pt;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0,0,0,0.15);
  }
  .btn-print:hover {
    background: #0b5ed7;
  }
  @media print {
    body {
      max-width: 100%;
      padding: 0;
      margin: 0;
    }
    .action-bar {
      display: none !important;
    }
    pre, blockquote, table, .mermaid {
      page-break-inside: avoid;
    }
  }
</style>
</head>
<body>
<div class="action-bar">
  <div>
    <strong style="font-size:13pt; color:#084298;">📄 Academic Report Ready to Save / Print</strong><br>
    <span style="font-size:11pt; color:#495057;">Standard Times New Roman formatting (12pt body, 14pt sub-heading, 16pt chapter title) with justified paragraphs.</span>
  </div>
  <button class="btn-print" onclick="window.print()">
    🖨️ Save as PDF / Print (Ctrl + P)
  </button>
</div>

<div id="reportMarkdown" style="display:none;">${Buffer.from(md).toString('base64')}</div>
<div id="content"></div>

<script>
  const base64Md = document.getElementById('reportMarkdown').textContent;
  const decodedMd = decodeURIComponent(escape(atob(base64Md)));
  document.getElementById('content').innerHTML = marked.parse(decodedMd);

  // Convert mermaid code blocks
  document.querySelectorAll('pre code.language-mermaid').forEach(el => {
    const parent = el.parentElement;
    const div = document.createElement('div');
    div.className = 'mermaid';
    div.textContent = el.textContent;
    parent.replaceWith(div);
  });

  mermaid.run();
</script>
</body>
</html>`;

fs.writeFileSync(outHtmlPath, htmlContent, 'utf8');
console.log('HTML Report successfully written to:', outHtmlPath);
