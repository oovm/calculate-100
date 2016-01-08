use std::fmt::{Debug};
use std::hash::{Hash, Hasher};
use std::rc::Rc;
use std::str::FromStr;
use dashu::base::ParseError;
use dashu::rational::RBig;

mod display;

#[derive(Debug, Clone, Eq, PartialEq)]
pub enum Expression {
    Atomic {
        number: RBig
    },
    /// 坏点, 中止计算
    Negative {
        lhs: Rc<Expression>,
        rhs: Rc<Expression>,
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
        reverse: bool
    },
    /// 两个数字相乘
    Times {
        lhs: Rc<Expression>,
        rhs: Rc<Expression>,
    },
    /// 两个数字相除
    Division {
        lhs: Rc<Expression>,
        rhs: Rc<Expression>,
    },
}

#[derive(Debug)]
pub struct Calculate {
    digits: Vec<RBig>,
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

impl Calculate {
    pub fn joins(&self) -> Vec<Calculate> {
        Expression::Plus {
            lhs: Rc::new(Expression::Negative),
            rhs: Rc::new(Expression::Negative),
        };


        todo!()
    }
}

fn generate_combinations(numbers: &[u32]) -> Vec<Vec<u32>> {
    let mut result = Vec::new();
    let mut current_combination = Vec::new();
    generate_combinations_helper(numbers, &mut result, &mut current_combination, 0);
    result
}

fn generate_combinations_helper(
    numbers: &[u32],
    result: &mut Vec<Vec<u32>>,
    current_combination: &mut Vec<u32>,
    start_index: usize,
) {
    result.push(current_combination.clone());

    for i in start_index..numbers.len() {
        current_combination.push(numbers[i]);
        generate_combinations_helper(numbers, result, current_combination, i + 1);
        current_combination.pop();
    }
}

#[test]
fn main() {
    let numbers = vec![1, 2, 3, 4];
    let combinations = generate_combinations(&numbers);

    for combination in combinations {
        println!("{:?}", combination);
    }
}

#[test]
fn parse_int() {
    let digits = Calculate::from_str("1 1 4 5 1 4".trim()).unwrap();
    // println!("{:?}", find_combinations(&[1, 2, 3, 4]))
}