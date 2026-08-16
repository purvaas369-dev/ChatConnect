# from django.urls import path
# from .views import CreateOrderView, VerifyPaymentView, CheckAccessView

# urlpatterns = [
#     path("create-order/", CreateOrderView.as_view()),
#     path("verify/", VerifyPaymentView.as_view()),
#     path("check-access/<int:room_id>/", CheckAccessView.as_view()),
# ]
from django.urls import path
from .views import FakePaymentView, CheckAccessView,CreateOrderView,VerifyPaymentView

urlpatterns = [
    path('create-order/',CreateOrderView.as_view(), name='create_order'),
    path('verify-payment/', VerifyPaymentView.as_view(), name='verify_payment'),
    path("fake-payment/", FakePaymentView.as_view()),
    path("check-access/<int:room_id>/", CheckAccessView.as_view()),
]