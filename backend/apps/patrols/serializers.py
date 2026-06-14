from rest_framework import serializers

from .models import Checkpoint, PatrolException, PatrolRecord, PatrolRoute, PatrolRouteCheckpoint


class CheckpointSerializer(serializers.ModelSerializer):
    class Meta:
        model = Checkpoint
        fields = "__all__"


class PatrolRouteSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatrolRoute
        fields = "__all__"


class PatrolRouteCheckpointSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatrolRouteCheckpoint
        fields = "__all__"


class PatrolRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatrolRecord
        fields = "__all__"


class PatrolRecordImportItemSerializer(serializers.Serializer):
    assignment_id = serializers.IntegerField(required=False)
    device_id = serializers.IntegerField(required=False)
    device_number = serializers.CharField(required=False, allow_blank=False)
    route_id = serializers.IntegerField(required=False)
    route_code = serializers.CharField(required=False, allow_blank=False)
    checkpoint_id = serializers.IntegerField(required=False)
    checkpoint_code = serializers.CharField(required=False, allow_blank=False)
    guard_id = serializers.IntegerField(required=False)
    guard_employee_number = serializers.CharField(required=False, allow_blank=False)
    guard_card_number = serializers.CharField(required=False, allow_blank=False)
    source = serializers.ChoiceField(choices=PatrolRecord.Source.choices, required=False)
    source_record_id = serializers.CharField(required=True, allow_blank=False)
    imei = serializers.CharField(required=False, allow_blank=True)
    guard_identifier = serializers.CharField(required=False, allow_blank=True)
    checkpoint_identifier = serializers.CharField(required=False, allow_blank=True)
    record_type = serializers.CharField(required=False, allow_blank=True)
    occurred_at = serializers.DateTimeField()
    information = serializers.CharField(required=False, allow_blank=True)
    latitude = serializers.DecimalField(required=False, allow_null=True, max_digits=9, decimal_places=6)
    longitude = serializers.DecimalField(required=False, allow_null=True, max_digits=9, decimal_places=6)
    speed = serializers.DecimalField(required=False, allow_null=True, max_digits=8, decimal_places=2)
    satellites = serializers.IntegerField(required=False, allow_null=True, min_value=0)
    raw_payload = serializers.JSONField(required=False)


class PatrolRecordImportSerializer(serializers.Serializer):
    source = serializers.ChoiceField(choices=PatrolRecord.Source.choices, required=False, default=PatrolRecord.Source.MANUAL_IMPORT)
    device_id = serializers.IntegerField(required=False)
    clear_device_after_import = serializers.BooleanField(required=False, default=False)
    records = PatrolRecordImportItemSerializer(many=True)


class PatrolExceptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatrolException
        fields = "__all__"
