export interface FormKB {
    id: string;
    name: string;
    department: string;
    processingTime: string;
    submissionLocation: string;
    purpose: string;
    procedure: string[];
    requiredDocuments: string[];
    criticalFields: { field: string; warning: string }[];
    rejectionReasons: { title: string; detail: string }[];
    grievances: { issue: string; tip: string }[];
    technicalRules: string[];
    icon: string;
    color: string;
}

export const FORMS: FormKB[] = [
    {
        id: 'income-certificate',
        name: 'Income Certificate',
        department: 'Revenue Department',
        processingTime: '7 to 15 days',
        submissionLocation: 'Meeseva Center or Online Portal',
        icon: 'receipt',
        color: '#4f8ef7',
        purpose: 'The Income Certificate verifies the annual family income for welfare schemes and scholarships.',
        procedure: [
            'Citizen submits application with proof of income.',
            'VRO (Village Revenue Officer) performs field verification of assets and family size.',
            'RI (Revenue Inspector) cross-checks with the VRO report and CFMS/Ration Card databases.',
            'Tahsildar (MRO) grants approval based on the verification report.',
        ],
        requiredDocuments: [
            'Application Form (signed)',
            'Ration Card / EPIC Card / Aadhaar Card',
            'Copy of IT Returns / Pay Slips (for employees)',
            'Self-Declaration from the applicant',
        ],
        criticalFields: [
            { field: 'Gross Annual Income', warning: 'Must include income from ALL sources (Salary, Business, Agriculture).' },
            { field: 'Family Members', warning: 'Ensure all members listed in the Ration Card are included.' },
        ],
        rejectionReasons: [
            { title: 'Income Mismatch', detail: 'Declared income is lower than what is reflected in 26AS (Income Tax) or electricity bill.' },
            { title: 'Asset Concealment', detail: 'Failure to declare agricultural land or urban property owned by family members.' },
        ],
        grievances: [
            { issue: 'High electricity bill being used as a proxy for high income.', tip: 'If your electricity bill is high due to a shared meter, provide a letter from the landlord or a sub-meter reading to the VRO.' },
        ],
        technicalRules: [
            'G.O. Ms. No. 186 (2018): Income from agricultural sources is calculated based on Standard Acre yield rates fixed by the District Collector.',
            'Non-taxable pensions (old-age or disability) are excluded from Gross Annual Income for scholarship eligibility.',
            'Per G.O. Ms. No. 484 (2023): Income Certificates for students are valid for ONE year; for other purposes, may be required every 6 months.',
            'If the family owns more than 2.5 acres of wet land or 5 acres of dry land, they are often automatically disqualified from BPL income status.',
        ],
    },
    {
        id: 'integrated-certificate',
        name: 'Integrated Certificate',
        department: 'Revenue Department',
        processingTime: '15 to 30 days',
        submissionLocation: 'Meeseva Center or Online Portal',
        icon: 'id-card',
        color: '#8b5cf6',
        purpose: 'Combines proof of Caste, Nativity, and Date of Birth into a single permanent document.',
        procedure: [
            'Submission of historical caste evidence.',
            'VRO/RI verification of the applicant\'s community and traditional occupation.',
            'Inquiry by the District Level Scrutiny Committee (DLSC) for disputed SC/ST claims.',
            'Digital issuance by the Tahsildar.',
        ],
        requiredDocuments: [
            'Application Form',
            'Caste Certificate issued to family members (Father/Siblings)',
            'SSC Marks Memo / DOB Extract / Transfer Certificate',
            '1st to 10th Study Certificates (for Nativity proof)',
        ],
        criticalFields: [
            { field: 'Sub-Caste Name', warning: 'Must match the official list in the AP Gazette (e.g., Mala, Madiga, Kapu).' },
            { field: 'Place of Birth', warning: 'Must match the school records exactly.' },
        ],
        rejectionReasons: [
            { title: 'Insufficient Proof', detail: 'Providing only a self-declaration without any family caste records.' },
            { title: 'Inter-Caste Marriage Issues', detail: 'Children of inter-caste marriages must prove which community they were brought up in.' },
        ],
        grievances: [
            { issue: 'Officials asking for 1950 records for SC/ST applicants.', tip: 'If 1950 records are unavailable, provide land records or old school registers of ancestors that mention the caste.' },
        ],
        technicalRules: [
            'Rule 58 of 1997 (AP SC/ST/BC Rules): Burden of proof lies with the applicant. VRO must conduct a local inquiry including interviewing neighbors.',
            'Nativity is determined by the Local Candidate rule — where the applicant studied for the maximum period during 7 consecutive years ending with the qualifying exam year.',
            'Per G.O. Ms. No. 26 (2015): Once issued, it is a PERMANENT document and does not need renewal unless lost or correction is needed.',
            'A child\'s caste is determined by biological parents, not adoptive parents, unless adoption is legally registered.',
        ],
    },
    {
        id: 'residence-certificate',
        name: 'Residence Certificate',
        department: 'Revenue Department',
        processingTime: '7 days',
        submissionLocation: 'Meeseva Center or Online Portal',
        icon: 'home',
        color: '#06d6a0',
        purpose: 'Proves residence in a specific area for a defined period.',
        procedure: [
            'Application with address proofs.',
            'VRO verifies physical stay through local inquiry and utility bills.',
            'Tahsildar approves the certificate.',
        ],
        requiredDocuments: [
            'Application Form',
            'Ration Card / Aadhaar Card',
            'House Tax receipt / Electricity Bill',
            'Photo (for Passport purpose)',
        ],
        criticalFields: [
            { field: 'Duration of Stay', warning: '"From" and "To" dates must be continuous without gaps.' },
            { field: 'Purpose', warning: 'Clearly state if it is for Passport, General, or Education.' },
        ],
        rejectionReasons: [
            { title: 'Gap in Residence', detail: 'Inability to prove stay for the entire period claimed.' },
            { title: 'Name Mismatch', detail: 'Utility bills are in the name of a previous owner or landlord without a rental agreement.' },
        ],
        grievances: [
            { issue: 'Tenants face issues if the landlord refuses to provide the property tax receipt.', tip: 'A registered lease agreement plus a bank passbook with the current address is usually sufficient.' },
        ],
        technicalRules: [
            'For General residence, a minimum stay of 6 months is required. For Passport purposes, verification is stricter and often involves police coordination.',
            'If an applicant moved within the same Mandal, the VRO can verify multiple addresses. If moved from a different Mandal, separate certificates may be required.',
            'Minor children\'s residence is automatically tied to the father\'s/guardian\'s residence proof.',
        ],
    },
    {
        id: 'family-member-certificate',
        name: 'Family Member Certificate',
        department: 'Revenue Department',
        processingTime: '15 to 30 days',
        submissionLocation: 'Meeseva Center or Online Portal',
        icon: 'users',
        color: '#f59e0b',
        purpose: 'Identifies legal survivors of a deceased person for administrative purposes.',
        procedure: [
            'Application by a family member.',
            'VRO local inquiry and Panchanama (statement by 5 witnesses).',
            '15-day notice period for public objections.',
            'Tahsildar issuance.',
        ],
        requiredDocuments: [
            'Death Certificate of the deceased',
            'Aadhaar Cards of all family members',
            'Notarized Affidavit listing all members',
        ],
        criticalFields: [
            { field: 'All Names', warning: 'Ensure NO family member (even married daughters) is omitted.' },
            { field: 'Age of Members', warning: 'Must match Aadhaar exactly.' },
        ],
        rejectionReasons: [
            { title: 'Concealment', detail: 'Deliberately omitting a second wife or children from a first marriage.' },
            { title: 'Name Spelling', detail: 'Differences between the Death Certificate and Aadhaar cards of survivors.' },
        ],
        grievances: [
            { issue: 'VROs demanding a No Objection Certificate (NOC) from all members.', tip: 'Get all members to sign the affidavit together to avoid multiple visits.' },
        ],
        technicalRules: [
            'G.O. Ms. No. 145 (2015): Tahsildars are authorized to issue this only for Service Benefits (pensions, compassionate jobs), NOT for Property Disputes.',
            'For property inheritance exceeding a certain value, officials will direct to Civil Court for a Legal Heir or Succession Certificate.',
            'The Panchanama must include at least two non-relatives who knew the deceased for over 10 years.',
        ],
    },
    {
        id: 'birth-certificate',
        name: 'Birth Certificate',
        department: 'Municipal Administration / Panchayat Raj',
        processingTime: '15 to 20 days',
        submissionLocation: 'Meeseva Center or Online Portal',
        icon: 'baby',
        color: '#ec4899',
        purpose: 'Registers a birth or corrects errors in the birth record.',
        procedure: [
            'Submission of hospital/school records.',
            'Verification by the Health Assistant or Panchayat Secretary.',
            'Approval by the Registrar (Municipal Commissioner or MPDO).',
        ],
        requiredDocuments: [
            'Hospital Discharge Summary',
            'SSC Marks Memo (for corrections)',
            'Notarized Affidavit',
            'Parents\' Aadhaar Cards',
        ],
        criticalFields: [
            { field: 'Date of Birth', warning: 'Cannot be changed after the first registration without a Magistrate order.' },
            { field: 'Child\'s Name', warning: 'Ensure the name is final; subsequent changes are difficult.' },
        ],
        rejectionReasons: [
            { title: 'Late Registration', detail: 'Trying to register after 1 year without a Magistrate order.' },
            { title: 'Hospital Mismatch', detail: 'Application details don\'t match the Form-1 submitted by the hospital to the municipality.' },
        ],
        grievances: [
            { issue: 'Name being "Blank" in old records.', tip: 'Use the "Name Entry" service in Meeseva if the birth was registered but the child was not named at that time.' },
        ],
        technicalRules: [
            '0–21 Days: Free registration.',
            '22–30 Days: Late fee of ₹25 + permission from Registrar.',
            '31 Days to 1 Year: Late fee of ₹50 + written permission from Sub-Collector/RDO.',
            'Over 1 Year: Mandatory Magistrate Order (First Class Magistrate) + Late fee of ₹250.',
            'Only clerical/spelling errors can be corrected by the Registrar. Substantive changes require a court decree.',
        ],
    },
    {
        id: 'death-certificate',
        name: 'Death Certificate',
        department: 'Municipal Administration / Panchayat Raj',
        processingTime: '15 to 20 days',
        submissionLocation: 'Meeseva Center or Online Portal',
        icon: 'document',
        color: '#64748b',
        purpose: 'Official registration of a death.',
        procedure: [
            'Application with burial/hospital proof.',
            'Verification by local health/revenue officials.',
            'Registration and digital issuance.',
        ],
        requiredDocuments: [
            'Hospital Death Summary',
            'Burial/Cremation Ground Receipt',
            'Deceased\'s Aadhaar (to be marked as Deceased in database)',
        ],
        criticalFields: [
            { field: 'Date of Death', warning: 'Crucial for insurance; must match hospital records exactly.' },
            { field: 'Place of Death', warning: 'Specific hospital name or house address required.' },
        ],
        rejectionReasons: [
            { title: 'Missing Burial Proof', detail: 'For home deaths, failure to get a report from the VRO/Panchayat Secretary immediately.' },
            { title: 'Duplicate Registration', detail: 'Death already registered in a different municipality (place of death vs. place of residence).' },
        ],
        grievances: [
            { issue: 'Delay in updating the online portal after physical registration.', tip: 'Keep the Acknowledgement Number from the burial ground safely.' },
        ],
        technicalRules: [
            'Missing Person: Legally presumed dead only after 7 years, requiring a court declaration under the Indian Evidence Act.',
            'Late Registration (over 1 year): Requires a Magistrate Order.',
            'If records yield no result, the Registrar issues a Non-Availability Certificate (NAC), which is a prerequisite for late registration.',
        ],
    },
    {
        id: 'adangal-pahani',
        name: 'Adangal / Pahani (Land Records)',
        department: 'Revenue Department',
        processingTime: 'Immediate (Online) / 7 days (Certified)',
        submissionLocation: 'Meeseva Center or Online Portal',
        icon: 'map',
        color: '#10b981',
        purpose: 'Provides detailed ownership and cultivation status of agricultural land.',
        procedure: [
            'Provide Survey/Khata number.',
            'System fetches data from the Webland database.',
            'Tahsildar digitally signs the certified copy.',
        ],
        requiredDocuments: [
            'Survey Number / Sub-division Number',
            'Aadhaar Card of the Pattadar (Owner)',
        ],
        criticalFields: [
            { field: 'Survey Number', warning: 'Ensure the sub-division (e.g., /A, /1) is correct.' },
            { field: 'Nature of Land', warning: 'Check if it is Government (Poramboke) or Private (Patta).' },
        ],
        rejectionReasons: [
            { title: 'Survey Number Mismatch', detail: 'Providing numbers that don\'t exist in that village\'s map.' },
            { title: 'Prohibited Lands', detail: 'Requesting records for lands listed under Section 22-A (Prohibited for registration).' },
        ],
        grievances: [
            { issue: 'Wrong name spelling in the online database.', tip: 'Use the "Meebhoomi" portal to check for errors and file a VRO Correction request immediately.' },
        ],
        technicalRules: [
            'Section 3 of ROR Act: The Adangal is updated annually (Fasli year). Changes in the Cultivator column do NOT imply ownership change.',
            'Column 12 (Remarks) is the most critical — it contains notes on court stays, bank liens (mortgages), or government disputes.',
            'Land is recorded in Acres and Cents (100 Cents = 1 Acre).',
        ],
    },
    {
        id: 'possession-certificate',
        name: 'Possession Certificate',
        department: 'Revenue Department',
        processingTime: '15 days',
        submissionLocation: 'Meeseva Center or Online Portal',
        icon: 'key',
        color: '#f97316',
        purpose: 'Certifies physical possession of a property.',
        procedure: [
            'Application with boundary details.',
            'VRO field inspection to confirm the applicant is occupying the site.',
            'RI verification of the chain of documents.',
            'Tahsildar approval.',
        ],
        requiredDocuments: [
            'Registered Sale Deed',
            'Latest Property Tax Receipt',
            'Photo of the site with the applicant',
        ],
        criticalFields: [
            { field: 'Boundaries (N, S, E, W)', warning: 'Must match the Sale Deed exactly.' },
            { field: 'Dimensions', warning: 'Length and width of the plot in feet/yards must be accurate.' },
        ],
        rejectionReasons: [
            { title: 'Vacant Land Issues', detail: 'Difficulty proving possession of an open plot without a fence or structure.' },
            { title: 'Encroachment', detail: 'Part of the property is on government land or a neighbor\'s plot.' },
        ],
        grievances: [
            { issue: 'VROs refusing to issue certificate for "assigned" (D-Patta) lands.', tip: 'If it\'s assigned land, ensure you have the "Alienation" permission if you are a subsequent buyer.' },
        ],
        technicalRules: [
            'This certificate only confirms PHYSICAL stay/hold. It does NOT override a court\'s decision on legal title.',
            'The VRO must record the Nature of Possession (Owner-occupied, Tenant-occupied, or Fenced Vacant Plot).',
            'Most banks require this certificate to be less than 6 months old for loan processing.',
        ],
    },
    {
        id: 'mutation',
        name: 'Mutation (Property Transfer)',
        department: 'Revenue Department',
        processingTime: '30 to 45 days',
        submissionLocation: 'Meeseva Center or Online Portal',
        icon: 'transfer',
        color: '#14b8a6',
        purpose: 'Updates the Record of Rights (ROR) after a property transfer.',
        procedure: [
            'Application after registration.',
            'Issue of Form-VIII notice to interested parties.',
            'Verification of the registered document in the SRO database.',
            'Update of the Digi-Khata and ROR-1B.',
        ],
        requiredDocuments: [
            'Registered Sale/Gift/Partition Deed',
            'Encumbrance Certificate (EC)',
            'Death Certificate (for inheritance cases)',
        ],
        criticalFields: [
            { field: 'Document Number/Year', warning: 'Must match the SRO registration stamp.' },
            { field: 'Seller\'s Khata Number', warning: 'The seller must be the "Pattadar" in the current records.' },
        ],
        rejectionReasons: [
            { title: 'Extent Mismatch', detail: 'Seller trying to sell more land than they own in the revenue records.' },
            { title: 'Unpaid Dues', detail: 'Pending agricultural loans on the land (Bank "Lien").' },
        ],
        grievances: [
            { issue: 'Mutation taking months despite "auto-mutation" promises.', tip: 'Check if the SRO has forwarded the "J-Slip" to the Tahsildar; if not, provide a physical copy.' },
        ],
        technicalRules: [
            'G.O. Ms. No. 114 (2019): Introduced "Auto-Mutation" for simple sale transactions. Succession (inheritance) mutations still require a manual 15-day notice period.',
            'Section 5 of ROR Act: Any person acquiring rights must report it within 90 days.',
            'If only a part of a survey number is sold, a Sub-division (Phodi) process must be initiated, involving a government surveyor.',
        ],
    },
    {
        id: 'ews-certificate',
        name: 'EWS Certificate',
        department: 'Revenue Department',
        processingTime: '15 to 30 days',
        submissionLocation: 'Meeseva Center or Online Portal',
        icon: 'shield',
        color: '#a855f7',
        purpose: 'Provides 10% reservation for General Category economically weaker sections.',
        procedure: [
            'Application with income and asset details.',
            'VRO verification of family holdings across the district.',
            'Tahsildar approval based on state-specific criteria.',
        ],
        requiredDocuments: [
            'Income Certificate',
            'Property Tax receipts (Urban)',
            'Land Adangals (Rural)',
            'Self-Declaration of Assets',
        ],
        criticalFields: [
            { field: 'Family Definition', warning: 'Includes parents, spouse, and siblings/children under 18.' },
            { field: 'Total Land', warning: 'Sum of ALL land owned by the Family anywhere in India.' },
        ],
        rejectionReasons: [
            { title: 'Income Limit Exceeded', detail: 'Family income exceeds ₹8 Lakhs per annum.' },
            { title: 'Asset Limit', detail: 'Owning a residential flat of 1000 sq. ft. or more in notified municipalities.' },
        ],
        grievances: [
            { issue: 'Confusion between "State EWS" and "Central EWS" criteria.', tip: 'Specify the purpose (Central Jobs vs. State Education) as criteria may slightly differ.' },
        ],
        technicalRules: [
            'G.O. Ms. No. 60 (2019): Gross annual family income must be below ₹8 Lakh.',
            'Asset Exclusion: Agricultural land of 5 acres and above disqualifies.',
            'Asset Exclusion: Residential flat of 1000 sq. ft. and above disqualifies.',
            'Asset Exclusion: Residential plot of 100 sq. yards+ in notified municipalities OR 200 sq. yards+ elsewhere.',
            'If a family owns multiple small plots that SUM UP to the limit, they are disqualified.',
            'Applicants belonging to SC, ST, or BC are NOT eligible for EWS, even if they meet income/asset criteria.',
        ],
    },
];

// Knowledge base Q&A function
export function queryKnowledgeBase(formId: string, question: string): string {
    const form = FORMS.find(f => f.id === formId);
    if (!form) return "I don't have information about that form. Please select a form from the list.";

    const q = question.toLowerCase();

    if (q.includes('document') || q.includes('require') || q.includes('need') || q.includes('bring')) {
        return `**Required Documents for ${form.name}:**\n\n${form.requiredDocuments.map((d, i) => `${i + 1}. ${d}`).join('\n')}\n\n💡 Make sure all documents are originals along with photocopies.`;
    }

    if (q.includes('reject') || q.includes('mistake') || q.includes('wrong') || q.includes('error') || q.includes('issue')) {
        return `**Common Rejection Reasons for ${form.name}:**\n\n${form.rejectionReasons.map(r => `❌ **${r.title}**: ${r.detail}`).join('\n\n')}`;
    }

    if (q.includes('how long') || q.includes('time') || q.includes('days') || q.includes('processing')) {
        return `**Processing Time for ${form.name}:** ${form.processingTime}\n\n📍 **Submission Location:** ${form.submissionLocation}`;
    }

    if (q.includes('where') || q.includes('submit') || q.includes('location') || q.includes('office')) {
        return `**Submission Location for ${form.name}:** ${form.submissionLocation}\n\n⏱️ **Processing Time:** ${form.processingTime}`;
    }

    if (q.includes('procedure') || q.includes('process') || q.includes('step') || q.includes('how')) {
        return `**Procedure for ${form.name}:**\n\n${form.procedure.map((s, i) => `**Step ${i + 1}:** ${s}`).join('\n\n')}`;
    }

    if (q.includes('critical') || q.includes('important') || q.includes('field') || q.includes('fill')) {
        return `**Critical Fields for ${form.name}:**\n\n${form.criticalFields.map(f => `⚠️ **${f.field}:** ${f.warning}`).join('\n\n')}`;
    }

    if (q.includes('tip') || q.includes('advice') || q.includes('grievance') || q.includes('help') || q.includes('stuck')) {
        return `**Practical Tips for ${form.name}:**\n\n${form.grievances.map(g => `❓ **Issue:** ${g.issue}\n✅ **Tip:** ${g.tip}`).join('\n\n')}`;
    }

    if (q.includes('rule') || q.includes('law') || q.includes('go') || q.includes('technical') || q.includes('act')) {
        return `**Technical Rules & Administrative Logic for ${form.name}:**\n\n${form.technicalRules.map((r, i) => `${i + 1}. ${r}`).join('\n\n')}`;
    }

    if (q.includes('purpose') || q.includes('what is') || q.includes('about') || q.includes('use')) {
        return `**About ${form.name}:**\n\n${form.purpose}\n\n**Department:** ${form.department}\n**Processing Time:** ${form.processingTime}`;
    }

    // Default: provide overview
    return `**${form.name} — Quick Overview**\n\n📋 **Purpose:** ${form.purpose}\n\n🏛️ **Department:** ${form.department}\n⏱️ **Processing Time:** ${form.processingTime}\n📍 **Submission:** ${form.submissionLocation}\n\nYou can ask me about:\n• Required documents\n• Procedure/steps\n• Common rejection reasons\n• Critical fields\n• Tips & grievances\n• Technical rules`;
}
