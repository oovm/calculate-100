use itertools::Itertools;
use std::{
    fmt::Debug,
    hash::Hash,
    iter::from_coroutine,
    mem::take,
    ops::{Add, Div, Mul, Sub},
    rc::Rc,
};

#[derive(Debug)]
pub struct Calculate {
    // digits.len > 1
    digits: Vec<usize>,
}

#[derive(Copy, Debug, Clone, Eq, PartialEq, Hash)]
pub enum Operators {
    /// Factorial a number, equivalent to $x!$
    Factorial,
    /// Directly connect two numbers, equivalent to $x*10^ceil(log10(y)) + y$
    Join,
    /// Add two numbers, equivalent to $x+y$
    Plus,
    /// Subtract two numbers, equivalent to $x-y$
    Minus,
    /// Multiply two numbers, equivalent to $-x+y$
    ReverseMinus,
    /// Multiply two numbers, equivalent to $x*y$
    Multiplication,
    /// Divide two numbers, equivalent to $x/y$
    Division,
    /// Power two numbers, equivalent to $x^y$
    Power,
}

#[derive(Clone, Debug)]
struct TreeState {
    tree: Tree,
    cache: f64,
}

#[derive(Clone, Debug)]
enum Tree {
    Number { value: f64 },
    Factorial { value: Rc<TreeState> },
    Join { lhs: Rc<TreeState>, rhs: Rc<TreeState> },
    Plus { lhs: Rc<TreeState>, rhs: Rc<TreeState> },
    Minus { reverse: bool, lhs: Rc<TreeState>, rhs: Rc<TreeState> },
    Multiplication { lhs: Rc<TreeState>, rhs: Rc<TreeState> },
    Division { lhs: Rc<TreeState>, rhs: Rc<TreeState> },
    Power { lhs: Rc<TreeState>, rhs: Rc<TreeState> },
}

impl Operators {
    fn all() -> &'static [Operators; 7] {
        &[Self::Join, Self::Plus, Self::Minus, Self::ReverseMinus, Self::Multiplication, Self::Division, Self::Power]
    }
}

impl TreeState {
    fn almost_integer(&self) -> bool {
        self.cache.fract() < 10f64.powf(-10.0)
    }
    fn is_natural(&self) -> bool {
        self.cache >= 0.0 && self.almost_integer()
    }
}

impl Tree {
    fn evaluate(&self) -> Option<Rc<TreeState>> {
        let value = match self {
            Self::Number { value } => *value,
            Self::Factorial { value } => {
                if !value.almost_integer() {
                    return None;
                }
                if value.cache == 1.0 || value.cache < 0.0 || value.cache > 172.0 {
                    return None;
                }
                else if value.cache == 0.0 {
                    1.0
                }
                else {
                    let mut fact = value.cache;
                    let mut base = 1.0;
                    while fact > 1.0 {
                        base *= fact;
                        fact -= 1.0;
                    }
                    base
                }
            }
            Self::Join { lhs, rhs } => {
                if lhs.tree.is_join_child() && rhs.tree.is_join_child() {
                    if rhs.cache == 0.0 {
                        lhs.cache * 10.0 + rhs.cache
                    }
                    else {
                        lhs.cache * 10f64.powf(rhs.cache.log10().ceil()) + rhs.cache
                    }
                }
                else {
                    return None;
                }
            }
            Self::Plus { lhs, rhs } => lhs.cache.add(rhs.cache),
            Self::Minus { reverse, lhs, rhs } => match *reverse {
                true => rhs.cache.sub(lhs.cache),
                false => lhs.cache.sub(rhs.cache),
            },
            Self::Multiplication { lhs, rhs } => lhs.cache.mul(rhs.cache),
            Self::Division { lhs, rhs } => lhs.cache.div(rhs.cache),
            Self::Power { lhs, rhs } => lhs.cache.powf(rhs.cache),
        };
        if value.is_normal() { Some(Rc::new(TreeState { tree: self.clone(), cache: value })) } else { None }
    }
    fn is_join_child(&self) -> bool {
        match self {
            Self::Number { .. } => true,
            Self::Join { lhs, rhs } => lhs.tree.is_join_child() && rhs.tree.is_join_child(),
            _ => false,
        }
    }
}

impl Calculate {
    /// Find all expressions that can be formed by inserting operators into digits
    pub fn expressions_bfs(&self) -> Vec<Rc<TreeState>> {
        let mut stack: Vec<Rc<TreeState>> = vec![];
        for i in self.digits.iter().map(|v| *v as f64) {
            let rhs = Rc::new(TreeState { tree: Tree::Number { value: i }, cache: i });
            // head digit
            if stack.is_empty() {
                stack.extend(Tree::Factorial { value: rhs.clone() }.evaluate().into_iter());
                stack.extend_one(rhs);
                continue;
            }
            // rest digit
            for lhs in stack.clone() {
                let mut buffer: Vec<Tree> = Vec::with_capacity(7);
                for operator in Operators::all().iter() {
                    let tree = match operator {
                        Operators::Factorial => unreachable!(),
                        Operators::Join => Tree::Join { lhs: lhs.clone(), rhs: rhs.clone() },
                        Operators::Plus => Tree::Plus { lhs: lhs.clone(), rhs: rhs.clone() },
                        Operators::Minus => Tree::Minus { reverse: false, lhs: lhs.clone(), rhs: rhs.clone() },
                        Operators::ReverseMinus => Tree::Minus { reverse: true, lhs: lhs.clone(), rhs: rhs.clone() },
                        Operators::Multiplication => Tree::Multiplication { lhs: lhs.clone(), rhs: rhs.clone() },
                        Operators::Division => Tree::Division { lhs: lhs.clone(), rhs: rhs.clone() },
                        Operators::Power => Tree::Power { lhs: lhs.clone(), rhs: rhs.clone() },
                    };
                    buffer.push(tree);
                }
                for tree in buffer {
                    if let Some(out) = tree.evaluate() {
                        stack.extend(Tree::Factorial { value: out.clone() }.evaluate().into_iter());
                        stack.extend_one(out);
                    }
                }
            }
        }
        stack
    }
    pub fn expressions_dfs<'i>(&'i self) -> impl Iterator<Item = Rc<TreeState>> + 'i {
        from_coroutine(move || {
            for pattern in Operators::all().iter().copied().permutations(self.digits.len() - 1) {
                for expression in self.apply(&pattern) {
                    if expression.almost_integer() {
                        yield expression;
                    }
                    // drop non integer
                }
            }
        })
    }
    fn apply(&self, operators: &[Operators]) -> Vec<Rc<TreeState>> {
        assert_eq!(operators.len(), self.digits.len() - 1);
        let mut stack: Vec<Rc<TreeState>> = vec![];
        let digits = self.rc_digits();
        let rest = match digits.as_slice() {
            [head, rest @ ..] => {
                stack.push(head.clone());
                rest
            }
            _ => unreachable!("digits must > 1"),
        };
        for (digit, operator) in rest.iter().zip(operators.iter()) {
            for node in take(&mut stack) {
                // binary transform
                let tree = match operator {
                    Operators::Join => Tree::Join { lhs: node.clone(), rhs: digit.clone() },
                    Operators::Plus => Tree::Plus { lhs: node.clone(), rhs: digit.clone() },
                    Operators::Minus => Tree::Minus { reverse: false, lhs: node.clone(), rhs: digit.clone() },
                    Operators::ReverseMinus => Tree::Minus { reverse: true, lhs: node.clone(), rhs: digit.clone() },
                    Operators::Multiplication => Tree::Multiplication { lhs: node.clone(), rhs: digit.clone() },
                    Operators::Division => Tree::Division { lhs: node.clone(), rhs: digit.clone() },
                    Operators::Power => Tree::Power { lhs: node.clone(), rhs: digit.clone() },
                    _ => unreachable!(),
                };
                if let Some(out) = tree.evaluate() {
                    // unary transform
                    match operator {
                        Operators::Factorial => stack.extend(Tree::Factorial { value: out.clone() }.evaluate().into_iter()),
                        _ => unreachable!(),
                    }
                    stack.extend_one(out);
                }
            }
        }
        stack
    }
    fn rc_digits(&self) -> Vec<Rc<TreeState>> {
        self.digits.iter().map(|v| Rc::new(TreeState { tree: Tree::Number { value: *v as f64 }, cache: *v as f64 })).collect()
    }
}

#[test]
fn find_one() {
    let calculate = Calculate { digits: vec![1, 2, 3, 4, 5, 6, 7, 8, 9] };
    let expressions = calculate.expressions_dfs();
    for expression in expressions.into_iter().filter(|v| v.cache == 100.0).take(1) {
        println!("{:#?}", expression);
    }
}
