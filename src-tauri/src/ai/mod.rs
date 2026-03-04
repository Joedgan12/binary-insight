pub mod ollama_client;
pub mod prompt_builder;

pub use ollama_client::{OllamaClient, ChatMessage};
pub use prompt_builder::build_analysis_prompt;
