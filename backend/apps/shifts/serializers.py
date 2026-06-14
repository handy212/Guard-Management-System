from rest_framework import serializers

from .models import AttendanceRecord, GuardAssignment, Shift


class ShiftSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shift
        fields = "__all__"

    def validate(self, attrs):
        starts_at = attrs.get("starts_at", getattr(self.instance, "starts_at", None))
        ends_at = attrs.get("ends_at", getattr(self.instance, "ends_at", None))
        if starts_at and ends_at and ends_at <= starts_at:
            raise serializers.ValidationError({"ends_at": "Shift end must be after shift start."})
        return attrs


class GuardAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = GuardAssignment
        fields = "__all__"


class AttendanceRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceRecord
        fields = "__all__"

    def validate(self, attrs):
        checked_in_at = attrs.get("checked_in_at", getattr(self.instance, "checked_in_at", None))
        checked_out_at = attrs.get("checked_out_at", getattr(self.instance, "checked_out_at", None))
        if checked_in_at and checked_out_at and checked_out_at <= checked_in_at:
            raise serializers.ValidationError({"checked_out_at": "Check-out must be after check-in."})
        return attrs
