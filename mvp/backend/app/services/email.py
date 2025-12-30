"""
Email notification service for sending transactional emails.
"""

import os
from typing import Optional, Dict, Any, List
from datetime import datetime
from jinja2 import Template

from app.core.config import settings


class EmailService:
    """
    Service for sending email notifications.

    Note: In production, integrate with SendGrid, AWS SES, or similar.
    For development, this logs emails instead of sending them.
    """

    def __init__(self):
        """Initialize email service."""
        self.enabled = settings.EMAIL_ENABLED if hasattr(settings, 'EMAIL_ENABLED') else False
        self.from_email = getattr(settings, 'FROM_EMAIL', 'noreply@commonground.app')
        self.from_name = "CommonGround"

    async def send_case_invitation(
        self,
        to_email: str,
        to_name: str,
        inviter_name: str,
        case_name: str,
        invitation_link: str,
        children_names: List[str]
    ) -> bool:
        """
        Send case invitation email.

        Args:
            to_email: Recipient email
            to_name: Recipient name
            inviter_name: Name of person sending invitation
            case_name: Name of the case
            invitation_link: Link to accept invitation
            children_names: List of children's names

        Returns:
            Success status
        """
        subject = f"{inviter_name} invited you to collaborate on {case_name}"

        children_list = ", ".join(children_names) if children_names else "your children"

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #2563EB; color: white; padding: 20px; text-align: center; }}
                .content {{ background: #f9fafb; padding: 30px; }}
                .button {{
                    display: inline-block;
                    background: #10B981;
                    color: white;
                    padding: 12px 30px;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 20px 0;
                }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>CommonGround</h1>
                    <p>Co-Parenting Made Easier</p>
                </div>
                <div class="content">
                    <h2>Hi {to_name},</h2>
                    <p>{inviter_name} has invited you to collaborate on <strong>{case_name}</strong> regarding {children_list}.</p>

                    <p>CommonGround helps co-parents:</p>
                    <ul>
                        <li>📋 Create custody agreements together</li>
                        <li>💬 Communicate with AI-powered conflict prevention</li>
                        <li>📅 Track parenting time and exchanges</li>
                        <li>📊 Maintain objective records for court</li>
                    </ul>

                    <p style="text-align: center;">
                        <a href="{invitation_link}" class="button">Accept Invitation</a>
                    </p>

                    <p><small>This link will expire in 7 days.</small></p>
                </div>
                <div class="footer">
                    <p>CommonGround - Where co-parents find common ground</p>
                    <p>You received this email because {inviter_name} invited you to collaborate.</p>
                </div>
            </div>
        </body>
        </html>
        """

        return await self._send_email(to_email, subject, html_body)

    async def send_agreement_approval_needed(
        self,
        to_email: str,
        to_name: str,
        case_name: str,
        agreement_title: str,
        approval_link: str
    ) -> bool:
        """
        Send notification that agreement needs approval.

        Args:
            to_email: Recipient email
            to_name: Recipient name
            case_name: Name of the case
            agreement_title: Title of the agreement
            approval_link: Link to review and approve

        Returns:
            Success status
        """
        subject = f"Agreement ready for your approval: {case_name}"

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #2563EB; color: white; padding: 20px; text-align: center; }}
                .content {{ background: #f9fafb; padding: 30px; }}
                .button {{
                    display: inline-block;
                    background: #10B981;
                    color: white;
                    padding: 12px 30px;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 20px 0;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Agreement Ready for Approval</h1>
                </div>
                <div class="content">
                    <h2>Hi {to_name},</h2>
                    <p>The parenting agreement for <strong>{case_name}</strong> is ready for your review and approval.</p>

                    <p><strong>Agreement:</strong> {agreement_title}</p>

                    <p>Please review the agreement carefully before approving. Once both parents approve, it will become active.</p>

                    <p style="text-align: center;">
                        <a href="{approval_link}" class="button">Review & Approve</a>
                    </p>
                </div>
            </div>
        </body>
        </html>
        """

        return await self._send_email(to_email, subject, html_body)

    async def send_message_notification(
        self,
        to_email: str,
        to_name: str,
        sender_name: str,
        case_name: str,
        message_preview: str,
        message_link: str,
        was_flagged: bool = False
    ) -> bool:
        """
        Send notification about new message.

        Args:
            to_email: Recipient email
            to_name: Recipient name
            sender_name: Name of message sender
            case_name: Name of the case
            message_preview: First 100 chars of message
            message_link: Link to view message
            was_flagged: Whether ARIA flagged the message

        Returns:
            Success status
        """
        subject = f"New message from {sender_name} - {case_name}"

        aria_note = ""
        if was_flagged:
            aria_note = """
            <div style="background: #FEF3C7; padding: 15px; border-left: 4px solid #F59E0B; margin: 15px 0;">
                <strong>🛡️ ARIA Note:</strong> This message was reviewed by our AI assistant for tone.
            </div>
            """

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #2563EB; color: white; padding: 20px; text-align: center; }}
                .content {{ background: #f9fafb; padding: 30px; }}
                .message-preview {{
                    background: white;
                    padding: 20px;
                    border-left: 4px solid #2563EB;
                    margin: 20px 0;
                }}
                .button {{
                    display: inline-block;
                    background: #2563EB;
                    color: white;
                    padding: 12px 30px;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 20px 0;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>New Message</h1>
                </div>
                <div class="content">
                    <h2>Hi {to_name},</h2>
                    <p>{sender_name} sent you a message regarding <strong>{case_name}</strong>.</p>

                    {aria_note}

                    <div class="message-preview">
                        <p>{message_preview}...</p>
                    </div>

                    <p style="text-align: center;">
                        <a href="{message_link}" class="button">View Full Message</a>
                    </p>
                </div>
            </div>
        </body>
        </html>
        """

        return await self._send_email(to_email, subject, html_body)

    async def send_exchange_reminder(
        self,
        to_email: str,
        to_name: str,
        event_title: str,
        event_time: datetime,
        location: str,
        children_names: List[str],
        hours_before: int = 24
    ) -> bool:
        """
        Send reminder about upcoming exchange.

        Args:
            to_email: Recipient email
            to_name: Recipient name
            event_title: Title of the event
            event_time: Time of the exchange
            location: Exchange location
            children_names: List of children involved
            hours_before: How many hours before (for subject)

        Returns:
            Success status
        """
        subject = f"Reminder: {event_title} in {hours_before} hours"

        time_str = event_time.strftime("%A, %B %d at %I:%M %p")
        children_list = ", ".join(children_names)

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #10B981; color: white; padding: 20px; text-align: center; }}
                .content {{ background: #f9fafb; padding: 30px; }}
                .event-details {{
                    background: white;
                    padding: 20px;
                    border-left: 4px solid #10B981;
                    margin: 20px 0;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📅 Exchange Reminder</h1>
                </div>
                <div class="content">
                    <h2>Hi {to_name},</h2>
                    <p>This is a reminder about your upcoming parenting time exchange.</p>

                    <div class="event-details">
                        <p><strong>Event:</strong> {event_title}</p>
                        <p><strong>When:</strong> {time_str}</p>
                        <p><strong>Where:</strong> {location}</p>
                        <p><strong>Children:</strong> {children_list}</p>
                    </div>

                    <p>💡 <strong>Tip:</strong> Check in when you arrive to maintain your on-time record.</p>
                </div>
            </div>
        </body>
        </html>
        """

        return await self._send_email(to_email, subject, html_body)

    async def send_compliance_report(
        self,
        to_email: str,
        to_name: str,
        case_name: str,
        on_time_rate: float,
        total_exchanges: int,
        report_link: str
    ) -> bool:
        """
        Send monthly compliance report.

        Args:
            to_email: Recipient email
            to_name: Recipient name
            case_name: Name of the case
            on_time_rate: Percentage on-time (0-1)
            total_exchanges: Total number of exchanges
            report_link: Link to full report

        Returns:
            Success status
        """
        subject = f"Monthly Compliance Report - {case_name}"

        on_time_pct = int(on_time_rate * 100)
        status_emoji = "🟢" if on_time_pct >= 90 else "🟡" if on_time_pct >= 70 else "🔴"

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #2563EB; color: white; padding: 20px; text-align: center; }}
                .content {{ background: #f9fafb; padding: 30px; }}
                .stat {{
                    background: white;
                    padding: 20px;
                    margin: 10px 0;
                    text-align: center;
                    border-radius: 5px;
                }}
                .stat h3 {{ margin: 0; color: #2563EB; font-size: 36px; }}
                .stat p {{ margin: 5px 0; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Monthly Compliance Report</h1>
                </div>
                <div class="content">
                    <h2>Hi {to_name},</h2>
                    <p>Here's your monthly compliance summary for <strong>{case_name}</strong>.</p>

                    <div class="stat">
                        <h3>{status_emoji} {on_time_pct}%</h3>
                        <p>On-Time Rate</p>
                    </div>

                    <div class="stat">
                        <h3>{total_exchanges}</h3>
                        <p>Total Exchanges</p>
                    </div>

                    <p style="text-align: center;">
                        <a href="{report_link}" style="display: inline-block; background: #2563EB; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                            View Full Report
                        </a>
                    </p>

                    <p><small>These metrics are court-admissible and can be used to demonstrate good faith compliance.</small></p>
                </div>
            </div>
        </body>
        </html>
        """

        return await self._send_email(to_email, subject, html_body)

    async def _send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None
    ) -> bool:
        """
        Send email via configured provider.

        Args:
            to_email: Recipient email
            subject: Email subject
            html_body: HTML email body
            text_body: Plain text fallback

        Returns:
            Success status
        """
        if not self.enabled:
            # In development, log instead of sending
            print(f"\n{'='*60}")
            print(f"📧 EMAIL (Development Mode - Not Sent)")
            print(f"{'='*60}")
            print(f"To: {to_email}")
            print(f"From: {self.from_name} <{self.from_email}>")
            print(f"Subject: {subject}")
            print(f"{'='*60}\n")
            return True

        # TODO: Integrate with SendGrid, AWS SES, or similar
        # Example for SendGrid:
        # from sendgrid import SendGridAPIClient
        # from sendgrid.helpers.mail import Mail
        #
        # message = Mail(
        #     from_email=self.from_email,
        #     to_emails=to_email,
        #     subject=subject,
        #     html_content=html_body
        # )
        # try:
        #     sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
        #     response = sg.send(message)
        #     return response.status_code == 202
        # except Exception as e:
        #     print(f"Error sending email: {e}")
        #     return False

        return True
