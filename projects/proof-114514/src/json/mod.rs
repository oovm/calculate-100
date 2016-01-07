use serde_json::Value;

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

fn read_expression(pair: &Value) -> Option<()> {
    match pair {
        Value::Null => {}
        Value::Bool(_) => {}
        Value::Number(n) => {
            println!("N: {:?}", n);
        }
        Value::String(_) => {}
        Value::Array(e) => {
            let e = e.get(0)?.get(1)?.as_str()?;
            println!("E: {:?}", e);
        }
        Value::Object(_) => {}
    }
    Some(())
}