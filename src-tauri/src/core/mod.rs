pub mod file_reader;
pub mod hex_view;
pub mod magic_detector;
pub mod entropy;
pub mod diff;

pub use file_reader::FileReader;
pub use magic_detector::{detect_file_format, FileFormat};
pub use entropy::{calculate_entropy, calculate_block_entropy};
