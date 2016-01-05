use serde_json::Value;

#[derive(Debug, Copy, Clone)]
pub enum Error {
    UnknownError
}

pub type Result<T> = std::result::Result<T, Error>;


#[test]
fn cache_json() -> Option<()> {
    let v: Value = serde_json::from_str(include_str!("cache.raw.json")).unwrap();
    v.as_object()?;
    println!("{}", v);
    Some(())
}