//! Fixture that must fail. Each item below trips a named lint.

use std::rc::Rc;

/// Trips `rust::missing_debug_implementations`.
pub struct Opaque {
	pub value: u32,
}

/// Trips `clippy::disallowed_methods` through the clippy.toml prohibition.
pub fn unwrapped(value: Option<u32>) -> u32 {
	value.unwrap()
}

/// Trips `clippy::disallowed_macros` through the clippy.toml prohibition.
pub fn shouts() {
	println!("shipped print");
}

/// Trips `clippy::clone_on_ref_ptr`.
pub fn duplicated(counted: &Rc<u32>) -> Rc<u32> {
	counted.clone()
}

/// Trips `clippy::map_err_ignore`.
pub fn swallowed(outcome: Result<u32, String>) -> Result<u32, ()> {
	outcome.map_err(|_| ())
}
