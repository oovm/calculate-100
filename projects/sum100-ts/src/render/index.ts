// 渲染器实现

import {ASTNode, BinaryOpNode, ConcatNode, ExpressionNode, NumberNode, UnaryOpNode} from '../ast/index.js';
import {SolutionResult} from '../solver/index.js';

// 渲染选项
export interface RenderOptions {
    format: 'text' | 'latex' | 'mathematica';
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

        switch (options.format) {
            case 'latex':
                content = this.renderNodeLatex(expression);
                break;
            case 'mathematica':
                content = this.renderNodeMathematica(expression);
                break;
            default:
                content = this.renderNodeText(expression);
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
            const noSolutionText = {
                'latex': '\\text{No solutions found}',
                'mathematica': '"No solutions found"',
                'text': 'No solutions found'
            };
            return {
                content: noSolutionText[options.format] || noSolutionText.text
            };
        }

        const contents = results.map((result, index) => {
            const rendered = this.render(result, {...options, includeMetadata: false});
            const prefixes = {
                'latex': `\\text{Solution ${index + 1}: }`,
                'mathematica': `(* Solution ${index + 1} *) `,
                'text': `Solution ${index + 1}: `
            };
            const prefix = prefixes[options.format] || prefixes.text;
            return prefix + rendered.content;
        });

        const separators = {
            'latex': '\\\\',
            'mathematica': '\n',
            'text': '\n'
        };
        const separator = separators[options.format] || separators.text;
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

    // 渲染AST节点为文本格式
    private renderNodeText(node: ASTNode): string {
        switch (node.type) {
            case 'number':
                return (node as NumberNode).value.toString();
            case 'binary_op': {
                const binNode = node as BinaryOpNode;
                const left = this.renderNodeText(binNode.left);
                const right = this.renderNodeText(binNode.right);
                return `(${left} ${binNode.operator} ${right})`;
            }
            case 'unary_op': {
                const unaryNode = node as UnaryOpNode;
                const operand = this.renderNodeText(unaryNode.operand);
                if (unaryNode.operator === '!') {
                    return `${operand}!`;
                }
                return `${unaryNode.operator}${operand}`;
            }
            case 'concat': {
                const concatNode = node as ConcatNode;
                return concatNode.numbers.join('');
            }
            case 'expression': {
                const exprNode = node as ExpressionNode;
                return `${this.renderNodeText(exprNode.left)} = ${exprNode.target}`;
            }
            default:
                return 'Unknown';
        }
    }

    // 渲染AST节点为LaTeX格式
    private renderNodeLatex(node: ASTNode): string {
        switch (node.type) {
            case 'number':
                return (node as NumberNode).value.toString();
            case 'binary_op': {
                const binNode = node as BinaryOpNode;
                const left = this.renderNodeLatex(binNode.left);
                const right = this.renderNodeLatex(binNode.right);
                switch (binNode.operator) {
                    case '+':
                        return `${left} + ${right}`;
                    case '-':
                        return `${left} - ${right}`;
                    case '*':
                        return `${left} \\cdot ${right}`;
                    case '/':
                        return `\\frac{${left}}{${right}}`;
                    case '%':
                        return `${left} \\bmod ${right}`;
                    case '^':
                        return `${left}^{${right}}`;
                    default:
                        return `${left} ${binNode.operator} ${right}`;
                }
            }
            case 'unary_op': {
                const unaryNode = node as UnaryOpNode;
                const operand = this.renderNodeLatex(unaryNode.operand);
                switch (unaryNode.operator) {
                    case '!':
                        return `${operand}!`;
                    case '√':
                        return `\\sqrt{${operand}}`;
                    case '-':
                        return `-${operand}`;
                    default:
                        return `${unaryNode.operator}${operand}`;
                }
            }
            case 'concat': {
                const concatNode = node as ConcatNode;
                return concatNode.numbers.join('');
            }
            case 'expression': {
                const exprNode = node as ExpressionNode;
                return `${this.renderNodeLatex(exprNode.left)} = ${exprNode.target}`;
            }
            default:
                return 'Unknown';
        }
    }

    // 渲染AST节点为Mathematica格式
    private renderNodeMathematica(node: ASTNode): string {
        switch (node.type) {
            case 'number':
                return (node as NumberNode).value.toString();
            case 'binary_op': {
                const binNode = node as BinaryOpNode;
                const left = this.renderNodeMathematica(binNode.left);
                const right = this.renderNodeMathematica(binNode.right);
                switch (binNode.operator) {
                    case '+':
                        return `(${left} + ${right})`;
                    case '-':
                        return `(${left} - ${right})`;
                    case '*':
                        return `(${left} * ${right})`;
                    case '/':
                        return `(${left} / ${right})`;
                    case '%':
                        return `Mod[${left}, ${right}]`;
                    case '^':
                        return `Power[${left}, ${right}]`;
                    default:
                        return `(${left} ${binNode.operator} ${right})`;
                }
            }
            case 'unary_op': {
                const unaryNode = node as UnaryOpNode;
                const operand = this.renderNodeMathematica(unaryNode.operand);
                switch (unaryNode.operator) {
                    case '!':
                        return `Factorial[${operand}]`;
                    case '√':
                        return `Sqrt[${operand}]`;
                    case '-':
                        return `-${operand}`;
                    default:
                        return `${unaryNode.operator}${operand}`;
                }
            }
            case 'concat': {
                const concatNode = node as ConcatNode;
                return concatNode.numbers.join('');
            }
            case 'expression': {
                const exprNode = node as ExpressionNode;
                return `${this.renderNodeMathematica(exprNode.left)} == ${exprNode.target}`;
            }
            default:
                return 'Unknown';
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

export function renderToMathematica(
    result: SolutionResult,
    options: Omit<RenderOptions, 'format'> = {}
): string {
    const renderer = new Renderer();
    return renderer.render(result, {...options, format: 'mathematica'}).content;
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

export function renderMultipleToMathematica(
    results: SolutionResult[],
    options: Omit<RenderOptions, 'format'> = {}
): string {
    const renderer = new Renderer();
    return renderer.renderMultiple(results, {...options, format: 'mathematica'}).content;
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