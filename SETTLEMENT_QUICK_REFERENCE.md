# Settlement Quick Reference Card

## 🚀 Quick Start

### To Settle a Transaction:

1. **POS** → **Disputes** → **Settlement**
2. Enter **reference number** from original transaction
3. Enter your **cashier ID**
4. Review details and **confirm**
5. ✅ Done! Settlement appears in green on transactions page

## 📊 Transaction Types

| Original Type | Settlement Type | Display Color |
| ------------- | --------------- | ------------- |
| ON_HOLD       | ON_HOLD_PAID    | 🟢 Green      |
| CREDIT        | CREDIT_PAID     | 🟢 Green      |

## ⚡ Key Points

- ✅ Only ON_HOLD and CREDIT can be settled
- ✅ Creates NEW transaction (original unchanged)
- ✅ Requires valid cashier ID
- ✅ Cannot settle same transaction twice
- ✅ Maintains complete audit trail

## 🎨 Visual Indicators

```
Before: 🟡 On Hold      → After: 🟢 On-Hold Paid
Before: 🟠 Credit       → After: 🟢 Credit Paid
```

## 🔍 Finding Settlements

**Transactions Page:**

- Look for green transactions with "On-Hold Paid" or "Credit Paid"
- Check notes for "Settled from: [original reference]"
- Original transaction remains visible

## ❌ Common Errors

| Error                 | Meaning            | Solution                      |
| --------------------- | ------------------ | ----------------------------- |
| Transaction not found | Invalid reference  | Double-check reference number |
| Already settled       | Duplicate attempt  | Check if already processed    |
| Invalid cashier ID    | Wrong/inactive ID  | Verify your cashier ID        |
| Invalid type          | Not ON_HOLD/CREDIT | Can only settle these types   |

## 🔐 Security

- ✅ Cashier authentication required
- ✅ Server-side validation
- ✅ Audit trail maintained
- ✅ No direct database access

## 📝 Notes

- Settlement inherits items from original transaction
- Customer info preserved
- Payment method can be changed (default: CASH)
- Timestamp shows when settled, not original sale time

## 🆘 Need Help?

1. Check `SETTLEMENT_IMPLEMENTATION.md` for details
2. View `SETTLEMENT_WORKFLOW.md` for visual guide
3. Contact system administrator
4. Check API logs for technical issues

---

**Remember**: Settlement is designed to be simple and secure. When in doubt, verify the reference number and your cashier ID before confirming!
