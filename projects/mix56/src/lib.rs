mod errors;
mod node;


use dashu::integer::UBig;
pub use errors::{Error, Result};


pub struct Generation {
    gene: Vec<Vec<UBig>>,
}

