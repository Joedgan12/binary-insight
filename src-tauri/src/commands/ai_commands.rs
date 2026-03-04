use crate::ai::{OllamaClient, ChatMessage, build_analysis_prompt};
use crate::core::FileReader;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalyzeRequest {
    pub file_path: Option<String>,
    pub question: String,
    pub hex_context: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalyzeResult {
    pub response: String,
    pub model: String,
    pub available: bool,
}

/// Analyze binary data with AI.
#[tauri::command]
pub async fn ai_analyze(request: AnalyzeRequest) -> Result<AnalyzeResult, String> {
    let client = OllamaClient::new(None, None);

    if !client.is_available().await {
        return Ok(AnalyzeResult {
            response: "Ollama is not running. Start Ollama locally to use AI features, or the app will use mock responses.".to_string(),
            model: "none".to_string(),
            available: false,
        });
    }

    let context = if let Some(path) = &request.file_path {
        let reader = FileReader::open(path).map_err(|e| e.to_string())?;
        let info = reader.info();
        let hex_preview: String = reader
            .slice(0, 128)
            .iter()
            .map(|b| format!("{:02X}", b))
            .collect::<Vec<_>>()
            .join(" ");
        build_analysis_prompt(&info, &hex_preview, &request.question)
    } else if let Some(hex) = &request.hex_context {
        format!("Hex data:\n{}\n\nQuestion: {}", hex, request.question)
    } else {
        request.question.clone()
    };

    let response = client
        .analyze(&context, &request.question)
        .await
        .map_err(|e| e.to_string())?;

    Ok(AnalyzeResult {
        response,
        model: "llama3.2".to_string(),
        available: true,
    })
}

/// Chat with AI about binary analysis.
#[tauri::command]
pub async fn ai_chat(messages: Vec<ChatMessage>) -> Result<String, String> {
    let client = OllamaClient::new(None, None);

    if !client.is_available().await {
        return Err("Ollama is not available. Please start it locally.".to_string());
    }

    client.chat(messages).await.map_err(|e| e.to_string())
}

/// Ask AI to suggest field labels for hex bytes.
#[tauri::command]
pub async fn ai_suggest_fields(hex_context: String) -> Result<String, String> {
    let client = OllamaClient::new(None, None);

    if !client.is_available().await {
        return Err("Ollama is not available.".to_string());
    }

    client
        .suggest_fields(&hex_context)
        .await
        .map_err(|e| e.to_string())
}
