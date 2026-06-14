from rest_framework import serializers

from .models import DisciplinaryRecord, GuardDocument, GuardNextOfKin, GuardProfile, GuardTrainingRecord, UniformIssue


class GuardProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = GuardProfile
        fields = "__all__"


class GuardNextOfKinSerializer(serializers.ModelSerializer):
    class Meta:
        model = GuardNextOfKin
        fields = "__all__"


class GuardDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = GuardDocument
        fields = "__all__"


class GuardTrainingRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = GuardTrainingRecord
        fields = "__all__"


class UniformIssueSerializer(serializers.ModelSerializer):
    class Meta:
        model = UniformIssue
        fields = "__all__"


class DisciplinaryRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = DisciplinaryRecord
        fields = "__all__"
