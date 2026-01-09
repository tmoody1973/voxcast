# Voxcast - Product Requirements Document (PRD)

**Version:** 2.0
**Author:** Tarik Moody
**Date:** January 2025
**Status:** Draft
**Last Updated:** January 8, 2026 (Post-Brainstorming Session)

---

## Executive Summary

Voxcast is a SaaS platform providing AI-powered management consultants for public radio stations. Built on the Public Radio Agents framework, it offers four specialized AI agents (Development, Marketing, Underwriting, Programming) orchestrated by **Station Pulse** — a Chief of Staff intelligence layer that correlates signals across departments and provides proactive early warning. Agents can collaborate, generate reports, create presentations, and integrate with station workflows.

### Vision Statement
*"Every public radio station deserves access to expert strategic guidance. Voxcast democratizes management consulting through AI, helping stations thrive despite funding challenges."*

### Key Differentiators
1. **Domain Expertise** - Agents trained specifically for public radio operations
2. **Multi-Agent Collaboration** - Party Mode enables cross-functional strategy sessions
3. **Station Pulse Intelligence** - Cross-department signal correlation and early warning system
4. **Actionable Outputs** - Generate decks, reports, charts, and campaign materials
5. **Institutional Memory** - Externalize tacit knowledge into queryable, shareable intelligence
6. **Station Context** - RAG system personalizes advice to each station's data
7. **Voice Mode** - Natural conversation with distinct agent personalities

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Target Users](#2-target-users)
3. [Core Features](#3-core-features)
4. [Station Pulse — Chief of Staff Layer](#4-station-pulse--chief-of-staff-layer)
5. [Agent Architecture](#5-agent-architecture)
6. [Tool Integrations](#6-tool-integrations)
7. [Dynamic UI System](#7-dynamic-ui-system)
8. [Technical Architecture](#8-technical-architecture)
9. [Data Model](#9-data-model)
10. [API Specifications](#10-api-specifications)
11. [Security & Compliance](#11-security--compliance)
12. [Pricing Strategy](#12-pricing-strategy)
13. [Success Metrics](#13-success-metrics)
14. [Roadmap](#14-roadmap)
15. [Appendices](#appendices)

---

## 1. Problem Statement

### The Challenge
Public radio stations face unprecedented challenges:
- **CPB funding uncertainty** - Federal funding cuts threaten operations
- **Resource constraints** - Small teams lack specialized expertise
- **Consulting costs** - Traditional consultants charge $300-500/hour
- **Knowledge gaps** - Staff wear multiple hats without deep domain expertise
- **Decision paralysis** - Complex tradeoffs without strategic frameworks

### The Opportunity
AI agents can provide:
- 24/7 strategic guidance at a fraction of consulting costs
- Institutional knowledge that doesn't leave when staff turns over
- Multi-disciplinary perspectives through agent collaboration
- Actionable outputs (not just advice) - decks, reports, campaigns

### Market Size
- 1,500+ public radio stations in the US
- Average station budget: $500K - $50M
- Total addressable market: ~$50M annually for strategic consulting tools

---

## 2. Target Users

### Primary Personas

#### Station Manager / General Manager
- **Needs:** Strategic planning, board presentations, budget scenarios, cross-department visibility
- **Pain points:** Too many responsibilities, limited strategic support, working in silos, no early warning when things go wrong
- **Key features:** Station Pulse daily briefings, Party Mode for cross-functional analysis, deck generation, collision detection
- **Key insight:** *"I don't need dashboards. I need to know what's about to break before it breaks."*

#### Development Director
- **Needs:** Campaign planning, donor communications, grant writing, **fundraising events** (galas, Fall Ball, etc.), donor relationship management
- **Pain points:** Limited budget, small team, fundraising pressure, institutional memory trapped in one person's head, "quiet attrition" of donors
- **Key features:** Sarah agent, campaign templates, donor analysis, **60-Second Donor Prep**, **Event Intelligence Dashboard**, **Living Narrative Library**, **Quiet Attrition Detection**
- **Key insight:** *"Who have I forgotten? Help me remember what I can't possibly hold in my head."*

#### Marketing Director
- **Needs:** Audience growth, brand strategy, digital campaigns, role clarity
- **Pain points:** Competing with commercial media, limited ad spend, unclear audience identity, "accountable for everything, in control of almost nothing"
- **Key features:** Marcus agent, image generation, social content, **Audience Reality Map**, **Journey Intelligence**, **Channel Efficiency Analysis**, **Role Clarity Canvas**
- **Key insight:** *"Who are we actually for anymore?"*

#### Underwriting Director
- **Needs:** Prospect research, proposal generation, rate optimization, evidence of listener value
- **Pain points:** Selling against digital, proving ROI, pipeline is a "junk drawer," knowledge trapped in one person
- **Key features:** Diana agent, proposal templates, market research, **Pipeline Intelligence**, **Proposal Generator (80% complete)**, **Renewal Briefs**, **Call Prep Sheets**, **Listener Impact Surveys**
- **Key insight:** *"Help me build the machine so I can stop being the machine."*

#### Program Director
- **Needs:** Schedule optimization, content strategy, audience analysis, **external partnership opportunities**
- **Pain points:** Balancing mission and ratings, limited research, programming "in the dark," can't see consequences of scheduling decisions
- **Key features:** Jordan agent, programming analysis, competitive intel, **Consequence Preview**, **Show Outcome Tagging**, **Partnership Pipeline**, **Listener-Supporter Bridge**
- **Key insight:** *"I stop programming for audience. I start programming for outcome."*

### Secondary Personas
- Board members (read-only dashboards)
- Part-time staff (quick answers)
- Consultants (white-label potential)

---

## 3. Core Features

### 3.1 Chat Interface

#### Single Agent Mode
- Select one of four specialized agents
- Streaming responses with markdown rendering
- Conversation history and search
- Context panel for documents

#### Party Mode
- Select 2-4 agents for collaboration
- Agents respond in sequence, building on each other
- Facilitator summaries and action items
- Cross-functional strategy development

#### Voice Mode (Pro)
- Real-time voice conversation
- Distinct voice per agent (Gemini TTS)
- Wake word detection (optional)
- Transcript generation

### 3.2 Document Intelligence

#### Upload & Processing
- Supported formats: PDF, DOCX, XLSX, CSV, TXT, MD
- Automatic text extraction
- Chunking for vector search (1000 tokens/chunk)
- OpenAI embeddings (text-embedding-3-small)

#### Context Categories
- **Financials:** Budgets, P&L, forecasts
- **Ratings:** Nielsen, audience data
- **Operations:** Org charts, policies
- **Content:** Program schedules, logs
- **External:** Market research, competitive intel

#### RAG System
- Convex vector search (no external vector DB needed)
- Automatic context retrieval based on query
- Citation of source documents
- Relevance scoring

### 3.3 Output Generation

#### Reports (Markdown/PDF)
- Strategic plans
- SWOT analyses
- Campaign briefs
- Board presentations (narrative)

#### Presentations (Gamma API)
- Auto-generated slide decks
- Station branding applied
- Editable in Gamma or export to PPTX
- Templates: Campaign Pitch, Board Update, Strategic Plan

#### Charts & Visualizations (Tremor)
- **Line/Area Charts:** Membership trends, audience growth, revenue over time
- **Bar Charts:** Ratings by daypart, revenue by category, platform comparison
- **Donut Charts:** Giving levels distribution, content type breakdown
- **KPI Cards:** Campaign metrics with deltas, sparklines, progress bars
- **Stacked Charts:** Multi-category revenue, expense breakdowns
- **Trackers:** Usage quotas, goal progress visualization

#### Marketing Assets (Replicate/FLUX)
- Social media graphics
- Campaign imagery
- Email headers
- Event materials

### 3.4 Integrations

#### Google Workspace
- Import: Docs, Sheets, Slides from Drive
- Export: Save reports and decks to Drive
- Real-time sync (optional)

#### Station Tools
- RAB/Marketron integration (future)
- Nielsen API (future)
- CRM integrations (future)

---

## 4. Station Pulse — Chief of Staff Layer

### 4.1 Overview

Station Pulse is the intelligence orchestration layer that sits above the four specialized agents. It watches the entire station, correlates signals across departments, and provides proactive early warning before problems become crises.

**Core Insight from User Research:**
> *"I don't need dashboards. I need a Chief of Staff — someone watching everything and telling me what's about to break."*

### 4.2 Architecture Position

```
                    ┌─────────────────┐
                    │  STATION PULSE  │
                    │  (Chief of Staff)│
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
   ┌──────────┐        ┌──────────┐        ┌──────────┐
   │  SARAH   │◄──────►│  MARCUS  │◄──────►│  DIANA   │
   │ (Dev)    │        │ (Mktg)   │        │ (Under)  │
   └────┬─────┘        └────┬─────┘        └────┬─────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                            ▼
                      ┌──────────┐
                      │  JORDAN  │
                      │ (Prog)   │
                      └──────────┘
```

**Station Pulse** sits above, watching for cross-agent signals and correlations.
**All agents** share a common intelligence layer and can query each other's knowledge.
**Jordan (Programming)** receives input from all others — every programming decision has development, marketing, and underwriting implications.

### 4.3 Core Capabilities

| Capability | Description | Example |
|------------|-------------|---------|
| **Daily Briefing** | Prioritized intelligence with recommended actions, not dashboards | "3 items need your attention today: [ranked list with context]" |
| **Multi-Signal Correlation** | Connect signals across departments that individually seem minor | Donor engagement drop + sponsor silence + schedule change = risk |
| **Collision Detection** | Flag when one department's decision affects another | "Programming is considering cutting Local Rhythms — 4 major donors cite this show" |
| **Momentum Tracking** | What's gaining steam, losing steam, or gone quiet | "Membership signups up 15% since podcast launch" |
| **Decay Detection** | Relationship erosion signals before they break | "3 donors haven't attended an event in 18 months" |
| **External Intelligence** | Industry news, competitive moves, market shifts | "Competing station just launched morning show rebrand" |

### 4.4 The Five Collision Types

Cross-department conflicts identified through user research:

1. **Programming ↔ Development**
   - Schedule changes affecting donors who love specific shows
   - Host departures without donor notification

2. **Marketing ↔ Underwriting**
   - Campaign timing conflicting with sponsor sensitivities
   - Brand messaging that inadvertently undermines sponsor relationships

3. **Events ↔ ROI**
   - Event effort vs. actual return on investment
   - Resource allocation without clear outcome tracking

4. **Content ↔ Membership**
   - What we air vs. who supports us
   - Programming decisions made without donor impact visibility

5. **Grant Narrative ↔ Reality**
   - What we promised funders vs. what we're actually doing
   - Compliance risks from drifting commitments

### 4.5 Daily Briefing Format

```yaml
# Station Pulse Daily Briefing
# Generated: Monday, 8:00 AM

priority_items:
  - level: HIGH
    category: donor_risk
    summary: "Margaret Chen (Major Donor, $5K) hasn't been contacted in 47 days"
    context: "Last interaction was Gala. She mentioned interest in local music programming."
    recommended_action: "Schedule coffee meeting this week"
    owner: sarah

  - level: MEDIUM
    category: collision_detected
    summary: "Thursday 2pm schedule change under consideration"
    context: "2 underwriters specifically bought this daypart. 4 donors cite this show."
    recommended_action: "Loop in Diana and review Consequence Preview before deciding"
    owner: jordan

  - level: LOW
    category: momentum_positive
    summary: "Podcast downloads up 23% month-over-month"
    context: "New interview series driving growth. Consider cross-promotion."
    recommended_action: "Review with Marcus for amplification opportunities"
    owner: jordan

signals_to_watch:
  - "Sponsor renewal conversation stalled (Day 12 of silence)"
  - "3 sustainers downgraded this week — unusual pattern"
  - "Board meeting in 5 days — deck not started"

cross_department_activity:
  - sarah: "Working on year-end campaign. Major gift visits scheduled."
  - marcus: "Social campaign launching Wednesday. Coordinate messaging."
  - diana: "Q1 renewals in progress. 4 active negotiations."
  - jordan: "Schedule review for February. Partnership discussions with NPR."
```

### 4.6 Implementation Approach

Station Pulse is not a separate agent — it's an **orchestration layer** that:

1. **Aggregates signals** from all four agents' activities
2. **Runs correlation algorithms** to detect patterns
3. **Generates briefings** with prioritized intelligence
4. **Injects context** into each agent's responses when relevant
5. **Maintains a shared knowledge graph** accessible to all agents

**Technical Notes:**
- Built on top of the existing Convex data model
- Uses scheduled functions for daily briefing generation
- Implements a signal taxonomy for cross-agent event classification
- Requires cross-agent data access permissions in the schema

---

## 5. Agent Architecture

### 5.1 Agent Definitions

Each agent has:
- **Identity:** Name, title, emoji, color scheme
- **Personality:** Communication style, approach
- **Expertise:** Domain knowledge areas
- **Tools:** Specific capabilities
- **Voice:** TTS voice configuration

#### Sarah - Development Director 💝
```yaml
color: rose
expertise:
  - Major gifts and planned giving
  - Membership campaigns
  - Grant writing
  - Donor psychology
  - Capital campaigns
  - Board development
  - Event fundraising (Galas, Fall Ball, etc.)
  - Donor retention and quiet attrition detection
  - Institutional memory management
tools:
  # Original tools
  - generate_campaign_plan
  - analyze_donor_data
  - draft_appeal_letter
  - create_case_for_support

  # New tools from brainstorming (v2.0)
  - generate_donor_prep          # 60-Second Donor Prep one-pager
  - detect_quiet_attrition       # Surface donors going cold
  - generate_narrative           # Living Narrative Library
  - calculate_momentum_score     # Relationship momentum tracking
  - generate_event_intel         # Event Intelligence Dashboard
  - suggest_seating_strategy     # Table/seating optimization
  - track_event_roi              # Event ROI tracking
  - generate_followup_queue      # Post-event follow-up prioritization
  - attribute_event_to_gift      # Event-to-gift attribution
  - get_donor_event_history      # Event history per donor

voice:
  gemini: en-US-Studio-O
  style: warm, encouraging, strategic

key_insight: "Who have I forgotten? Help me remember what I can't possibly hold in my head."
```

#### Marcus - Marketing Director 📢
```yaml
color: blue
expertise:
  - Brand strategy
  - Digital marketing
  - Social media
  - Audience development
  - Content marketing
  - Email campaigns
  - Media planning
  - Analytics
  - Audience identity and segmentation
  - Role clarity and resource prioritization
tools:
  # Original tools
  - generate_social_content
  - create_marketing_image
  - analyze_audience_data
  - draft_press_release

  # New tools from brainstorming (v2.0)
  - generate_audience_reality_map   # Who's actually listening vs. who we think
  - map_adjacent_audiences          # Who could we be for?
  - analyze_journey_intelligence    # Unaware → sustaining member pathways
  - analyze_channel_efficiency      # What to sunset, what to double down on
  - generate_role_clarity_canvas    # Own / Influence / Stop boundaries
  - evaluate_strategic_filter       # Framework for saying no
  - track_campaign_attribution      # What actually moved the needle

voice:
  gemini: en-US-Studio-Q
  style: energetic, creative, data-driven

key_insight: "Who are we actually for anymore?"
```

#### Diana - Underwriting Director 🤝
```yaml
color: emerald
expertise:
  - Corporate partnerships
  - Sponsorship sales
  - Rate optimization
  - Proposal development
  - ROI demonstration
  - Prospect research
  - Negotiation
  - Contract terms
  - Pipeline management and prioritization
  - Institutional sales knowledge
tools:
  # Original tools
  - research_prospect
  - generate_proposal
  - calculate_rates
  - create_media_kit

  # New tools from brainstorming (v2.0)
  - generate_listener_impact_survey   # Evidence/proof for sponsors
  - analyze_pipeline_intelligence     # Prioritized opportunities
  - generate_proposal_80_percent      # 80% complete proposals from templates
  - generate_renewal_brief            # Talking points for renewals
  - generate_call_prep_sheet          # One-pager before client meetings
  - generate_sales_playbook           # Institutional knowledge documentation
  - detect_engagement_decay           # When sponsor interaction drops off
  - analyze_competitive_intel         # What other stations/media are offering

voice:
  gemini: en-US-Studio-N
  style: professional, confident, consultative

key_insight: "Help me build the machine so I can stop being the machine."
```

#### Jordan - Program Director 🎙️
```yaml
color: violet
expertise:
  - Programming strategy
  - Schedule optimization
  - Content development
  - Audience research
  - Competitive analysis
  - Local content
  - Digital content
  - Podcast strategy
  - External partnership opportunities
  - Cross-department impact assessment
tools:
  # Original tools
  - analyze_schedule
  - research_competitors
  - generate_program_proposal
  - analyze_ratings

  # New tools from brainstorming (v2.0)
  - generate_consequence_preview      # Impact forecast before programming decisions
  - generate_show_profile             # Full cross-department show intelligence
  - tag_show_outcome                  # Classify: reach, conversion, brand, revenue plays
  - bridge_listener_supporter         # Connect anonymous streams to known donors
  - map_listening_journeys            # Patterns over time, not snapshots
  - attribute_conversion              # What did they listen to before giving?
  - assess_decision_confidence        # Green light vs. flags requiring conversation
  - manage_partnership_pipeline       # Track external partnership opportunities
  - generate_partner_profile          # Organization history, audience overlap, strategic fit
  - assess_partnership_value          # Upside analysis: audience, revenue, brand
  - manage_collaboration_calendar     # Partnership windows, scheduling conflicts
  - track_partnership_roi             # What did partnerships actually deliver?
  - check_cross_department_impact     # Does this affect Development, Marketing, Underwriting?

voice:
  gemini: en-US-Journey-D
  style: thoughtful, analytical, creative

key_insight: "I stop programming for audience. I start programming for outcome."
```

### 5.2 Claude Agent SDK Integration

#### Model Selection
- **Primary:** Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`)
  - Cost: ~$3/M input, $15/M output tokens
  - Best balance of capability and cost
  - Sufficient for most strategic tasks
  
- **Complex Analysis:** Claude Opus 4.5 (optional upgrade)
  - For board presentations, strategic plans
  - User-selectable or auto-escalation

#### SDK Configuration
```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

// Agent configuration
const agentConfig = {
  model: "claude-sonnet-4-5-20250929",
  max_tokens: 8192,
  temperature: 0.7, // Balanced creativity
  tools: [...], // Agent-specific tools
  system: buildSystemPrompt(agent, stationContext),
};
```

#### Tool Definitions
```typescript
const tools: Tool[] = [
  // Document tools
  {
    name: "search_station_documents",
    description: "Search station context documents for relevant information",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        category: { type: "string", enum: ["financials", "ratings", "operations", "content"] },
      },
      required: ["query"],
    },
  },
  
  // Generation tools
  {
    name: "generate_presentation",
    description: "Create a slide deck using Gamma API",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        outline: { type: "array", items: { type: "string" } },
        template: { type: "string", enum: ["board_update", "campaign_pitch", "strategic_plan"] },
      },
      required: ["title", "outline"],
    },
  },
  
  {
    name: "generate_chart",
    description: "Create a data visualization chart using Tremor",
    input_schema: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["line", "bar", "area", "donut", "stacked-bar"] },
        title: { type: "string" },
        description: { type: "string" },
        data: { type: "array", description: "Array of data objects" },
        config: {
          type: "object",
          properties: {
            index: { type: "string", description: "Key for x-axis/labels" },
            categories: { type: "array", items: { type: "string" }, description: "Keys for y-axis values" },
            colors: { type: "array", items: { type: "string" } },
            stack: { type: "boolean" },
          },
          required: ["index", "categories"],
        },
      },
      required: ["type", "title", "data", "config"],
    },
  },
  
  {
    name: "generate_kpi_dashboard",
    description: "Create a KPI card grid for metrics display",
    input_schema: {
      type: "object",
      properties: {
        kpis: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              metric: { type: "string" },
              delta: { type: "string" },
              deltaType: { type: "string", enum: ["increase", "decrease", "unchanged"] },
              progress: { type: "number", description: "0-100 for progress bar" },
              target: { type: "string" },
            },
            required: ["title", "metric"],
          },
        },
      },
      required: ["kpis"],
    },
  },
  
  {
    name: "generate_image",
    description: "Create marketing imagery using AI (Replicate/FLUX)",
    input_schema: {
      type: "object",
      properties: {
        prompt: { type: "string" },
        style: { type: "string", enum: ["photo", "illustration", "graphic", "artistic"] },
        dimensions: { type: "string", enum: ["square", "landscape", "portrait", "story", "banner"] },
      },
      required: ["prompt"],
    },
  },
];
```

### 5.3 Agent-Specific Chart Capabilities

Each agent has specialized chart generation patterns:

#### Sarah (Development) - Fundraising Charts
```typescript
// Example charts Sarah generates
const sarahCharts = {
  membershipTrends: {
    type: "area",
    title: "Membership Growth",
    data: [/* monthly data */],
    config: { index: "month", categories: ["members"], colors: ["emerald"] },
  },
  donationLevels: {
    type: "donut",
    title: "Giving Levels Distribution",
    data: [/* level breakdown */],
    config: { index: "level", categories: ["count"] },
  },
  campaignKPIs: [
    { title: "Total Raised (YTD)", metric: "$847,230", delta: "+12.3%", deltaType: "increase", progress: 72 },
    { title: "New Members", metric: "1,842", delta: "+8.7%", deltaType: "increase" },
    { title: "Retention Rate", metric: "78.4%", delta: "-2.1%", deltaType: "decrease" },
  ],
};
```

#### Marcus (Marketing) - Audience Charts
```typescript
const marcusCharts = {
  audienceByPlatform: {
    type: "bar",
    title: "Weekly Reach by Platform",
    data: [/* platform data */],
    config: { index: "platform", categories: ["reach", "engagement"], colors: ["blue", "cyan"] },
  },
  socialGrowth: {
    type: "line",
    title: "Social Media Follower Growth",
    data: [/* monthly data */],
    config: { index: "month", categories: ["instagram", "facebook", "tiktok"] },
  },
};
```

#### Diana (Underwriting) - Revenue Charts
```typescript
const dianaCharts = {
  revenueByCategory: {
    type: "stacked-bar",
    title: "Underwriting Revenue by Sector",
    data: [/* quarterly data */],
    config: { index: "quarter", categories: ["healthcare", "finance", "education"], stack: true },
  },
  pipelineProgress: {
    type: "bar",
    title: "Sales Pipeline by Stage",
    data: [/* stage data */],
    config: { index: "stage", categories: ["value"], colors: ["violet"] },
  },
};
```

#### Jordan (Programming) - Ratings Charts
```typescript
const jordanCharts = {
  ratingsByDaypart: {
    type: "bar",
    title: "AQH by Daypart",
    data: [/* daypart data */],
    config: { index: "daypart", categories: ["thisYear", "lastYear"], colors: ["emerald", "zinc"] },
  },
  contentPerformance: {
    type: "donut",
    title: "Streaming Hours by Content Type",
    data: [/* content data */],
    config: { index: "type", categories: ["hours"] },
  },
};
```

### 5.4 Multi-Agent Orchestration

#### Party Mode Flow
```
1. User submits topic/question
2. Orchestrator determines turn order based on topic
3. For each agent in order:
   a. Build context with prior responses
   b. Call Claude with agent persona
   c. Stream response to UI
   d. Store in conversation history
4. After all agents respond:
   a. Generate facilitator summary
   b. Extract action items
   c. Offer follow-up options
```

#### Turn Order Logic
```typescript
function determineTurnOrder(topic: string, selectedAgents: AgentId[]): AgentId[] {
  const topicKeywords = {
    sarah: ["fundraising", "donors", "campaign", "grants", "membership"],
    marcus: ["marketing", "brand", "social", "audience", "promotion"],
    diana: ["underwriting", "sponsors", "corporate", "partnership", "sales"],
    jordan: ["programming", "schedule", "content", "ratings", "shows"],
  };
  
  // Score each agent's relevance
  const scores = selectedAgents.map(agent => ({
    agent,
    score: topicKeywords[agent].filter(kw => 
      topic.toLowerCase().includes(kw)
    ).length,
  }));
  
  // Sort by relevance (most relevant first)
  return scores
    .sort((a, b) => b.score - a.score)
    .map(s => s.agent);
}
```

---

## 6. Tool Integrations

### 6.1 Gamma API - Presentation Generation

#### Purpose
Generate professional slide decks from agent conversations.

#### Integration
```typescript
// lib/integrations/gamma.ts
export class GammaClient {
  private apiKey: string;
  private baseUrl = "https://api.gamma.app/v1";
  
  async generatePresentation(params: {
    title: string;
    outline: string[];
    template?: string;
    branding?: {
      primaryColor: string;
      logo?: string;
    };
  }): Promise<GammaPresentation> {
    const response = await fetch(`${this.baseUrl}/presentations`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: params.title,
        slides: params.outline.map(point => ({
          type: "content",
          content: point,
        })),
        theme: params.template || "professional",
        branding: params.branding,
      }),
    });
    
    return response.json();
  }
  
  async exportToPptx(presentationId: string): Promise<Buffer> {
    const response = await fetch(
      `${this.baseUrl}/presentations/${presentationId}/export?format=pptx`,
      { headers: { "Authorization": `Bearer ${this.apiKey}` } }
    );
    return Buffer.from(await response.arrayBuffer());
  }
}
```

#### Agent Tool Handler
```typescript
async function handleGeneratePresentation(
  input: { title: string; outline: string[]; template?: string },
  context: AgentContext
): Promise<ToolResult> {
  const gamma = new GammaClient(process.env.GAMMA_API_KEY!);
  
  const presentation = await gamma.generatePresentation({
    title: input.title,
    outline: input.outline,
    template: input.template,
    branding: {
      primaryColor: context.station.brandColor,
      logo: context.station.logo,
    },
  });
  
  // Store reference in Convex
  await ctx.db.insert("generatedAssets", {
    type: "presentation",
    stationId: context.stationId,
    conversationId: context.conversationId,
    externalId: presentation.id,
    url: presentation.editUrl,
    title: input.title,
    createdAt: Date.now(),
  });
  
  return {
    success: true,
    message: `Created presentation "${input.title}"`,
    data: {
      editUrl: presentation.editUrl,
      viewUrl: presentation.viewUrl,
      slideCount: input.outline.length,
    },
  };
}
```

### 6.2 Replicate - Image Generation

#### Purpose
Generate marketing graphics, social media images, and campaign visuals.

#### Model Selection
- **FLUX 1.1 Pro** - High quality, fast generation
- **FLUX Schnell** - Quick drafts
- **Stable Diffusion XL** - Fallback option

#### Integration
```typescript
// lib/integrations/replicate.ts
import Replicate from "replicate";

export class ImageGenerator {
  private replicate: Replicate;
  
  constructor() {
    this.replicate = new Replicate({
      auth: process.env.REPLICATE_API_KEY!,
    });
  }
  
  async generate(params: {
    prompt: string;
    style: "photo" | "illustration" | "graphic";
    dimensions: "square" | "landscape" | "portrait" | "story";
    stationBranding?: {
      colors: string[];
      style: string;
    };
  }): Promise<string> {
    // Enhance prompt with style and branding
    const enhancedPrompt = this.buildPrompt(params);
    
    // Dimension mapping
    const dimensions = {
      square: { width: 1024, height: 1024 },
      landscape: { width: 1344, height: 768 },
      portrait: { width: 768, height: 1344 },
      story: { width: 1080, height: 1920 },
    };
    
    const output = await this.replicate.run(
      "black-forest-labs/flux-1.1-pro",
      {
        input: {
          prompt: enhancedPrompt,
          width: dimensions[params.dimensions].width,
          height: dimensions[params.dimensions].height,
          num_inference_steps: 28,
          guidance_scale: 3.5,
        },
      }
    );
    
    return output as string; // Returns image URL
  }
  
  private buildPrompt(params: Parameters<typeof this.generate>[0]): string {
    const styleModifiers = {
      photo: "professional photograph, high quality, realistic",
      illustration: "digital illustration, clean lines, modern",
      graphic: "graphic design, bold colors, minimal",
    };
    
    let prompt = `${params.prompt}, ${styleModifiers[params.style]}`;
    
    if (params.stationBranding) {
      prompt += `, color palette: ${params.stationBranding.colors.join(", ")}`;
    }
    
    // Safety: Add public radio context
    prompt += ", appropriate for public media, professional, inclusive";
    
    return prompt;
  }
}
```

#### Agent Tool Handler
```typescript
async function handleGenerateImage(
  input: { prompt: string; style: string; dimensions: string },
  context: AgentContext
): Promise<ToolResult> {
  const generator = new ImageGenerator();
  
  const imageUrl = await generator.generate({
    prompt: input.prompt,
    style: input.style as "photo" | "illustration" | "graphic",
    dimensions: input.dimensions as "square" | "landscape" | "portrait" | "story",
    stationBranding: {
      colors: [context.station.brandColor],
      style: "public radio, community-focused",
    },
  });
  
  // Upload to Convex storage for persistence
  const storageId = await uploadToConvex(imageUrl);
  
  // Store reference
  await ctx.db.insert("generatedAssets", {
    type: "image",
    stationId: context.stationId,
    conversationId: context.conversationId,
    storageId,
    url: imageUrl,
    prompt: input.prompt,
    createdAt: Date.now(),
  });
  
  return {
    success: true,
    message: "Generated image",
    data: {
      url: imageUrl,
      storageId,
    },
  };
}
```

### 6.3 Google Workspace Integration

#### Purpose
- Import existing station documents from Google Drive
- Export generated reports and presentations to Drive
- Sync with Google Sheets for data analysis

#### OAuth Setup
```typescript
// lib/integrations/google.ts
import { google } from "googleapis";

export class GoogleWorkspaceClient {
  private oauth2Client;
  
  constructor(accessToken: string) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    this.oauth2Client.setCredentials({ access_token: accessToken });
  }
  
  // Google Drive
  async listFiles(folderId?: string): Promise<DriveFile[]> {
    const drive = google.drive({ version: "v3", auth: this.oauth2Client });
    
    const response = await drive.files.list({
      q: folderId 
        ? `'${folderId}' in parents and trashed = false`
        : "trashed = false",
      fields: "files(id, name, mimeType, modifiedTime, size)",
      pageSize: 100,
    });
    
    return response.data.files || [];
  }
  
  async importFile(fileId: string): Promise<{ content: string; mimeType: string }> {
    const drive = google.drive({ version: "v3", auth: this.oauth2Client });
    
    // Get file metadata
    const metadata = await drive.files.get({ fileId, fields: "mimeType" });
    const mimeType = metadata.data.mimeType!;
    
    // Handle Google Docs/Sheets/Slides
    if (mimeType.includes("google-apps")) {
      const exportMimeType = this.getExportMimeType(mimeType);
      const response = await drive.files.export(
        { fileId, mimeType: exportMimeType },
        { responseType: "text" }
      );
      return { content: response.data as string, mimeType: exportMimeType };
    }
    
    // Handle regular files
    const response = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "arraybuffer" }
    );
    
    const content = Buffer.from(response.data as ArrayBuffer).toString("utf-8");
    return { content, mimeType };
  }
  
  async exportFile(params: {
    name: string;
    content: string;
    mimeType: string;
    folderId?: string;
  }): Promise<string> {
    const drive = google.drive({ version: "v3", auth: this.oauth2Client });
    
    const response = await drive.files.create({
      requestBody: {
        name: params.name,
        mimeType: params.mimeType,
        parents: params.folderId ? [params.folderId] : undefined,
      },
      media: {
        mimeType: params.mimeType,
        body: params.content,
      },
      fields: "id, webViewLink",
    });
    
    return response.data.webViewLink!;
  }
  
  // Google Sheets
  async readSheet(spreadsheetId: string, range: string): Promise<any[][]> {
    const sheets = google.sheets({ version: "v4", auth: this.oauth2Client });
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    
    return response.data.values || [];
  }
  
  async writeSheet(spreadsheetId: string, range: string, values: any[][]): Promise<void> {
    const sheets = google.sheets({ version: "v4", auth: this.oauth2Client });
    
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });
  }
  
  private getExportMimeType(googleMimeType: string): string {
    const exportMap: Record<string, string> = {
      "application/vnd.google-apps.document": "text/markdown",
      "application/vnd.google-apps.spreadsheet": "text/csv",
      "application/vnd.google-apps.presentation": "application/pdf",
    };
    return exportMap[googleMimeType] || "text/plain";
  }
}
```

#### Agent Tools
```typescript
const googleWorkspaceTools: Tool[] = [
  {
    name: "import_from_drive",
    description: "Import a document from Google Drive for context",
    input_schema: {
      type: "object",
      properties: {
        fileId: { type: "string", description: "Google Drive file ID" },
        category: { type: "string", enum: ["financials", "ratings", "operations", "content"] },
      },
      required: ["fileId"],
    },
  },
  {
    name: "export_to_drive",
    description: "Save a generated report or document to Google Drive",
    input_schema: {
      type: "object",
      properties: {
        content: { type: "string", description: "Document content (markdown)" },
        name: { type: "string", description: "File name" },
        format: { type: "string", enum: ["doc", "pdf", "sheet"] },
        folderId: { type: "string", description: "Destination folder ID (optional)" },
      },
      required: ["content", "name"],
    },
  },
  {
    name: "read_spreadsheet",
    description: "Read data from a Google Sheet for analysis",
    input_schema: {
      type: "object",
      properties: {
        spreadsheetId: { type: "string" },
        range: { type: "string", description: "A1 notation range (e.g., 'Sheet1!A1:D10')" },
      },
      required: ["spreadsheetId", "range"],
    },
  },
];
```

---

## 7. Dynamic UI System

### 7.1 Architecture Decision

**Chosen Approach: Vercel AI SDK + Tremor + Custom React Components**

#### Why Tremor over Raw Recharts?
- Built ON TOP of Recharts with pre-styled components
- Native dark mode support (matches our zinc-900 theme)
- Dashboard-ready: KPI cards, metrics, trackers included
- 50% less code than raw Recharts
- Tailwind-native styling

#### Why Not CopilotKit?
- CopilotKit is opinionated about UI structure
- Limited customization for our dark theme
- Adds complexity without significant benefit for our use case

#### Why Not Thesys?
- Still in early development
- Less community support
- Our component needs are well-defined

#### Our Approach
- Use Vercel AI SDK for streaming and tool handling
- Use Tremor for charts, KPIs, and dashboard components
- Define explicit UI components for each tool output
- Server-side rendering of component data
- Client-side rendering with Framer Motion

### 7.2 Component Types

#### Chart Component (Tremor)
```typescript
// components/ui/TremorCharts.tsx
"use client";

import {
  AreaChart,
  BarChart,
  DonutChart,
  LineChart,
  Card,
  Metric,
  Text,
  Flex,
  ProgressBar,
  BadgeDelta,
  Grid,
  Title,
} from "@tremor/react";
import { motion } from "framer-motion";

export interface ChartData {
  type: "line" | "bar" | "area" | "donut" | "stacked-bar";
  title: string;
  description?: string;
  data: Record<string, any>[];
  config: {
    index: string; // x-axis key (Tremor terminology)
    categories: string[]; // y-axis keys
    colors?: ("blue" | "emerald" | "amber" | "rose" | "violet" | "cyan")[];
    valueFormatter?: (value: number) => string;
    showLegend?: boolean;
    stack?: boolean;
  };
}

export function DynamicChart({ chart }: { chart: ChartData }) {
  const colors = chart.config.colors || ["blue", "emerald", "amber", "rose"];
  const valueFormatter = chart.config.valueFormatter || ((v) => v.toLocaleString());

  const commonProps = {
    data: chart.data,
    index: chart.config.index,
    categories: chart.config.categories,
    colors: colors,
    valueFormatter: valueFormatter,
    showLegend: chart.config.showLegend ?? true,
    className: "h-72",
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="bg-zinc-900/50 ring-1 ring-zinc-800">
        <Title className="text-white">{chart.title}</Title>
        {chart.description && (
          <Text className="text-zinc-400">{chart.description}</Text>
        )}
        <div className="mt-4">
          {chart.type === "line" && <LineChart {...commonProps} />}
          {chart.type === "bar" && <BarChart {...commonProps} />}
          {chart.type === "area" && <AreaChart {...commonProps} />}
          {chart.type === "donut" && (
            <DonutChart
              data={chart.data}
              index={chart.config.index}
              category={chart.config.categories[0]}
              colors={colors}
              valueFormatter={valueFormatter}
              className="h-72"
            />
          )}
          {chart.type === "stacked-bar" && <BarChart {...commonProps} stack />}
        </div>
      </Card>
    </motion.div>
  );
}
```

#### KPI Card Component (Tremor)
```typescript
// components/ui/TremorCharts.tsx (continued)

export interface KPIData {
  title: string;
  metric: string | number;
  delta?: string;
  deltaType?: "increase" | "decrease" | "unchanged";
  progress?: number;
  target?: string;
  trend?: number[]; // Sparkline data
}

export function KPICard({ kpi }: { kpi: KPIData }) {
  return (
    <Card className="bg-zinc-900/50 ring-1 ring-zinc-800" decoration="top" decorationColor="blue">
      <Flex alignItems="start">
        <div>
          <Text className="text-zinc-400">{kpi.title}</Text>
          <Metric className="text-white">{kpi.metric}</Metric>
        </div>
        {kpi.delta && (
          <BadgeDelta deltaType={kpi.deltaType || "unchanged"} size="sm">
            {kpi.delta}
          </BadgeDelta>
        )}
      </Flex>

      {kpi.progress !== undefined && (
        <div className="mt-4">
          <Flex>
            <Text className="text-zinc-400">Progress</Text>
            <Text className="text-zinc-400">{kpi.target}</Text>
          </Flex>
          <ProgressBar value={kpi.progress} className="mt-2" />
        </div>
      )}

      {kpi.trend && (
        <AreaChart
          data={kpi.trend.map((value, i) => ({ index: i, value }))}
          index="index"
          categories={["value"]}
          colors={[kpi.deltaType === "decrease" ? "rose" : "emerald"]}
          showXAxis={false}
          showYAxis={false}
          showLegend={false}
          className="mt-4 h-12"
        />
      )}
    </Card>
  );
}

export function KPIGrid({ kpis }: { kpis: KPIData[] }) {
  return (
    <Grid numItemsSm={2} numItemsLg={4} className="gap-4">
      {kpis.map((kpi, i) => (
        <KPICard key={i} kpi={kpi} />
      ))}
    </Grid>
  );
}
```

#### Revenue Breakdown Component
```typescript
// Specialized component for common fundraising visualization

export function RevenueBreakdown({
  data,
  title = "Revenue Breakdown",
}: {
  data: { source: string; amount: number; change?: number }[];
  title?: string;
}) {
  const total = data.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card className="bg-zinc-900/50 ring-1 ring-zinc-800">
      <Title className="text-white">{title}</Title>
      <Metric className="text-white mt-2">${total.toLocaleString()}</Metric>

      <DonutChart
        data={data.map((item) => ({ name: item.source, value: item.amount }))}
        index="name"
        category="value"
        colors={["blue", "emerald", "amber", "rose", "violet", "cyan"]}
        valueFormatter={(v) => `$${v.toLocaleString()}`}
        className="mt-6 h-52"
      />

      <div className="mt-6 space-y-2">
        {data.map((item) => (
          <Flex key={item.source}>
            <Text className="text-zinc-300">{item.source}</Text>
            <div className="flex items-center gap-2">
              <Text className="text-white font-medium">
                ${item.amount.toLocaleString()}
              </Text>
              {item.change !== undefined && (
                <BadgeDelta
                  deltaType={item.change >= 0 ? "increase" : "decrease"}
                  size="xs"
                >
                  {item.change >= 0 ? "+" : ""}{item.change}%
                </BadgeDelta>
              )}
            </div>
          </Flex>
        ))}
      </div>
    </Card>
  );
}
```

#### Presentation Preview
```typescript
// components/ui/PresentationPreview.tsx
"use client";

import { motion } from "framer-motion";
import { ExternalLink, Download, Edit } from "lucide-react";

interface PresentationData {
  title: string;
  editUrl: string;
  viewUrl: string;
  slideCount: number;
  thumbnail?: string;
}

export function PresentationPreview({ presentation }: { presentation: PresentationData }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 p-4 ring-1 ring-violet-500/30"
    >
      <div className="flex items-start gap-4">
        {/* Thumbnail */}
        <div className="h-20 w-32 rounded-lg bg-zinc-800 flex items-center justify-center">
          {presentation.thumbnail ? (
            <img
              src={presentation.thumbnail}
              alt={presentation.title}
              className="h-full w-full object-cover rounded-lg"
            />
          ) : (
            <span className="text-3xl">📊</span>
          )}
        </div>
        
        {/* Info */}
        <div className="flex-1">
          <h4 className="font-medium text-white">{presentation.title}</h4>
          <p className="text-sm text-zinc-400">{presentation.slideCount} slides</p>
          
          {/* Actions */}
          <div className="mt-3 flex gap-2">
            <a
              href={presentation.editUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20"
            >
              <Edit size={12} />
              Edit in Gamma
            </a>
            <a
              href={presentation.viewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20"
            >
              <ExternalLink size={12} />
              View
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
```

#### Image Preview
```typescript
// components/ui/ImagePreview.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Copy, Maximize2 } from "lucide-react";
import { copyToClipboard } from "@/lib/utils";

interface ImageData {
  url: string;
  prompt: string;
  style: string;
  dimensions: string;
}

export function ImagePreview({ image }: { image: ImageData }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    await copyToClipboard(image.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl bg-zinc-800/50 p-4"
      >
        {/* Image */}
        <div
          className="relative cursor-pointer overflow-hidden rounded-lg"
          onClick={() => setIsExpanded(true)}
        >
          <img
            src={image.url}
            alt={image.prompt}
            className="w-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity hover:opacity-100">
            <Maximize2 className="text-white" size={24} />
          </div>
        </div>
        
        {/* Info */}
        <p className="mt-2 text-xs text-zinc-400 line-clamp-2">{image.prompt}</p>
        
        {/* Actions */}
        <div className="mt-3 flex gap-2">
          <a
            href={image.url}
            download
            className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20"
          >
            <Download size={12} />
            Download
          </a>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20"
          >
            <Copy size={12} />
            {copied ? "Copied!" : "Copy URL"}
          </button>
        </div>
      </motion.div>
      
      {/* Expanded Modal */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-8"
          onClick={() => setIsExpanded(false)}
        >
          <img
            src={image.url}
            alt={image.prompt}
            className="max-h-full max-w-full object-contain"
          />
        </motion.div>
      )}
    </>
  );
}
```

### 7.3 Message Rendering with Dynamic UI

```typescript
// components/chat/MessageContent.tsx
"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { DynamicChart, KPIGrid, KPIData, ChartData } from "@/components/ui/TremorCharts";
import { PresentationPreview, PresentationData } from "@/components/ui/PresentationPreview";
import { ImagePreview, ImageData } from "@/components/ui/ImagePreview";
import { DocumentCard, DocumentData } from "@/components/ui/DocumentCard";

interface MessageContentProps {
  content: string;
  attachments?: Attachment[];
}

type Attachment = 
  | { type: "chart"; data: ChartData }
  | { type: "kpis"; data: KPIData[] }
  | { type: "presentation"; data: PresentationData }
  | { type: "image"; data: ImageData }
  | { type: "document"; data: DocumentData };

export function MessageContent({ content, attachments }: MessageContentProps) {
  return (
    <div className="space-y-4">
      {/* Markdown Content */}
      <div className="prose prose-invert prose-sm max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      </div>
      
      {/* Dynamic UI Attachments */}
      {attachments && attachments.length > 0 && (
        <div className="grid gap-4">
          {attachments.map((attachment, i) => (
            <div key={i}>
              {attachment.type === "chart" && (
                <DynamicChart chart={attachment.data} />
              )}
              {attachment.type === "kpis" && (
                <KPIGrid kpis={attachment.data} />
              )}
              {attachment.type === "presentation" && (
                <PresentationPreview presentation={attachment.data} />
              )}
              {attachment.type === "image" && (
                <ImagePreview image={attachment.data} />
              )}
              {attachment.type === "document" && (
                <DocumentCard document={attachment.data} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 7.4 Tool Result Processing

```typescript
// lib/agents/toolProcessor.ts

import { ChartData, KPIData } from "@/components/ui/TremorCharts";

export function processToolResult(
  toolName: string,
  result: any
): { content: string; attachment?: Attachment } {
  switch (toolName) {
    case "generate_chart":
      return {
        content: `Here's the ${result.type} chart showing ${result.title}:`,
        attachment: {
          type: "chart",
          data: result as ChartData,
        },
      };
    
    case "generate_kpi_dashboard":
      return {
        content: `Here are the key metrics:`,
        attachment: {
          type: "kpis",
          data: result.kpis as KPIData[],
        },
      };
      
    case "generate_presentation":
      return {
        content: `I've created a presentation "${result.title}" with ${result.slideCount} slides.`,
        attachment: {
          type: "presentation",
          data: result,
        },
      };
      
    case "generate_image":
      return {
        content: "Here's the generated image:",
        attachment: {
          type: "image",
          data: result,
        },
      };
      
    case "search_station_documents":
      return {
        content: result.summary,
        attachment: result.documents?.length > 0 ? {
          type: "document",
          data: result.documents[0],
        } : undefined,
      };
      
    default:
      return { content: JSON.stringify(result) };
  }
}
```

### 7.5 Party Mode Dashboard Generation

When agents collaborate in Party Mode, they can collectively build a dashboard:

```typescript
// Example: Party Mode generates a station health dashboard
const partyModeOutput = {
  title: "Station Health Dashboard - Q4 2024",
  agents: ["sarah", "marcus", "diana", "jordan"],
  sections: [
    {
      agent: "sarah",
      title: "Fundraising Performance",
      outputs: [
        { type: "kpis", data: [/* campaign metrics */] },
        { type: "chart", data: { type: "area", title: "Membership Trends", /* ... */ } },
      ],
    },
    {
      agent: "marcus", 
      title: "Audience Growth",
      outputs: [
        { type: "chart", data: { type: "bar", title: "Platform Reach", /* ... */ } },
      ],
    },
    {
      agent: "diana",
      title: "Underwriting Revenue",
      outputs: [
        { type: "chart", data: { type: "stacked-bar", title: "Revenue by Sector", /* ... */ } },
      ],
    },
    {
      agent: "jordan",
      title: "Programming Performance", 
      outputs: [
        { type: "chart", data: { type: "bar", title: "Ratings by Daypart", /* ... */ } },
      ],
    },
  ],
};
```

---

## 8. Technical Architecture

### 8.1 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Voxcast                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Next.js   │  │    Clerk    │  │      Convex             │ │
│  │  App Router │  │    Auth     │  │  (Database + Functions) │ │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ │
│         │                │                      │                │
│         └────────────────┼──────────────────────┘                │
│                          │                                       │
│  ┌───────────────────────┴───────────────────────────────────┐  │
│  │                    API Routes Layer                        │  │
│  │  /api/agents/stream  /api/voice/*  /api/documents/*       │  │
│  └───────────────────────┬───────────────────────────────────┘  │
│                          │                                       │
│  ┌───────────────────────┴───────────────────────────────────┐  │
│  │                  Agent Orchestration                       │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐         │  │
│  │  │  Sarah  │ │  Marcus │ │  Diana  │ │  Jordan │         │  │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘         │  │
│  │       └───────────┼───────────┼───────────┘               │  │
│  │                   │           │                            │  │
│  │            ┌──────┴───────────┴──────┐                    │  │
│  │            │   Claude Sonnet 4.5     │                    │  │
│  │            │   (Anthropic API)       │                    │  │
│  │            └─────────────────────────┘                    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    External Services                       │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐         │  │
│  │  │  Gamma  │ │Replicate│ │ Google  │ │ OpenAI  │         │  │
│  │  │  (PPT)  │ │ (Images)│ │Workspace│ │(Vectors)│         │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 15 | App Router, Server Components, Streaming |
| **Styling** | Tailwind CSS + Framer Motion | Dark theme, animations |
| **Charts/Dashboard** | Tremor | Pre-styled charts, KPIs, metrics |
| **State** | React hooks + Convex reactive | Real-time updates |
| **Auth** | Clerk | Multi-tenant, organizations |
| **Database** | Convex | Real-time, serverless, vector search |
| **AI** | Claude Sonnet 4.5 | Agent conversations |
| **Embeddings** | OpenAI text-embedding-3-small | Document search |
| **TTS** | Google Cloud TTS (Gemini voices) | Voice mode |
| **Voice Input** | OpenAI Realtime API | Voice conversations |
| **Presentations** | Gamma API | Slide generation |
| **Images** | Replicate (FLUX) | Marketing graphics |
| **Storage** | Convex Storage + Google Drive | Files |

### 8.3 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Vercel                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Next.js    │  │   Edge      │  │    Serverless      │ │
│  │  Frontend   │  │  Functions  │  │    Functions       │ │
│  │  (Static)   │  │  (Auth)     │  │  (API Routes)      │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└───────────────────────────┬─────────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
       ┌──────────┐  ┌──────────┐  ┌──────────┐
       │  Convex  │  │  Clerk   │  │ External │
       │  Cloud   │  │  Cloud   │  │  APIs    │
       └──────────┘  └──────────┘  └──────────┘
```

### 8.4 Environment Variables

```bash
# Core
NEXT_PUBLIC_APP_URL=https://stationconsole.ai
NODE_ENV=production

# Convex
NEXT_PUBLIC_CONVEX_URL=https://xxx.convex.cloud
CONVEX_DEPLOY_KEY=xxx

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx

# AI
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-xxx

# Voice
GOOGLE_API_KEY=xxx

# Integrations
GAMMA_API_KEY=xxx
REPLICATE_API_KEY=xxx
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
```

---

## 9. Data Model

### 9.1 Core Entities

```typescript
// convex/schema.ts

// Stations (Tenants)
stations: defineTable({
  name: v.string(),
  slug: v.string(),
  clerkOrgId: v.string(),
  callLetters: v.optional(v.string()),
  market: v.optional(v.string()),
  logo: v.optional(v.string()),
  settings: v.object({
    defaultAgents: v.array(v.string()),
    voiceEnabled: v.boolean(),
    brandColor: v.string(),
    partyModeEnabled: v.boolean(),
  }),
  // Subscription
  subscription: v.union(
    v.literal("free"),
    v.literal("pro"),
    v.literal("enterprise")
  ),
  messageQuota: v.number(), // -1 = unlimited
  messagesUsed: v.number(),
  quotaResetDate: v.number(),
  // Billing
  stripeCustomerId: v.optional(v.string()),
  stripeSubscriptionId: v.optional(v.string()),
  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
})

// Users
users: defineTable({
  clerkUserId: v.string(),
  stationId: v.id("stations"),
  email: v.string(),
  name: v.string(),
  avatar: v.optional(v.string()),
  role: v.union(
    v.literal("admin"),
    v.literal("manager"),
    v.literal("staff")
  ),
  // Google Workspace (optional)
  googleAccessToken: v.optional(v.string()),
  googleRefreshToken: v.optional(v.string()),
  googleTokenExpiry: v.optional(v.number()),
  // Timestamps
  lastActiveAt: v.number(),
  createdAt: v.number(),
})

// Conversations
conversations: defineTable({
  stationId: v.id("stations"),
  userId: v.id("users"),
  title: v.string(),
  mode: v.union(
    v.literal("single"),
    v.literal("party"),
    v.literal("voice")
  ),
  agents: v.array(v.string()),
  // Status
  status: v.union(
    v.literal("active"),
    v.literal("archived")
  ),
  // Timestamps
  lastMessageAt: v.number(),
  createdAt: v.number(),
})

// Messages
messages: defineTable({
  conversationId: v.id("conversations"),
  role: v.union(
    v.literal("user"),
    v.literal("assistant"),
    v.literal("system")
  ),
  agentId: v.optional(v.string()),
  content: v.string(),
  // Attachments (charts, images, presentations)
  attachments: v.optional(v.array(v.object({
    type: v.string(),
    data: v.any(),
  }))),
  // Voice
  audioUrl: v.optional(v.string()),
  // Tool usage
  toolCalls: v.optional(v.array(v.object({
    name: v.string(),
    input: v.any(),
    result: v.any(),
  }))),
  // Timestamps
  createdAt: v.number(),
})

// Documents
documents: defineTable({
  stationId: v.id("stations"),
  uploadedBy: v.id("users"),
  name: v.string(),
  type: v.string(), // pdf, docx, csv, etc.
  category: v.union(
    v.literal("financials"),
    v.literal("ratings"),
    v.literal("operations"),
    v.literal("content"),
    v.literal("other")
  ),
  // Storage
  storageId: v.optional(v.id("_storage")),
  googleDriveId: v.optional(v.string()),
  // Processing
  status: v.union(
    v.literal("pending"),
    v.literal("processing"),
    v.literal("ready"),
    v.literal("error")
  ),
  chunkCount: v.optional(v.number()),
  // Timestamps
  createdAt: v.number(),
  processedAt: v.optional(v.number()),
})

// Document Chunks (for vector search)
documentChunks: defineTable({
  documentId: v.id("documents"),
  stationId: v.id("stations"),
  content: v.string(),
  embedding: v.array(v.float64()), // 1536 dimensions
  chunkIndex: v.number(),
  metadata: v.object({
    pageNumber: v.optional(v.number()),
    section: v.optional(v.string()),
  }),
})

// Generated Assets
generatedAssets: defineTable({
  stationId: v.id("stations"),
  conversationId: v.id("conversations"),
  type: v.union(
    v.literal("presentation"),
    v.literal("image"),
    v.literal("report"),
    v.literal("chart")
  ),
  // External references
  externalId: v.optional(v.string()), // Gamma ID, etc.
  storageId: v.optional(v.id("_storage")),
  url: v.string(),
  // Metadata
  title: v.optional(v.string()),
  prompt: v.optional(v.string()),
  // Timestamps
  createdAt: v.number(),
})
```

### 9.2 Indexes

```typescript
// Station lookups
.index("by_clerk_org", ["clerkOrgId"])
.index("by_slug", ["slug"])

// User lookups
.index("by_clerk_user", ["clerkUserId"])
.index("by_station", ["stationId"])
.index("by_email", ["email"])

// Conversation lookups
.index("by_station", ["stationId"])
.index("by_user", ["userId"])
.index("by_station_recent", ["stationId", "lastMessageAt"])

// Message lookups
.index("by_conversation", ["conversationId"])
.index("by_conversation_time", ["conversationId", "createdAt"])

// Document lookups
.index("by_station", ["stationId"])
.index("by_station_category", ["stationId", "category"])

// Vector search index
documentChunks
  .vectorIndex("by_embedding", {
    vectorField: "embedding",
    dimensions: 1536,
    filterFields: ["stationId"],
  })
```

---

## 10. API Specifications

### 10.1 Agent Streaming API

```typescript
// POST /api/agents/stream
// Streams agent responses with tool results

interface AgentStreamRequest {
  conversationId: string;
  stationId: string;
  prompt: string;
  agents: string[]; // ["sarah", "marcus", etc.]
  mode: "single" | "party";
}

// Response: Server-Sent Events stream
// Event types:
// - { type: "agent_start", agentId, agentName }
// - { type: "text", agentId, content }
// - { type: "tool_call", agentId, toolName, input }
// - { type: "tool_result", agentId, toolName, result }
// - { type: "attachment", agentId, attachment }
// - { type: "agent_end", agentId }
// - { type: "done" }
// - { type: "error", error }
```

### 10.2 Voice API

```typescript
// GET /api/voice/realtime-token
// Returns OpenAI Realtime API session token

interface RealtimeTokenResponse {
  token: string;
  expiresAt: number;
}

// POST /api/voice/tts
// Generate speech from text

interface TTSRequest {
  text: string;
  agentId: string;
}

interface TTSResponse {
  audioUrl: string;
  duration: number;
}
```

### 10.3 Document API

```typescript
// POST /api/documents/upload-url
// Get presigned URL for upload

interface UploadUrlRequest {
  fileName: string;
  contentType: string;
}

interface UploadUrlResponse {
  uploadUrl: string;
  storageId: string;
}

// POST /api/documents/process
// Trigger document processing

interface ProcessRequest {
  documentId: string;
}

// GET /api/documents/search
// Semantic search over documents

interface SearchRequest {
  stationId: string;
  query: string;
  category?: string;
  limit?: number;
}

interface SearchResponse {
  results: {
    documentId: string;
    documentName: string;
    content: string;
    score: number;
  }[];
}
```

### 10.4 Integration APIs

```typescript
// POST /api/integrations/gamma/create
// Create presentation via Gamma

interface GammaCreateRequest {
  title: string;
  outline: string[];
  template?: string;
}

interface GammaCreateResponse {
  presentationId: string;
  editUrl: string;
  viewUrl: string;
}

// POST /api/integrations/replicate/generate
// Generate image via Replicate

interface ReplicateGenerateRequest {
  prompt: string;
  style: "photo" | "illustration" | "graphic";
  dimensions: "square" | "landscape" | "portrait" | "story";
}

interface ReplicateGenerateResponse {
  imageUrl: string;
  storageId: string;
}

// GET /api/integrations/google/files
// List Google Drive files

// POST /api/integrations/google/import
// Import file from Google Drive

// POST /api/integrations/google/export
// Export to Google Drive
```

---

## 11. Security & Compliance

### 11.1 Authentication & Authorization

- **Clerk Authentication:** SSO, MFA support, organization management
- **Role-Based Access:**
  - Admin: Full access, billing, team management
  - Manager: Conversations, documents, settings
  - Staff: Conversations only
- **API Key Management:** For enterprise API access
- **Session Management:** 24-hour sessions, refresh tokens

### 11.2 Data Security

- **Encryption at Rest:** Convex encrypted storage
- **Encryption in Transit:** TLS 1.3
- **Multi-Tenancy:** Strict station ID scoping
- **Data Isolation:** Separate vector indexes per station
- **Audit Logging:** All admin actions logged

### 11.3 AI Safety

- **Content Filtering:** No harmful content generation
- **Prompt Injection Protection:** System prompt hardening
- **Output Validation:** Sanitize generated content
- **Rate Limiting:** Per-user and per-station limits
- **Human Oversight:** All AI outputs clearly labeled

### 11.4 Compliance

- **SOC 2 Type II:** Via Convex and Clerk
- **GDPR Ready:** Data export, deletion capabilities
- **CCPA Compliant:** Privacy policy, opt-out
- **Accessibility:** WCAG 2.1 AA target

---

## 12. Pricing Strategy

### 12.1 Tier Structure

| Feature | Free | Pro ($49/mo) | Enterprise |
|---------|------|--------------|------------|
| **Agents** | All 4 | All 4 | All 4 + Custom |
| **Party Mode** | ✅ | ✅ | ✅ |
| **Messages/month** | 50 | Unlimited | Unlimited |
| **Team Members** | 1 | 5 | Unlimited |
| **Voice Mode** | ❌ | ✅ | ✅ |
| **Document Uploads** | ❌ | 100 docs | Unlimited |
| **Deck Generation** | ❌ | 10/mo | Unlimited |
| **Image Generation** | ❌ | 50/mo | Unlimited |
| **Google Workspace** | ❌ | ✅ | ✅ |
| **Audio Discussions** | ❌ | 5/mo | Unlimited |
| **API Access** | ❌ | ❌ | ✅ |
| **SSO/SAML** | ❌ | ❌ | ✅ |
| **Priority Support** | ❌ | ✅ | ✅ |
| **Custom Training** | ❌ | ❌ | ✅ |

### 12.2 Cost Analysis

| Component | Cost/Unit | Free Tier | Pro Tier |
|-----------|-----------|-----------|----------|
| Claude Sonnet 4.5 | ~$0.01/msg | $0.50/mo | $5/mo (500 msgs) |
| OpenAI Embeddings | $0.02/1M tokens | $0.01/mo | $0.10/mo |
| Gamma API | ~$0.50/deck | $0 | $5/mo (10 decks) |
| Replicate (FLUX) | ~$0.02/image | $0 | $1/mo (50 images) |
| Google TTS | ~$0.004/1K chars | $0 | $2/mo |
| Convex | $0 (dev) | $0 | $25/mo |
| **Total Cost** | | **~$0.50/mo** | **~$38/mo** |
| **Margin** | | N/A | **~22%** |

### 12.3 Growth Strategy

1. **Freemium Conversion:** 5-10% target conversion rate
2. **Annual Discount:** 20% off ($39/mo billed annually)
3. **Volume Discount:** Enterprise negotiated
4. **Partner Program:** NPR, CPB distribution
5. **White Label:** Consulting firm licensing

---

## 13. Success Metrics

### 13.1 Business Metrics

| Metric | Target (6 mo) | Target (12 mo) |
|--------|---------------|----------------|
| Total Stations | 100 | 500 |
| Paid Stations | 10 | 75 |
| MRR | $500 | $3,750 |
| Free-to-Paid Conversion | 5% | 15% |
| Churn Rate | <10% | <5% |

### 13.2 Product Metrics

| Metric | Target |
|--------|--------|
| Messages/Station/Week | 20+ |
| Session Duration | 10+ min |
| Party Mode Usage | 30% of sessions |
| Document Uploads/Station | 5+ |
| Deck Generation/Station/Mo | 2+ |
| Weekly Active Users | 60%+ |
| NPS Score | 50+ |

### 13.3 Technical Metrics

| Metric | Target |
|--------|--------|
| Response Latency (p50) | <2s |
| Response Latency (p95) | <5s |
| Uptime | 99.9% |
| Error Rate | <1% |
| Voice Latency | <500ms |

---

## 14. Roadmap

> **Note:** Roadmap updated January 8, 2026 based on brainstorming session findings. New priorities reflect user research insights.

### Phase 1: Foundation (Q1 2025) ✅
- [x] Core chat interface
- [x] Four agent definitions
- [x] Convex database schema
- [x] Clerk authentication
- [x] Dark theme UI
- [ ] Basic document upload
- [ ] Single agent mode
- [ ] Party mode

### Phase 2: Intelligence Layer (Q2 2025)
- [ ] RAG document search
- [ ] Tremor chart generation (line, bar, area, donut, KPIs)
- [ ] Gamma presentation integration
- [ ] Replicate image generation (FLUX)
- [ ] Google Workspace import/export
- [ ] Usage quotas and billing

### Phase 3: Station Pulse (Q3 2025) — NEW PRIORITY
> *"I don't need dashboards. I need to know what's about to break before it breaks."*

**P0: Station Pulse Architecture**
- [ ] Cross-agent signal taxonomy and data model
- [ ] Signal correlation engine
- [ ] Daily Briefing generation (scheduled functions)
- [ ] Collision detection for 5 identified types
- [ ] Momentum and decay tracking algorithms
- [ ] Shared knowledge graph accessible to all agents

**P1: Prep Briefs System (Universal)**
- [ ] 60-Second Donor Prep (Sarah)
- [ ] Call Prep Sheets (Diana)
- [ ] Event Intelligence Dashboard (Sarah)
- [ ] Consequence Preview (Jordan)
- [ ] Brief trigger logic and templates

**P1: Consequence Preview (Programming)**
- [ ] Show Profile data structure
- [ ] Cross-department data aggregation (donors, sponsors, grants)
- [ ] Risk assessment algorithm
- [ ] "Flag for conversation" workflow

### Phase 4: Role-Specific Tools (Q4 2025)

**Development (Sarah) — Events & Retention**
- [ ] Quiet Attrition Detection
- [ ] Living Narrative Library
- [ ] Relationship Momentum Scores
- [ ] Event ROI Tracking
- [ ] Post-Event Follow-up Queue
- [ ] Event-to-Gift Attribution

**Underwriting (Diana) — Pipeline & Evidence**
- [ ] Pipeline Intelligence (prioritization)
- [ ] Proposal Generator (80% complete)
- [ ] Renewal Briefs
- [ ] Listener Impact Survey System
- [ ] Engagement Decay Alerts

**Marketing (Marcus) — Audience & Strategy**
- [ ] Audience Reality Map
- [ ] Journey Intelligence
- [ ] Channel Efficiency Analysis
- [ ] Role Clarity Canvas
- [ ] Campaign Impact Attribution

**Programming (Jordan) — Partnerships & Outcomes**
- [ ] Partnership Pipeline
- [ ] Partner Profile & Value Assessment
- [ ] Show Outcome Tagging
- [ ] Collaboration Calendar
- [ ] Cross-Department Impact Check

### Phase 5: Voice & Scale (2026)
- [ ] Voice mode (Gemini TTS)
- [ ] OpenAI Realtime integration
- [ ] Enterprise features & API access
- [ ] Mobile-responsive UI
- [ ] Listener-Supporter Bridge (Moonshot)
- [ ] Full Journey Intelligence (Moonshot)

### Priority Framework

| Priority | Description | Examples |
|----------|-------------|----------|
| **P0** | Architectural foundation | Station Pulse signal layer |
| **P1** | Universal high-value | Prep Briefs, Consequence Preview |
| **P2** | Role-specific tools | Pipeline Intelligence, Attrition Detection |
| **P3** | Future innovations | Audience Reality Map, Living Narrative |
| **P4** | Moonshots | Listener-Supporter Bridge, Conversion Attribution |

---

## Appendices

### A. Agent System Prompts

See `/lib/agents/definitions.ts` for complete system prompts.

### B. Tremor Component Library

Voxcast uses Tremor for all chart and dashboard components. Key exports:

```typescript
// components/ui/TremorCharts.tsx exports:
export { DynamicChart } from "./TremorCharts";     // Line, Bar, Area, Donut, Stacked
export { KPICard, KPIGrid } from "./TremorCharts"; // Metric cards with deltas
export { UsageTracker } from "./TremorCharts";     // Quota visualization
export { ComparisonBars } from "./TremorCharts";   // Progress bar comparisons
export { RevenueBreakdown } from "./TremorCharts"; // Donut + legend combo
export { ChartTypeSelector } from "./TremorCharts"; // Chart type picker UI

// Type exports:
export type { ChartData } from "./TremorCharts";
export type { KPIData } from "./TremorCharts";
export type { TrackerData } from "./TremorCharts";
export type { ComparisonData } from "./TremorCharts";
```

**Tremor Color Palette (Dark Mode Compatible):**
- `blue` - Primary actions, Marcus (Marketing)
- `emerald` - Success, Diana (Underwriting)  
- `amber` - Warning, attention
- `rose` - Negative deltas, Sarah (Development)
- `violet` - Jordan (Programming)
- `cyan` - Secondary data series

### C. API Rate Limits

| Endpoint | Free | Pro | Enterprise |
|----------|------|-----|------------|
| /api/agents/stream | 10/min | 60/min | 300/min |
| /api/voice/* | N/A | 30/min | 120/min |
| /api/documents/* | 5/min | 30/min | 120/min |
| /api/integrations/* | N/A | 30/min | 120/min |

### D. Error Codes

| Code | Description |
|------|-------------|
| `QUOTA_EXCEEDED` | Monthly message limit reached |
| `FEATURE_UNAVAILABLE` | Feature not available on current plan |
| `INVALID_AGENT` | Unknown agent ID |
| `DOCUMENT_PROCESSING` | Document still being processed |
| `INTEGRATION_ERROR` | External service error |

### E. Webhook Events

```typescript
// Clerk webhooks
"user.created" -> Create user record
"user.updated" -> Update user record
"user.deleted" -> Soft delete user
"organization.created" -> Create station
"organization.updated" -> Update station
"organization.deleted" -> Archive station

// Stripe webhooks
"checkout.session.completed" -> Activate subscription
"invoice.paid" -> Record payment
"invoice.payment_failed" -> Notify user
"customer.subscription.updated" -> Update tier
"customer.subscription.deleted" -> Downgrade to free
```

---

**Document Control**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 2025 | Tarik Moody | Initial PRD |
| 2.0 | Jan 8, 2026 | Tarik Moody | Post-brainstorming update: Added Station Pulse (Section 4), expanded agent tools (44 new features), updated personas with key insights, revised roadmap priorities |

---

*Voxcast - Empowering public radio with AI expertise*
