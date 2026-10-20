<?php
/** SEO content for /tools/notice-period-buyout-calculator/ (rendered by page-tools.php). Main keyword: "notice period buyout calculator" (mid difficulty). */
if (!defined('ABSPATH')) {
    exit;
}
return [
    'h1' => 'Notice Period Buyout Calculator',
    'lede' => 'Work out what it costs to leave before your notice period ends, from your monthly pay, days served, leave set-off and your company\'s day count.',
    'features' => [
        'Buyout amount from monthly pay and unserved days',
        'Earned leave set-off against the notice period',
        '30-day or 26-day divisor for the daily rate',
        'Shows days left and the per-day rate',
        'Runs in your browser; nothing is stored or sent',
    ],
    'sections' => [
        ['id' => 'what', 'h2' => 'What a notice period buyout is', 'html' => <<<'HTML'
<p>Most employment contracts in India ask you to give notice before you leave: 30 days is common, and 60 or 90 days is normal in IT services, consulting and many senior roles. If you want to leave sooner, say because a new employer wants you to join in three weeks, many companies let you "buy out" the days you do not serve. You (or sometimes your new employer) pay the old company an amount that stands in for the salary of those unserved days, and it releases you early.</p>
<p>The amount is usually recovered from your full and final settlement, the last payment that clears your salary, leave encashment and other dues. If the settlement is smaller than the buyout, the company may ask you to pay the difference.</p>
<p>This notice period buyout calculator works out that figure the way most HR teams do: a daily rate (monthly pay divided by 30 or 26) multiplied by the days you still owe after subtracting the days you have served and any earned leave the company lets you set off. It takes a few seconds and helps you check HR's number before you sign the relieving paperwork or negotiate a joining date.</p>
<p>A quick note on terms used here. Indian pay is often quoted in lakh (â¹1,00,000) and LPA (lakh per annum). Basic pay is the fixed core of a salary, usually 40% to 50% of CTC; gross pay is basic plus allowances, before deductions.</p>
HTML
        ],
        ['id' => 'calculation', 'h2' => 'How the notice period buyout is calculated', 'html' => <<<'HTML'
<p>The maths fits on one line. Every step below is exactly what the notice period buyout calculator does.</p>
<h3>The formula</h3>
<ol>
<li><strong>Days left</strong> = notice period − days already served − earned leave set off (never below zero).</li>
<li><strong>Daily rate</strong> = monthly pay ÷ divisor (30 or 26).</li>
<li><strong>Buyout amount</strong> = daily rate × days left.</li>
</ol>
<p>Days served are capped at the notice period, and leave set-off is capped at the days that remain, so the result can never go negative.</p>
<h3>Worked example: 90-day notice, â¹60,000 a month</h3>
<p>You earn â¹60,000 a month in the pay your company uses for recovery. You resign with a 90-day notice period, serve 30 days, and your manager agrees to set off 10 days of earned leave. Your company divides by 30.</p>
<table>
<thead><tr><th>Line</th><th>How it is worked out</th><th>Value</th></tr></thead>
<tbody>
<tr><td>Notice period</td><td>From your contract</td><td>90 days</td></tr>
<tr><td>Days served</td><td>Since you resigned</td><td>− 30 days</td></tr>
<tr><td>Earned leave set off</td><td>Approved by HR</td><td>− 10 days</td></tr>
<tr><td><strong>Days left to buy out</strong></td><td>90 − 30 − 10</td><td><strong>50 days</strong></td></tr>
<tr><td>Daily rate</td><td>â¹60,000 ÷ 30</td><td>â¹2,000</td></tr>
<tr><td><strong>Buyout amount</strong></td><td>â¹2,000 × 50</td><td><strong>â¹1,00,000</strong></td></tr>
</tbody>
</table>
<figure class="xf-figure"><img src="{{brand}}tool-notice-timeline.png" alt="A 90-day notice period bar split into 30 days served, 10 days of earned leave set off and 50 days left to buy out; at â¹60,000 a month divided by 30, the daily rate is â¹2,000 and the buyout is â¹1,00,000" width="1600" height="900" loading="lazy" decoding="async"><figcaption>A 90-day notice with 30 days served and 10 days of leave set off leaves 50 days to buy out. Graphic: 100xFounder.</figcaption></figure>
<p>Without the leave set-off the same person would owe 60 days, or â¹1,20,000. Ten days of leave saved â¹20,000, which is why it is worth asking about leave before anything else.</p>
HTML
        ],
        ['id' => 'examples', 'h2' => 'Notice buyout examples', 'html' => <<<'HTML'
<h3>The 30-day vs 26-day divisor</h3>
<p>Companies differ on how they turn a monthly salary into a daily rate. Some divide by 30 (or the calendar days in the month); others divide by 26, counting only working days. The 26-day convention appears in Indian labour law: gratuity has long been worked out as 15 days' wages with monthly pay divided by 26, a formula from the Payment of Gratuity Act, 1972, now consolidated into the Code on Social Security, 2020. Your contract or HR policy decides which applies to a notice recovery, so check it.</p>
<p>The choice matters more than people expect. Take â¹60,000 a month and 60 days to buy out:</p>
<table>
<thead><tr><th>Divisor</th><th>Daily rate</th><th>Buyout for 60 days</th></tr></thead>
<tbody>
<tr><td>30</td><td>â¹2,000</td><td>â¹1,20,000</td></tr>
<tr><td>26</td><td>â¹2,308</td><td>â¹1,38,462</td></tr>
</tbody>
</table>
<figure class="xf-figure"><img src="{{brand}}tool-notice-divisor.png" alt="Bar comparison for â¹60,000 monthly pay and 60 days to buy out: a 30-day divisor gives â¹2,000 a day and â¹1,20,000, a 26-day divisor gives â¹2,308 a day and â¹1,38,462" width="1600" height="900" loading="lazy" decoding="async"><figcaption>Same salary, same days: the 26-day divisor costs â¹18,462 more. Graphic: 100xFounder.</figcaption></figure>
<p>The 26-day divisor raises the bill by about 15%, here â¹18,462. The notice period buyout calculator has a switch for each, so you can see both before you talk to HR.</p>
<h3>More examples</h3>
<ul>
<li><strong>Short notice, junior role.</strong> â¹40,000 a month, 60-day notice, 15 days served, no leave set-off, divisor 30: 45 days left at â¹1,333 a day, a buyout of â¹60,000.</li>
<li><strong>Senior role, most of the notice served.</strong> â¹1,20,000 a month, 90-day notice, 60 days served, divisor 30: 30 days left at â¹4,000 a day, a buyout of â¹1,20,000.</li>
<li><strong>Leave covers it all.</strong> â¹60,000 a month, 30-day notice, 20 days served and 15 days of leave approved: leave set-off is capped at the 10 days remaining, so nothing is owed.</li>
</ul>
<p>These show why serving even part of the notice helps: each day served cuts the bill by one day's pay. Run your own case through the notice period buyout calculator above before you agree a last day.</p>
HTML
        ],
        ['id' => 'law', 'h2' => 'What the law says about notice and buyouts in India', 'html' => <<<'HTML'
<p>There is no single Indian law that sets a notice period for every private employee or fixes how a buyout is calculated. In practice three things decide it.</p>
<h3>1. Your contract and HR policy come first</h3>
<p>The length of your notice, whether a buyout is allowed, whether it is calculated on basic or gross pay, the divisor, and whether leave can be set off are almost always written into your appointment letter or the company's HR policy. Read those documents before you resign. If the policy is silent on something, it is open to negotiation.</p>
<h3>2. Standing orders and the Industrial Relations Code</h3>
<p>For workers in larger industrial establishments, service conditions such as termination were governed by standing orders under the Industrial Employment (Standing Orders) Act, 1946. That Act is one of the laws consolidated into the Industrial Relations Code, 2020, which came into force on 21 November 2025, according to law firms <a href="https://knowledge.dlapiper.com/dlapiperknowledge/globalemploymentlatestdevelopments/2025/government-of-india-notifies-the-labour-codes-ushers-a-new-era-of-compliances" rel="noopener">DLA Piper</a> and KS&amp;K. DLA Piper reports that the Code applies standing orders to establishments with 300 or more workers, up from 100. The draft model standing orders for the services sector provided for terminating a permanent worker with one month's written notice or wages in lieu of it, according to a Mondaq summary, so pay in place of notice is an established idea. Many office and tech employees, however, fall outside the "worker" definitions these rules use, and their notice terms come from the contract.</p>
<h3>3. State Shops and Establishments Acts</h3>
<p>Each state has its own Shops and Establishments Act covering shops, offices and commercial establishments, and some of these address notice when an employer ends employment. The rules vary by state and we have not checked every one, so look up your state's Act or ask an employment lawyer if your situation depends on it.</p>
<h3>Final settlement timing</h3>
<p>Under the Code on Wages, employers must pay wages due within two working days of termination, resignation or retrenchment, according to DLA Piper. In practice many companies take longer to complete a full and final settlement, and how this deadline applies to every employee and state is still being worked out as the rules roll out. Ask HR for the date in writing, and check their notice recovery figure against the notice period buyout calculator.</p>
<p>This section is general information, not legal or tax advice. Confirm your own case with a qualified lawyer or chartered accountant.</p>
HTML
        ],
        ['id' => 'basic-gross', 'h2' => 'Basic pay or gross pay: which salary is used', 'html' => <<<'HTML'
<p>The single biggest swing in a notice buyout amount is which monthly figure the company uses. Many firms recover notice pay on basic salary; others use gross monthly pay. On a â¹15 lakh CTC with basic at 50%, monthly basic is â¹62,500 while gross monthly pay is roughly â¹1.19 lakh (our <a href="/tools/in-hand-salary-calculator/">in-hand salary calculator</a> shows â¹14,27,925 a year in gross salary on its default assumptions). A 60-day buyout at a 30-day divisor is â¹1,25,000 on basic and about â¹2,38,000 on gross.</p>
<p>Look for the word your contract uses: "basic", "gross", "fixed" or "CTC". If it only says "salary", ask HR how they read it, and get the answer in an email. Then enter that figure as monthly pay.</p>
HTML
        ],
        ['id' => 'who-pays', 'h2' => 'Who pays the buyout, and how it is taxed', 'html' => <<<'HTML'
<h3>You, your new employer, or both</h3>
<p>Some hiring companies will cover part or all of your notice pay to get you in sooner. When they do, it tends to take one of three forms:</p>
<ul>
<li>The new employer reimburses your buyout after you join, against the old employer's settlement letter.</li>
<li>The new employer gives you a joining bonus sized to cover it, often with a clawback if you leave within a year.</li>
<li>The new employer adjusts your joining date so you serve more of your notice and the cost falls.</li>
</ul>
<p>Ask for any of these in writing in your offer letter. Use the notice period buyout calculator's result as the number in that conversation: "my notice buyout is â¹1,00,000 for 50 days" is more persuasive than "I have a long notice period". Before you resign, also check our <a href="/tools/salary-hike-calculator/">salary hike calculator</a> to confirm the move pays after the buyout.</p>
<h3>Income tax</h3>
<p>Whether you can reduce your taxable salary by the notice pay you hand back to your old employer is not settled: tax tribunals have taken different views, and we have not found an official clarification from the Income Tax Department. How a reimbursement from your new employer is taxed is also a question for a chartered accountant. Keep the settlement letter and payment proof either way.</p>
<h3>GST</h3>
<p>The tax authority CBIC addressed notice pay in Circular No. 178/10/2022-GST dated 3 August 2022, treating amounts an employer recovers for an early exit as not a payment for a supply, and so not liable to GST. The Kerala High Court relied on that circular in Manappuram Finance Ltd., holding that it applies retrospectively and allowing a refund of GST paid on it, as reported by <a href="https://taxmann.com/post/blog/no-gst-on-notice-pay-recovery-by-employer-for-premature-quitting-of-employee-hc" rel="noopener">Taxmann</a>. If HR adds GST to your bill, ask them to point to the basis for it.</p>
HTML
        ],
        ['id' => 'negotiate', 'h2' => 'How to negotiate an early release', 'html' => <<<'HTML'
<p>A buyout is often the starting point, not the final word. Many managers will shorten a notice period if the handover is clean. Some approaches that tend to work:</p>
<ul>
<li><strong>Offer a handover plan on the day you resign.</strong> List what you own, who takes it over and how many days the transfer needs. A manager who can see the work covered is more likely to release you early.</li>
<li><strong>Ask for leave set-off up front.</strong> Earned leave is money you have already earned; offsetting it against notice costs the company nothing extra. Check whether your policy allows it.</li>
<li><strong>Propose a partial buyout.</strong> Serve the critical weeks, then buy out the rest. A notice period buyout calculator shows the cost of each option in seconds.</li>
<li><strong>Confirm the basis and divisor in writing.</strong> Agree on basic or gross, and 30 or 26, before the final settlement, not after.</li>
<li><strong>Get the release in writing.</strong> A relieving letter and experience letter that state your last working day protect you in background checks.</li>
</ul>
<p>If you are still deciding where to go next, our <a href="/jobs/">jobs board</a> lists openings from official company career pages, and our <a href="/guides/">guides</a> explain how to apply at specific companies.</p>
HTML
        ],
        ['id' => 'tips', 'h2' => 'Tips and common mistakes', 'html' => <<<'HTML'
<h3>Tips</h3>
<ul>
<li><strong>Read the contract before you resign.</strong> Notice length, buyout terms and leave rules are usually there.</li>
<li><strong>Count served days the way HR does.</strong> Some companies count calendar days from the day after resignation; others count from acceptance. Ask.</li>
<li><strong>Run the numbers twice.</strong> Use the notice period buyout calculator with a 30-day and a 26-day divisor, and with basic and gross pay, so you know the range.</li>
<li><strong>Match the buyout to your joining date.</strong> Work backwards from the date the new employer needs you to the days you can serve.</li>
</ul>
<h3>Common mistakes</h3>
<ul>
<li><strong>Assuming the buyout is on basic.</strong> Many contracts use gross pay, which can nearly double the bill.</li>
<li><strong>Forgetting leave set-off.</strong> Unused earned leave can cut days you owe, but only if the policy allows it and HR approves it.</li>
<li><strong>Agreeing a number verbally.</strong> Without email confirmation, the settlement can come in higher than expected.</li>
<li><strong>Walking out without paying.</strong> Leaving without serving or paying the notice can delay your relieving letter and settlement, which may matter in background checks.</li>
<li><strong>Ignoring the timing of your settlement.</strong> The buyout is usually adjusted against your final pay, so plan for a gap before money arrives.</li>
</ul>
HTML
        ],
    ],
    'howto' => [
        'h2' => 'How to use the notice period buyout calculator',
        'intro' => 'You need your monthly pay, your notice period and how many days you have served. Leave set-off and the divisor are optional in the notice period buyout calculator.',
        'steps' => [
            ['name' => 'Enter your monthly pay', 'text' => 'Type the monthly salary your company uses for recovery. Many use basic pay; some use gross. Check your contract.'],
            ['name' => 'Enter your notice period', 'text' => 'Type the full notice period in days from your appointment letter, for example 30, 60 or 90.'],
            ['name' => 'Add days served', 'text' => 'Enter how many days of notice you have already worked, or will work, before your last day.'],
            ['name' => 'Add leave set-off', 'text' => 'If HR lets you offset earned leave against notice, enter the approved days. Leave it at zero otherwise.'],
            ['name' => 'Choose the divisor and read the result', 'text' => 'Pick 30 or 26 days per month. The result shows the buyout amount, the days left and the daily rate.'],
        ],
    ],
    'faq' => [
        ['q' => 'How is notice period buyout calculated?', 'a' => 'Divide your monthly pay by 30 or 26 to get a daily rate, then multiply it by the days of notice you have not served, after subtracting any approved leave set-off. The notice period buyout calculator on this page does this for you.'],
        ['q' => 'Is notice period buyout calculated on basic or gross salary?', 'a' => 'It depends on your contract or HR policy. Many companies use basic pay, others use gross or fixed pay. Check the wording and confirm with HR in writing.'],
        ['q' => 'Can I adjust earned leave against my notice period?', 'a' => 'Often yes, if your company policy allows it and HR approves. Each day of leave set off reduces the days you need to buy out by one.'],
        ['q' => 'Will my new employer pay my notice buyout?', 'a' => 'Many do, either by reimbursing it after you join or through a joining bonus, but it is a negotiation. Ask for it in your offer letter.'],
        ['q' => 'Is GST charged on notice pay recovery?', 'a' => 'CBIC Circular No. 178/10/2022-GST treats notice pay recovered by an employer as not liable to GST, and the Kerala High Court has applied it. Ask HR for the basis if GST is added.'],
        ['q' => 'Is the notice buyout tax deductible for the employee?', 'a' => 'This is not settled and tribunals have taken different views. Speak to a chartered accountant and keep your settlement letter and payment proof.'],
        ['q' => 'What if I leave without serving notice or paying the buyout?', 'a' => 'Your employer may hold back your final settlement or relieving letter and may pursue the amount under your contract. Negotiate an early release or a buyout instead.'],
    ],
    'sources' => [
        ['publisher' => 'DLA Piper', 'title' => 'Government of India notifies the Labour Codes, ushers in a new era of compliances', 'url' => 'https://knowledge.dlapiper.com/dlapiperknowledge/globalemploymentlatestdevelopments/2025/government-of-india-notifies-the-labour-codes-ushers-a-new-era-of-compliances', 'date' => '2025'],
        ['publisher' => 'King Stubb & Kasiva', 'title' => 'Central Government notifies commencement of all four Labour Codes, effective 21 November 2025', 'url' => 'https://ksandk.com/labour-employment/all-four-labour-codes-enforced-from-21-november-2025/', 'date' => '2025-11'],
        ['publisher' => 'Mondaq', 'title' => 'Model Standing Orders for Services Sector', 'url' => 'https://www.mondaq.com/india/employee-rights-labour-relations/1031442/model-standing-orders-for-services-sector', 'date' => '2021-02-01'],
        ['publisher' => 'Taxmann', 'title' => 'No GST on notice pay recovery by employer for premature quitting of employee: HC', 'url' => 'https://taxmann.com/post/blog/no-gst-on-notice-pay-recovery-by-employer-for-premature-quitting-of-employee-hc', 'date' => '2022-12-20'],
        ['publisher' => 'GST Council (CBIC circular listing)', 'title' => 'Circular No. 178/10/2022-GST: liquidated damages, compensation and penalty', 'url' => 'https://www.gstcouncil.gov.in/node/4899', 'date' => '2022-08-03'],
        ['publisher' => 'V.V. Giri National Labour Institute', 'title' => 'The Payment of Gratuity Act, 1972 (text, now consolidated into the Code on Social Security, 2020)', 'url' => 'https://vvgnli.gov.in/sites/default/files/Payment%20of%20Gratuity%20Act,%201972.pdf', 'date' => '1972'],
    ],
];
