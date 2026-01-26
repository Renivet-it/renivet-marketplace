# Daily Order Summary Email - Setup Guide

This document explains how to set up the automated daily order summary email system.

## Overview

The system sends a daily email summary of all orders and their statuses to configured recipients at **10:00 PM IST** every day.

**Features:**
- Order statistics by status (Total, Ready to Pickup, Pickup Scheduled, Shipped, Delivered, Cancelled, RTO)
- Detailed order table with customer names, amounts, and timestamps
- Past 24-hour order lookback period
- Sends to multiple configured email recipients

## API Endpoint

**URL:** `https://your-domain.com/api/cron/daily-order-summary`  
**Method:** GET  
**Schedule:** Daily at 10:00 PM IST (16:30 UTC)

## Configuration

### Email Recipients

The system uses email addresses from environment variables:
- `RENIVET_EMAIL_1` - First recipient
- `RENIVET_EMAIL_2` - Second recipient

To add more recipients in the future, update `src/actions/send-daily-order-summary.ts` and add new environment variables.

### Existing Cron Service Setup

Since you're already using an external cron service (the same one for Delhivery order status updates), add this new job to your cron configuration:

**Cron Expression:** `30 16 * * *` (4:30 PM UTC = 10:00 PM IST)

**Configuration Example:**

```
URL: https://your-domain.com/api/cron/daily-order-summary
Method: GET
Schedule: 30 16 * * * (daily at 10 PM IST)
Timeout: 60 seconds
```

## Manual Testing

### Local Testing

1. Start the development server:
   ```powershell
   bun run dev
   ```

2. Trigger the endpoint manually:
   ```powershell
   curl http://localhost:3000/api/cron/daily-order-summary
   ```

3. Check the console output for logs
4. Verify emails are received at both configured addresses

### Production Testing

After deployment, test the endpoint:

```powershell
curl https://your-domain.com/api/cron/daily-order-summary
```

## Monitoring

The endpoint logs comprehensive information:
- Start time (in IST)
- Total orders found in the past 24 hours
- Statistics breakdown
- Email recipients
- Success/failure status

Check your server logs or console output to monitor execution.

## Troubleshooting

### No emails received
1. Check environment variables are set: `RENIVET_EMAIL_1`, `RENIVET_EMAIL_2`, `RESEND_API_KEY`
2. Verify Resend API key is valid
3. Check server logs for errors
4. Ensure the cron job is actually triggering (check cron service logs)

### Wrong time zone
- The code expects 10 PM IST
- Cron expression `30 16 * * *` is in UTC (4:30 PM UTC = 10:00 PM IST)
- Adjust if your server is in a different timezone

### Empty order list
- This is normal if no orders were placed in the past 24 hours
- The email will still be sent with zero counts

## Email Preview

To preview the email template during development:

```powershell
bun run email:dev
```

Navigate to the `DailyOrderSummary` template in the React Email preview interface.

## Future Enhancements

To add more email recipients:

1. Add new environment variables in `env.ts`:
   ```typescript
   RENIVET_EMAIL_3: z.string().optional(),
   ```

2. Update `send-daily-order-summary.ts`:
   ```typescript
   const recipients = [
       env.RENIVET_EMAIL_1,
       env.RENIVET_EMAIL_2,
       env.RENIVET_EMAIL_3, // Add new recipient
   ].filter(Boolean); // Filter out undefined values
   ```

3. Update your `.env` file with the new email address
