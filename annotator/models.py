import re
import uuid

from django.contrib.auth.models import User
from django.db import models

from app_config.npa import NPA

_RE_NEWLINE = re.compile(r"\n+")


class Document(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, verbose_name="Пользователь"
    )
    title = models.CharField(max_length=255, verbose_name="Название")
    text = models.TextField(verbose_name="Текст")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")

    JUSTIFICATION_CHOICES = [
        ("AUTH", "Авторитет"),
        ("CARE", "Забота"),
        ("LOYAL", "Лояльность"),
        ("FAIR", "Справедливость"),
        ("PUR", "Чистота"),
        ("NON", "Нет этической окраски"),
        ("UNCHECKED", "Не проверено"),
    ]

    TYPE_CHOICES = [
        ("DUTY", "Обязанность"),
        ("ALLOW", "Дозволение"),
        ("BAN", "Запрет"),
        ("DEF", "Дефиниция"),
        ("DEC", "Декларация"),
        ("GOAL", "Цель"),
        ("UNCHECKED", "Не проверено"),
        ("OTHER", "Иное"),
    ]

    NPA_CHOICES = NPA

    STATUS_CHOICES = [
        ("UNMARKED", "Не размечено"),
        ("MARKED", "Размечено"),
        ("CHECKED", "Проверено"),
        ("GENERATED", "Сгенерировано"),
    ]

    AUTH_points = models.PositiveIntegerField(default=0)
    CARE_points = models.PositiveIntegerField(default=0)
    LOYAL_points = models.PositiveIntegerField(default=0)
    FAIR_points = models.PositiveIntegerField(default=0)
    PUR_points = models.PositiveIntegerField(default=0)
    NON_points = models.PositiveIntegerField(default=0)

    dominant_justification = models.CharField(
        max_length=50,
        choices=JUSTIFICATION_CHOICES,
        default="UNCHECKED",
        verbose_name="Доминирующее обоснование закона",
        blank=True,
    )

    law_type = models.CharField(
        max_length=50,
        choices=TYPE_CHOICES,
        default="UNCHECKED",
        verbose_name="Тип закона",
    )

    NPA = models.CharField(
        max_length=50,
        choices=NPA_CHOICES,
        default="NOTSELECTED",
        verbose_name="НПА",
    )

    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default="UNMARKED",
        verbose_name="Статус",
    )

    def calculate_dominant_justification(self):
        justifications_points = {
            "AUTH": self.AUTH_points,
            "CARE": self.CARE_points,
            "LOYAL": self.LOYAL_points,
            "FAIR": self.FAIR_points,
            "PUR": self.PUR_points,
            "NON": self.NON_points,
        }
        if all(value == 0 for value in justifications_points.values()):
            return "UNCHECKED"
        return max(justifications_points, key=justifications_points.get)

    def save(self, *args, **kwargs):
        self.text = self.text.strip().replace("\r", "\n")
        self.text = _RE_NEWLINE.sub("\n", self.text)

        if self.pk:
            old_doc = Document.objects.get(pk=self.pk)
            if old_doc.text != self.text:
                Annotation.objects.filter(document_id=self.pk).delete()
        self.dominant_justification = self.calculate_dominant_justification()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

    class Meta:
        verbose_name = "Документ"
        verbose_name_plural = "Документы"
        permissions = [
            ("can_mark_as_marked", "Can mark document as marked"),
            ("can_mark_as_checked", "Can mark document as checked"),
        ]


class Annotation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(Document, on_delete=models.CASCADE)
    start = models.IntegerField()
    end = models.IntegerField()
    orig_text = models.TextField()
    comment = models.TextField(blank=True, null=True)

    law_type = models.CharField(
        max_length=50,
        choices=Document.TYPE_CHOICES,
        default="UNCHECKED",
        verbose_name="Тип закона",
    )
    law_justification = models.CharField(
        max_length=50,
        choices=Document.JUSTIFICATION_CHOICES,
        default="UNCHECKED",
        verbose_name="Обоснование закона",
    )

    json_data = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
