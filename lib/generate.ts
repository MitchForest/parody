import { ExtractedContent } from './extract';
import { ParodyContent } from './parody';

export function generateHTML(original: ExtractedContent, parody: ParodyContent): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <title>${parody.title}</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        ${generateParodyStyles(parody.style)}
      </style>
    </head>
    <body class="bg-gray-50 min-h-screen">
      <nav class="bg-white shadow-md p-4">
        <div class="container mx-auto flex flex-wrap items-center justify-between">
          ${parody.navigation.map(item => 
            `<a href="${item.href || '#'}" class="mx-2 px-3 py-1 hover:text-blue-500 transition-colors duration-200">${item.text}</a>`
          ).join('')}
        </div>
      </nav>
      
      <main class="container mx-auto p-8 max-w-6xl">
        <div class="space-y-6">
          ${parody.headings.h1.map(h1 => 
            `<h1 class="text-4xl font-bold mb-6 text-gray-900 leading-tight">${h1}</h1>`
          ).join('')}
          
          ${parody.headings.h2.map(h2 => 
            `<h2 class="text-3xl font-semibold mb-4 text-gray-800">${h2}</h2>`
          ).join('')}
          
          ${parody.headings.h3.map(h3 => 
            `<h3 class="text-2xl font-medium mb-3 text-gray-700">${h3}</h3>`
          ).join('')}
          
          <div class="prose prose-lg max-w-none">
            ${parody.paragraphs.map(p => 
              `<p class="mb-4 text-gray-600 leading-relaxed">${p}</p>`
            ).join('')}
          </div>
          
          <div class="flex flex-wrap gap-4 mt-8">
            ${parody.buttons.map(btn => 
              `<button class="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition-colors duration-200">${btn}</button>`
            ).join('')}
          </div>
        </div>
        
        <footer class="mt-16 pt-8 border-t border-gray-200">
          <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm text-yellow-700">
                  <strong>Parody Notice:</strong> This is a ${parody.style} parody transformation. 
                  ${parody.summary}
                </p>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </body>
    </html>
  `;
}

function generateParodyStyles(style: string): string {
  const baseStyles = `
    .parody-content {
      animation: fadeIn 0.5s ease-in;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .parody-highlight {
      background: linear-gradient(120deg, #fbbf24 0%, #f59e0b 100%);
      background-repeat: no-repeat;
      background-size: 100% 0.2em;
      background-position: 0 88%;
    }
  `;

  const styleSpecific = {
    'corporate-buzzword': `
      body { font-family: 'Arial', sans-serif; }
      h1, h2, h3 { color: #1e40af; }
      .buzzword { font-weight: bold; color: #dc2626; }
    `,
    'gen-z-brainrot': `
      body { font-family: 'Comic Sans MS', cursive; }
      h1, h2, h3 { color: #ec4899; text-shadow: 2px 2px 4px rgba(0,0,0,0.1); }
      .slang { color: #8b5cf6; font-weight: bold; }
    `,
    'medieval': `
      body { font-family: 'Times New Roman', serif; }
      h1, h2, h3 { color: #92400e; text-shadow: 1px 1px 2px rgba(0,0,0,0.3); }
      .medieval { font-style: italic; color: #059669; }
    `,
    'infomercial': `
      body { font-family: 'Arial Black', sans-serif; }
      h1, h2, h3 { color: #dc2626; text-transform: uppercase; }
      .emphasis { background-color: #fef3c7; padding: 2px 4px; border-radius: 3px; }
    `,
    'conspiracy': `
      body { font-family: 'Courier New', monospace; }
      h1, h2, h3 { color: #374151; }
      .conspiracy { background-color: #fee2e2; padding: 2px 4px; border-radius: 3px; }
    `
  };

  return baseStyles + (styleSpecific[style as keyof typeof styleSpecific] || '');
}
