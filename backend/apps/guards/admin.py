from django.contrib import admin

from .models import DisciplinaryRecord, GuardDocument, GuardNextOfKin, GuardProfile, GuardTrainingRecord, UniformIssue

admin.site.register(GuardProfile)
admin.site.register(GuardNextOfKin)
admin.site.register(GuardDocument)
admin.site.register(GuardTrainingRecord)
admin.site.register(UniformIssue)
admin.site.register(DisciplinaryRecord)
