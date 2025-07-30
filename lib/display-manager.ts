import { promises as fs } from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';

export interface DisplayResult {
  parodyUrl: string;
  downloadUrl: string;
  comparisonUrl: string;
  previewId: string;
  expiresAt: Date;
}

export interface StoredParody {
  id: string;
  html: string;
  originalUrl: string;
  style: string;
  createdAt: Date;
  expiresAt: Date;
  metadata: {
    imagesTransformed: number;
    processingTime: number;
    fileSize: number;
  };
}

export class DisplayManager {
  private static readonly PREVIEW_DIR = path.join(process.cwd(), '.next', 'cache', 'parodies');
  private static readonly MAX_AGE_HOURS = 24;
  
  constructor() {
    this.ensurePreviewDirectory();
  }

  async displayParody(
    parodySiteHtml: string,
    originalUrl: string,
    style: string,
    metadata: { imagesTransformed: number; processingTime: number }
  ): Promise<DisplayResult> {
    // Generate unique ID for this parody
    const previewId = this.generatePreviewId();
    const expiresAt = new Date(Date.now() + DisplayManager.MAX_AGE_HOURS * 60 * 60 * 1000);
    
    // Store the parody
    const storedParody: StoredParody = {
      id: previewId,
      html: parodySiteHtml,
      originalUrl,
      style,
      createdAt: new Date(),
      expiresAt,
      metadata: {
        ...metadata,
        fileSize: Buffer.byteLength(parodySiteHtml, 'utf8')
      }
    };
    
    await this.storeParody(storedParody);
    
    // Create comparison HTML
    const comparisonHtml = this.createComparisonView(originalUrl, `/preview/${previewId}`);
    const comparisonId = this.generatePreviewId();
    await this.storeFile(comparisonId, comparisonHtml, 'comparison');
    
    return {
      parodyUrl: `/preview/${previewId}`,
      downloadUrl: `/api/download/${previewId}`,
      comparisonUrl: `/preview/${comparisonId}`,
      previewId,
      expiresAt
    };
  }

  async getParody(previewId: string): Promise<StoredParody | null> {
    try {
      const filePath = path.join(DisplayManager.PREVIEW_DIR, `${previewId}.json`);
      const fileContent = await fs.readFile(filePath, 'utf8');
      const parody: StoredParody = JSON.parse(fileContent);
      
      // Check if expired
      if (new Date() > new Date(parody.expiresAt)) {
        await this.deleteParody(previewId);
        return null;
      }
      
      return parody;
    } catch (error) {
      console.error('Failed to get parody:', error);
      return null;
    }
  }

  async deleteParody(previewId: string): Promise<void> {
    try {
      const filePath = path.join(DisplayManager.PREVIEW_DIR, `${previewId}.json`);
      await fs.unlink(filePath);
    } catch {
      // File might not exist, which is fine
      console.log('Parody file not found for deletion:', previewId);
    }
  }

  async cleanupExpiredParodies(): Promise<number> {
    let cleanedCount = 0;
    
    try {
      const files = await fs.readdir(DisplayManager.PREVIEW_DIR);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      for (const file of jsonFiles) {
        try {
          const filePath = path.join(DisplayManager.PREVIEW_DIR, file);
          const fileContent = await fs.readFile(filePath, 'utf8');
          const parody: StoredParody = JSON.parse(fileContent);
          
          if (new Date() > new Date(parody.expiresAt)) {
            await fs.unlink(filePath);
            cleanedCount++;
          }
        } catch {
          // If we can't parse the file, delete it
          const filePath = path.join(DisplayManager.PREVIEW_DIR, file);
          await fs.unlink(filePath);
          cleanedCount++;
        }
      }
    } catch (error) {
      console.error('Failed to cleanup expired parodies:', error);
    }
    
    return cleanedCount;
  }

  async getParodyStats(): Promise<{
    totalStored: number;
    totalSize: number;
    oldestParody: Date | null;
    newestParody: Date | null;
  }> {
    let totalStored = 0;
    let totalSize = 0;
    let oldestParody: Date | null = null;
    let newestParody: Date | null = null;
    
    try {
      const files = await fs.readdir(DisplayManager.PREVIEW_DIR);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      for (const file of jsonFiles) {
        try {
          const filePath = path.join(DisplayManager.PREVIEW_DIR, file);
          const fileContent = await fs.readFile(filePath, 'utf8');
          const parody: StoredParody = JSON.parse(fileContent);
          
          // Skip expired parodies
          if (new Date() > new Date(parody.expiresAt)) {
            continue;
          }
          
          totalStored++;
          totalSize += parody.metadata.fileSize;
          
          const createdAt = new Date(parody.createdAt);
          if (!oldestParody || createdAt < oldestParody) {
            oldestParody = createdAt;
          }
          if (!newestParody || createdAt > newestParody) {
            newestParody = createdAt;
          }
        } catch {
          // Skip invalid files
        }
      }
    } catch (error) {
      console.error('Failed to get parody stats:', error);
    }
    
    return { totalStored, totalSize, oldestParody, newestParody };
  }

  private async storeParody(parody: StoredParody): Promise<void> {
    const filePath = path.join(DisplayManager.PREVIEW_DIR, `${parody.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(parody, null, 2), 'utf8');
  }

  private async storeFile(id: string, content: string, type: string): Promise<void> {
    const fileName = `${id}_${type}.json`;
    const filePath = path.join(DisplayManager.PREVIEW_DIR, fileName);
    const data = {
      id,
      type,
      content,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + DisplayManager.MAX_AGE_HOURS * 60 * 60 * 1000)
    };
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  }

  private generatePreviewId(): string {
    return randomBytes(16).toString('hex');
  }

  private async ensurePreviewDirectory(): Promise<void> {
    try {
      await fs.mkdir(DisplayManager.PREVIEW_DIR, { recursive: true });
    } catch (error) {
      console.error('Failed to create preview directory:', error);
    }
  }

  private createComparisonView(originalUrl: string, parodyUrl: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Parody Comparison</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            height: 100vh;
            display: flex;
            flex-direction: column;
            background: #f5f5f5;
          }
          
          .header {
            background: #1a1a1a;
            color: white;
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          
          .header h1 {
            font-size: 18px;
            font-weight: 600;
          }
          
          .controls {
            display: flex;
            gap: 10px;
            align-items: center;
          }
          
          .control-btn {
            background: #4CAF50;
            border: none;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.2s;
          }
          
          .control-btn:hover {
            background: #45a049;
          }
          
          .control-btn.secondary {
            background: #2196F3;
          }
          
          .control-btn.secondary:hover {
            background: #1976D2;
          }
          
          .comparison-container {
            flex: 1;
            display: flex;
            position: relative;
          }
          
          .frame-container {
            flex: 1;
            position: relative;
            overflow: hidden;
          }
          
          .frame-label {
            position: absolute;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            z-index: 10;
            backdrop-filter: blur(5px);
          }
          
          .frame-label.original {
            background: rgba(34, 150, 243, 0.9);
          }
          
          .frame-label.parody {
            background: rgba(255, 193, 7, 0.9);
            color: #000;
          }
          
          iframe {
            width: 100%;
            height: 100%;
            border: none;
            background: white;
          }
          
          .divider {
            width: 4px;
            background: #333;
            cursor: ew-resize;
            position: relative;
            transition: background 0.2s;
          }
          
          .divider:hover {
            background: #555;
          }
          
          .divider::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 20px;
            height: 40px;
            background: #333;
            border-radius: 10px;
            border: 2px solid #fff;
          }
          
          .footer {
            background: #f0f0f0;
            padding: 10px 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ddd;
          }
          
          .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            z-index: 5;
          }
          
          .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 10px;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @media (max-width: 768px) {
            .comparison-container {
              flex-direction: column;
            }
            
            .divider {
              width: 100%;
              height: 4px;
              cursor: ns-resize;
            }
            
            .divider::before {
              width: 40px;
              height: 20px;
            }
            
            .header {
              flex-direction: column;
              gap: 10px;
              text-align: center;
            }
            
            .controls {
              justify-content: center;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎭 Website Parody Comparison</h1>
          <div class="controls">
            <button class="control-btn" onclick="toggleSync()">🔄 Sync Scroll</button>
            <button class="control-btn secondary" onclick="openParody()">📱 Open Parody</button>
            <button class="control-btn secondary" onclick="downloadParody()">💾 Download</button>
          </div>
        </div>
        
        <div class="comparison-container">
          <div class="frame-container">
            <div class="frame-label original">📄 Original</div>
            <div class="loading">
              <div class="spinner"></div>
              <div>Loading original site...</div>
            </div>
            <iframe id="originalFrame" src="${originalUrl}"></iframe>
          </div>
          
          <div class="divider" id="divider"></div>
          
          <div class="frame-container">
            <div class="frame-label parody">🎭 Parody</div>
            <div class="loading">
              <div class="spinner"></div>
              <div>Loading parody...</div>
            </div>
            <iframe id="parodyFrame" src="${parodyUrl}"></iframe>
          </div>
        </div>
        
        <div class="footer">
          Parody generated by Parody Site Generator • Original: ${originalUrl}
        </div>
        
        <script>
          let syncScroll = false;
          
          function toggleSync() {
            syncScroll = !syncScroll;
            const btn = document.querySelector('.control-btn');
            btn.textContent = syncScroll ? '🔄 Sync ON' : '🔄 Sync OFF';
            btn.style.background = syncScroll ? '#FF9800' : '#4CAF50';
          }
          
          function openParody() {
            window.open('${parodyUrl}', '_blank');
          }
          
          function downloadParody() {
            // Implementation depends on your download API
            alert('Download functionality coming soon!');
          }
          
          // Hide loading indicators when iframes load
          document.getElementById('originalFrame').onload = function() {
            this.previousElementSibling.style.display = 'none';
          };
          
          document.getElementById('parodyFrame').onload = function() {
            this.previousElementSibling.style.display = 'none';
          };
          
          // Resizable divider functionality
          let isResizing = false;
          
          document.getElementById('divider').addEventListener('mousedown', function(e) {
            isResizing = true;
            document.addEventListener('mousemove', handleResize);
            document.addEventListener('mouseup', stopResize);
          });
          
          function handleResize(e) {
            if (!isResizing) return;
            
            const container = document.querySelector('.comparison-container');
            const rect = container.getBoundingClientRect();
            const leftWidth = ((e.clientX - rect.left) / rect.width) * 100;
            
            if (leftWidth > 10 && leftWidth < 90) {
              const leftFrame = container.children[0];
              const rightFrame = container.children[2];
              
              leftFrame.style.flex = leftWidth + '%';
              rightFrame.style.flex = (100 - leftWidth) + '%';
            }
          }
          
          function stopResize() {
            isResizing = false;
            document.removeEventListener('mousemove', handleResize);
            document.removeEventListener('mouseup', stopResize);
          }
          
          // Sync scroll functionality (basic implementation)
          if (window.addEventListener) {
            try {
              document.getElementById('originalFrame').contentWindow.addEventListener('scroll', function() {
                if (syncScroll) {
                  // Basic scroll sync - would need more sophisticated implementation
                  console.log('Sync scroll - original');
                }
              });
            } catch (e) {
              // Cross-origin restrictions
            }
          }
        </script>
      </body>
      </html>
    `;
  }

  // Static method for quick HTML blob creation (client-side)
  static createBlobUrl(html: string): string {
    if (typeof window === 'undefined') {
      throw new Error('createBlobUrl can only be called in browser environment');
    }
    
    const blob = new Blob([html], { type: 'text/html' });
    return URL.createObjectURL(blob);
  }

  // Generate preview HTML for immediate display
  static generatePreviewHtml(
    parodyHtml: string,
    originalUrl: string,
    style: string
  ): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Parody Preview - ${style}</title>
        <style>
          .preview-header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 10px;
            text-align: center;
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 14px;
          }
          
          .preview-content {
            margin-top: 50px;
          }
          
          .preview-actions {
            margin-top: 10px;
          }
          
          .preview-btn {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 8px 16px;
            margin: 0 5px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
          }
          
          .preview-btn:hover {
            background: #45a049;
          }
        </style>
      </head>
      <body>
        <div class="preview-header">
          🎭 PARODY PREVIEW - ${style.toUpperCase()} • Original: ${originalUrl}
          <div class="preview-actions">
            <button class="preview-btn" onclick="window.close()">✕ Close</button>
            <button class="preview-btn" onclick="downloadParody()">💾 Download</button>
          </div>
        </div>
        
        <div class="preview-content">
          ${parodyHtml}
        </div>
        
        <script>
          function downloadParody() {
            const element = document.createElement('a');
            const content = document.documentElement.outerHTML;
            const file = new Blob([content], { type: 'text/html' });
            element.href = URL.createObjectURL(file);
            element.download = 'parody-${style}-${Date.now()}.html';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
          }
        </script>
      </body>
      </html>
    `;
  }
}

export const displayManager = new DisplayManager();
