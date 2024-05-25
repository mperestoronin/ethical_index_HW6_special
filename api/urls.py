from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    AnnotationViewSet,
    ExportAnnotationViewSet,
    annotation_list,
    ClassifierViewSet,
    DocumentViewSet,
    login,
    me,
    DocumentAndAnnotationViewset,
    change_document_status,
    document_statistics,
    date_range_statistics,
    generate_statistics_pdf,
    npa_list,
)

router = DefaultRouter()
router.register(r"annotations", AnnotationViewSet, basename="annotation")
router.register(
    r"export_annotations", ExportAnnotationViewSet, basename="export_annotation"
)
router.register(r"export_all", DocumentAndAnnotationViewset, basename="export_all")
router.register(r"classifiers", ClassifierViewSet, basename="classifier")
router.register(r"documents", DocumentViewSet, basename="document")

urlpatterns = [
    path("npa_list/", npa_list, name="npa_list"),
    path(
        "update_status/<int:document_id>/", change_document_status, name="update_status"
    ),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("login/", login, name="login"),
    path("me/", me, name="me"),
    path("", include(router.urls)),
    path("annotations_list/<int:document_id>", annotation_list, name="annotation_list"),
    path("statistics", document_statistics, name="statistics"),
    path("date_range_statistics/", date_range_statistics, name="date_range_statistics"),
    path(
        "generate_statistics_pdf/",
        generate_statistics_pdf,
        name="generate_statistics_pdf",
    ),
]
