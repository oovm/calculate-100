import {ASTNode, BinaryOpNode, ConcatNode, ExpressionNode, NumberNode, UnaryOpNode} from '../ast';

// 渲染选项
export interface RenderOptions {
    format: 'text' | 'latex' | 'mathematica';
}

// 渲染结果
export interface RenderResult {
    content: string;
}

// 主渲染器类
export class Renderer {
    _config: RenderOptions;

    constructor(config: Partial<RenderOptions>) {
        this._config = {
            format: config.format || 'text',
        };
    }

    render(expression: ExpressionNode): RenderResult {
        let content: string;
        switch (this._config.format) {
            case 'latex':
                content = this.renderNodeLatex(expression);
                break;
            case 'mathematica':
                content = this.renderNodeMathematica(expression);
                break;
            default:
                content = this.renderNodeText(expression);
        }
        return {content};
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
export function renderToText(result: ExpressionNode): string {
    const renderer = new Renderer({format: 'text'});
    return renderer.render(result).content;
}

export function renderToLatex(result: ExpressionNode): string {
    const renderer = new Renderer({format: 'latex'});
    return renderer.render(result).content;
}

export function renderToMathematica(result: ExpressionNode): string {
    const renderer = new Renderer({format: 'mathematica'});
    return renderer.render(result).content;
}
