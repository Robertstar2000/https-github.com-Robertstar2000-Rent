
# TallmanRent - Operations & System Manual

## 1. Operational Instructions

### Dashboard (Day-at-a-Glance)
- Monitor real-time revenue, active contracts, and asset utilization.
- View recent activities and pending deliveries to manage daily workflows effectively.

### Inventory Management
- **Add Asset**: Use the "Add Item" button to register new equipment (stringer blocks, etc.) with serial numbers and replacement costs.
- **Tracking**: Statuses update automatically from 'Available' to 'Rented' when contracts are activated.
- **Maintenance**: Track repair history and costs per asset.

### Contracts & Quotes
- **New Quote**: Create a professional quote for utility partners.
- **E-Signature**: Send contracts for digital sign-off via the integrated DocuSign simulation.
- **ReturnDesk™**: Use the intelligent check-in system to process returns, flag damages, or report missing items.

## 2. Complete List of Features & Functions

- **Real-Time Inventory**: Automated status tracking (Available, Rented, Maintenance, Missing, Damaged).
- **Scan360 Damage Detection**: Use Gemini AI to analyze photos of returned equipment for structural issues.
- **AI Strategic Audit**: Executive-level reporting on tool health scores and reorder recommendations.
- **Logistics Manifest**: Real-time dispatching with route prioritization for field deliveries and pickups.
- **Automated Billing**: Automated invoice generation based on contract completion or asset loss.

## 3. Epicor P21 Interface Instructions

### Connection Setup
1. Navigate to **Admin & Operations Console** -> **ERP Bridge Settings**.
2. Enter the **API Endpoint URL**, **Client ID**, and **API Secret** provided by your IT department.
3. Set the **Sync Interval** (30 mins recommended) and **Direction** (Bidirectional for full parity).

### Synchronization
- **Manual Sync**: Triggered from the Admin Console to force an immediate update of inventory counts and customer data.
- **Logs**: Review the Bridge Logs to ensure successful data transmission. Common errors (401 Unauthorized) usually indicate expired API credentials.

### Alert Automation
- Configure **Email Server** settings (SendGrid/SMTP) to enable automated "Overdue" notices for both invoices and asset returns.
