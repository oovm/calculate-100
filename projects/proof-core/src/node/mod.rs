use std::fmt::{Debug, Formatter};
use std::hash::{Hash, Hasher};
use dashu::rational::RBig;

mod display;

#[derive(Clone, Eq, PartialEq)]
pub enum CalculateNode {
    /// 坏点, 中止计算
    Infinitive,
    /// 原子节点, 是一个数字
    Atom {
        value: RBig
    },
    Factorial {
        value: Box<CalculateNode>,
    },
    /// 连接两个数字, 等价于 $10x + y$
    Concat {
        left: Box<CalculateNode>,
        right: Box<CalculateNode>,
    },
    /// 两个数字相加
    Add {
        left: Box<CalculateNode>,
        right: Box<CalculateNode>,
    },
    /// 两个数字相减
    Sub {
        left: Box<CalculateNode>,
        right: Box<CalculateNode>,
    },
    /// 两个数字相乘
    Mul {
        left: Box<CalculateNode>,
        right: Box<CalculateNode>,
    },
    /// 两个数字相除
    Div {
        left: Box<CalculateNode>,
        right: Box<CalculateNode>,
    },
}
