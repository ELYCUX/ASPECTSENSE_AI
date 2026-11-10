"""
Report Routes — PDF, Excel, and CSV report generation.
PDF uses ReportLab; Excel uses openpyxl.
"""
import io
import csv
import json
import datetime
import logging
from flask import Blueprint, jsonify, send_file, request, g
from middleware.auth import token_required
from config.db import execute_query

logger = logging.getLogger(__name__)
report_bp = Blueprint('reports', __name__)


def get_report_data(product_id=None, user_id=None, is_admin=False):
    """Fetch data needed for reports."""
    where_parts = []
    params = []
    
    if product_id:
        params.append(product_id)
        where_parts.append(f"r.product_id = ${len(params)}")
        
    if not is_admin and user_id:
        params.append(user_id)
        where_parts.append(f"(r.user_id = ${len(params)} OR r.is_shared = TRUE OR r.user_id IS NULL)")
        
    where_clause = f"WHERE {' AND '.join(where_parts)}" if where_parts else ""
    
    query = f"""SELECT r.id, COALESCE(p.name, 'General Product') as product_name, r.user_name, r.rating, r.sentiment, 
                       r.body, r.created_at, r.aspects, r.source
                FROM reviews r 
                LEFT JOIN products p ON r.product_id = p.id
                {where_clause}
                ORDER BY r.created_at DESC
                LIMIT 1000"""
    return execute_query(query, params if params else None, fetch_all=True)


def parse_aspects(aspects_raw):
    """Parse aspect JSON column."""
    if not aspects_raw:
        return {}
    if isinstance(aspects_raw, dict):
        return aspects_raw
    try:
        return json.loads(aspects_raw)
    except Exception:
        return {}


@report_bp.route('/csv', methods=['GET'])
@token_required
def export_csv():
    try:
        product_id = request.args.get('productId')
        user_id = g.user.get('id') if hasattr(g, 'user') and g.user else None
        is_admin = (g.user.get('role') == 'admin') if hasattr(g, 'user') and g.user else False
        reviews = get_report_data(product_id, user_id=user_id, is_admin=is_admin)

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['Review ID', 'Product', 'Reviewer', 'Rating', 'Sentiment', 'Aspects', 'Review Text', 'Source', 'Date'])

        for r in reviews:
            aspects = parse_aspects(r.get('aspects'))
            aspect_str = '; '.join(f"{k}: {v}" for k, v in aspects.items()) if aspects else ''
            date = r['created_at'].isoformat() if hasattr(r.get('created_at'), 'isoformat') else str(r.get('created_at', ''))
            writer.writerow([
                r['id'], r['product_name'], r['user_name'],
                r['rating'], r['sentiment'], aspect_str, r['body'],
                r.get('source', 'manual'), date
            ])

        mem = io.BytesIO()
        mem.write(output.getvalue().encode('utf-8-sig'))  # BOM for Excel compatibility
        mem.seek(0)

        return send_file(
            mem,
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'aspect_sense_report_{datetime.date.today()}.csv'
        )
    except Exception as e:
        logger.error(f"CSV Export error: {e}")
        return jsonify({'success': False, 'message': 'Failed to generate CSV'}), 500


@report_bp.route('/excel', methods=['GET'])
@token_required
def export_excel():
    try:
        import openpyxl
        from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
        from openpyxl.utils import get_column_letter

        product_id = request.args.get('productId')
        user_id = g.user.get('id') if hasattr(g, 'user') and g.user else None
        is_admin = (g.user.get('role') == 'admin') if hasattr(g, 'user') and g.user else False
        reviews = get_report_data(product_id, user_id=user_id, is_admin=is_admin)

        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Reviews"

        # Header styling
        header_fill = PatternFill(start_color="1E3A5F", end_color="1E3A5F", fill_type="solid")
        header_font = Font(color="FFFFFF", bold=True, size=11)
        header_align = Alignment(horizontal="center", vertical="center")

        headers = ['ID', 'Product', 'Reviewer', 'Rating', 'Sentiment', 'Aspects', 'Review Text', 'Source', 'Date']
        for col, header in enumerate(headers, 1):
            cell = ws.cell(row=1, column=col, value=header)
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = header_align

        ws.row_dimensions[1].height = 25

        # Data rows
        sentiment_colors = {'positive': 'D4EDDA', 'negative': 'F8D7DA', 'neutral': 'E2E3E5'}
        for row_idx, r in enumerate(reviews, 2):
            aspects = parse_aspects(r.get('aspects'))
            aspect_str = '; '.join(f"{k}: {v}" for k, v in aspects.items()) if aspects else ''
            date = r['created_at'].isoformat() if hasattr(r.get('created_at'), 'isoformat') else str(r.get('created_at', ''))
            sentiment = r.get('sentiment', 'neutral')

            row_data = [
                r['id'], r['product_name'], r['user_name'],
                r['rating'], sentiment.capitalize(), aspect_str, r['body'],
                r.get('source', 'manual'), date
            ]

            for col, value in enumerate(row_data, 1):
                cell = ws.cell(row=row_idx, column=col, value=value)
                if col == 5:  # Sentiment column
                    color = sentiment_colors.get(sentiment, 'FFFFFF')
                    cell.fill = PatternFill(start_color=color, end_color=color, fill_type="solid")

        # Column widths
        col_widths = [8, 25, 20, 8, 12, 40, 60, 15, 20]
        for col, width in enumerate(col_widths, 1):
            ws.column_dimensions[get_column_letter(col)].width = width

        # Summary sheet
        ws_summary = wb.create_sheet("Summary")
        ws_summary['A1'] = "AspectSense AI — Review Report"
        ws_summary['A1'].font = Font(bold=True, size=14)
        ws_summary['A3'] = f"Generated: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M')}"
        ws_summary['A4'] = f"Total Reviews: {len(reviews)}"

        if reviews:
            avg = round(sum(r['rating'] for r in reviews) / len(reviews), 2)
            pos = sum(1 for r in reviews if r.get('sentiment') == 'positive')
            neg = sum(1 for r in reviews if r.get('sentiment') == 'negative')
            neu = sum(1 for r in reviews if r.get('sentiment') == 'neutral')
            ws_summary['A5'] = f"Average Rating: {avg}/5"
            ws_summary['A6'] = f"Positive: {pos} | Negative: {neg} | Neutral: {neu}"

        mem = io.BytesIO()
        wb.save(mem)
        mem.seek(0)

        return send_file(
            mem,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=f'aspect_sense_report_{datetime.date.today()}.xlsx'
        )

    except ImportError:
        logger.warning("openpyxl not installed. Falling back to CSV.")
        return export_csv()
    except Exception as e:
        logger.error(f"Excel Export error: {e}")
        return jsonify({'success': False, 'message': 'Failed to generate Excel report'}), 500


@report_bp.route('/pdf', methods=['GET'])
@token_required
def export_pdf():
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.colors import HexColor, white, black
        from reportlab.lib.units import mm
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
        from reportlab.lib.enums import TA_CENTER, TA_LEFT

        product_id = request.args.get('productId')
        user_id = g.user.get('id') if hasattr(g, 'user') and g.user else None
        is_admin = (g.user.get('role') == 'admin') if hasattr(g, 'user') and g.user else False
        reviews = get_report_data(product_id, user_id=user_id, is_admin=is_admin)

        buf = io.BytesIO()
        doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=20*mm, bottomMargin=20*mm,
                                leftMargin=20*mm, rightMargin=20*mm)

        styles = getSampleStyleSheet()
        PRIMARY = HexColor('#1E3A5F')
        ACCENT = HexColor('#4F46E5')
        POS_CLR = HexColor('#16A34A')
        NEG_CLR = HexColor('#DC2626')
        NEU_CLR = HexColor('#6B7280')

        title_style = ParagraphStyle('Title', parent=styles['Title'], fontSize=22,
                                     textColor=PRIMARY, spaceAfter=4)
        subtitle_style = ParagraphStyle('Sub', parent=styles['Normal'], fontSize=10,
                                        textColor=HexColor('#64748B'), spaceAfter=12)
        section_style = ParagraphStyle('Section', parent=styles['Heading2'], fontSize=13,
                                       textColor=PRIMARY, spaceBefore=16, spaceAfter=6)
        normal_style = ParagraphStyle('NormalP', parent=styles['Normal'], fontSize=9,
                                      leading=13, textColor=HexColor('#1E293B'))

        elements = []

        # Title
        elements.append(Paragraph("AspectSense AI — Review Report", title_style))
        elements.append(Paragraph(
            f"Generated on {datetime.datetime.now().strftime('%B %d, %Y at %H:%M')} · {len(reviews)} reviews",
            subtitle_style
        ))
        elements.append(HRFlowable(width="100%", thickness=1, color=ACCENT))
        elements.append(Spacer(1, 12))

        # Summary statistics
        if reviews:
            avg_rating = round(sum(r['rating'] for r in reviews) / len(reviews), 2)
            pos = sum(1 for r in reviews if r.get('sentiment') == 'positive')
            neg = sum(1 for r in reviews if r.get('sentiment') == 'negative')
            neu = sum(1 for r in reviews if r.get('sentiment') == 'neutral')

            elements.append(Paragraph("Summary Statistics", section_style))

            stats_data = [
                ['Metric', 'Value'],
                ['Total Reviews', str(len(reviews))],
                ['Average Rating', f"{avg_rating} / 5.0"],
                ['Positive Reviews', str(pos)],
                ['Negative Reviews', str(neg)],
                ['Neutral Reviews', str(neu)],
            ]
            stats_table = Table(stats_data, colWidths=[80*mm, 80*mm])
            stats_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), ACCENT),
                ('TEXTCOLOR', (0, 0), (-1, 0), white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [HexColor('#F8FAFC'), white]),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
                ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#E2E8F0')),
                ('ALIGN', (1, 0), (1, -1), 'CENTER'),
                ('PADDING', (0, 0), (-1, -1), 6),
            ]))
            elements.append(stats_table)
            elements.append(Spacer(1, 16))

        # Reviews table
        elements.append(Paragraph("Review Details", section_style))

        table_data = [['Product', 'Reviewer', 'Rating', 'Sentiment', 'Review (excerpt)']]
        for r in reviews[:50]:  # Limit to 50 for PDF readability
            text_excerpt = r['body'][:120] + '...' if len(r['body']) > 120 else r['body']
            sent = r.get('sentiment', 'neutral')
            table_data.append([
                Paragraph(str(r['product_name'])[:30], normal_style),
                Paragraph(str(r['user_name'])[:20], normal_style),
                str(r['rating']) + '★',
                Paragraph(sent.capitalize(), normal_style),
                Paragraph(text_excerpt, normal_style),
            ])

        review_table = Table(table_data, colWidths=[40*mm, 30*mm, 15*mm, 22*mm, 63*mm])
        review_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [HexColor('#F8FAFC'), white]),
            ('GRID', (0, 0), (-1, -1), 0.3, HexColor('#E2E8F0')),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('PADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(review_table)

        if len(reviews) > 50:
            elements.append(Spacer(1, 8))
            elements.append(Paragraph(f"* Showing 50 of {len(reviews)} reviews. Download Excel for full data.", subtitle_style))

        doc.build(elements)
        buf.seek(0)

        return send_file(
            buf,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'aspect_sense_report_{datetime.date.today()}.pdf'
        )

    except ImportError:
        logger.warning("ReportLab not installed.")
        return jsonify({'success': False, 'message': 'PDF generation requires ReportLab (install it in venv).'}), 500
    except Exception as e:
        logger.error(f"PDF Export error: {e}", exc_info=True)
        return jsonify({'success': False, 'message': 'Failed to generate PDF report'}), 500
