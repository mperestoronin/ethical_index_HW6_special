from django.contrib import admin

from annotator.models import Document


class DocumentAdmin(admin.ModelAdmin):
    exclude = (
        "law_justification",
        "law_type",
    )


admin.site.register(Document, DocumentAdmin)
