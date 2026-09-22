package service

import (
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/model"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/relaykit/dto"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestAppendConversationAdminInfoOpenAI(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx, _ := gin.CreateTestContext(nil)

	alice := "alice"
	req := &dto.GeneralOpenAIRequest{
		Messages: []dto.Message{
			{Role: "system", Content: "You are a helpful assistant."},
			{Role: "user", Content: "Explain quantum computing.", Name: &alice},
		},
	}

	relayInfo := &relaycommon.RelayInfo{
		Request: req,
	}
	relayInfo.AppendResponseContent("Quantum computing uses qubits.")
	relayInfo.AppendResponseReasoning("Thinking about quantum superposition...")

	other := model.NewLogOther()
	appendConversationAdminInfo(ctx, relayInfo, other)

	snapshot := other.Snapshot()
	adminInfo, ok := snapshot["admin_info"].(map[string]any)
	require.True(t, ok)

	detail, ok := adminInfo["conversation"].(*model.LogChatDetail)
	require.True(t, ok)
	require.Len(t, detail.Messages, 2)
	assert.Equal(t, "system", detail.Messages[0].Role)
	assert.Equal(t, "You are a helpful assistant.", detail.Messages[0].Content)
	assert.Equal(t, "", detail.Messages[0].Name)
	assert.Equal(t, "user", detail.Messages[1].Role)
	assert.Equal(t, "Explain quantum computing.", detail.Messages[1].Content)
	assert.Equal(t, "alice", detail.Messages[1].Name)

	require.NotNil(t, detail.Response)
	assert.Equal(t, "assistant", detail.Response.Role)
	assert.Equal(t, "Quantum computing uses qubits.", detail.Response.Content)
	assert.Equal(t, "Thinking about quantum superposition...", detail.Response.ReasoningContent)
}

func TestAppendConversationAdminInfoClaude(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx, _ := gin.CreateTestContext(nil)

	req := &dto.ClaudeRequest{
		System: "System prompt for Claude",
		Messages: []dto.ClaudeMessage{
			{Role: "user", Content: "Hello Claude"},
		},
	}

	relayInfo := &relaycommon.RelayInfo{
		Request: req,
	}
	relayInfo.AppendResponseContent("Hello from Claude!")

	other := model.NewLogOther()
	appendConversationAdminInfo(ctx, relayInfo, other)

	snapshot := other.Snapshot()
	adminInfo, ok := snapshot["admin_info"].(map[string]any)
	require.True(t, ok)

	detail, ok := adminInfo["conversation"].(*model.LogChatDetail)
	require.True(t, ok)
	require.Len(t, detail.Messages, 2)
	assert.Equal(t, "system", detail.Messages[0].Role)
	assert.Equal(t, "System prompt for Claude", detail.Messages[0].Content)
	assert.Equal(t, "user", detail.Messages[1].Role)
	assert.Equal(t, "Hello Claude", detail.Messages[1].Content)
	require.NotNil(t, detail.Response)
	assert.Equal(t, "Hello from Claude!", detail.Response.Content)
}

func TestAppendConversationAdminInfoResponsesAPI(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx, _ := gin.CreateTestContext(nil)

	inputJSON := `[
		{
			"type": "message",
			"id": "msg_01",
			"role": "developer",
			"content": [{"type": "input_text", "text": "<app-context>\n# Codex desktop context"}]
		},
		{
			"type": "message",
			"id": "msg_02",
			"role": "user",
			"content": [{"type": "input_text", "text": "What is the capital of France?"}]
		}
	]`

	req := &dto.OpenAIResponsesRequest{
		Model: "gpt-4o",
		Input: []byte(inputJSON),
	}

	relayInfo := &relaycommon.RelayInfo{
		Request: req,
	}
	relayInfo.AppendResponseContent("Paris is the capital of France.")

	other := model.NewLogOther()
	appendConversationAdminInfo(ctx, relayInfo, other)

	snapshot := other.Snapshot()
	adminInfo, ok := snapshot["admin_info"].(map[string]any)
	require.True(t, ok)

	detail, ok := adminInfo["conversation"].(*model.LogChatDetail)
	require.True(t, ok)
	require.Len(t, detail.Messages, 2)
	assert.Equal(t, "system", detail.Messages[0].Role)
	assert.Equal(t, "<app-context>\n# Codex desktop context", detail.Messages[0].Content)
	assert.Equal(t, "user", detail.Messages[1].Role)
	assert.Equal(t, "What is the capital of France?", detail.Messages[1].Content)

	require.NotNil(t, detail.Response)
	assert.Equal(t, "assistant", detail.Response.Role)
	assert.Equal(t, "Paris is the capital of France.", detail.Response.Content)
}

func TestAppendConversationAdminInfoTruncate(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx, _ := gin.CreateTestContext(nil)

	hugePrompt := strings.Repeat("A", 30000)
	req := &dto.GeneralOpenAIRequest{
		Messages: []dto.Message{
			{Role: "user", Content: hugePrompt},
		},
	}

	relayInfo := &relaycommon.RelayInfo{
		Request: req,
	}
	relayInfo.AppendResponseContent(strings.Repeat("B", 25000))

	other := model.NewLogOther()
	appendConversationAdminInfo(ctx, relayInfo, other)

	snapshot := other.Snapshot()
	adminInfo := snapshot["admin_info"].(map[string]any)
	detail := adminInfo["conversation"].(*model.LogChatDetail)

	require.True(t, strings.HasSuffix(detail.Messages[0].Content, "... (truncated)"))
	require.True(t, len(detail.Messages[0].Content) < 25000)
	require.True(t, strings.HasSuffix(detail.Response.Content, "... (truncated)"))
}
