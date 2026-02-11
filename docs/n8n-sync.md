# n8n Founder Sync

Use this endpoint to push founder updates from n8n:

- `POST /api/founders/sync`
- Header: `x-secret-key: <N8N_SYNC_SECRET>`
- Body:

```json
{
  "founders": [
    {
      "founderName": "Ritesh Agarwal",
      "companyName": "OYO Rooms",
      "foundedYear": 2013,
      "headquarters": "Gurgaon",
      "industry": "Hospitality",
      "stage": "Late Stage",
      "productSummary": "Hospitality network and booking technology platform.",
      "fundingInfo": "Raised multiple venture rounds.",
      "sourceUrl": "https://entri.app/blog/founders-of-indian-companies/",
      "verified": true
    }
  ]
}
```

Response:

```json
{
  "success": true,
  "upserted": 1
}
```
