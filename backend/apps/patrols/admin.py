from django.contrib import admin

from .models import Checkpoint, PatrolRecord, PatrolRoute, PatrolRouteCheckpoint

admin.site.register(Checkpoint)
admin.site.register(PatrolRoute)
admin.site.register(PatrolRouteCheckpoint)
admin.site.register(PatrolRecord)
