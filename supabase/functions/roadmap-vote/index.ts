import { createClient } from "jsr:@supabase/supabase-js@2"

const allowedItems = new Set([
  "modular-architecture-split-into-separate-reloadable-dlls",
  "rust-scripting",
  "hot-reload",
  "tracing",
  "editor-mvp",
  "automated-ci-benchmarking",
  "error-handling",
  "tests",
  "docs",
  "fast-streaming",
  "headless-engine",
  "scriptable-rendering-pipeline",
  "advanced-rendering-pipeline",
  "ESP32-support",
  "gpu-compute",
  "wasm-editor",
  "hardware-ray-tracing",
])

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  })
}

async function hashVoter(voterId: string) {
  const secret = Deno.env.get("VOTE_HASH_SECRET")!

  const encoder = new TextEncoder()

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  )

  const result = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(voterId),
  )

  return [...new Uint8Array(result)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    })
  }

  try {
    const {
      itemId,
      voterId,
      turnstileToken,
    } = await req.json()

    if (
      typeof itemId !== "string" ||
      typeof voterId !== "string" ||
      typeof turnstileToken !== "string"
    ) {
      return json({ error: "invalid_request" }, 400)
    }

    if (!allowedItems.has(itemId)) {
      return json({ error: "invalid_item" }, 400)
    }

    const verificationResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secret: Deno.env.get("TURNSTILE_SECRET_KEY"),
          response: turnstileToken,
        }),
      },
    )

    const verification =
      await verificationResponse.json()

    if (!verification.success) {
      return json(
        { error: "turnstile_failed" },
        403,
      )
    }

    if (
      verification.action &&
      verification.action !== "roadmap_vote"
    ) {
      return json(
        { error: "invalid_turnstile_action" },
        403,
      )
    }

    const voterHash = await hashVoter(voterId)

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    )

    const { data, error } =
      await supabase.rpc("record_roadmap_vote", {
        p_item_id: itemId,
        p_voter_hash: voterHash,
      })

    if (error) {
      console.error(error)
      return json({ error: "database_error" }, 500)
    }

    const result = data?.[0]

    return json({
      ok: true,
      accepted: result?.accepted ?? false,
      alreadyVoted: !(result?.accepted ?? false),
      votes: Number(result?.votes ?? 0),
    })
  } catch (error) {
    console.error(error)

    return json(
      { error: "internal_error" },
      500,
    )
  }
})
