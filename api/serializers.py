from rest_framework import serializers

from annotator.models import Annotation, Document
from django.contrib.auth.models import User, Permission


class AnnotationSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField()

    class Meta:
        model = Annotation
        fields = [
            "id",
            "document",
            "start",
            "end",
            "orig_text",
            "comment",
            "law_type",
            "law_justification",
            "json_data",
            "created_at",
        ]


class ExportAnnotationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Annotation
        fields = [
            "id",
            "document",
            "start",
            "end",
            "orig_text",
            "comment",
            "law_type",
            "law_justification",
        ]


class ClassifierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = [
            "AUTH_points",
            "CARE_points",
            "LOYAL_points",
            "FAIR_points",
            "PUR_points",
            "NON_points",
            "dominant_justification",
            "law_type",
            "NPA",
        ]


class DocumentSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Document
        fields = "__all__"


class DocumentAndAnnotationSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    annotations = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = "__all__"

    def get_annotations(self, obj):
        """
        Fetch annotations for a given document.
        """
        annotations = Annotation.objects.filter(document=obj)
        return ExportAnnotationSerializer(annotations, many=True).data


class UserSerializer(serializers.ModelSerializer):
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "permissions", "is_staff", "is_superuser"]

    def get_permissions(self, obj):
        # get all user permissions
        user_permissions = obj.user_permissions.all()

        # get all permissions of the groups the user belongs to
        group_permissions = Permission.objects.filter(group__user=obj)

        # combine both QuerySets
        all_permissions = user_permissions | group_permissions

        return list(all_permissions.values_list("codename", flat=True))
