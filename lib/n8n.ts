export async function triggerN8nWorkflow(
  workflowName: string,
  data: Record<string, unknown>,
): Promise<void> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL
  if (!webhookUrl) {
    console.warn("N8N_WEBHOOK_URL not configured — skipping n8n trigger")
    return
  }

  try {
    await fetch(webhookUrl, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ workflowName, data }),
      signal:  AbortSignal.timeout(5000),
    })
  } catch (error) {
    console.error("n8n webhook error:", error)
  }
}
