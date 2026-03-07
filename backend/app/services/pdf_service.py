"""
PDF generation service using Jinja2 templates and WeasyPrint.

WeasyPrint requires native GTK libraries. When not available (e.g. on
Windows dev machines) the service raises an HTTP 501 rather than crashing
the whole application on import.
"""

import logging
import os
import tempfile
import uuid

logger = logging.getLogger(__name__)

TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "..", "templates")
OUTPUT_DIR = os.path.join(tempfile.gettempdir(), "sevasetu_pdfs")
os.makedirs(OUTPUT_DIR, exist_ok=True)


class PDFService:
    @staticmethod
    def generate_form_pdf(form_data: dict, instructions: dict, checklist: list) -> str:
        """
        Render form_data using the Jinja2 HTML template and convert to PDF.

        Returns the absolute path to the generated PDF file.
        Raises HTTP 501 if WeasyPrint or Jinja2 is not installed.
        """
        try:
            from jinja2 import Environment, FileSystemLoader
            from weasyprint import HTML
        except ImportError as exc:
            from fastapi import HTTPException

            raise HTTPException(
                status_code=501,
                detail=f"PDF generation is not available on this server: {exc}",
            ) from exc

        env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))
        template = env.get_template("form_template.html")

        rendered_html = template.render(
            form_data=form_data,
            instructions=instructions,
            checklist=checklist,
        )

        filename = f"{uuid.uuid4()}_submission.pdf"
        output_path = os.path.join(OUTPUT_DIR, filename)
        HTML(string=rendered_html).write_pdf(output_path)
        logger.info("PDF generated: %s", output_path)
        return output_path
