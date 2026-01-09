# Social Media Integration Guide

VoxCast supports connecting social media and analytics accounts to provide AI-powered insights about your station's digital presence.

## Supported Platforms

| Platform | Data Types |
|----------|------------|
| Facebook | Page insights, posts, engagement (reactions, comments, shares) |
| Instagram | Stories, reels, engagement (likes, comments) |
| LinkedIn | Company page analytics, post engagement |
| Twitter/X | Tweet analytics, followers, engagement |
| YouTube | Channel stats, video performance, audience retention |
| Google Analytics | Website traffic, user behavior, conversions |

## Architecture

```
OAuth Flow → Store Tokens → Sync Data → Store in Convex → Agent Queries Local Data
```

### Data Flow

1. **OAuth Authentication** - User authorizes VoxCast to access their platform data
2. **Token Storage** - Access/refresh tokens stored securely in `socialConnections` table
3. **Data Sync** - Scheduled jobs fetch metrics from platform APIs
4. **Local Storage** - Metrics cached in `socialMetrics` table for fast access
5. **Agent Access** - AI agents query local Convex data (no rate limits)

### Benefits of Local Caching

- **Fast queries** - Data available instantly without API calls
- **No rate limits** - Agents can query freely without hitting platform limits
- **Consistent format** - Data normalized across all platforms
- **Reliable** - Works even when external APIs are slow or down

## Environment Variables

Add these to your **Convex dashboard** (Settings → Environment Variables):

### Facebook / Instagram

```
FACEBOOK_CLIENT_ID=your_app_id
FACEBOOK_CLIENT_SECRET=your_app_secret
INSTAGRAM_CLIENT_ID=your_app_id  (same as Facebook)
INSTAGRAM_CLIENT_SECRET=your_app_secret
```

Get credentials: [Meta Developer Portal](https://developers.facebook.com)

Required permissions:
- `pages_read_engagement`
- `pages_read_user_content`
- `pages_show_list`
- `instagram_basic`
- `instagram_manage_insights`

### LinkedIn

```
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
```

Get credentials: [LinkedIn Developer Portal](https://www.linkedin.com/developers)

Required permissions:
- `r_organization_social`
- `rw_organization_admin`

### Twitter/X

```
TWITTER_CLIENT_ID=your_client_id
TWITTER_CLIENT_SECRET=your_client_secret
```

Get credentials: [Twitter Developer Portal](https://developer.twitter.com)

Required permissions:
- `tweet.read`
- `users.read`
- `offline.access`

### YouTube

```
YOUTUBE_CLIENT_ID=your_client_id
YOUTUBE_CLIENT_SECRET=your_client_secret
```

Get credentials: [Google Cloud Console](https://console.cloud.google.com)

Required APIs:
- YouTube Data API v3

### Google Analytics

```
GOOGLE_ANALYTICS_CLIENT_ID=your_client_id
GOOGLE_ANALYTICS_CLIENT_SECRET=your_client_secret
```

Get credentials: [Google Cloud Console](https://console.cloud.google.com)

Required APIs:
- Google Analytics Data API

## Database Schema

### socialConnections Table

Stores OAuth credentials and connection status.

```typescript
{
  stationId: Id<"stations">,
  platform: "facebook" | "instagram" | "linkedin" | "twitter" | "youtube" | "google_analytics",
  accountId: string,
  accountName: string,
  accountType?: string,
  accessToken: string,
  refreshToken?: string,
  tokenExpiresAt?: number,
  syncEnabled: boolean,
  lastSyncAt?: number,
  syncFrequency: "hourly" | "daily" | "weekly",
  status: "active" | "expired" | "error" | "disconnected",
  lastError?: string,
  permissions?: string[],
  connectedBy: Id<"users">,
  createdAt: number,
  updatedAt: number,
}
```

### socialMetrics Table

Stores synced metrics data.

```typescript
{
  stationId: Id<"stations">,
  connectionId: Id<"socialConnections">,
  platform: string,
  metricType: "post" | "page_insights" | "audience" | "engagement",
  periodStart: number,
  periodEnd: number,
  data: any,  // Platform-specific metrics
  fetchedAt: number,
  rawResponse?: any,
}
```

## API Reference

### Queries

- `socialConnections.list` - List all connections for a station
- `socialConnections.get` - Get a specific connection
- `socialConnections.getStatusSummary` - Get platform status overview
- `socialConnections.getAvailablePlatforms` - List supported platforms

### Actions

- `socialConnections.generateAuthUrl` - Start OAuth flow
- `socialConnections.completeOAuth` - Exchange code for tokens
- `socialConnections.syncPlatformData` - Manually trigger data sync

### Mutations

- `socialConnections.disconnect` - Remove a connection
- `socialConnections.updateSyncSettings` - Change sync frequency

## Agent Integration

AI agents can access social data through these tools:

### get_social_metrics

Query metrics by platform, type, or date range.

```typescript
{
  platform?: "facebook" | "instagram" | "linkedin" | "twitter" | "youtube" | "google_analytics",
  metricType?: "post" | "page_insights" | "audience" | "engagement",
  daysBack?: number  // Default: 30
}
```

### get_social_summary

Get a weekly engagement summary across all connected platforms.

```typescript
// No parameters - returns summary for all active connections
```

## Example Agent Queries

Once social accounts are connected, you can ask the agents:

- "How did our Facebook posts perform last week?"
- "What's our Instagram engagement trend?"
- "Compare our social media performance across platforms"
- "Which content types get the most engagement?"
- "What time of day do we get the most engagement on Twitter?"

## Sync Frequency

You can configure how often data syncs:

| Frequency | Best For |
|-----------|----------|
| Hourly | Active campaigns, real-time monitoring |
| Daily | Regular reporting (recommended) |
| Weekly | Long-term trends, lower API usage |

## Troubleshooting

### "Integration is not configured"

Add the required environment variables to Convex.

### "Token expired"

The connection needs to be re-authenticated. Click "Reconnect" in the Social Connector.

### "Sync failed"

Check the `lastError` field on the connection. Common causes:
- API rate limits exceeded
- Insufficient permissions
- Account access revoked

### Data not showing

1. Verify the connection status is "active"
2. Check when the last sync occurred
3. Try manually triggering a sync
