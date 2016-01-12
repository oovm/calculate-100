use crate::node::{Expression, Record};
use dashu::{integer::IBig, rational::RBig};
use serde_json::Value;
use std::rc::Rc;

#[test]
fn cache_json() {
    let pairs = read_values(&serde_json::from_str(include_str!("../cache.raw.json")).unwrap()).unwrap();
    println!("{pairs:#?}")
}

fn read_values(v: &Value) -> Option<Vec<Record>> {
    let root = v.as_array()?;
    let mut pairs = Vec::with_capacity(root.len());

    for pair in root.iter().skip(1) {
        pairs.push(read_pair(pair.as_array()?)?)
    }
    Some(pairs)
}

fn read_pair(pair: &[Value]) -> Option<Record> {
    let key = RBig::from(pair.get(1)?.as_i64()?);
    let value = read_expression(pair.get(2)?)?;
    Some(Record { e: value, n: key })
}

fn read_expression(pair: &Value) -> Option<Expression> {
    match pair {
        Value::Null => None,
        Value::Bool(_) => None,
        Value::Number(n) => Some(Expression::Atomic { number: IBig::from(n.as_i64()?) }),
        Value::String(_) => None,
        Value::Array(e) => {
            let o = e.get(0)?.get(1)?.as_str()?;
            match o {
                "Minus" => {
                    let lhs = read_expression(e.get(1)?)?;
                    Some(Expression::Negative { base: Rc::new(lhs) })
                }
                "Plus" => {
                    let lhs = read_expression(e.get(1)?)?;
                    let rhs = read_expression(e.get(2)?)?;
                    Some(Expression::Plus { lhs: Rc::new(lhs), rhs: Rc::new(rhs) })
                }
                "Times" => {
                    let lhs = read_expression(e.get(1)?)?;
                    let rhs = read_expression(e.get(2)?)?;
                    Some(Expression::Times { lhs: Rc::new(lhs), rhs: Rc::new(rhs) })
                }
                "Divide" => {
                    let lhs = read_expression(e.get(1)?)?;
                    let rhs = read_expression(e.get(2)?)?;
                    Some(Expression::Divide { lhs: Rc::new(lhs), rhs: Rc::new(rhs) })
                }
                "Subtract" => {
                    let lhs = read_expression(e.get(1)?)?;
                    let rhs = read_expression(e.get(2)?)?;
                    Some(Expression::Minus { reverse: false, lhs: Rc::new(lhs), rhs: Rc::new(rhs) })
                }
                "RightTeeArrow" => {
                    let lhs = read_expression(e.get(1)?)?;
                    let rhs = read_expression(e.get(2)?)?;
                    Some(Expression::Minus { reverse: true, lhs: Rc::new(lhs), rhs: Rc::new(rhs) })
                }
                _ => {
                    println!("O: {:?}", o);
                    println!("E: {:?}", e);
                    None
                }
            }
        }
        Value::Object(_) => None,
    }
}
