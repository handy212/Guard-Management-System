from rest_framework import serializers

from .models import Site, SiteEmergencyContact, SiteInstruction


class SiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Site
        fields = "__all__"


class SiteEmergencyContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteEmergencyContact
        fields = "__all__"


class SiteInstructionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteInstruction
        fields = "__all__"
