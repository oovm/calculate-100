use std::fmt::{Debug, Formatter};
use std::hash::{Hash, Hasher};
use dashu::rational::RBig;

mod display;

#[derive(Clone, Eq, PartialEq)]
pub enum CalculateNode {
    Infinitive,
    Atom {
        value: RBig
    },
    Factorial {
        value: Box<CalculateNode>,
    },
    Add {
        left: Box<CalculateNode>,
        right: Box<CalculateNode>,
    },
    Sub {
        left: Box<CalculateNode>,
        right: Box<CalculateNode>,
    },
    Mul {
        left: Box<CalculateNode>,
        right: Box<CalculateNode>,
    },
    Div {
        left: Box<CalculateNode>,
        right: Box<CalculateNode>,
    },
}
