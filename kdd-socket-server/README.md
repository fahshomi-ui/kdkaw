# خادم KDD Socket.IO مستقل

هذا مجلد خادم مرجعي مستقل. لا يقرأ قاعدة بيانات أو ملفات أو أسراراً من مشروع آخر، ولا يفترض وجود لوحة إدارة أو صفحة بطاقة أو صفحة دفع. يتضمن الكتالوج الحقيقي المنقول بموافقة المستخدم: 159 منتجاً و27 فئة. لا توجد أسعار أو خصومات خيالية مضمّنة.

## التشغيل

بعد أن يوفّر المشروع الأب حزمتَي `socket.io` و`socket.io-client` (لا يقوم هذا المجلد بالتثبيت):

```bash
node kdd-socket-server/index.mjs
```

المنفذ الافتراضي `3001`، ويمكن تغييره عبر `PORT`. الخادم يستمع على `0.0.0.0` عند التشغيل المباشر، و`GET /health` يعيد فقط:

```json
{"ok":true,"status":"ok"}
```

لا توجد مسارات قراءة للطلبات أو البيانات الشخصية.

## الإعداد

- `KDD_CATALOG_FILE`: مسار ملف كتالوج بديل بصيغة JSON. إذا لم يُضبط، يستخدم الخادم `client/src/kdd/data/catalog.json` المنقول من المصدر الأصلي. يتحقق الخادم من الحقول ويرفض الكتالوج غير الصالح.
- `KDD_ALLOWED_ORIGINS`: قائمة origins مفصولة بفواصل، مثل `https://shop.example,https://www.shop.example`. لا تُقبل origins المتصفح إلا إذا كانت في هذه القائمة. عند غيابها يُسمح فقط بالمضيفات المحلية الشائعة (`localhost` و`127.0.0.1` على 3000 أو 5173). عملاء Node بلا ترويسة `Origin` مقبولون للاختبارات والخدمات الداخلية.
- `KDD_ORDERS_DIRECTORY`: عند ضبطه يُفعّل مستودع JSON اختياريّاً. ينشئ المجلد بصلاحية `0700` وملفاً لكل طلب بصلاحية `0600` واسم UUID. لا يُفعّل الخادم تخزيناً دائماً إذا لم يُضبط.
- `PORT`: منفذ التشغيل المباشر، وقيمته الافتراضية `3001`.

بدلاً من `KDD_ORDERS_DIRECTORY` يمكن تمرير `orderRepository` إلى `createStoreServer`. يجب أن يوفّر المستودع `findByRequestId` (أو `getByRequestId`) وواحداً من `saveOrder` أو `createOrder` أو `save`. تعرض الوحدة أيضاً `createJsonOrderRepository(directory)` للاستخدام الصريح.

## استخدام الوحدة

```js
import { createStoreServer } from './kdd-socket-server/index.mjs';

const app = createStoreServer({
  catalog: { products: [], categories: [] },
  allowedOrigins: ['http://localhost:5173'],
});

await app.listen(3001, '0.0.0.0');
// await app.close();
```

الواجهات المعادة هي `listen` و`close` و`address`، إضافة إلى `httpServer` و`io` للاختبارات. بيانات السلة محفوظة في ذاكرة Socket واحدة فقط وتُحذف عند الانفصال، ولا يوجد broadcast للتفاصيل الشخصية.

## غلاف ACK

كل حدث يعيد، عند تمرير callback، أحد الشكلين:

```json
{"ok":true,"data":{}}
```

أو:

```json
{"ok":false,"error":"ERROR_CODE"}
```

الحقول غير المعروفة مرفوضة في كل payload. لا تُقبل حقول بطاقة أو بنك أو دفع في أي مسار. الأسعار تُؤخذ حصراً من الكتالوج الخادمي؛ لا يرسل العميل سعراً ولا يستطيع تغييره. توجد حدود للحجم والكمية والعناصر ومعدل الأحداث.

## الأحداث

### `kdd:catalog:get`

الطلب يجب أن يكون `{}`. البيانات:

```json
{"products":["DbProduct"],"categories":["CategoryNode"]}
```

حقول `DbProduct`: `id`, `name_ar`, `name_en`, `description_ar`, `description_en`, `price`, `old_price`, `image_url`, `category_id`, `weight`, `origin`, `in_stock`, `featured`, و`category` (`slug`, `name_ar`, `name_en`) أو `null`.

حقول `CategoryNode`: `id`, `slug`, `name_ar`, `name_en`, `parent_id`, `sort_order`, `image_url`, `icon`, و`children`.

### `kdd:cart:update`

```json
{"items":[{"productId":"p-1","quantity":2,"preparations":["بدون صلصة"]}]}
```

`preparations` اختيارية. يتحقق الخادم من وجود المنتج ومن `in_stock`، ويرفض المنتج المجهول أو غير المتاح. النتيجة:

```json
{"items":[{"productId":"p-1","quantity":2}],"subtotal":20,"discount":0,"deliveryFee":0,"total":20}
```

التوصيل مجاني كما في صفحة إتمام الطلب المرجعية. المثال أعلاه لمنتج اختباري بسعر 10.000 دون سعر سابق. يحسب `subtotal` بعد عرض 50٪ للمنتجات المطابقة له، بإعادة بناء أساس العرض من `old_price` وطرح الخصم المقرب مرة واحدة؛ لا يُخصم السعر الحالي مرة ثانية. تعرض الواجهة المجموع الأساسي والتوفير منفصلين. تُضاف رسوم التحضير المعروفة ويُقرب الإجمالي إلى ثلاث منازل للدينار الكويتي. لا تُقبل الأسعار من العميل.

### `kdd:coupon:validate`

```json
{"code":"CODE"}
```

لا يوجد مصدر كوبونات افتراضي؛ النتيجة دائماً `null` بعد التحقق من الحمولة. لا يُنشئ الخادم خصماً تخمينياً.

### `kdd:order:create`

الحمولة:

```json
{
  "requestId":"UUID",
  "customer":{
    "name":"الاسم",
    "phone":"0500000000",
    "area":"المنطقة",
    "block":"اختياري",
    "street":"اختياري",
    "building":"اختياري",
    "floor":"اختياري",
    "apartment":"اختياري",
    "notes":"اختياري"
  },
  "items":[{"productId":"p-1","quantity":1,"preparations":[]}],
  "deliverySlot":{"date":"اختياري","window":"اختياري"},
  "couponCode":"اختياري"
}
```

لا تُقبل الحقول البنكية أو بيانات البطاقة. قبل التخزين يعاد احتساب الإجمالي من أسعار الكتالوج. من دون مستودع دائم تكون النتيجة الواضحة `ORDER_STORAGE_NOT_CONFIGURED` ولا يُنشأ طلب. عند تفعيل مستودع JSON، لا يُرسل ACK الناجح إلا بعد الحفظ، ويضمن `requestId` idempotency: التكرار بنفس الحمولة يعيد نفس الإيصال، واستخدامه بحمولة مختلفة يرفض بـ`REQUEST_ID_REUSE_DIFFERENT_PAYLOAD`.

الإيصال الناجح هو فقط:

```json
{"orderId":"UUID","status":"received","total":20,"createdAt":"2026-01-01T00:00:00.000Z"}
```

هذا الخادم المرجعي ليس تكاملاً مع نظام إدارة قديم، وليس بوابة دفع. يجب تشغيله مع تخزين دائم مُهيأ صراحةً حتى تنجح أوامر الطلب في بيئة الإنتاج.
