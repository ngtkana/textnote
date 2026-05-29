#!/usr/bin/env node

// PWAアイコン生成スクリプト
// Node.jsのCanvas APIを使用してアイコンを生成

import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [192, 512];
const outputDir = path.join(__dirname, '../public/icons');

// 出力ディレクトリ作成
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// アイコン生成
sizes.forEach((size) => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // 背景（グラデーション）
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#667eea');
  gradient.addColorStop(1, '#764ba2');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // テキスト "T"
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size * 0.6}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('T', size / 2, size / 2);

  // PNG出力
  const buffer = canvas.toBuffer('image/png');
  const filename = `icon-${size}x${size}.png`;
  fs.writeFileSync(path.join(outputDir, filename), buffer);
  console.log(`✓ Generated ${filename}`);
});

console.log('✓ All icons generated successfully');
