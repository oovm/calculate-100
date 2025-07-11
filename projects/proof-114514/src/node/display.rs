use super::*;
use std::fmt::Write;

pub struct WrapDisplay<'i, T> {
    inner: &'i T,
}

impl<'i, T> Debug for WrapDisplay<'i, T>
where
    T: Display,
{
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

impl Display for Record {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "{} == {}", self.n, self.e)
    }
}

impl Debug for Expression {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Atomic { number } => Display::fmt(number, f),
            Self::Negative { base: lhs } => f.debug_struct("Negative").field("lhs", lhs).finish(),
            Self::Concat { lhs, rhs } => f.debug_struct("Concat").field("lhs", lhs).field("rhs", rhs).finish(),
            Self::Plus { lhs, rhs } => f.debug_struct("Plus").field("lhs", lhs).field("rhs", rhs).finish(),
            Self::Minus { lhs, rhs } => f.debug_struct("Minus").field("lhs", lhs).field("rhs", rhs).finish(),
            Self::Times { lhs, rhs } => f.debug_struct("Times").field("lhs", lhs).field("rhs", rhs).finish(),
            Self::Divide { lhs, rhs } => f.debug_struct("Divide").field("lhs", lhs).field("rhs", rhs).finish(),
        }
    }
}

impl Display for Expression {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Atomic { number } => Display::fmt(number, f)?,
            Self::Negative { base: lhs } => {
                if lhs.lower_than_mul() {
                    write!(f, "-({lhs})")?
                }
                else {
                    write!(f, "-{lhs}")?
                }
            }
            Self::Concat { lhs, rhs } => write!(f, "{lhs}{rhs}")?,
            Self::Plus { lhs, rhs } => write!(f, "{lhs}+{rhs}")?,
            Self::Minus { lhs, rhs } => {
                if rhs.lower_than_mul() {
                    write!(f, "{lhs}-({rhs})")?
                }
                else {
                    write!(f, "{lhs}-{rhs}")?
                }
            }
            Self::Times { lhs, rhs } => {
                if lhs.lower_than_mul() {
                    write!(f, "({lhs})")?
                }
                else {
                    write!(f, "{lhs}")?
                }
                f.write_char('×')?;
                if rhs.lower_than_mul() { write!(f, "({rhs})")? } else { write!(f, "{rhs}")? }
            }
            Self::Divide { lhs, rhs } => {
                if lhs.lower_than_mul() {
                    write!(f, "({lhs})")?
                }
                else {
                    write!(f, "{lhs}")?
                }
                f.write_char('÷')?;
                match &**rhs {
                    Self::Atomic { .. } => write!(f, "{rhs}")?,
                    _ => write!(f, "({rhs})")?,
                }
            }
        }
        Ok(())
    }
}

impl Expression {
    fn lower_than_atom(&self) -> bool {
        match self {
            Self::Atomic { .. } => true,
            _ => false,
        }
    }

    fn lower_than_mul(&self) -> bool {
        match self {
            Self::Plus { .. } => true,
            Self::Minus { .. } => true,
            Self::Divide { .. } => true,
            _ => false,
        }
    }
}
