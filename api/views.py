from datetime import datetime, timedelta
from io import BytesIO

import matplotlib
import matplotlib.pyplot as plt
from PIL import Image as PILImage
from django.contrib.auth import authenticate
from django.db.models import Count
from django.db.models import Q
from django.db.models.functions import TruncMonth
from django.http import JsonResponse, HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from reportlab.lib import colors
from reportlab.lib.colors import Color
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Image
from reportlab.platypus import (
    SimpleDocTemplate,
    Table,
    TableStyle,
    Paragraph,
    Spacer,
    PageBreak,
)
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from annotator.models import Annotation, Document
from app_config.npa import NPA
from .serializers import (
    AnnotationSerializer,
    ExportAnnotationSerializer,
    ClassifierSerializer,
    DocumentSerializer,
    DocumentAndAnnotationSerializer,
)
from .serializers import UserSerializer

matplotlib.use("Agg")  # Set the backend to Agg
pdfmetrics.registerFont(TTFont("Roboto", "fonts/Roboto-Regular.ttf"))
pdfmetrics.registerFont(TTFont("Roboto-Bold", "fonts/Roboto-Bold.ttf"))


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def npa_list(request):
    return JsonResponse({"npa": NPA})


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def login(request):
    username = request.data.get("username", None)
    password = request.data.get("password", None)

    user = authenticate(username=username, password=password)
    if user is None:
        return Response(
            {"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED
        )

    refresh = RefreshToken.for_user(user)
    data = {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }

    return Response(data, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


class AnnotationViewSet(viewsets.ModelViewSet):
    queryset = Annotation.objects.exclude(document__status='generated')
    serializer_class = AnnotationSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class ExportAnnotationViewSet(viewsets.ModelViewSet):
    queryset = Annotation.objects.exclude(document__status='generated')
    serializer_class = ExportAnnotationSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class DocumentAndAnnotationViewset(viewsets.ModelViewSet):
    queryset = Document.objects.exclude(status='generated')
    serializer_class = DocumentAndAnnotationSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]



@api_view(["GET"])
@permission_classes([IsAuthenticatedOrReadOnly])
def annotation_list(request, document_id):
    document = get_object_or_404(Document, id=document_id)
    annotations = Annotation.objects.filter(document=document)
    response = [annotation.json_data for annotation in annotations]
    return JsonResponse(response, safe=False)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def change_document_status(request, document_id):
    document = get_object_or_404(Document, id=document_id)

    new_status = request.data.get("status")
    print("NEW STATUS:", new_status)
    if new_status == "UNMARKED":
        if document.status == "MARKED":
            if request.user.has_perm("annotator.can_mark_as_marked"):
                document.status = new_status
                document.save()
                return Response({"message": "Document status updated successfully"})
        if document.status == "GENERATED":
            if request.user.has_perm("annotator.can_mark_as_marked"):
                document.status = new_status
                document.save()
                return Response({"message": "Document status updated successfully"})
        if document.status == "CHECKED":
            if request.user.has_perm("annotator.can_mark_as_checked"):
                document.status = new_status
                document.save()
                return Response({"message": "Document status updated successfully"})

    # Map the status to the permission
    status_permission_map = {
        "MARKED": "annotator.can_mark_as_marked",
        "CHECKED": "annotator.can_mark_as_checked",
        "GENERATED": "annotator.can_mark_as_marked",
    }

    # Get the permission corresponding to the new status
    status_permission = status_permission_map.get(new_status)
    # print(status_permission)

    # If the status is not valid, return an error
    if status_permission is None:
        return Response({"message": "Invalid status"}, status=400)

    # Check if the user has permission to update the document status
    if not request.user.has_perm(status_permission):
        return Response(
            {"message": "You do not have permission to change this document's status"},
            status=403,
        )

    # You may want to add additional checks here to ensure the status is valid

    document.status = new_status
    document.save()

    return Response({"message": "Document status updated successfully"})


class ClassifierViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = ClassifierSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DocumentPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 100


class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = DocumentPagination

    @action(detail=False, methods=["get"])
    def search(self, request):
        search_query = request.GET.get("search", "")
        search_type = request.GET.get("search_type", "title")

        law_types = (
            request.GET.get("law_types", "").split(",")
            if request.GET.get("law_types", "")
            else []
        )
        npa_values = (
            request.GET.get("npa", "").split(",") if request.GET.get("npa", "") else []
        )
        from_date = request.GET.get("from_date", None)
        to_date = request.GET.get("to_date", None)
        dominant_justifications = (
            request.GET.get("dominant_justifications", "").split(",")
            if request.GET.get("dominant_justifications", "")
            else []
        )
        doc_status = (
            request.GET.get("status", "").split(",")
            if request.GET.get("status", "")
            else []
        )

        user = request.GET.get("user", "")

        q_objects = Q()

        is_query_valid = True

        q_objects = Q()

        if search_query:
            if search_type == "text":
                q_objects |= Q(text__icontains=search_query)
            elif search_type == "id":
                try:
                    q_objects |= Q(id=int(search_query))
                except ValueError:
                    return Response(
                        []
                    )  # return empty list if search query is not a valid integer
            else:
                q_objects |= Q(title__icontains=search_query)

        if law_types:
            law_types_q_objects = Q()
            for law_type in law_types:
                law_types_q_objects |= Q(law_type__iexact=law_type)
            q_objects &= law_types_q_objects

        if dominant_justifications:
            dominant_justifications_q_objects = Q()
            for dominant_justification in dominant_justifications:
                dominant_justifications_q_objects |= Q(
                    dominant_justification__iexact=dominant_justification
                )
            q_objects &= dominant_justifications_q_objects

        if npa_values:
            npa_q_objects = Q()
            for npa in npa_values:
                npa_q_objects |= Q(NPA__iexact=npa)
            q_objects &= npa_q_objects

        if doc_status:
            status_q_objects = Q()
            for state in doc_status:
                status_q_objects |= Q(status__iexact=state)
            q_objects &= status_q_objects

        if from_date or to_date:
            from_date = (
                from_date if from_date else "2000-01-01"
            )
            if to_date:
                to_date = (
                    datetime.strptime(to_date, "%Y-%m-%d") + timedelta(days=1)
                ).isoformat()
            else:
                to_date = datetime.now().isoformat()
            q_objects &= Q(created_at__range=(from_date, to_date))  # For date range

        if user:
            q_objects &= Q(user__username__icontains=user)  # For username

        documents = Document.objects.filter(q_objects).order_by("-created_at")

        # Count the total number of documents matching the filters
        total_documents = documents.count()

        # Use pagination to paginate the results
        page = self.paginate_queryset(documents)
        if page is not None:
            serializer = self.get_serializer(page, many=True)

            # Manually add total_documents to the paginated response
            paginated_response = self.get_paginated_response(serializer.data)
            paginated_response.data["total_documents"] = total_documents
            return paginated_response

        serializer = self.get_serializer(documents, many=True)

        # Add the total_documents to the response
        return Response(
            {"total_documents": total_documents, "documents": serializer.data}
        )


@action(detail=False, methods=["get"])
@permission_classes([IsAuthenticated])
def document_statistics(request):
    # Count of Documents by User
    user_document_counts = (
        Document.objects.values("user__username")
        .annotate(total=Count("id"))
        .order_by("-total")
    )

    # Documents Count by Justification Type
    justification_counts = (
        Document.objects.values("dominant_justification")
        .annotate(total=Count("id"))
        .order_by("-total")
    )

    # Documents Count by Law Type
    law_type_counts = (
        Document.objects.values("law_type")
        .annotate(total=Count("id"))
        .order_by("-total")
    )

    # Documents Count by NPA (НПА)
    npa_counts = (
        Document.objects.values("NPA").annotate(total=Count("id")).order_by("-total")
    )

    # Documents Count by Status
    status_counts = (
        Document.objects.values("status").annotate(total=Count("id")).order_by("-total")
    )

    # Count of Documents for each points value for each justification type
    auth_points_counts = (
        Document.objects.values("AUTH_points")
        .annotate(total=Count("id"))
        .order_by("-AUTH_points")
    )
    care_points_counts = (
        Document.objects.values("CARE_points")
        .annotate(total=Count("id"))
        .order_by("-CARE_points")
    )
    loyal_points_counts = (
        Document.objects.values("LOYAL_points")
        .annotate(total=Count("id"))
        .order_by("-LOYAL_points")
    )
    fair_points_counts = (
        Document.objects.values("FAIR_points")
        .annotate(total=Count("id"))
        .order_by("-FAIR_points")
    )
    pur_points_counts = (
        Document.objects.values("PUR_points")
        .annotate(total=Count("id"))
        .order_by("-PUR_points")
    )
    non_points_counts = (
        Document.objects.values("NON_points")
        .annotate(total=Count("id"))
        .order_by("-NON_points")
    )

    # Time Series Data (Document submissions over time)
    monthly_counts = (
        Document.objects.annotate(month=TruncMonth("created_at"))
        .values("month")
        .annotate(total=Count("id"))
        .order_by("month")
    )

    justification_law_type_counts = get_justification_law_type()

    # Combine all data into a single response
    data = {
        "user_document_counts": list(user_document_counts),
        "justification_counts": list(justification_counts),
        "law_type_counts": list(law_type_counts),
        "npa_counts": list(npa_counts),
        "status_counts": list(status_counts),
        "auth_points_counts": list(auth_points_counts),
        "care_points_counts": list(care_points_counts),
        "loyal_points_counts": list(loyal_points_counts),
        "fair_points_counts": list(fair_points_counts),
        "pur_points_counts": list(pur_points_counts),
        "non_points_counts": list(non_points_counts),
        "monthly_counts": list(monthly_counts),
        "justification_law_type_counts": justification_law_type_counts,
    }

    return JsonResponse(data)


def get_justification_law_type():
    queryset = (
        Document.objects.values("dominant_justification", "law_type")
        .annotate(count=Count("id"))
        .order_by("dominant_justification", "law_type")
    )
    justification_law_type_counts = {
        j: {t: 0 for t, _ in Document.TYPE_CHOICES}
        for j, _ in Document.JUSTIFICATION_CHOICES
    }
    for entry in queryset:
        justification = entry["dominant_justification"]
        law_type = entry["law_type"]
        count = entry["count"]
        justification_law_type_counts[justification][law_type] = count
    return justification_law_type_counts


@action(detail=False, methods=["get"])
@permission_classes([IsAuthenticated])
def date_range_statistics(request):
    start_date = request.GET.get("start_date")
    end_date = request.GET.get("end_date")

    # Convert string dates to datetime objects
    start_date = datetime.strptime(start_date, "%Y-%m-%d")
    end_date = datetime.strptime(end_date, "%Y-%m-%d")
    end_date = end_date + timedelta(days=1)

    # Filter documents within the date range
    documents_in_range = Document.objects.filter(
        created_at__range=(start_date, end_date)
    )

    # Aggregate data
    total_documents = documents_in_range.count()
    user_document_counts = (
        documents_in_range.values("user__username")
        .annotate(total=Count("id"))
        .order_by("-total")
    )

    data = {
        "total_documents": total_documents,
        "user_document_counts": list(user_document_counts),
    }

    return JsonResponse(data)


label_mapping = {
    "UNCHECKED": "не проверено",
    "ALLOW": "Дозволение",
    "DUTY": "Обязанность",
    "BAN": "Запрет",
    "DEF": "Дефиниция",
    "DEC": "Декларация",
    "GOAL": "Цель",
    "OTHER": "Иное",
    "AUTH": "Авторитет",
    "CARE": "Забота",
    "LOYAL": "Лояльность",
    "FAIR": "Справедлив.",
    "PUR": "Чистота",
    "NON": "Нет окраски",
}


def resize_image(image_path_or_buffer, max_width):
    if isinstance(image_path_or_buffer, BytesIO):
        pil_image = PILImage.open(image_path_or_buffer)
    else:
        pil_image = PILImage.open(image_path_or_buffer)

    original_width, original_height = pil_image.size
    aspect_ratio = original_height / original_width
    new_height = max_width * aspect_ratio

    return Image(image_path_or_buffer, width=max_width, height=new_height)


def generate_bar_chart_image(data, labels, color, figsize):
    readable_labels = [label_mapping.get(label, label) for label in labels]

    # Increased figure size and resolution
    plt.figure(figsize=(figsize[0], figsize[1]))  # Increase figure size
    plt.bar(readable_labels, data, color=color)
    plt.xticks(rotation=60, ha="right")  # Adjust font size
    plt.tight_layout()

    # Save the plot with higher resolution
    img_buffer = BytesIO()
    plt.savefig(img_buffer, format="png", dpi=300)  # Increase resolution with dpi
    img_buffer.seek(0)
    plt.close()

    return img_buffer


def create_justification_law_type_table():
    data = get_justification_law_type()
    # header
    header = ["Моральное основание"] + [
        label_mapping[type_key] for type_key in next(iter(data.values()))
    ]

    # data rows
    table_rows = [header]
    for justification, types in data.items():
        row = [label_mapping[justification]] + [types[type_key] for type_key in types]
        table_rows.append(row)

    return table_rows


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def generate_statistics_pdf(request):
    response = HttpResponse(content_type="application/pdf")
    response["Content-Disposition"] = 'attachment; filename="statistics.pdf"'

    # Fetch the justification data
    justification_counts = (
        Document.objects.values("dominant_justification")
        .annotate(total=Count("id"))
        .order_by("-total")
    )

    # Create a SimpleDocTemplate object
    doc = SimpleDocTemplate(
        response,
        pagesize=letter,
        topMargin=1,
        leftMargin=10,
        rightMargin=10,
        bottomMargin=10,
    )

    # Set up styles
    styles = getSampleStyleSheet()

    custom_dark_blue = Color(0, 0, 0.3)
    law_type_color = HexColor("#82ca9d")
    justification_color = HexColor("#8884d8")

    white_font_style = ParagraphStyle(
        "WhiteFont", parent=styles["Normal"], fontSize=10, textColor=colors.whitesmoke
    )
    heading_style = ParagraphStyle(
        "HeadingStyle",
        parent=white_font_style,
        alignment=TA_LEFT,
        fontName="Roboto-Bold",
    )
    date_style = ParagraphStyle(
        "DateStyle", parent=white_font_style, alignment=TA_RIGHT, fontName="Roboto-Bold"
    )

    # Heading and date
    heading_text = "<para leftIndent=10>Статистика инструмента для сбора датасета Индекса Этичности</para>"
    date_text = "<para rightIndent=10>{}</para>".format(
        timezone.now().strftime("%d.%m.%Y")
    )
    heading = Paragraph(heading_text, heading_style)
    date = Paragraph(date_text, date_style)

    # Table to align heading and date on a blue background
    header_content = [[heading, date]]
    header_table = Table(
        header_content, colWidths=[7 * inch, 1 * inch], rowHeights=[0.3 * inch]
    )
    header_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), custom_dark_blue),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )

    # Create elements list for Platypus
    elements = [header_table]

    status_names = {
        "MARKED": "Размечено, не проверено",
        "CHECKED": "Проверено",
        "UNMARKED": "Не размечено",
        "GENERATED": "Сгенерировано",
    }

    # Fetch status counts data and apply the mapping
    status_counts = (
        Document.objects.values("status").annotate(total=Count("id")).order_by("-total")
    )
    # Calculate the total number of documents
    total_documents = sum(item["total"] for item in status_counts)
    labels = ["Всего документов"] + [status_names[st["status"]] for st in status_counts]
    values = [str(total_documents)] + [str(st["total"]) for st in status_counts]
    # Create a table for the rectangle
    rectangle_data = [labels, values]
    rectangle_table = Table(rectangle_data, colWidths=[2 * inch] * 4)
    rectangle_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), HexColor("#F8F8F8")),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("FONTNAME", (0, 0), (-1, -1), "Roboto"),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.black),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )

    # Add the rectangle table to elements list
    elements = [
        header_table,
        Spacer(1, 0.2 * inch),
        rectangle_table,
        Spacer(1, 0.2 * inch),
    ]

    # Create table data for justification counts
    # Mapping for justification names

    # Mapping for law type names
    law_type_names = {
        "UNCHECKED": "не проверено",
        "ALLOW": "Дозволение",
        "DUTY": "Обязанность",
        "BAN": "Запрет",
        "DEF": "Дефиниция",
        "DEC": "Декларация",
        "GOAL": "Цель",
        "OTHER": "Иное",
    }

    # Fetch law type counts data and apply the mapping
    law_type_counts = (
        Document.objects.values("law_type")
        .annotate(total=Count("id"))
        .order_by("-total")
    )
    law_type_data = [
        [law_type_names.get(law_type["law_type"], "Other"), law_type["total"]]
        for law_type in law_type_counts
    ]

    justification_names = {
        "UNCHECKED": "не проверено",
        "AUTH": "Авторитет",
        "CARE": "Забота",
        "LOYAL": "Лояльность",
        "FAIR": "Справедливость",
        "PUR": "Чистота",
        "NON": "Нет этической окраски",
    }

    # Fetch justification counts data and apply the mapping
    justification_counts = (
        Document.objects.values("dominant_justification")
        .annotate(total=Count("id"))
        .order_by("-total")
    )
    justification_data = [
        [
            justification_names.get(justification["dominant_justification"], "Other"),
            justification["total"],
        ]
        for justification in justification_counts
    ]

    # Create a table for justifications

    justification_table = Table(justification_data, colWidths=[2 * inch, 1 * inch])
    justification_table.setStyle(
        TableStyle(
            [
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("FONTNAME", (0, 0), (-1, -1), "Roboto"),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.black),
                ("GRID", (0, 0), (-1, -1), 1, colors.black),
                ("BACKGROUND", (0, 0), (-1, -1), justification_color),
            ]
        )
    )

    law_type_table = Table(law_type_data, colWidths=[2 * inch, 1 * inch])
    law_type_table.setStyle(
        TableStyle(
            [
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("FONTNAME", (0, 0), (-1, -1), "Roboto"),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.black),
                ("GRID", (0, 0), (-1, -1), 1, colors.black),
                ("BACKGROUND", (0, 0), (-1, -1), law_type_color),
            ]
        )
    )

    # Graphs
    justification_graph_data = [item["total"] for item in justification_counts]
    justification_graph_labels = [
        item["dominant_justification"] for item in justification_counts
    ]
    justification_img = generate_bar_chart_image(
        justification_graph_data, justification_graph_labels, "#8884d8", (6, 4)
    )

    law_type_graph_data = [item["total"] for item in law_type_counts]
    law_type_graph_labels = [item["law_type"] for item in law_type_counts]
    law_type_img = generate_bar_chart_image(
        law_type_graph_data, law_type_graph_labels, "#82ca9d", (6, 4)
    )

    heading_style = ParagraphStyle("HeadingStyle", fontName="Roboto-Bold")
    justification_title = Paragraph("Профиль нормы", heading_style)
    law_type_title = Paragraph("Тип нормы", heading_style)
    # Adjustments for the layout table to position tables closer to corners and add a larger gap
    layout_table_data = [
        [justification_title, "", law_type_title],
        [justification_table, "", law_type_table],
    ]
    # Increase the width of the gap and adjust the table widths
    layout_table = Table(
        layout_table_data, colWidths=[3 * inch, 1 * inch, 3 * inch]
    )  # Adjust widths as needed
    layout_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                (
                    "BACKGROUND",
                    (1, 0),
                    (1, 0),
                    colors.white,
                ),  # Optional: background color for the gap
            ]
        )
    )

    # Add the layout table to elements list
    elements.append(layout_table)

    max_image_width = 3.9 * inch

    # Resize images while maintaining aspect ratio
    justification_image = resize_image(justification_img, max_image_width)
    law_type_image = resize_image(law_type_img, max_image_width)

    layout_table_data_graphs = [[justification_image, "", law_type_image]]

    layout_table_graphs = Table(
        layout_table_data_graphs, colWidths=[3.9 * inch, 0.18 * inch, 3.9 * inch]
    )
    layout_table_graphs.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("BACKGROUND", (1, 0), (1, 0), colors.white),
            ]
        )
    )

    elements.append(layout_table_graphs)

    centered_title_style = ParagraphStyle(
        "CenteredTitle",
        parent=styles["Normal"],
        alignment=TA_CENTER,
        fontSize=12,
        spaceAfter=6,
        fontName="Roboto-Bold",
    )

    monthly_counts = (
        Document.objects.annotate(month=TruncMonth("created_at"))
        .values("month")
        .annotate(total=Count("id"))
        .order_by("month")
    )

    # Prepare data for the monthly upload graph
    months = [month["month"].strftime("%Y-%m") for month in monthly_counts]
    counts = [month["total"] for month in monthly_counts]

    # Generate the monthly upload graph image
    monthly_upload_img = generate_bar_chart_image(counts, months, "darkorange", (10, 6))
    monthly_upload_graph = resize_image(monthly_upload_img, 6 * inch)
    month_graph_title = Paragraph("Статистика по месяцам", centered_title_style)
    elements.extend(
        [
            month_graph_title,  # Title for the NPA table
            Spacer(1, 0.1 * inch),  # Space between title and table
            monthly_upload_graph,  # The NPA table
            PageBreak(),
        ]
    )

    # Mapping for NPA type names
    npa_names = NPA

    npa_title = Paragraph("Статистика по НПА", centered_title_style)
    # Fetch NPA counts data and apply the mapping
    npa_counts = (
        Document.objects.values("NPA").annotate(total=Count("id")).order_by("-total")
    )
    npa_data = [
        [npa_names.get(npa["NPA"], "Other"), npa["total"]] for npa in npa_counts
    ]

    # Create a table for NPA types
    npa_table = Table(
        npa_data, colWidths=[7.3 * inch, 0.7 * inch]
    )  # Adjust column widths as needed
    npa_table.setStyle(
        TableStyle(
            [
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("FONTNAME", (0, 0), (-1, -1), "Roboto"),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.black),
                ("GRID", (0, 0), (-1, -1), 1, colors.black),
            ]
        )
    )

    # Add the NPA table to elements list
    # Assume elements already contains other components like rectangles, other tables, etc.
    elements.extend(
        [
            npa_title,  # Title for the NPA table
            Spacer(1, 0.1 * inch),  # Space between title and table
            npa_table,  # The NPA table
            Spacer(1, 0.1 * inch),  # Space between table and next title
        ]
    )

    # Create a table for justification_law_type
    justification_law_type_title = Paragraph(
        "Таблица сопоставления типов норм и обоснований", centered_title_style
    )

    justification_law_type_table_data = create_justification_law_type_table()

    justification_law_type_table = Table(justification_law_type_table_data)

    justification_law_type_table.setStyle(
        TableStyle(
            [
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("FONTNAME", (0, 0), (-1, -1), "Roboto"),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.black),
                ("GRID", (0, 0), (-1, -1), 1, colors.black),
                ("BACKGROUND", (0, 0), (0, -1), colors.lightblue),
                ("BACKGROUND", (0, 0), (-1, 0), colors.orange),
            ]
        )
    )
    elements.extend(
        [
            justification_law_type_title,
            Spacer(1, 0.1 * inch),
            justification_law_type_table,
        ]
    )

    # Build the PDF
    doc.build(elements)

    return response
