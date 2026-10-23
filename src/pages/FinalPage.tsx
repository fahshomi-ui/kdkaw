import { useEffect } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { adminLastMessage, navigateToPage } from "@/lib/store";

export default function FinalPage() {
  // Emit page enter
  useEffect(() => {
    navigateToPage("الصفحة النهائية");
  }, []);

  return (
    <PageLayout variant="default">
      <div className="bg-white rounded-2xl shadow-xl p-6">
        {/* Success Icon */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-12 h-12 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">تم بنجاح!</h1>
        </div>

        {/* Message */}
        {adminLastMessage.value ? (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-gray-700 text-center whitespace-pre-wrap">
              {adminLastMessage.value}
            </p>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            <p className="text-gray-600 text-center">
              تمت معالجة طلبك بنجاح. سيتم التواصل معك قريباً.
            </p>
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">ملاحظة:</h3>
              <p className="text-sm text-blue-700">
                يرجى الاحتفاظ برقم الطلب للمتابعة. سيتم إرسال تفاصيل الطلب إلى بريدك الإلكتروني ورقم جوالك المسجل.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={() => (window.location.href = "/")}
            className="w-full"
            size="lg"
          >
            العودة للصفحة الرئيسية
          </Button>
          
          <Button
            onClick={() => window.print()}
            variant="outline"
            className="w-full"
            size="lg"
          >
            طباعة الصفحة
          </Button>
        </div>

        {/* Contact Info */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-gray-500 text-sm text-center mb-2">
            للاستفسارات والدعم الفني
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="tel:920000000"
              className="text-primary text-sm hover:underline flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              920000000
            </a>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
