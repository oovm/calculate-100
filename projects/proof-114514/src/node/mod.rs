use std::fmt::{Debug, Display, Formatter};
use std::rc::Rc;
use std::str::FromStr;
use dashu::base::ParseError;
use dashu::integer::IBig;
use dashu::rational::RBig;

mod display;



#[derive(Clone, Eq, PartialEq)]
pub enum Expression {
    Atomic {
        number: IBig
    },
    /// 坏点, 中止计算
    Negative {
        base: Rc<Expression>,
    },
    /// 连接两个数字, 等价于 $10x + y$
    Concat {
        lhs: Rc<Expression>,
        rhs: Rc<Expression>,
    },
    /// 两个数字相加
    Plus {
        lhs: Rc<Expression>,
        rhs: Rc<Expression>,
    },
    /// 两个数字相减
    Minus {
        reverse: bool,
        lhs: Rc<Expression>,
        rhs: Rc<Expression>,
    },
    /// 两个数字相乘
    Times {
        lhs: Rc<Expression>,
        rhs: Rc<Expression>,
    },
    /// 两个数字相除
    Divide {
        lhs: Rc<Expression>,
        rhs: Rc<Expression>,
    },
}



#[derive(Debug)]
pub struct Calculate {
    digits: Vec<RBig>,
}



pub struct Record {
    pub(crate) e: Expression,
    pub(crate) n: RBig,
}




impl FromStr for Calculate {
    type Err = ParseError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let mut digits = vec![];
        for digit in s.split(&[',', '，', ' ']) {
            digits.push(RBig::from_str(digit.trim())?)
        }
        Ok(Self {
            digits,
        })
    }
}
