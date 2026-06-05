# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# API Design
- Use generic shared routes under /v1/ for common infrastructure (like image proxies) instead of provider-specific nested routes. Confidence: 0.70

# Workflow
- When the user says the dev server is running, directly test API endpoints with curl rather than explaining how to test or debugging configuration. Confidence: 0.80
- When testing API endpoints, run curl commands sequentially one at a time rather than batching parallel calls, especially when endpoints are slow to respond. Confidence: 0.70

# Proxies
- Keep upstream provider proxies simple — just forward requests to the upstream API without adding extra features like search or transformation layers. Confidence: 0.70

# Documentation
See [documentation/taste.md](documentation/taste.md)
