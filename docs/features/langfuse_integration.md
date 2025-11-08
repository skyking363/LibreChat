# Langfuse Integration for LibreChat

LibreChat now supports [Langfuse](https://langfuse.com) for LLM observability, allowing you to track, monitor, and debug your language model interactions.

## Overview

The Langfuse integration provides:

- **Comprehensive Tracing**: Track entire conversation flows from user input to LLM response
- **Performance Monitoring**: Monitor latency, token usage, and costs
- **Error Tracking**: Automatic logging of errors and exceptions
- **Multi-Provider Support**: Works with OpenAI, Anthropic, Google, and other LLM providers
- **Session Management**: Group conversations by user and session

## Setup

### 1. Get Langfuse Credentials

You can use either Langfuse Cloud or self-host Langfuse:

**Option A: Langfuse Cloud (Recommended for Quick Start)**

1. Sign up at [https://cloud.langfuse.com](https://cloud.langfuse.com) (US) or [https://cloud.eu.langfuse.com](https://cloud.eu.langfuse.com) (EU)
2. Create a new project
3. Navigate to **Settings > API Keys**
4. Create a new API key pair (Public Key and Secret Key)

**Option B: Self-Hosted Langfuse**

Follow the [Langfuse self-hosting guide](https://langfuse.com/docs/deployment/self-host) to deploy your own instance.

### 2. Configure Environment Variables

Add the following variables to your `.env` file:

```bash
# Enable Langfuse
LANGFUSE_ENABLED=true

# Langfuse API credentials
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...

# Langfuse host (choose based on your setup)
# For Langfuse Cloud US:
LANGFUSE_HOST=https://cloud.langfuse.com
# For Langfuse Cloud EU:
# LANGFUSE_HOST=https://cloud.eu.langfuse.com
# For self-hosted:
# LANGFUSE_HOST=https://your-langfuse-instance.com

# Optional: Enable debug logging for Langfuse
LANGFUSE_DEBUG=false

# Optional: Sample rate (0.0 to 1.0)
# Useful for high-volume applications to reduce costs
# 1.0 = log all requests (default)
# 0.5 = log 50% of requests
LANGFUSE_SAMPLE_RATE=1.0

# Optional: Flush settings
LANGFUSE_FLUSH_AT_SHUTDOWN=true
LANGFUSE_FLUSH_INTERVAL=1000
```

### 3. Restart LibreChat

After configuring the environment variables, restart your LibreChat server:

```bash
npm run backend
```

You should see a log message indicating that Langfuse has been initialized:

```
[LangfuseService] Langfuse initialized successfully
```

## What Gets Tracked

### Trace Information

Each conversation generates a trace containing:

- **User ID**: Identifies the user making the request
- **Session ID**: Maps to the LibreChat conversation ID
- **Endpoint**: The LLM provider (OpenAI, Anthropic, Google, etc.)
- **Model**: The specific model used (e.g., gpt-4, claude-3, gemini-pro)
- **Message IDs**: Parent and response message identifiers

### Generation Details

For each LLM call, Langfuse tracks:

- **Input**: The complete prompt sent to the LLM
- **Output**: The LLM's response
- **Token Usage**: Prompt tokens, completion tokens, and total tokens
- **Latency**: Time taken for the LLM to respond
- **Model Parameters**: Temperature, max tokens, top-p, etc.
- **Errors**: Any exceptions or failures that occur

### Metadata

Additional context captured:

- Conversation metadata
- Edit/regeneration status
- File attachments (if present)
- Custom parameters

## Features by Provider

### OpenAI

The OpenAI integration uses Langfuse's native OpenAI SDK observer, providing:

- Automatic token counting
- Streaming support with real-time updates
- Function/tool calling traces
- Vision model support

### Anthropic, Google, and Others

For non-OpenAI providers, LibreChat uses manual tracing at the BaseClient level, capturing:

- Complete request/response cycles
- Token usage estimation
- Error handling
- Performance metrics

## Viewing Your Data

1. Log in to your Langfuse dashboard
2. Navigate to **Traces** to see all conversations
3. Click on a trace to view:
   - Complete conversation flow
   - Individual LLM generations
   - Token usage and costs
   - Performance metrics
   - Error logs (if any)

### Useful Langfuse Features

- **Filtering**: Filter traces by user, model, endpoint, or date range
- **Analytics**: View aggregate metrics across all conversations
- **Cost Tracking**: Monitor LLM API costs over time
- **Debugging**: Inspect failed requests and error messages
- **Prompt Management**: Export successful prompts for reuse

## Performance Considerations

### Sample Rate

For high-volume production deployments, consider using a sample rate less than 1.0:

```bash
# Log only 10% of requests
LANGFUSE_SAMPLE_RATE=0.1
```

This reduces:
- Network overhead to Langfuse
- Storage costs
- Processing time

While still providing representative sampling for monitoring.

### Flush Settings

The flush interval controls how often traces are sent to Langfuse:

```bash
# Send traces every 2 seconds (default: 1000ms)
LANGFUSE_FLUSH_INTERVAL=2000
```

Higher intervals reduce network calls but increase memory usage.

## Troubleshooting

### Langfuse Not Logging

1. **Check Environment Variables**: Ensure `LANGFUSE_ENABLED=true` and credentials are set
2. **Verify Credentials**: Test your public/secret keys in the Langfuse dashboard
3. **Check Logs**: Look for Langfuse initialization messages in server logs
4. **Enable Debug Mode**: Set `LANGFUSE_DEBUG=true` for verbose logging

### Missing Traces

1. **Sample Rate**: Check if `LANGFUSE_SAMPLE_RATE` is less than 1.0
2. **Network Issues**: Verify LibreChat can reach your Langfuse host
3. **Flush on Shutdown**: Ensure `LANGFUSE_FLUSH_AT_SHUTDOWN=true` if traces seem incomplete

### High Latency

1. **Increase Flush Interval**: Set `LANGFUSE_FLUSH_INTERVAL` to a higher value
2. **Reduce Sample Rate**: Lower `LANGFUSE_SAMPLE_RATE` for production
3. **Use Self-Hosted Langfuse**: Deploy Langfuse closer to your LibreChat instance

## Privacy and Security

- **Sensitive Data**: Langfuse stores all prompts and responses. Ensure your Langfuse instance complies with your privacy requirements
- **Self-Hosting**: For maximum control, use self-hosted Langfuse
- **API Keys**: Keep your Langfuse secret key secure and never commit it to version control
- **User IDs**: User IDs are hashed/anonymized where appropriate

## Advanced Configuration

### Custom Trace Attributes

The integration automatically includes:

- Conversation context
- User information
- Model parameters
- Endpoint configuration

### Integration with Other Tools

Langfuse data can be:

- Exported for analysis
- Connected to BI tools
- Used for fine-tuning datasets
- Integrated with alerting systems

## Disabling Langfuse

To disable Langfuse logging:

```bash
LANGFUSE_ENABLED=false
```

Or simply remove/comment out the Langfuse environment variables from your `.env` file.

## Resources

- [Langfuse Documentation](https://langfuse.com/docs)
- [Langfuse GitHub](https://github.com/langfuse/langfuse)
- [LibreChat Documentation](https://www.librechat.ai/docs)

## Support

For issues related to:

- **Langfuse Integration**: Open an issue on the [LibreChat GitHub](https://github.com/danny-avila/LibreChat/issues)
- **Langfuse Platform**: Visit [Langfuse Support](https://langfuse.com/docs/support)
