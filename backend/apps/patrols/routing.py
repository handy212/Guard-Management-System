from django.urls import path

from . import consumers

websocket_urlpatterns = [
    path("ws/monitoring/live/", consumers.LiveMonitoringConsumer.as_asgi()),
]
