mod errors;
mod node;

use num_traits::One;
use num_traits::Zero;
use std::ops::{Div};
use dashu::rational::RBig;
use itertools::Itertools;
pub use errors::{Error, Result};

#[derive(Debug)]
pub struct Generation {
    gene: Vec<Vec<RBig>>,
}

impl Generation {
    pub fn new(count: usize) -> Self {
        let mut gene = Vec::with_capacity(count);
        for i in 0..count {
            // vec fill 1
            unsafe {
                let mut v = vec![RBig::zero(); count];
                *v.get_unchecked_mut(i) = RBig::one();
                gene.push(v);
            }
        }
        Self { gene }
    }
    pub fn next(&mut self) -> bool {
        let mut news = Vec::with_capacity(self.gene.len() * 2);
        for i in self.gene.iter().permutations(2) {
            unsafe {
                let lhs = i.get_unchecked(0);
                let rhs = i.get_unchecked(1);
                let sum: Vec<RBig> = lhs.iter().zip(rhs.iter()).map(|(a, b)| (a + b).div(&RBig::from(2u8))).collect();
                let head = sum.first().unwrap_unchecked();
                if sum.iter().all(|i| i.eq(head)) {
                    println!("found {} = {:?} + {:?}", head, lhs, rhs);
                    return true;
                }
                news.push(sum);
            }
        }
        self.gene.extend_from_slice(&news);
        // self.gene = news;
        false
    }
}

#[test]
fn test() {
    let mut out = Generation::new(5);
    const MAX_LOOP: usize = 3;
    for _ in 0..MAX_LOOP {
        if out.next() {
            break;
        }
    }
    println!("{:#?}", out.gene.iter().take(100).collect_vec());
}


