from django.contrib import admin

from .models import Branch, CompanySettings, Department

admin.site.register(CompanySettings)
admin.site.register(Branch)
admin.site.register(Department)
