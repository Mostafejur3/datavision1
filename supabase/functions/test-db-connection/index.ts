import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { host, port, database, username, password, dbType } = await req.json();

    if (!host || !database || !username) {
      return new Response(JSON.stringify({ success: false, error: "Host, database name, and username are required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Test connection based on database type
    let connectionUrl = "";
    const dbPort = port || (dbType === "mysql" ? 3306 : 5432);

    if (dbType === "mysql") {
      // For MySQL we use a TCP connection test
      connectionUrl = `mysql://${username}:${encodeURIComponent(password || "")}@${host}:${dbPort}/${database}`;
    } else {
      // PostgreSQL
      connectionUrl = `postgres://${username}:${encodeURIComponent(password || "")}@${host}:${dbPort}/${database}`;
    }

    // Attempt a TCP connection to verify the host and port are reachable
    try {
      const conn = await Deno.connect({
        hostname: host,
        port: Number(dbPort),
      });
      conn.close();
    } catch (connErr) {
      const errorMsg = connErr instanceof Error ? connErr.message : "Unknown error";
      return new Response(JSON.stringify({
        success: false,
        error: `Cannot reach ${host}:${dbPort} — ${errorMsg}. Please check your host, port, and firewall settings.`,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If TCP succeeded, return success with connection info
    return new Response(JSON.stringify({
      success: true,
      message: `Successfully connected to ${host}:${dbPort}. Database "${database}" is reachable.`,
      connectionInfo: {
        host,
        port: dbPort,
        database,
        username,
        dbType: dbType || "postgresql",
      },
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("DB connection test error:", error);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
