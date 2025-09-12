On the POS page, several critical issues need to be addressed:

1. Product Display Issue:
   - Lubricant products currently display their types (ex: synthetic) instead of their proper names like (ex: ow 50)
   - Correct this to show the actual product names as intended

2. Filter Category Checkout Failure:
   - When adding filter category products to cart, the checkout button is unresponsive
   - Error logs when attempting checkout: (ReferenceError: toast is not defined
    at handleCheckout (webpack-internal:///(app-pages-browser)/./app/pos/page.tsx:1628:13)
    at executeDispatch (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16922:9)
    at runWithFiberInDEV (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:873:30)
    at processDispatchQueue (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:16972:19)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17573:9)
    at batchedUpdates$1 (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:3313:40)
    at dispatchEventForPluginEventSystem (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:17126:7)
    at dispatchEvent (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:21309:11)
    at dispatchDiscreteEvent (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js:21277:11))

3. Empty Parts Category:
   - The parts category currently shows no products at all
   - Investigate and restore proper product listings

4. Payment Confirmation Hang:
   - During checkout for non-filter products, the process stalls at the payment confirmation step
   - Console logs during general product checkout attempts: [[Fast Refresh] done in 1147ms
D:\Coding Projects\pos\lib\services\inventoryService.ts:488   POST http://localhost:3000/api/products/save 400 (Bad Request)
updateItem @ D:\Coding Projects\pos\lib\services\inventoryService.ts:488
useInventoryPOSSync.useCallback[updateStock] @ D:\Coding Projects\pos\lib\services\inventory-pos-sync.ts:261
useInventoryPOSSync.useCallback[processSale] @ D:\Coding Projects\pos\lib\services\inventory-pos-sync.ts:372
processSaleByNumericId @ D:\Coding Projects\pos\lib\hooks\data\useIntegratedPOSData.ts:157
handleFinalizePayment @ D:\Coding Projects\pos\app\pos\page.tsx:1337
await in handleFinalizePayment
executeDispatch @ D:\Coding Projects\pos\node_modules\next\dist\compiled\react-dom\cjs\react-dom-client.development.js:16921
runWithFiberInDEV @ D:\Coding Projects\pos\node_modules\next\dist\compiled\react-dom\cjs\react-dom-client.development.js:872
processDispatchQueue @ D:\Coding Projects\pos\node_modules\next\dist\compiled\react-dom\cjs\react-dom-client.development.js:16971
eval @ D:\Coding Projects\pos\node_modules\next\dist\compiled\react-dom\cjs\react-dom-client.development.js:17572
batchedUpdates$1 @ D:\Coding Projects\pos\node_modules\next\dist\compiled\react-dom\cjs\react-dom-client.development.js:3312
dispatchEventForPluginEventSystem @ D:\Coding Projects\pos\node_modules\next\dist\compiled\react-dom\cjs\react-dom-client.development.js:17125
dispatchEvent @ D:\Coding Projects\pos\node_modules\next\dist\compiled\react-dom\cjs\react-dom-client.development.js:21308
dispatchDiscreteEvent @ D:\Coding Projects\pos\node_modules\next\dist\compiled\react-dom\cjs\react-dom-client.development.js:21276
<button>
exports.jsxDEV @ D:\Coding Projects\pos\node_modules\next\dist\compiled\react\cjs\react-jsx-dev-runtime.development.js:345
_c @ D:\Coding Projects\pos\components\ui\button.tsx:50
react_stack_bottom_frame @ D:\Coding Projects\pos\node_modules\next\dist\compiled\react-dom\cjs\react-dom-client.development.js:23552
renderWithHooksAgain @ D:\Coding Projects\pos\node_modules\next\dist\compiled\react-dom\cjs\react-dom-client.development.js:6863
renderWithHooks @ D:\Coding Projects\pos\node_modules\next\dist\compiled\react-dom\cjs\react-dom-client.development.js:6775
updateForwardRef @ D:\Coding Projects\pos\node_modules\next\dist\compiled\react-dom\cjs\react-dom-client.development.js:8777
beginWork @ D:\Coding Projects\pos\node_modules\next\dist\compiled\react-dom\cjs\react-dom-client.development.js:11018
runWithFiberInDEV @ D:\Coding Projects\pos\node_modules\next\dist\compiled\react-dom\cjs\react-dom-client.development.js:872
performUnitOfWork @ D:\Coding Projects\pos\node_modules\next\dist\compiled\react-dom\cjs\react-dom-client.development.js:15677
workLoopSync @ D:\Coding Projects\pos\node_modules\next\dist\compiled\react-dom\cjs\react-dom-client.development.js:15497
renderRootSync @ D:\Coding Projects\pos\node_modules\next\dist\compiled\react-dom\cjs\react-dom-client.development.js:15477
performWorkOnRoot @ D:\Coding Projects\pos\node_modules\next\dist\compiled\react-dom\cjs\react-dom-client.development.js:14941
performSyncWorkOnRoot @ D:\Coding Projects\pos\node_modules\next\dist\compiled\react-dom\cjs\react-dom-client.development.js:16781
flushSyncWorkAcrossRoots_impl @ D:\Coding Projects\pos\node_modules\next\dist\compiled\react-dom\cjs\react-dom-client.development.js:16627
processRootScheduleInMicrotask @ D:\Coding Projects\pos\node_modules\next\dist\compiled\react-dom\cjs\react-dom-client.development.js:16665
eval @ D:\Coding Projects\pos\node_modules\next\dist\compiled\react-dom\cjs\react-dom-client.development.js:16800
<Button>
exports.jsxDEV @ D:\Coding Projects\pos\node_modules\next\dist\compiled\react\cjs\react-jsx-dev-runtime.development.js:345
POSPageContent @ D:\Coding Projects\pos\app\pos\page.tsx:2720
react_stack_bottom_frame @ D:\Coding Projects\pos\node_modules\next\dist\compiled\react-dom\cjs\react-dom-client.development.js:23552
renderWithHooksAgain @ D:\Coding Projects\pos\node_modules\next\dist\compiled\react-dom\cjs\react-dom-client.development.js:6863
renderWithHooks @ D:\Coding Projects\pos\node_modules\next\dist\compiled\react-dom\cjs\react-dom-client.development.js:6775
updateFunctionComponent @ D:\Coding Projects\pos\node_modules\next\dist\compiled\react-dom\cjs\react-dom-client.development.js:9069
beginWork @ D:\Coding Projects\pos\node_modules\next\dist\compiled\react-dom\cjs\react-dom-client.development.js:10679
runWithFiberInDEV @ D:\Coding Projects\pos\node_modules\next\dist\compiled\react-dom\cjs\react-dom-client.development.js:872
performUnitOfWork @ D:\Coding Projects\pos\node_modules\next\dist\compiled\react-dom\cjs\react-dom-client.development.js:15677
workLoopSync @ D:\Coding Projects\pos\node_modules\next\dist\compiled\react-dom\cjs\react-dom-client.development.js:15497
renderRootSync @ D:\Coding Projects\pos\node_modules\next\dist\compiled\react-dom\cjs\react-dom-client.development.js:15477
performWorkOnRoot @ D:\Coding Projects\pos\node_modules\next\dist\compiled\react-dom\cjs\react-dom-client.development.js:14941
performSyncWorkOnRoot @ D:\Coding Projects\pos\node_modules\next\dist\compiled\react-dom\cjs\react-dom-client.development.js:16781
flushSyncWorkAcrossRoots_impl @ D:\Coding Projects\pos\node_modules\next\dist\compiled\react-dom\cjs\react-dom-client.development.js:16627
processRootScheduleInMicrotask @ D:\Coding Projects\pos\node_modules\next\dist\compiled\react-dom\cjs\react-dom-client.development.js:16665
eval @ D:\Coding Projects\pos\node_modules\next\dist\compiled\react-dom\cjs\react-dom-client.development.js:16800
D:\Coding Projects\pos\lib\services\inventoryService.ts:500  API Error Response: {error: 'Required'}error: "Required"[[Prototype]]: Object
overrideMethod @ hook.js:608
error @ D:\Coding Projects\pos\node_modules\next\dist\next-devtools\userspace\app\errors\intercept-console-error.js:62
updateItem @ D:\Coding Projects\pos\lib\services\inventoryService.ts:500
D:\Coding Projects\pos\lib\services\inventoryService.ts:523  Error updating item: Error: Failed to update item: Required
    at updateItem (D:\Coding Projects\pos\lib\services\inventoryService.ts:501:13)
    at async useInventoryPOSSync.useCallback[updateStock] (D:\Coding Projects\pos\lib\services\inventory-pos-sync.ts:261:25)
    at async useInventoryPOSSync.useCallback[processSale] (D:\Coding Projects\pos\lib\services\inventory-pos-sync.ts:372:23)
    at async handleFinalizePayment (D:\Coding Projects\pos\app\pos\page.tsx:1337:28)
overrideMethod @ hook.js:608
error @ D:\Coding Projects\pos\node_modules\next\dist\next-devtools\userspace\app\errors\intercept-console-error.js:62
updateItem @ D:\Coding Projects\pos\lib\services\inventoryService.ts:523
D:\Coding Projects\pos\lib\services\inventory-pos-sync.ts:325  ❌ Stock update error: Error: Failed to update item: Required
    at updateItem (D:\Coding Projects\pos\lib\services\inventoryService.ts:501:13)
    at async useInventoryPOSSync.useCallback[updateStock] (D:\Coding Projects\pos\lib\services\inventory-pos-sync.ts:261:25)
    at async useInventoryPOSSync.useCallback[processSale] (D:\Coding Projects\pos\lib\services\inventory-pos-sync.ts:372:23)
    at async handleFinalizePayment (D:\Coding Projects\pos\app\pos\page.tsx:1337:28)
overrideMethod @ hook.js:608
error @ D:\Coding Projects\pos\node_modules\next\dist\next-devtools\userspace\app\errors\intercept-console-error.js:62
useInventoryPOSSync.useCallback[updateStock] @ D:\Coding Projects\pos\lib\services\inventory-pos-sync.ts:325
D:\Coding Projects\pos\app\pos\page.tsx:1348  Some inventory updates failed: (2) ['Coolant Green: Failed to process sale', 'Fuel System Cleaner: Failed to process sale']
overrideMethod @ hook.js:608
handleFinalizePayment @ D:\Coding Projects\pos\app\pos\page.tsx:1348
D:\Coding Projects\pos\app\pos\page.tsx:1368  Error processing inventory updates: ReferenceError: toast is not defined
    at handleFinalizePayment (D:\Coding Projects\pos\app\pos\page.tsx:1349:9)
overrideMethod @ hook.js:608
error @ D:\Coding Projects\pos\node_modules\next\dist\next-devtools\userspace\app\errors\intercept-console-error.js:62
handleFinalizePayment @ D:\Coding Projects\pos\app\pos\page.tsx:1368
D:\Coding Projects\pos\app\pos\page.tsx:1369  Uncaught (in promise) ReferenceError: toast is not defined
    at handleFinalizePayment (D:\Coding Projects\pos\app\pos\page.tsx:1369:7)]

All these issues require immediate attention to restore full POS functionality. The system should:
- Display correct product information
- Process all checkout requests properly
- Show complete product categories
- Complete payment transactions without interruption