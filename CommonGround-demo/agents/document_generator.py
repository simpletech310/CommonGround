"""
Legal Document Generator
Generates a formal custody agreement document from structured data.
Uses proper legal terminology and formatting.
"""

import os
from datetime import datetime

# Template for the legal document
LEGAL_DOCUMENT_TEMPLATE = """
CUSTODY AND PARENTING TIME AGREEMENT

STATE OF _______________
COUNTY OF _______________

IN THE MATTER OF:

{petitioner_name} ("Petitioner"/{petitioner_relationship})
and
{respondent_name} ("Respondent"/{respondent_relationship})

Concerning the minor child(ren):
{children_list}

═══════════════════════════════════════════════════════════════════════════════

ARTICLE I: CUSTODY ARRANGEMENT

1.1 Legal and Physical Custody
The parties agree to the following custody arrangement:

{custody_section}

═══════════════════════════════════════════════════════════════════════════════

ARTICLE II: PARENTING TIME SCHEDULE

2.1 Regular Parenting Time Schedule
{schedule_section}

═══════════════════════════════════════════════════════════════════════════════

ARTICLE III: EXCHANGE OF MINOR CHILD(REN)

3.1 Exchange Location
All exchanges of the minor child(ren) shall occur at the following location:
{exchange_location}

3.2 Exchange Schedule
{exchange_schedule}

3.3 Punctuality
Both parties agree to be punctual for all scheduled exchanges. A grace period of 
fifteen (15) minutes shall be allowed. If a party will be more than fifteen (15) 
minutes late, they shall notify the other party as soon as reasonably possible.

3.4 Conduct During Exchanges
Both parties agree to conduct themselves in a civil and respectful manner during 
all exchanges. Neither party shall make disparaging remarks about the other party 
in the presence of the minor child(ren).

═══════════════════════════════════════════════════════════════════════════════

ARTICLE IV: CHILD SUPPORT

{child_support_section}

═══════════════════════════════════════════════════════════════════════════════

ARTICLE V: TRANSPORTATION

5.1 Transportation Responsibilities
{transportation_section}

═══════════════════════════════════════════════════════════════════════════════

ARTICLE VI: ADDITIONAL PROVISIONS

{additional_provisions}

═══════════════════════════════════════════════════════════════════════════════

ARTICLE VII: GENERAL PROVISIONS

7.1 Modification
This Agreement may be modified only by written agreement signed by both parties 
or by order of the Court.

7.2 Governing Law
This Agreement shall be governed by and construed in accordance with the laws 
of the State of _______________.

7.3 Entire Agreement
This Agreement constitutes the entire agreement between the parties concerning 
the custody, care, and support of the minor child(ren) and supersedes all prior 
agreements, whether written or oral.

7.4 Severability
If any provision of this Agreement is held to be invalid or unenforceable, the 
remaining provisions shall continue in full force and effect.

═══════════════════════════════════════════════════════════════════════════════

IN WITNESS WHEREOF, the parties have executed this Agreement on the dates 
indicated below.


_________________________________    Date: _______________
{petitioner_name}
Petitioner


_________________________________    Date: _______________
{respondent_name}
Respondent


STATE OF _______________
COUNTY OF _______________

ACKNOWLEDGMENT

On this _____ day of _______________, 20___, before me personally appeared 
{petitioner_name} and {respondent_name}, known to me to be the persons whose 
names are subscribed to the foregoing instrument, and acknowledged that they 
executed the same for the purposes therein contained.

IN WITNESS WHEREOF, I have hereunto set my hand and official seal.


_________________________________
Notary Public
My Commission Expires: _______________
"""


class LegalDocumentGenerator:
    """
    Generates formal legal custody agreement documents from structured data.
    """
    
    def __init__(self):
        self.template = LEGAL_DOCUMENT_TEMPLATE
    
    def generate(self, legal_data: dict) -> str:
        """
        Generate a legal document from structured data.
        
        Args:
            legal_data: Dictionary from ExtractorAgent.extract_to_legal_format()
            
        Returns:
            Formatted legal document as string
        """
        # Extract data with defaults
        petitioner = legal_data.get("petitioner", {})
        respondent = legal_data.get("respondent", {})
        children = legal_data.get("minor_children", [])
        custody = legal_data.get("custody_arrangement", {})
        exchange = legal_data.get("exchange_provisions", {})
        child_support = legal_data.get("child_support", {})
        transportation = legal_data.get("transportation", {})
        additional = legal_data.get("additional_provisions")
        
        # Format children list
        children_list = self._format_children(children)
        
        # Format custody section
        custody_section = self._format_custody(custody, petitioner, respondent)
        
        # Format schedule section
        schedule_section = self._format_schedule(custody)
        
        # Format exchange sections
        exchange_location = self._format_exchange_location(exchange)
        exchange_schedule = self._format_exchange_schedule(exchange)
        
        # Format child support section
        child_support_section = self._format_child_support(child_support, petitioner, respondent)
        
        # Format transportation section
        transportation_section = self._format_transportation(transportation)
        
        # Format additional provisions
        additional_provisions = self._format_additional(additional)
        
        # Fill template
        document = self.template.format(
            petitioner_name=petitioner.get("name", "[PETITIONER NAME]"),
            petitioner_relationship=petitioner.get("relationship", "[RELATIONSHIP]"),
            respondent_name=respondent.get("name", "[RESPONDENT NAME]"),
            respondent_relationship=respondent.get("relationship", "[RELATIONSHIP]"),
            children_list=children_list,
            custody_section=custody_section,
            schedule_section=schedule_section,
            exchange_location=exchange_location,
            exchange_schedule=exchange_schedule,
            child_support_section=child_support_section,
            transportation_section=transportation_section,
            additional_provisions=additional_provisions
        )
        
        return document
    
    def _format_children(self, children: list) -> str:
        """Format the children list"""
        if not children:
            return "[MINOR CHILD NAME], Date of Birth: [DOB]"
        
        lines = []
        for i, child in enumerate(children, 1):
            name = child.get("name", f"[CHILD {i} NAME]")
            age = child.get("age")
            dob = child.get("date_of_birth")
            
            if dob:
                lines.append(f"    {i}. {name}, Date of Birth: {dob}")
            elif age:
                lines.append(f"    {i}. {name}, Age {age}")
            else:
                lines.append(f"    {i}. {name}")
        
        return "\n".join(lines)
    
    def _format_custody(self, custody: dict, petitioner: dict, respondent: dict) -> str:
        """Format the custody arrangement section"""
        custody_type = custody.get("type", "JOINT LEGAL AND PHYSICAL CUSTODY")
        primary = custody.get("primary_custodian")
        time_share = custody.get("time_share", {})
        
        sections = []
        
        # Custody type declaration
        sections.append(f"The parties shall share {custody_type} of the minor child(ren).")
        
        # Time share if specified
        mother_pct = time_share.get("mother_percentage")
        father_pct = time_share.get("father_percentage")
        
        if mother_pct and father_pct:
            sections.append(f"""
Parenting time shall be allocated as follows:
    - Mother: {mother_pct}% of parenting time
    - Father: {father_pct}% of parenting time""")
        
        # Primary custodian if applicable
        if primary:
            if primary == "MOTHER":
                primary_name = respondent.get("name") if respondent.get("relationship") == "MOTHER" else petitioner.get("name")
            else:
                primary_name = petitioner.get("name") if petitioner.get("relationship") == "FATHER" else respondent.get("name")
            
            sections.append(f"""
{primary_name or primary} shall serve as the primary residential parent for purposes 
of school enrollment and related matters.""")
        
        return "\n".join(sections)
    
    def _format_schedule(self, custody: dict) -> str:
        """Format the parenting time schedule"""
        schedule = custody.get("schedule")
        
        if schedule:
            return f"""The parties agree to the following parenting time schedule:

{schedule}

This schedule may be modified by mutual written agreement of the parties."""
        
        return """The parties shall establish a parenting time schedule by mutual agreement, 
taking into consideration the best interests of the minor child(ren), the work 
schedules of both parties, and the school schedule of the minor child(ren)."""
    
    def _format_exchange_location(self, exchange: dict) -> str:
        """Format exchange location details"""
        pickup = exchange.get("pickup", {})
        dropoff = exchange.get("dropoff", {})
        
        # Use pickup location as primary (usually same as dropoff)
        location = pickup.get("location") or dropoff.get("location")
        location_type = pickup.get("location_type") or dropoff.get("location_type")
        
        if location:
            if location_type:
                return f"""Address: {location}
Location Type: {location_type} (neutral public location)

This location was selected as a neutral, public location for the safety and 
convenience of both parties and the minor child(ren)."""
            else:
                return f"""Address: {location}

This location was selected as a neutral location for the convenience of both 
parties and the minor child(ren)."""
        
        return "[EXCHANGE LOCATION TO BE DETERMINED]"
    
    def _format_exchange_schedule(self, exchange: dict) -> str:
        """Format exchange schedule details"""
        pickup = exchange.get("pickup", {})
        dropoff = exchange.get("dropoff", {})
        
        sections = []
        
        if pickup:
            day = pickup.get("day", "[DAY]")
            time = pickup.get("time", "[TIME]")
            freq = pickup.get("frequency", "WEEKLY")
            responsible = pickup.get("responsible_party", "[PARTY]")
            
            sections.append(f"""Pickup Exchange:
    Day: {day}
    Time: {time}
    Frequency: {freq}
    The {responsible} shall be responsible for transporting the minor child(ren) 
    to the exchange location for pickup.""")
        
        if dropoff and dropoff != pickup:
            day = dropoff.get("day", "[DAY]")
            time = dropoff.get("time", "[TIME]")
            freq = dropoff.get("frequency", "WEEKLY")
            responsible = dropoff.get("responsible_party", "[PARTY]")
            
            sections.append(f"""
Dropoff Exchange:
    Day: {day}
    Time: {time}
    Frequency: {freq}
    The {responsible} shall be responsible for transporting the minor child(ren) 
    to the exchange location for dropoff.""")
        
        if sections:
            return "\n".join(sections)
        
        return "[EXCHANGE SCHEDULE TO BE DETERMINED]"
    
    def _format_child_support(self, child_support: dict, petitioner: dict, respondent: dict) -> str:
        """Format child support section"""
        if child_support.get("status") == "WAIVED BY MUTUAL AGREEMENT":
            return """4.1 Child Support Waiver
The parties agree that no child support shall be paid by either party to the 
other at this time. Both parties acknowledge that they have been advised of 
their right to seek child support and voluntarily waive such right.

4.2 Modification
Either party may petition the Court for child support in the future should 
circumstances change."""
        
        obligor = child_support.get("obligor")
        amount = child_support.get("monthly_amount")
        method = child_support.get("payment_method")
        
        if obligor and amount:
            # Determine obligor name
            if obligor == "FATHER":
                obligor_name = petitioner.get("name") if petitioner.get("relationship") == "FATHER" else respondent.get("name")
                obligee_name = respondent.get("name") if respondent.get("relationship") == "MOTHER" else petitioner.get("name")
            else:
                obligor_name = petitioner.get("name") if petitioner.get("relationship") == "MOTHER" else respondent.get("name")
                obligee_name = respondent.get("name") if respondent.get("relationship") == "FATHER" else petitioner.get("name")
            
            return f"""4.1 Child Support Obligation
{obligor_name or obligor} (hereinafter "Obligor") shall pay to {obligee_name or "Obligee"} 
(hereinafter "Obligee") the sum of ${amount:,.2f} per month as and for child 
support for the minor child(ren).

4.2 Payment Terms
Child support payments shall be due on the first (1st) day of each month, 
commencing on the first (1st) day of the month following the execution of 
this Agreement.

4.3 Payment Method
{f'Payment shall be made via {method}.' if method else 'Payment method shall be agreed upon by the parties.'}

4.4 Modification
Child support may be modified by the Court upon a showing of a substantial 
change in circumstances."""
        
        return """4.1 Child Support
Child support shall be determined in accordance with the applicable state 
child support guidelines."""
    
    def _format_transportation(self, transportation: dict) -> str:
        """Format transportation section"""
        arrangement = transportation.get("arrangement", "")
        responsible = transportation.get("responsible_party")
        
        if arrangement:
            return f"""{arrangement}

Both parties agree to ensure that the minor child(ren) are transported safely 
and in age-appropriate child safety restraints as required by law.

Neither party shall transport the minor child(ren) while under the influence 
of alcohol or controlled substances."""
        
        return """Each party shall be responsible for their own transportation costs 
associated with parenting time exchanges.

Both parties agree to ensure that the minor child(ren) are transported safely 
and in age-appropriate child safety restraints as required by law."""
    
    def _format_additional(self, additional: str) -> str:
        """Format additional provisions"""
        standard = """6.1 Communication
Both parties agree to maintain open and respectful communication regarding 
matters affecting the minor child(ren). Neither party shall interfere with 
the other party's reasonable telephone, video chat, or other electronic 
communication with the minor child(ren) during their parenting time.

6.2 Access to Records
Both parties shall have equal access to all medical, dental, educational, 
and other records pertaining to the minor child(ren).

6.3 Right of First Refusal
If either party is unable to care for the minor child(ren) during their 
scheduled parenting time for a period exceeding four (4) hours, they shall 
first offer the other party the opportunity to care for the minor child(ren) 
before arranging alternative childcare.

6.4 Relocation
Neither party shall relocate with the minor child(ren) more than fifty (50) 
miles from the current residence without providing sixty (60) days written 
notice to the other party and, if necessary, obtaining Court approval."""
        
        if additional:
            return f"""{standard}

6.5 Special Provisions
{additional}"""
        
        return standard
    
    def generate_to_file(self, legal_data: dict, filepath: str) -> str:
        """
        Generate document and save to file.
        
        Args:
            legal_data: Dictionary from ExtractorAgent.extract_to_legal_format()
            filepath: Path to save the document
            
        Returns:
            Path to saved file
        """
        document = self.generate(legal_data)
        
        with open(filepath, 'w') as f:
            f.write(document)
        
        return filepath


# JavaScript template for generating DOCX (for more complex formatting)
DOCX_GENERATOR_JS = '''
const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, 
        Header, Footer, PageNumber, BorderStyle, UnderlineType } = require('docx');
const fs = require('fs');

// Legal data passed from Python
const legalData = JSON.parse(process.argv[2]);

// Create the document
const doc = new Document({
    styles: {
        default: { document: { run: { font: "Times New Roman", size: 24 } } },
        paragraphStyles: [
            { id: "Title", name: "Title", basedOn: "Normal",
              run: { size: 32, bold: true }, 
              paragraph: { spacing: { after: 200 }, alignment: AlignmentType.CENTER } },
            { id: "Heading1", name: "Heading 1", basedOn: "Normal",
              run: { size: 28, bold: true },
              paragraph: { spacing: { before: 400, after: 200 } } },
            { id: "Heading2", name: "Heading 2", basedOn: "Normal",
              run: { size: 26, bold: true },
              paragraph: { spacing: { before: 300, after: 150 } } },
            { id: "Legal", name: "Legal", basedOn: "Normal",
              paragraph: { spacing: { after: 200 }, indent: { left: 720 } } }
        ]
    },
    sections: [{
        properties: {
            page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
        },
        headers: {
            default: new Header({ children: [
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: "CUSTODY AND PARENTING TIME AGREEMENT", bold: true })]
                })
            ]})
        },
        footers: {
            default: new Footer({ children: [
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun("Page "),
                        new TextRun({ children: [PageNumber.CURRENT] }),
                        new TextRun(" of "),
                        new TextRun({ children: [PageNumber.TOTAL_PAGES] })
                    ]
                })
            ]})
        },
        children: generateContent(legalData)
    }]
});

function generateContent(data) {
    const content = [];
    
    // Title
    content.push(new Paragraph({
        heading: HeadingLevel.TITLE,
        children: [new TextRun({ text: "CUSTODY AND PARENTING TIME AGREEMENT", bold: true })]
    }));
    
    // ... Add more sections based on legalData
    
    return content;
}

// Save document
Packer.toBuffer(doc).then(buffer => {
    fs.writeFileSync(process.argv[3] || 'custody_agreement.docx', buffer);
    console.log('Document generated successfully');
});
'''
