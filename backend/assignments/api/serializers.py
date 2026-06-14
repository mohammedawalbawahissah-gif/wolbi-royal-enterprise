from rest_framework import serializers
from ..models import Assignment, AssignmentComment, AssignmentActivity


class AssignmentCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.username", read_only=True)

    class Meta:
        model = AssignmentComment
        fields = ("id", "author", "author_name", "comment", "created_at")
        read_only_fields = ("author", "created_at")


class AssignmentActivitySerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.username", read_only=True)

    class Meta:
        model = AssignmentActivity
        fields = ("id", "message", "created_by", "created_by_name", "created_at")
        read_only_fields = ("created_by", "created_at")


class AssignmentSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source="assigned_to.username", read_only=True)
    assigned_by_name = serializers.CharField(source="assigned_by.username", read_only=True)
    comments         = AssignmentCommentSerializer(many=True, read_only=True)
    activities       = AssignmentActivitySerializer(many=True, read_only=True)

    class Meta:
        model = Assignment
        fields = "__all__"
        read_only_fields = ("assigned_by",)


class AssignmentWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = "__all__"
        read_only_fields = ("assigned_by",)
