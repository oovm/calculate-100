// 渲染器实现

import {ExpressionNode} from '../ast/index.js';
import {SolutionResult} from '../solver/index.js';

// 渲染选项
export interface RenderOptions {
    format: 'text' | 'latex';
    showSteps?: boolean;
    includeMetadata?: boolean;
}

// 渲染结果
export interface RenderResult {
    content: string;
    metadata?: {
        attempts: number;
        duration: number;
        found: boolean;
    };
}

// 主渲染器类
export class Renderer {
    render(result: SolutionResult, options: RenderOptions = {format: 'text'}): RenderResult {
        const {expression, attempts, duration, found} = result;

        let content: string;

        if (options.format === 'latex') {
            content = this.renderLatex(expression, options);
        } else {
            content = this.renderText(expression, options);
        }

        const renderResult: RenderResult = {content};

        if (options.includeMetadata) {
            renderResult.metadata = {
                attempts,
                duration,
                found
            };
        }

        return renderResult;
    }

    renderMultiple(
        results: SolutionResult[],
        options: RenderOptions = {format: 'text'}
    ): RenderResult {
        if (results.length === 0) {
            return {
                content: options.format === 'latex' ? '\\text{No solutions found}' : 'No solutions found'
            };
        }

        const contents = results.map((result, index) => {
            const rendered = this.render(result, {...options, includeMetadata: false});
            const prefix = options.format === 'latex'
                ? `\\text{Solution ${index + 1}: }`
                : `Solution ${index + 1}: `;
            return prefix + rendered.content;
        });

        const separator = options.format === 'latex' ? '\\\\' : '\n';
        const content = contents.join(separator);

        const renderResult: RenderResult = {content};

        if (options.includeMetadata && results.length > 0) {
            const totalAttempts = results.reduce((sum, r) => sum + r.attempts, 0);
            const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
            const foundCount = results.filter(r => r.found).length;

            renderResult.metadata = {
                attempts: totalAttempts,
                duration: totalDuration,
                found: foundCount > 0
            };
        }

        return renderResult;
    }

    private renderText(expression: ExpressionNode, options: RenderOptions): string {
        let result = expression.toString();

        if (options.showSteps) {
            result += this.generateSteps(expression, 'text');
        }

        return result;
    }

    private renderLatex(expression: ExpressionNode, options: RenderOptions): string {
        let result = expression.toLatex();

        if (options.showSteps) {
            result += this.generateSteps(expression, 'latex');
        }

        return result;
    }

    private generateSteps(expression: ExpressionNode, format: 'text' | 'latex'): string {
        try {
            const value = expression.evaluate();
            const target = expression.target;

            if (format === 'latex') {
                return `\\\\\\text{Evaluates to: } ${value} ${value === target ? '\\checkmark' : '\\times'}`;
            } else {
                return `\nEvaluates to: ${value} ${value === target ? '✓' : '✗'}`;
            }
        } catch (error) {
            if (format === 'latex') {
                return `\\\\\\text{Error: } \\text{${error instanceof Error ? error.message : 'Unknown error'}}`;
            } else {
                return `\nError: ${error instanceof Error ? error.message : 'Unknown error'}`;
            }
        }
    }
}

// 便捷函数
export function renderToText(
    result: SolutionResult,
    options: Omit<RenderOptions, 'format'> = {}
): string {
    const renderer = new Renderer();
    return renderer.render(result, {...options, format: 'text'}).content;
}

export function renderToLatex(
    result: SolutionResult,
    options: Omit<RenderOptions, 'format'> = {}
): string {
    const renderer = new Renderer();
    return renderer.render(result, {...options, format: 'latex'}).content;
}

export function renderMultipleToText(
    results: SolutionResult[],
    options: Omit<RenderOptions, 'format'> = {}
): string {
    const renderer = new Renderer();
    return renderer.renderMultiple(results, {...options, format: 'text'}).content;
}

export function renderMultipleToLatex(
    results: SolutionResult[],
    options: Omit<RenderOptions, 'format'> = {}
): string {
    const renderer = new Renderer();
    return renderer.renderMultiple(results, {...options, format: 'latex'}).content;
}

// HTML渲染器（用于Web界面）
export class HtmlRenderer {
    renderWithKatex(result: SolutionResult, options: RenderOptions = {format: 'latex'}): string {
        const renderer = new Renderer();
        const rendered = renderer.render(result, options);

        if (options.format === 'latex') {
            // 包装为KaTeX可渲染的HTML
            return `<div class="katex-expression">${rendered.content}</div>`;
        } else {
            // 纯文本包装为HTML
            return `<div class="text-expression">${this.escapeHtml(rendered.content)}</div>`;
        }
    }

    renderProgressHtml(attempts: number, solutions: number, eta: number, progress: number): string {
        const progressPercent = Math.round(progress * 100);
        const etaSeconds = Math.round(eta / 1000);

        return `
      <div class="solver-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progressPercent}%"></div>
        </div>
        <div class="progress-stats">
          <span>尝试次数: ${attempts.toLocaleString()}</span>
          <span>找到解: ${solutions}</span>
          <span>预计剩余: ${etaSeconds}s</span>
          <span>进度: ${progressPercent}%</span>
        </div>
      </div>
    `;
    }

    renderSolutionListHtml(results: SolutionResult[]): string {
        if (results.length === 0) {
            return '<div class="no-solutions">暂无解</div>';
        }

        const solutionItems = results.map((result, index) => {
            const latexContent = renderToLatex(result);
            return `
        <div class="solution-item" data-index="${index}">
          <div class="solution-number">解 ${index + 1}</div>
          <div class="solution-expression katex-expression">${latexContent}</div>
          <div class="solution-meta">
            <span>尝试: ${result.attempts}</span>
            <span>耗时: ${result.duration}ms</span>
          </div>
        </div>
      `;
        }).join('');

        return `<div class="solutions-list">${solutionItems}</div>`;
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 导出默认渲染器实例
export const defaultRenderer = new Renderer();
export const htmlRenderer = new HtmlRenderer();