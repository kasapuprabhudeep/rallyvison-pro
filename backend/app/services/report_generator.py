from pathlib import Path
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from app.core.config import REPORTS_DIR

class ReportGenerator:
    """
    Generates professional, publication-grade PDF Match Performance Reports
    complete with player stats, rally breakdowns, shot distributions, and coaching recommendations.
    """

    @classmethod
    def generate_pdf_report(
        cls,
        match_id: int,
        match_data: Dict[str, Any],
        user_data: Dict[str, Any],
        analytics: Dict[str, Any],
        recommendations: List[Dict[str, Any]],
        video_metadata: Dict[str, Any]
    ) -> str:
        report_filename = f"rallyvision_report_match_{match_id}.pdf"
        output_path = REPORTS_DIR / report_filename

        doc = SimpleDocTemplate(
            str(output_path),
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        
        # Custom color scheme matching RallyVision Pro
        navy_dark = colors.HexColor("#060913")
        slate_blue = colors.HexColor("#0f1936")
        accent_cyan = colors.HexColor("#0090ff")
        accent_blue = colors.HexColor("#3b82f6")
        text_dark = colors.HexColor("#0f172a")
        text_muted = colors.HexColor("#64748b")
        bg_light = colors.HexColor("#f8fafc")

        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=24,
            leading=28,
            textColor=navy_dark,
            spaceAfter=4
        )

        subtitle_style = ParagraphStyle(
            'ReportSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=11,
            leading=14,
            textColor=text_muted,
            spaceAfter=15
        )

        section_heading = ParagraphStyle(
            'SectionHeading',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=14,
            leading=18,
            textColor=navy_dark,
            spaceBefore=14,
            spaceAfter=8
        )

        body_style = ParagraphStyle(
            'ReportBody',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9.5,
            leading=13,
            textColor=text_dark
        )

        badge_style = ParagraphStyle(
            'BadgeStyle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8,
            textColor=colors.white
        )

        elements = []

        # 1. Header Banner
        elements.append(Paragraph("<b>RALLYVISION PRO</b> — TOURNAMENT PERFORMANCE DOSSIER", title_style))
        elements.append(Paragraph(f"BWF Court Telemetry Dossier • Match: <b>{match_data.get('title', 'Badminton Match')}</b> | Analyzed on {match_data.get('created_at', '')[:10]}", subtitle_style))
        elements.append(HRFlowable(width="100%", thickness=2, color=accent_cyan, spaceAfter=15))

        # 2. Match & Player Meta Table
        meta_data = [
            [
                Paragraph("<b>Player:</b> " + user_data.get('full_name', 'Player'), body_style),
                Paragraph("<b>Match Format:</b> " + match_data.get('match_type', 'SINGLES'), body_style),
                Paragraph("<b>Opponent:</b> " + (match_data.get('opponent_name') or 'N/A'), body_style),
            ],
            [
                Paragraph("<b>Video Duration:</b> " + f"{video_metadata.get('duration_seconds', 0):.1f}s", body_style),
                Paragraph("<b>Frame Rate:</b> " + f"{video_metadata.get('fps', 30.0)} FPS", body_style),
                Paragraph("<b>Resolution:</b> " + f"{video_metadata.get('width', 1920)}x{video_metadata.get('height', 1080)}", body_style),
            ]
        ]
        meta_table = Table(meta_data, colWidths=[180, 180, 180])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), bg_light),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#e2e8f0")),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 15))

        # 3. Key Performance Indicators (KPI Grid)
        elements.append(Paragraph("Key Performance Metrics", section_heading))
        kpi_data = [
            [
                Paragraph("<b>Metric</b>", body_style),
                Paragraph("<b>Recorded Value</b>", body_style),
                Paragraph("<b>Benchmark / Context</b>", body_style),
            ],
            [
                Paragraph("Total Movement Distance", body_style),
                Paragraph(f"<b>{analytics.get('total_movement_distance_m', 0):.1f} m</b>", body_style),
                Paragraph("Metric distance on standard court", body_style),
            ],
            [
                Paragraph("Average Movement Speed", body_style),
                Paragraph(f"<b>{analytics.get('avg_movement_speed_kmh', 0):.1f} km/h</b>", body_style),
                Paragraph("Continuous footwork velocity", body_style),
            ],
            [
                Paragraph("Peak Movement Speed", body_style),
                Paragraph(f"<b>{analytics.get('max_movement_speed_kmh', 0):.1f} km/h</b>", body_style),
                Paragraph("Explosive lunging & sprint bursts", body_style),
            ],
            [
                Paragraph("Base Position Recovery Rate", body_style),
                Paragraph(f"<b>{analytics.get('base_recovery_rate_percent', 0):.1f}%</b>", body_style),
                Paragraph("Target > 55% central reset", body_style),
            ],
            [
                Paragraph("Total Detected Rallies", body_style),
                Paragraph(f"<b>{analytics.get('total_rallies', 0)}</b>", body_style),
                Paragraph(f"Avg duration: {analytics.get('avg_rally_duration_sec', 0):.1f}s", body_style),
            ],
            [
                Paragraph("Total Recorded Shots", body_style),
                Paragraph(f"<b>{analytics.get('total_shots', 0)}</b>", body_style),
                Paragraph(f"Avg {analytics.get('avg_shots_per_rally', 0):.1f} shots/rally", body_style),
            ],
            [
                Paragraph("Work-to-Rest Ratio", body_style),
                Paragraph(f"<b>1 : {analytics.get('work_to_rest_ratio', 0):.1f}</b>", body_style),
                Paragraph("Active play vs downtime ratio", body_style),
            ],
            [
                Paragraph("Estimated Energy & Calories", body_style),
                Paragraph(f"<b>~{analytics.get('estimated_calories_burned', int(analytics.get('total_movement_distance_m', 0)*0.4))} kcal</b>", body_style),
                Paragraph(f"Approx {analytics.get('estimated_steps', int(analytics.get('total_movement_distance_m', 0)/0.72))} athletic steps", body_style),
            ],
            [
                Paragraph("Player Archetype & Style", body_style),
                Paragraph(f"<b>{analytics.get('player_archetype', 'All-Round Dynamo 🏸')}</b>", body_style),
                Paragraph("Tactical court personality", body_style),
            ]
        ]
        kpi_table = Table(kpi_data, colWidths=[180, 160, 200])
        kpi_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), slate_blue),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, bg_light])
        ]))
        elements.append(kpi_table)
        elements.append(Spacer(1, 15))

        # 4. Shot Distribution & Tactical Zone Coverage
        elements.append(Paragraph("Tactical Breakdown & Shot Distribution", section_heading))
        shot_dist = analytics.get("shot_distribution", {})
        shots_summary = ", ".join([f"{k}: {v}" for k, v in shot_dist.items()]) or "No shots categorized"
        
        zone_occ = analytics.get("court_zone_occupancy", {})
        zone_summary = f"Front Court: {zone_occ.get('FRONT_LEFT', 0) + zone_occ.get('FRONT_RIGHT', 0):.1f}% | Mid Court: {zone_occ.get('MID_LEFT', 0) + zone_occ.get('MID_RIGHT', 0):.1f}% | Rear Court: {zone_occ.get('REAR_LEFT', 0) + zone_occ.get('REAR_RIGHT', 0):.1f}%"
        
        breakdown_data = [
            [Paragraph("<b>Shot Category Counts:</b>", body_style), Paragraph(shots_summary, body_style)],
            [Paragraph("<b>Court Zone Occupancy:</b>", body_style), Paragraph(zone_summary, body_style)],
        ]
        b_table = Table(breakdown_data, colWidths=[150, 390])
        b_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), bg_light),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#e2e8f0")),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
        ]))
        elements.append(b_table)
        elements.append(Spacer(1, 15))

        # 5. Tactical Coaching Drills & Action Plan
        elements.append(Paragraph("Tactical Coaching Drills & Biomechanical Action Plan", section_heading))
        if recommendations:
            for rec in recommendations:
                rec_card = [
                    [Paragraph(f"<b>[{rec.get('category')}] {rec.get('title')}</b> (Priority: {rec.get('priority')})", body_style)],
                    [Paragraph(f"<i>Evidence:</i> {rec.get('observation')}", body_style)],
                    [Paragraph(f"<b>Drill / Action:</b> {rec.get('recommendation')}", body_style)]
                ]
                r_table = Table(rec_card, colWidths=[540])
                r_table.setStyle(TableStyle([
                    ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f0fdf4")),
                    ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#86efac")),
                    ('TOPPADDING', (0,0), (-1,-1), 5),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 5),
                    ('LEFTPADDING', (0,0), (-1,-1), 8),
                ]))
                elements.append(r_table)
                elements.append(Spacer(1, 6))
        else:
            elements.append(Paragraph("More match footage recommended to establish statistical baseline.", body_style))

        elements.append(Spacer(1, 15))

        # 6. Technical Limitations & Scientific Methodology
        elements.append(Paragraph("Sports Science & Optical Methodology", section_heading))
        disclaimer_text = (
            "<b>Measurement Accuracy Notice:</b> Metric distances are computed using 4-point homography projection "
            "against BWF standard dimensions (13.4m x 5.18m/6.1m). Shuttlecock speeds on standard consumer footage (<60 FPS) "
            "are subject to optical shutter blur and motion inter-frame interpolation limitations; speed figures are flagged accordingly. "
            "Stroke classification integrates kinematic body positioning, reach height, and spatial trajectory vectors.<br/><br/>"
            "<i>Published by RallyVision Sports Technologies, Inc. • Certified Optical Telemetry Engine v2.4.0 • Compliant with BWF Court Laws</i>"
        )
        elements.append(Paragraph(disclaimer_text, ParagraphStyle('Disc', parent=styles['Normal'], fontSize=8, leading=11, textColor=text_muted)))

        doc.build(elements)
        return f"/storage/reports/{report_filename}"

