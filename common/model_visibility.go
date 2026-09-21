package common

import (
	"strings"

	"github.com/tidwall/gjson"
	"github.com/tidwall/sjson"
)

// RelayInfoContextKey stores the current RelayInfo in the request context.
// Output helpers use the small GetClientModelName interface instead of
// importing relay/common, which would create an import cycle.
const RelayInfoContextKey = "relay_info"

// RewriteClientModelJSON rewrites only protocol model fields that are visible
// at the response boundary. It deliberately does not perform a global string
// replacement, so model names inside prompts, tool arguments, metadata, or
// error details remain untouched.
func RewriteClientModelJSON(data []byte, clientModel string) []byte {
	if len(data) == 0 || strings.TrimSpace(clientModel) == "" || !gjson.ValidBytes(data) {
		return data
	}

	for _, path := range []string{
		"model",
		"modelVersion",
		"response.model",
		"message.model",
	} {
		if !gjson.GetBytes(data, path).Exists() {
			continue
		}
		rewritten, err := sjson.SetBytes(data, path, clientModel)
		if err == nil {
			data = rewritten
		}
	}
	return data
}
