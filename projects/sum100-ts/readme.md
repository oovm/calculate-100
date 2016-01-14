# ASCII ART

A TypeScript library for generating and rendering ASCII art, supporting both Canvas (image-based) and Textarea (plain
text) rendering modes. Core features include font metrics measurement, customizable character sets, and mask application
for color customization.

## Key Features

- **Dual Render Modes**: Supports both Canvas (generates image output) and Textarea (displays plain text) rendering
- **Font Metrics**: Automatically detects monospace fonts and calculates character width/line height
- **Character Set Configuration**: Customizable character sets (select characters by density gradient)
- **Mask Functionality**: Customize ASCII art colors using image masks
- **Preset Management**: Built-in common configuration presets for quick setup

## Installation

```bash
npm install ascii-art-ts
```

## Quick Start

```typescript
import {AsciiArtGenerator} from 'ascii-art-ts';

// Initialize generator
const generator = new AsciiArtGenerator();

// Canvas mode rendering example
const config = {
    mode: 'canvas',
    font: {fontFamily: 'Courier New', fontSize: 12},
    layout: {columns: 80, rows: 24, lineHeight: 1.2},
    characterSet: [' ', '.', '*', '#', '@']
};

// Render and export PNG
const result = await generator.render(config, 'Hello ASCII!');
const pngDataUrl = result.dataUrl;
```

## Configuration Parameters

Core `AsciiArtConfig` configuration options:

- `mode`: Rendering mode ('canvas' | 'textarea')
- `font`: Font configuration (fontFamily, fontSize, fontWeight, etc.)
- `layout`: Layout configuration (columns/number of columns, rows/number of rows, lineHeight/line height ratio)
- `characterSet`: Character set array (ordered by increasing density)
- `canvas`：Canvas模式扩展配置（textColor/文字颜色, backgroundColor/背景色, maskImageUrl/遮罩图片地址）

## API文档

- `render(config, inputText)`：核心渲染方法，返回渲染结果对象
- `createTextarea(config, inputText)`：Textarea模式生成带样式的文本框
- `exportToPng(config, inputText)`：Canvas模式导出PNG数据URL
- `measureFont(config)`：测量字体指标（是否等宽/字符宽度/行高）
- `getPresets()`：获取内置预设配置列表

## 贡献

欢迎提交Issue或Pull Request，参与前请阅读[贡献指南](CONTRIBUTING.md)（待完善）。

## 许可

MIT License

```