"""
ASGI config for app_backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/asgi/
"""
# import os
# from django.core.asgi import get_asgi_application

# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app_backend.settings')

# django_asgi_app = get_asgi_application()
# from channels.routing import ProtocolTypeRouter, URLRouter
# from chat.middleware import JWTAuthMiddleware  # Your working middleware
# from chat.routing import websocket_urlpatterns

# application = ProtocolTypeRouter({
#     "http": django_asgi_app,
#     "websocket":JWTAuthMiddleware(
#         URLRouter(websocket_urlpatterns)
#     ),
#     # WebsocketDenier(
#     #     JWTAuthMiddleware(  
#     #         URLRouter(
#     #             chat.routing.websocket_urlpatterns
#     #         )
#     #     )
#     # ),
# })

"""
ASGI config for app_backend project with JWT.
"""

"""
ASGI config for app_backend - 100% Working
"""
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app_backend.settings')

django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter,URLRouter
from chat.routing import websocket_urlpatterns
from chat.middleware import JWTAuthMiddleware

# ✅ Import your FIXED routing
from chat.routing import websocket_urlpatterns

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JWTAuthMiddleware(
        URLRouter(websocket_urlpatterns)
    ),
})