import { createClient } from "npm:@supabase/supabase-js@2"

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json(
        { error: "method_not_allowed" },
        { status: 405 },
      )
    }

    // Protect the endpoint from random people triggering Discord spam.
    const expectedSecret =
      Deno.env.get("ROADMAP_CRON_SECRET")

    const suppliedSecret =
      req.headers.get("x-roadmap-secret")

    if (
      !expectedSecret ||
      suppliedSecret !== expectedSecret
    ) {
      return Response.json(
        { error: "unauthorized" },
        { status: 401 },
      )
    }

    const webhookUrl =
      Deno.env.get("DISCORD_ROADMAP_WEBHOOK_URL")

    if (!webhookUrl) {
      return Response.json(
        {
          error: "missing_secret",
          detail:
            "DISCORD_ROADMAP_WEBHOOK_URL is not configured",
        },
        { status: 500 },
      )
    }

    /*
     * Current Supabase projects expose the new secret-key map.
     * Fall back to the legacy service-role key if available.
     */
    let adminKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    if (!adminKey) {
      const secretKeysRaw =
        Deno.env.get("SUPABASE_SECRET_KEYS")

      if (secretKeysRaw) {
        const secretKeys =
          JSON.parse(secretKeysRaw)

        adminKey = secretKeys.default
      }
    }

    const supabaseUrl =
      Deno.env.get("SUPABASE_URL")

    if (!supabaseUrl || !adminKey) {
      return Response.json(
        {
          error: "supabase_config_missing",
          detail:
            "SUPABASE_URL or admin API key is unavailable",
        },
        { status: 500 },
      )
    }

    const supabase = createClient(
      supabaseUrl,
      adminKey,
    )

    const { data, error } = await supabase
      .from("roadmap_vote_stats")
      .select(
        `
          item_id,
          total_votes,
          votes_last_7_days,
          votes_last_30_days,
          last_vote_at
        `,
      )
      .order("total_votes", {
        ascending: false,
      })

    if (error) {
      console.error("Stats query failed:", error)

      return Response.json(
        {
          error: "stats_query_failed",
          detail: error.message,
        },
        { status: 500 },
      )
    }

    const stats = data ?? []

    const totalVotes = stats.reduce(
      (sum, item) =>
        sum + Number(item.total_votes ?? 0),
      0,
    )

    const votesThisWeek = stats.reduce(
      (sum, item) =>
        sum +
        Number(item.votes_last_7_days ?? 0),
      0,
    )

    const top = stats.slice(0, 10)

    const ranking = top
      .map((item, index) => {
        const total =
          Number(item.total_votes ?? 0)

        const weekly =
          Number(item.votes_last_7_days ?? 0)

        return (
          `**${index + 1}. ${formatItemId(item.item_id)}**` +
          ` — ${total} votes` +
          (weekly > 0
            ? ` · +${weekly} this week`
            : "")
        )
      })
      .join("\n")

    const fastestGrowing = [...stats]
      .sort(
        (a, b) =>
          Number(b.votes_last_7_days ?? 0) -
          Number(a.votes_last_7_days ?? 0),
      )[0]

    const fastestGrowingText =
      fastestGrowing &&
      Number(
        fastestGrowing.votes_last_7_days ?? 0,
      ) > 0
        ? `${formatItemId(
            fastestGrowing.item_id,
          )} (+${fastestGrowing.votes_last_7_days})`
        : "No new votes this week"

    const discordResponse =
      await fetch(webhookUrl, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          username: "Pill Roadmap",

          embeds: [
            {
              title:
                "📊 Pill Roadmap — Weekly votes",

              description:
                ranking ||
                "No roadmap votes yet.",

              fields: [
                {
                  name: "Total votes",
                  value: String(totalVotes),
                  inline: true,
                },
                {
                  name: "Votes this week",
                  value: String(votesThisWeek),
                  inline: true,
                },
                {
                  name: "🔥 Fastest growing",
                  value: fastestGrowingText,
                  inline: false,
                },
              ],

              timestamp:
                new Date().toISOString(),
            },
          ],
        }),
      })

    if (!discordResponse.ok) {
      const discordBody =
        await discordResponse.text()

      console.error(
        "Discord error:",
        discordResponse.status,
        discordBody,
      )

      return Response.json(
        {
          error: "discord_failed",
          status: discordResponse.status,
          detail: discordBody,
        },
        { status: 502 },
      )
    }

    return Response.json({
      ok: true,
      totalVotes,
      votesThisWeek,
      items: stats.length,
    })
  } catch (error) {
    console.error(error)

    return Response.json(
      {
        error: "internal_error",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 },
    )
  }
})

function formatItemId(id: string) {
  const names: Record<string, string> = {
    "modular-architecture-split-into-separate-reloadable-dlls":
      "Modular reloadable DLL architecture",

    "rust-scripting":
      "Rust & C# scripting",

    "hot-reload":
      "Two-level hot reload",

    "tracing":
      "Tracing & logging",

    "editor-mvp":
      "Editor MVP",

    "automated-ci-benchmarking":
      "Automated CI benchmarking",

    "error-handling":
      "Advanced error handling",

    "tests":
      "Testing pipeline",

    "docs":
      "Generated documentation",

    "fast-streaming":
      "Ultra-fast asset streaming",

    "headless-engine":
      "Headless engine",

    "scriptable-rendering-pipeline":
      "Scriptable rendering pipeline",

    "advanced-rendering-pipeline":
      "Advanced renderer",

    "ESP32-support":
      "ESP32 support",

    "gpu-compute":
      "GPU compute",

    "wasm-editor":
      "Browser editor",

    "hardware-ray-tracing":
      "Hardware ray tracing",
  }

  return names[id] ?? id
}
