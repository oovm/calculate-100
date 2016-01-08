use std::rc::Rc;
use dashu::integer::IBig;
use dashu::rational::RBig;
use serde_json::Value;
use crate::node::Expression;

#[test]
fn cache_json() {
    read_values(&serde_json::from_str(include_str!("../cache.raw.json")).unwrap()).unwrap();
}

fn read_values(v: &Value) -> Option<()> {
    for pair in v.as_array()?.iter().skip(1) {
        read_pair(pair.as_array()?)?
    }

    Some(())
}

fn read_pair(pair: &[Value]) -> Option<()> {
    let key = pair.get(1)?.as_i64()?;
    let value = read_expression(pair.get(2)?);

    Some(())
}

fn read_expression(pair: &Value) -> Option<Expression> {
    match pair {
        Value::Null => { None }
        Value::Bool(_) => { None }
        Value::Number(n) => {
            Some(Expression::Atomic {
                number: RBig::from(n.as_i64()?),
            })
        }
        Value::String(_) => { None }
        Value::Array(e) => {
            let o = e.get(0)?.get(1)?.as_str()?;
            match o {
                "Plus" => {
                    let lhs = read_expression(e.get(1)?)?;
                    let rhs = read_expression(e.get(2)?)?;
                    Some(Expression::Plus {
                        lhs: Rc::new(lhs),
                        rhs: Rc::new(rhs),
                    })
                }
                "Times" => {
                    let lhs = read_expression(e.get(1)?)?;
                    let rhs = read_expression(e.get(2)?)?;
                    Some(Expression::Times {
                        lhs: Rc::new(lhs),
                        rhs: Rc::new(rhs),
                    })
                }
                // "Divide" => {}
                _ => {
                    println!("O: {:?}", o);
                    println!("E: {:?}", e);
                    None
                }
            }
        }
        Value::Object(_) => { None }
    }
}