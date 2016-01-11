use std::fmt::Write;
use super::*;

pub struct WrapDisplay<'i, T> {
    inner: &'i T,
}

impl<'i, T> Debug for WrapDisplay<'i, T> where T: Display {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        Display::fmt(self.inner, f)
    }
}

impl Debug for Record {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("Record")
            .field("expression", &WrapDisplay { inner: &self.e })
            .field("value", &WrapDisplay { inner: &self.n })
            .finish()
    }
}

impl Debug for Expression {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Atomic { number } => {
                Display::fmt(number, f)
            }
            Self::Negative { lhs } => {
                f.debug_struct("Negative")
                    .field("lhs", lhs)
                    .finish()
            }
            Self::Concat { lhs, rhs } => {
                f.debug_struct("Concat")
                    .field("lhs", lhs)
                    .field("rhs", rhs)
                    .finish()
            }
            Self::Plus { lhs, rhs } => {
                f.debug_struct("Plus")
                    .field("lhs", lhs)
                    .field("rhs", rhs)
                    .finish()
            }
            Self::Minus { reverse, lhs, rhs } => {
                f.debug_struct("Minus")
                    .field("reverse", reverse)
                    .field("lhs", lhs)
                    .field("rhs", rhs)
                    .finish()
            }
            Self::Times { lhs, rhs } => {
                f.debug_struct("Times")
                    .field("lhs", lhs)
                    .field("rhs", rhs)
                    .finish()
            }
            Self::Divide { lhs, rhs } => {
                f.debug_struct("Divide")
                    .field("lhs", lhs)
                    .field("rhs", rhs)
                    .finish()
            }
        }
    }
}

impl Display for Expression {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Atomic { number } => {
                Display::fmt(number, f)?
            }
            Self::Negative { lhs } => {
                write!(f, "-{lhs}")?
            }
            Self::Concat { lhs, rhs } => {
                write!(f, "{lhs}{rhs}")?
            }
            Self::Plus { lhs, rhs } => {


                write!(f, "{lhs}+{rhs}")?
            }
            Self::Minus { reverse, lhs, rhs } => {
                if *reverse {
                    if lhs.lower_than_atom() {
                        write!(f, "-{lhs}+{rhs}")?
                    } else {
                        write!(f, "(-{lhs})+{rhs}")?
                    }
                }
                else {
                    if rhs.lower_than_mul() {
                        write!(f, "{lhs}-({rhs})")?
                    } else {
                        write!(f, "{lhs}-{rhs}")?
                    }
                }
            }
            Self::Times { lhs, rhs } => {
                if lhs.lower_than_mul() {
                    write!(f, "({lhs})")?
                } else {
                    write!(f, "{lhs}")?
                }
                f.write_char('×')?;
                if rhs.lower_than_mul() {
                    write!(f, "({rhs})")?
                } else {
                    write!(f, "{rhs}")?
                }
            }
            Self::Divide { lhs, rhs } => {
                if lhs.lower_than_mul() {
                    write!(f, "({lhs})")?
                } else {
                    write!(f, "{lhs}")?
                }
                f.write_char('÷')?;
                if rhs.lower_than_mul() {
                    write!(f, "({rhs})")?
                } else {
                    write!(f, "{rhs}")?
                }
            }
        }
        Ok(())
    }
}

impl Expression {
    fn lower_than_atom(&self) -> bool {
        match self {
            Self::Atomic { .. } => {true}
            _ => false
        }
    }
    fn lower_sub_rev(&self) -> bool {
        match self {
            Self::Minus { reverse, .. } => {*reverse}
            _ => false
        }
    }
    fn lower_than_mul(&self) -> bool {
        match self {
            Self::Plus { .. } => {true}
            Self::Minus { .. } => {true}
            Self::Divide { .. } => {true}
            _ => false
        }
    }
}