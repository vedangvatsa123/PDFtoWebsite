#!/usr/bin/env node
/**
 * CVin.Bio MCP Server
 *
 * Exposes the CVin.Bio candidate database to AI agents via the
 * Model Context Protocol. Any MCP-compatible client (Claude, ChatGPT,
 * Cursor, etc.) can query professional profiles using structured tools.
 *
 * Transport: stdio
 *
 * Usage:
 *   npx @cvinbio/mcp-server
 *
 * Environment variables:
 *   SUPABASE_URL  - Your Supabase project URL
 *   SUPABASE_KEY  - Your Supabase service role key
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "";
const supabaseKey = process.env.SUPABASE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";
if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL / SUPABASE_KEY environment variables.");
    process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);
const SITE = process.env.SITE_URL || "https://cvin.bio";
function formatProfile(p) {
    const name = p.full_name || "Unknown";
    const slug = p.username || "";
    const skills = Array.isArray(p.skills) ? p.skills : [];
    const about = p.about ? p.about.slice(0, 300) : "";
    const experience = Array.isArray(p.experience) ? p.experience : [];
    const education = Array.isArray(p.education) ? p.education : [];
    const location = (Array.isArray(p.links) &&
        p.links.find((l) => l.type === "location")?.value) ||
        "";
    let out = `## ${name}\n`;
    out += `Profile: ${SITE}/${slug}\n`;
    if (location)
        out += `Location: ${location}\n`;
    if (skills.length > 0)
        out += `Skills: ${skills.join(", ")}\n`;
    if (about)
        out += `\nSummary: ${about}\n`;
    if (experience.length > 0) {
        out += `\nWork Experience:\n`;
        for (const job of experience.slice(0, 5)) {
            const end = job.endDate || "Present";
            out += `- ${job.title} at ${job.company} (${job.startDate} – ${end})`;
            if (job.location)
                out += ` [${job.location}]`;
            out += `\n`;
        }
    }
    if (education.length > 0) {
        out += `\nEducation:\n`;
        for (const edu of education.slice(0, 3)) {
            out += `- ${edu.degree} at ${edu.institution}`;
            if (edu.endDate)
                out += ` (${edu.endDate})`;
            out += `\n`;
        }
    }
    return out;
}
const server = new McpServer({
    name: "cvinbio",
    version: "1.0.0",
});
server.tool("search_candidates", "Search the CVin.Bio professional database by skills, location, or keyword. Returns matching candidate profiles with work history, education, and skills.", {
    query: z
        .string()
        .describe("Search term: a skill (e.g. 'React'), location (e.g. 'London'), job title (e.g. 'Product Manager'), or any keyword."),
    limit: z
        .number()
        .min(1)
        .max(20)
        .default(10)
        .describe("Number of results to return (1-20, default 10)."),
}, async ({ query, limit }) => {
    const searchTerm = query.trim().toLowerCase();
    const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .not("username", "is", null)
        .or(`full_name.ilike.%${searchTerm}%,about.ilike.%${searchTerm}%,skills.cs.{${searchTerm}}`)
        .order("updated_at", { ascending: false })
        .limit(limit);
    if (error) {
        return {
            content: [
                { type: "text", text: `Error searching: ${error.message}` },
            ],
        };
    }
    if (!profiles || profiles.length === 0) {
        const { data: fallback } = await supabase
            .from("profiles")
            .select("*")
            .not("username", "is", null)
            .or(`full_name.ilike.%${searchTerm}%,about.ilike.%${searchTerm}%`)
            .order("updated_at", { ascending: false })
            .limit(limit);
        if (!fallback || fallback.length === 0) {
            return {
                content: [
                    {
                        type: "text",
                        text: `No candidates found matching "${query}". Try broader terms like a general skill or location.`,
                    },
                ],
            };
        }
        const results = fallback.map(formatProfile).join("\n---\n\n");
        return {
            content: [
                {
                    type: "text",
                    text: `Found ${fallback.length} candidate(s) matching "${query}":\n\n${results}`,
                },
            ],
        };
    }
    const results = profiles.map(formatProfile).join("\n---\n\n");
    return {
        content: [
            {
                type: "text",
                text: `Found ${profiles.length} candidate(s) matching "${query}":\n\n${results}`,
            },
        ],
    };
});
server.tool("get_profile", "Get the full professional profile for a specific CVin.Bio user by their username (slug). Returns complete work history, education, skills, and custom sections.", {
    username: z
        .string()
        .describe("The CVin.Bio username/slug (e.g. 'vedang'). This is the part after cvin.bio/ in the profile URL."),
}, async ({ username }) => {
    const slug = username.trim().toLowerCase().replace(/^\//, "");
    const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", slug)
        .single();
    if (error || !profile) {
        return {
            content: [
                {
                    type: "text",
                    text: `No profile found for username "${slug}". Check the spelling or use search_candidates to find the right profile.`,
                },
            ],
        };
    }
    const full = formatProfile(profile);
    const customSections = Array.isArray(profile.custom_sections)
        ? profile.custom_sections
        : [];
    let extra = "";
    for (const section of customSections) {
        extra += `\n${section.sectionTitle}:\n`;
        for (const item of section.items || []) {
            extra += `- ${item.title}`;
            if (item.subtitle)
                extra += ` (${item.subtitle})`;
            if (item.description)
                extra += `: ${item.description}`;
            extra += `\n`;
        }
    }
    return {
        content: [
            {
                type: "text",
                text: full + extra,
            },
        ],
    };
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
main().catch((err) => {
    console.error("MCP server failed to start:", err);
    process.exit(1);
});
