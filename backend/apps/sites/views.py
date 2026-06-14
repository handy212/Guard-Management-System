from rest_framework import viewsets

from apps.core.mixins import AuditLogMixin
from apps.core.permissions import permission_class

from .models import Site, SiteEmergencyContact, SiteInstruction
from .serializers import SiteEmergencyContactSerializer, SiteInstructionSerializer, SiteSerializer


class SiteViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = Site.objects.select_related("client")
    serializer_class = SiteSerializer
    permission_classes = [permission_class("sites.manage")]


class SiteEmergencyContactViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = SiteEmergencyContact.objects.select_related("site")
    serializer_class = SiteEmergencyContactSerializer
    permission_classes = [permission_class("sites.manage")]


class SiteInstructionViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = SiteInstruction.objects.select_related("site")
    serializer_class = SiteInstructionSerializer
    permission_classes = [permission_class("sites.manage")]
