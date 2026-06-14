from django.contrib import admin

from .models import ClientComplaint, IncidentReport, SupervisorInspection

admin.site.register(IncidentReport)
admin.site.register(SupervisorInspection)
admin.site.register(ClientComplaint)
