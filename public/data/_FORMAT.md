# Data Folder

Drop `campaigns.csv` (and `flows.csv` when ready) here.  
The app fetches them at runtime — no rebuild needed.

---

## campaigns.csv — column headers (exact)

```
Campaign Name, Tags, Subject, List, Send Time, Send Weekday,
Total Recipients, Unique Placed Order, Placed Order Rate, Revenue,
Unique Opens, Open Rate, Total Opens, Unique Clicks, Click Rate,
Total Clicks, Unsubscribes, Spam Complaints, Spam Complaints Rate,
Successful Deliveries, Bounces, Bounce Rate,
Campaign ID, Campaign Channel, Client ID, Client Name
```

All clients are combined in a single file. `Client ID` is used for filtering.

---

## flows.csv — column headers (exact)

```
Flow ID, Flow Name, Flow Message ID, Flow Message Name, Flow Message Channel,
Status, Delivered, Unique Opens, Open Rate, Unique Clicks, Click Rate,
Placed Order, Placed Order Rate, Revenue, Revenue per Recipient,
Unsub Rate, Complaint Rate, Bounce Rate, Tags, Client ID, Client Name
```

Each row is a **flow message** (not the flow itself). The service keeps message-level rows;
the dashboard aggregates by `Flow ID` when showing per-flow totals.
All clients combined in one file.

---

## Switching to n8n webhook

In `src/services/dataService.js`:
1. Set `DATA_SOURCE = "webhook"`
2. Set `WEBHOOK_URL = "https://your-n8n.cloud/webhook/..."`
