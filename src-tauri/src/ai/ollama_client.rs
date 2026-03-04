use anyhow::Result;
use reqwest::Client;
use serde::{Deserialize, Serialize};

/// A single chat message.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

/// Ollama API request.
#[derive(Debug, Serialize)]
struct OllamaRequest {
    model: String,
    messages: Vec<ChatMessage>,
    stream: bool,
}

/// Ollama API response.
#[derive(Debug, Deserialize)]
struct OllamaResponse {
    message: Option<ChatMessage>,
    done: Option<bool>,
}

/// Client for the Ollama local LLM API.
pub struct OllamaClient {
    client: Client,
    base_url: String,
    model: String,
}

impl OllamaClient {
    pub fn new(base_url: Option<String>, model: Option<String>) -> Self {
        Self {
            client: Client::new(),
            base_url: base_url.unwrap_or_else(|| "http://localhost:11434".to_string()),
            model: model.unwrap_or_else(|| "llama3.2".to_string()),
        }
    }

    /// Send a chat completion request to Ollama.
    pub async fn chat(&self, messages: Vec<ChatMessage>) -> Result<String> {
        let request = OllamaRequest {
            model: self.model.clone(),
            messages,
            stream: false,
        };

        let response = self
            .client
            .post(format!("{}/api/chat", self.base_url))
            .json(&request)
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            anyhow::bail!("Ollama API error ({}): {}", status, body);
        }

        let result: OllamaResponse = response.json().await?;
        Ok(result
            .message
            .map(|m| m.content)
            .unwrap_or_else(|| "No response from model".to_string()))
    }

    /// Check if Ollama is available.
    pub async fn is_available(&self) -> bool {
        self.client
            .get(format!("{}/api/tags", self.base_url))
            .send()
            .await
            .map(|r| r.status().is_success())
            .unwrap_or(false)
    }

    /// Analyze binary data with AI assistance.
    pub async fn analyze(&self, context: &str, question: &str) -> Result<String> {
        let messages = vec![
            ChatMessage {
                role: "system".to_string(),
                content: "You are a binary file analysis expert. You help identify file structures, decode protocols, and explain binary data formats. Be concise and technical.".to_string(),
            },
            ChatMessage {
                role: "user".to_string(),
                content: format!("Context:\n{}\n\nQuestion: {}", context, question),
            },
        ];

        self.chat(messages).await
    }

    /// Suggest field labels for unknown binary regions.
    pub async fn suggest_fields(&self, hex_context: &str) -> Result<String> {
        let messages = vec![
            ChatMessage {
                role: "system".to_string(),
                content: "You are a binary file structure expert. Given hex bytes, suggest what fields they represent. Format as JSON array of {name, start, end, type, description}.".to_string(),
            },
            ChatMessage {
                role: "user".to_string(),
                content: format!("Suggest fields for these hex bytes:\n{}", hex_context),
            },
        ];

        self.chat(messages).await
    }
}
