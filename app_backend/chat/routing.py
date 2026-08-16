# chat/routing.py - CORRECTED
from django.urls import re_path
from channels.routing import URLRouter
from .consumers import ChatConsumer, DiscoverConsumer, NotificationConsumer
from .middleware import JWTAuthMiddleware 

websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<room_id>\d+)/?$', ChatConsumer.as_asgi()),
    re_path(r'ws/discover/(?P<room_id>\w+)/?$', DiscoverConsumer.as_asgi()),  # ✅ Fixed
    re_path(r'ws/notifications/(?P<user_id>\d+)/?$', NotificationConsumer.as_asgi()),  # ✅ Fixed
]

# ✅ EXPORT URLROUTER (NOT 'app')
application = JWTAuthMiddleware(URLRouter(websocket_urlpatterns))

__all__ = ['websocket_urlpatterns']

