use super::*;


impl Debug for CalculateNode {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            CalculateNode::Infinitive => {
                f.write_str("?")
            }
            CalculateNode::Atom { value } => {
                if value.denominator().is_one() {
                    write!(f, "{}", value.numerator())
                } else {
                    write!(f, "{}/{}", value.numerator(), value.denominator())
                }
            }
            CalculateNode::Factorial { value } => {
                f.debug_struct("Unary")
                    .field("action", &"!")
                    .field("value", value)
                    .finish()
            }
            CalculateNode::Add { left, right } => {
                f.debug_struct("Binary")
                    .field("action", &"+")
                    .field("left", left)
                    .field("right", right)
                    .finish()
            }
            CalculateNode::Sub { left, right } => {
                f.debug_struct("Binary")
                    .field("action", &"-")
                    .field("left", left)
                    .field("right", right)
                    .finish()
            }
            CalculateNode::Mul { left, right } => {
                f.debug_struct("Binary")
                    .field("action", &"×")
                    .field("left", left)
                    .field("right", right)
                    .finish()
            }
            CalculateNode::Div { left, right } => {
                f.debug_struct("Binary")
                    .field("action", &"÷")
                    .field("left", left)
                    .field("right", right)
                    .finish()
            }
        }
    }
}