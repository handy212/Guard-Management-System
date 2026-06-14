from django.contrib import admin

from .models import AttendanceRecord, GuardAssignment, Shift

admin.site.register(Shift)
admin.site.register(GuardAssignment)
admin.site.register(AttendanceRecord)
