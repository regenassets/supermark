# REG-51: Fix Trigger.dev Document Processing

## Issue Summary

When uploading a PDF and creating a link, the link field shows "Waiting for worker to connect..." indefinitely. This prevents users from accessing the document processing features.

## Root Cause

The application is configured with Trigger.dev (`TRIGGER_SECRET_KEY` is set in production), but **no Trigger.dev worker has been deployed**.

Trigger.dev v4 requires a separate worker deployment that processes background tasks. Without a deployed worker:
- Tasks are created and queued in Trigger.dev cloud
- Task status remains `PENDING_VERSION` (waiting for a worker)
- The UI shows "Waiting for worker to connect..."
- Documents never finish processing

## Technical Details

### How Document Processing Works

1. **PDF Upload**: User uploads a PDF to the app
2. **Task Creation**: `convertPdfToImageRoute.trigger()` is called (lib/api/documents/process-document.ts:247)
3. **Trigger.dev Cloud**: Task is created with status `PENDING_VERSION`
4. **Worker (Missing!)**: Should pick up and process the task
5. **UI Polling**: Frontend polls Trigger.dev API for task status (lib/utils/use-progress-status.ts:57)
6. **Status Display**: Shows "Waiting for worker to connect..." when status is `PENDING_VERSION`

### Code References

- **Task Trigger**: `lib/api/documents/process-document.ts:245-264`
- **Task Definition**: `lib/trigger/pdf-to-image-route.ts`
- **Status Check**: `lib/utils/use-progress-status.ts:54-57`
- **UI Component**: `components/documents/file-process-status-bar.tsx`

## Solutions

### Option 1: Deploy Trigger.dev Worker (Full Featured)

**Best for**: Production deployments that need Office/CAD conversions and video optimization

**Steps**:
1. Follow the guide in `TRIGGER-DEPLOYMENT.md`
2. Run `npm run trigger:deploy` from local machine
3. Verify deployment in Trigger.dev dashboard
4. Test document upload and link creation

**Benefits**:
- ✅ Full background job processing
- ✅ Office/CAD file conversions
- ✅ Video optimization
- ✅ Progress tracking
- ✅ Better user experience

**Time Required**: ~15-30 minutes

### Option 2: Disable Trigger.dev (Quick Fix)

**Best for**: Getting the app working immediately without external dependencies

**Steps**:
1. Run `./toggle-trigger.sh disable`
2. Or manually edit `.env.production` and comment out `TRIGGER_SECRET_KEY`
3. Restart: `docker compose --env-file .env.production restart supermark`
4. Test document upload and link creation

**Benefits**:
- ✅ Works immediately
- ✅ No external service dependencies
- ✅ PDF documents still work fine
- ✅ No "waiting for worker" messages

**Limitations**:
- ❌ No Office/CAD file conversions
- ❌ No video optimization
- ❌ No background job processing

**Time Required**: ~2 minutes

### Option 3: Self-hosted Background Jobs (Future)

**Best for**: Organizations that need background processing but don't want cloud dependencies

This would require implementing BullMQ with Redis to replace Trigger.dev. See `TINYBIRD-TRIGGERDEV-WORKAROUNDS.md` for more information.

**Status**: Not yet implemented

## Recommendation

**Immediate Action (Today)**:
- Use **Option 2** (Disable Trigger.dev) to unblock users immediately
- This gets the app working in ~2 minutes
- PDF documents will work fine

**Follow-up (This Week)**:
- Evaluate if you need background job processing
- If yes, implement **Option 1** (Deploy Trigger.dev Worker)
- If no, keep Trigger.dev disabled (it's optional)

## Files Changed

1. **TRIGGER-DEPLOYMENT.md** - Comprehensive deployment guide
2. **toggle-trigger.sh** - Quick enable/disable script
3. **README.md** - Added reference to new guide
4. **REG-51-FIX-SUMMARY.md** - This summary document

## Testing

### After Disabling Trigger.dev

1. Upload a PDF document
2. Create a link to the document
3. ✅ Link should work immediately (no "waiting for worker" message)
4. ✅ PDF should be viewable
5. ❌ Try uploading a .docx file - conversion won't work (expected)

### After Deploying Worker

1. Upload a PDF document
2. Create a link to the document
3. ✅ Should show processing progress (0%, 10%, 20%, etc.)
4. ✅ Link should work after processing completes
5. ✅ Try uploading a .docx file - should convert to PDF
6. ✅ Progress bar should show conversion status

## Related Documentation

- [TRIGGER-DEPLOYMENT.md](./TRIGGER-DEPLOYMENT.md) - Deployment guide
- [TINYBIRD-TRIGGERDEV-WORKAROUNDS.md](./TINYBIRD-TRIGGERDEV-WORKAROUNDS.md) - Known issues
- [SERVICES.md](./SERVICES.md) - All external services
- [trigger.config.ts](./trigger.config.ts) - Trigger.dev configuration

## Support

If you encounter issues:

1. **Check Trigger.dev dashboard**: https://cloud.trigger.dev
2. **View logs**: `docker compose --env-file .env.production logs supermark | grep -i trigger`
3. **Verify environment**: `docker compose --env-file .env.production exec supermark env | grep TRIGGER`
4. **See troubleshooting**: TRIGGER-DEPLOYMENT.md

## Implementation Complete

This fix provides:
- ✅ Clear explanation of the issue
- ✅ Two actionable solutions (deploy worker or disable)
- ✅ Comprehensive deployment guide
- ✅ Quick toggle script for easy switching
- ✅ Testing procedures
- ✅ Updated documentation

Choose Option 1 or Option 2 based on your immediate needs and timeline.
