<?php
/** SEO content for /tools/in-hand-salary-calculator/ (rendered by page-tools.php). Main keyword: "in hand salary calculator" (high difficulty). */
if (!defined('ABSPATH')) {
    exit;
}
return [
    'h1' => 'In-Hand Salary Calculator (India, Tax Year 2026-27)',
    'lede' => 'Turn any CTC into your real monthly take-home pay under the new or old tax regime, with PF, gratuity, professional tax and cess shown line by line.',
    'features' => [
        'CTC to monthly and yearly in-hand pay',
        'New and old tax regime side by side, tax year 2026-27',
        'Employer and employee PF with the â¹25,000 wage ceiling',
        'Gratuity, professional tax, surcharge and 4% cess included',
        'HRA exemption and 80C deductions for the old regime',
        'Runs in your browser; nothing is stored or sent',
    ],
    'sections' => [
        ['id' => 'what', 'h2' => 'What an in-hand salary calculator tells you', 'html' => <<<'HTML'
<p>An offer letter in India usually leads with one number: the CTC, or cost to company. It is what the employer expects to spend on you in a year, and it is not what lands in your bank account. An in-hand salary calculator works backwards from that headline figure to your net salary: the amount you actually receive each month after the employer's own costs, your provident fund, professional tax and income tax have been taken out.</p>
<p>Indian salaries are usually quoted in LPA, short for lakh per annum. One lakh is â¹1,00,000 and one crore is 100 lakh (â¹1,00,00,000), so "15 LPA" means a CTC of â¹15 lakh a year. Indian notation groups digits differently: â¹13,03,169 is thirteen lakh and 3,169 rupees.</p>
<h3>CTC, gross salary and in-hand salary are three different numbers</h3>
<ul>
<li><strong>CTC (cost to company)</strong> is everything the employer budgets for you: basic pay, allowances, the employer's PF contribution, gratuity, and often bonuses, insurance premiums and other benefits.</li>
<li><strong>Gross salary</strong> is CTC minus the parts that never reach you as monthly pay. In this tool that means the employer's PF contribution and the gratuity provision. Your payslip's "gross earnings" line is roughly this figure divided by twelve.</li>
<li><strong>In-hand salary</strong> (also called take-home pay or net salary) is gross salary minus your own PF contribution, professional tax and income tax including cess. It is your salary after tax and deductions, and the number to plan rent, EMIs and savings around.</li>
</ul>
<p>The gap between CTC and take-home pay is rarely small. On a â¹15 lakh CTC in the new regime, our in-hand salary calculator puts the yearly take-home salary at â¹13,03,169, about 87% of the CTC. The other 13% goes to PF (yours and the employer's), gratuity, professional tax and income tax. Some of that is still your money, just not money you can spend this month.</p>
<p>This in-hand salary calculator is built for salaried employees in India for tax year 2026-27 (1 April 2026 to 31 March 2027), the first year under the Income-tax Act, 2025. Use the in-hand salary calculator to compare offers, check a payslip, or, as a founder, show candidates a realistic take-home pay figure before they sign.</p>
HTML
        ],
        ['id' => 'calculation', 'h2' => 'How the in-hand salary calculator works out your take-home pay', 'html' => <<<'HTML'
<p>The maths is what a payroll team runs, simplified to what applies to most salaried people. Every step below is exactly what the tool above does to convert CTC to in-hand pay, so you can check its result by hand.</p>
<h3>The formula, step by step</h3>
<ol>
<li><strong>Basic pay</strong> = CTC × basic share (50% by default; you can set anything from 10% to 100%).</li>
<li><strong>PF, each side</strong> = 12% of basic, capped at â¹3,000 a month (â¹36,000 a year) when the PF cap box is ticked. The cap follows the EPF wage ceiling of â¹25,000 a month.</li>
<li><strong>Gratuity provision</strong> = 4.81% of basic.</li>
<li><strong>Gross salary</strong> = CTC − employer PF − gratuity.</li>
<li><strong>Taxable income, new regime</strong> = gross − â¹75,000 standard deduction.</li>
<li><strong>Taxable income, old regime</strong> = gross − â¹50,000 standard deduction − HRA exemption − 80C deductions (your figure or your own PF, whichever is higher, up to â¹1.5 lakh) − professional tax.</li>
<li><strong>Income tax</strong> = slab tax, minus the rebate where it applies, plus surcharge on high incomes (with marginal relief), plus 4% Health and Education cess.</li>
<li><strong>In-hand salary</strong> = gross − employee PF − professional tax − income tax. Divide by 12 for your monthly in-hand pay.</li>
</ol>
<h3>Worked example: â¹15 lakh CTC in the new regime</h3>
<p>Take a CTC of â¹15,00,000 with the default assumptions: basic at 50% of CTC, PF capped, professional tax of â¹2,500 a year, new regime.</p>
<table>
<thead><tr><th>Line</th><th>How it is worked out</th><th>Amount (Rs a year)</th></tr></thead>
<tbody>
<tr><td>CTC</td><td>From the offer letter</td><td>15,00,000</td></tr>
<tr><td>Basic pay</td><td>50% of CTC</td><td>7,50,000</td></tr>
<tr><td>Employer PF</td><td>12% of basic is 90,000, capped at 3,000 × 12</td><td>− 36,000</td></tr>
<tr><td>Gratuity provision</td><td>4.81% of 7,50,000</td><td>− 36,075</td></tr>
<tr><td><strong>Gross salary</strong></td><td>CTC minus the two lines above</td><td><strong>14,27,925</strong></td></tr>
<tr><td>Standard deduction</td><td>New regime</td><td>− 75,000</td></tr>
<tr><td>Taxable income</td><td>Gross minus standard deduction</td><td>13,52,925</td></tr>
<tr><td>Slab tax</td><td>5% of 4 lakh + 10% of 4 lakh + 15% of 1,52,925</td><td>82,939</td></tr>
<tr><td>Income tax + 4% cess</td><td>No rebate (taxable income is above 12 lakh)</td><td>86,256</td></tr>
<tr><td>Employee PF</td><td>Same capped figure as the employer's</td><td>− 36,000</td></tr>
<tr><td>Professional tax</td><td>Default state levy</td><td>− 2,500</td></tr>
<tr><td><strong>In-hand salary</strong></td><td>14,27,925 − 36,000 − 2,500 − 86,256</td><td><strong>13,03,169</strong></td></tr>
<tr><td><strong>Monthly in-hand</strong></td><td>Yearly figure ÷ 12</td><td><strong>1,08,597</strong></td></tr>
</tbody>
</table>
<figure class="xf-figure"><img src="{{brand}}tool-in-hand-waterfall.png" alt="Step chart for a â¹15 lakh CTC in the new regime: employer PF â¹36,000 and gratuity â¹36,075 bring it to a gross of â¹14,27,925, then employee PF â¹36,000, professional tax â¹2,500 and income tax with cess â¹86,256 leave â¹13,03,169 a year in hand" width="1600" height="900" loading="lazy" decoding="async"><figcaption>From â¹15 lakh CTC to â¹1,08,597 a month in hand, new regime, tax year 2026-27. Graphic: 100xFounder.</figcaption></figure>
<p>Income tax here is about 5.8% of CTC, so the salary after tax is far closer to gross than many people expect. The larger deductions on this salary are actually the two PF contributions and gratuity, which together come to â¹1,08,075 a year. The PF portion is still your savings, held in your EPF account.</p>
HTML
        ],
        ['id' => 'examples', 'h2' => 'Salary calculator for India: take-home pay at common CTCs', 'html' => <<<'HTML'
<p>The table below runs the in-hand salary calculator at the CTCs people most often ask about. Every row uses the same defaults: basic at 50% of CTC, PF capped at â¹3,000 a month, â¹2,500 professional tax, and for the old regime â¹1.5 lakh of 80C investments with no rent paid (so no HRA exemption). Change any of them and your take-home pay will move.</p>
<table>
<thead><tr><th>CTC</th><th>Gross salary</th><th>New regime: tax</th><th>New regime: monthly in hand</th><th>Old regime: tax</th><th>Old regime: monthly in hand</th></tr></thead>
<tbody>
<tr><td>â¹6 lakh</td><td>5,49,570</td><td>0</td><td>42,589</td><td>0</td><td>42,589</td></tr>
<tr><td>â¹10 lakh</td><td>9,39,950</td><td>0</td><td>75,121</td><td>62,390</td><td>69,922</td></tr>
<tr><td>â¹12 lakh</td><td>11,35,140</td><td>0</td><td>91,387</td><td>1,02,989</td><td>82,804</td></tr>
<tr><td>â¹15 lakh</td><td>14,27,925</td><td>86,256</td><td>1,08,597</td><td>1,87,333</td><td>1,00,174</td></tr>
<tr><td>â¹25 lakh</td><td>24,03,875</td><td>2,93,508</td><td>1,72,656</td><td>4,91,829</td><td>1,56,129</td></tr>
<tr><td>â¹40 lakh</td><td>38,67,800</td><td>7,46,554</td><td>2,56,896</td><td>9,48,574</td><td>2,40,061</td></tr>
</tbody>
</table>
<p>Tax figures are yearly and include cess; in-hand figures are monthly and rounded to the rupee.</p>
<h3>What the numbers show</h3>
<ul>
<li><strong>New-regime tax is nil up to a gross salary of â¹12.75 lakh</strong>, which on these defaults is a CTC of about â¹13.4 lakh. At â¹12 lakh CTC the taxable income is â¹10,60,140, well inside the â¹12 lakh rebate limit, so the full â¹91,387 a month is yours after PF and professional tax.</li>
<li><strong>Just above the rebate limit, marginal relief smooths the jump.</strong> Someone whose taxable income is â¹12,10,000 does not suddenly owe full slab tax; their tax before cess is capped at the â¹10,000 by which they crossed the limit. The calculator applies this automatically.</li>
<li><strong>Without big deductions, the new regime pays more at every level</strong> in this table. The gap grows from about â¹5,200 a month at â¹10 lakh to about â¹16,800 a month at â¹40 lakh.</li>
</ul>
<p>Want to see how a raise changes these numbers? The <a href="/tools/salary-hike-calculator/">salary hike calculator</a> uses the same maths to show how much of a raise reaches your monthly take-home pay. If you are moving jobs and your current employer wants payment for an early exit, the <a href="/tools/notice-period-buyout-calculator/">notice period buyout calculator</a> works out that cost.</p>
HTML
        ],
        ['id' => 'regimes', 'h2' => 'New vs old tax regime for tax year 2026-27', 'html' => <<<'HTML'
<p>Every salaried taxpayer in India chooses between two sets of rules. The new regime has lower rates and a larger rebate but almost no deductions; the old regime has higher rates but lets you subtract HRA, 80C investments and other items. The new regime is the default under the Income-tax Act, 2025, so you are in it unless you opt out. The Finance Bill 2026 memorandum states that rates for tax year 2026-27 are unchanged, according to the <a href="https://www.incometaxindia.gov.in/documents/81799/11848482/memo-2026.pdf" rel="noopener">Income Tax Department</a>.</p>
<figure class="xf-figure"><img src="{{brand}}tool-in-hand-regimes.png" alt="Side-by-side slab tables for tax year 2026-27: new regime nil up to â¹4 lakh then 5% to 30% in â¹4 lakh steps above â¹24 lakh, with â¹75,000 standard deduction and rebate up to â¹12 lakh; old regime nil up to â¹2.5 lakh, 5%, 20% and 30% above â¹10 lakh, with â¹50,000 standard deduction and rebate up to â¹5 lakh" width="1600" height="900" loading="lazy" decoding="async"><figcaption>New and old regime slabs for individuals under 60, tax year 2026-27. Graphic: 100xFounder.</figcaption></figure>
<h3>New regime slabs</h3>
<table>
<thead><tr><th>Taxable income</th><th>Rate</th></tr></thead>
<tbody>
<tr><td>Up to â¹4 lakh</td><td>Nil</td></tr>
<tr><td>â¹4 lakh to 8 lakh</td><td>5%</td></tr>
<tr><td>â¹8 lakh to 12 lakh</td><td>10%</td></tr>
<tr><td>â¹12 lakh to 16 lakh</td><td>15%</td></tr>
<tr><td>â¹16 lakh to 20 lakh</td><td>20%</td></tr>
<tr><td>â¹20 lakh to 24 lakh</td><td>25%</td></tr>
<tr><td>Above â¹24 lakh</td><td>30%</td></tr>
</tbody>
</table>
<p>Salaried people get a â¹75,000 standard deduction, and a rebate of up to â¹60,000 wipes out the tax when taxable income is â¹12 lakh or less. With the standard deduction, that means a gross salary of up to â¹12.75 lakh pays no income tax.</p>
<h3>Old regime slabs (individuals below 60)</h3>
<table>
<thead><tr><th>Taxable income</th><th>Rate</th></tr></thead>
<tbody>
<tr><td>Up to â¹2.5 lakh</td><td>Nil</td></tr>
<tr><td>â¹2.5 lakh to 5 lakh</td><td>5%</td></tr>
<tr><td>â¹5 lakh to 10 lakh</td><td>20%</td></tr>
<tr><td>Above â¹10 lakh</td><td>30%</td></tr>
</tbody>
</table>
<p>The standard deduction is â¹50,000 and the rebate is up to â¹12,500 when taxable income is â¹5 lakh or less. Both regimes add surcharge above â¹50 lakh (10%), â¹1 crore (15%) and â¹2 crore (25%); only the old regime goes to 37% above â¹5 crore. Cess of 4% applies on tax plus surcharge in both. The slab, rebate, surcharge and cess figures are from the <a href="https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1" rel="noopener">income tax e-filing portal</a>.</p>
<h3>When the old regime still wins</h3>
<p>The old regime only makes sense if your deductions are large enough to outweigh its higher rates. For most salaried people that comes down to two items the in-hand salary calculator handles: HRA exemption (if you pay rent) and 80C investments up to â¹1.5 lakh, which already include your own PF.</p>
<p>The calculator's numbers show how high that bar is. At â¹15 lakh CTC in a 50% HRA city with â¹1.5 lakh in 80C:</p>
<ul>
<li>Paying â¹30,000 a month in rent, the old regime gives â¹12,84,817 a year in hand against â¹13,03,169 in the new one. The new regime still wins by about â¹18,350.</li>
<li>At â¹40,000 a month in rent, the HRA exemption reaches its 50%-of-basic cap and the old regime edges ahead by just â¹368 a year.</li>
<li>At â¹25 lakh CTC, even â¹60,000 a month in rent leaves the new regime about â¹12,700 a year ahead.</li>
</ul>
<p>So with only HRA and 80C, the two regimes are close at best. The old regime clearly pays only with other deductions on top, such as home-loan interest or health insurance premiums, which the tool does not model; if you have them, its old-regime net salary understates what you would keep. Run both regimes in the in-hand salary calculator, then check your full deduction list against the official rules before you tell your employer.</p>
HTML
        ],
        ['id' => 'components', 'h2' => 'PF, gratuity, professional tax and HRA, explained', 'html' => <<<'HTML'
<h3>Provident fund (EPF)</h3>
<p>Under the Employees' Provident Fund scheme, you and your employer each contribute 12% of your basic pay plus dearness allowance. The statutory wage ceiling was raised from â¹15,000 to â¹25,000 a month by notification S.O. 5109(E) dated 17 September 2026, so a contribution capped at the ceiling is now â¹3,000 a month from each side, up from â¹1,800, according to <a href="https://www.bdo.in/en-gb/insights/alerts-updates/alert-new-epf-ceiling-hiked" rel="noopener">BDO India</a>.</p>
<p>Many employers contribute on your full basic instead of the capped wage. If yours does, untick the PF cap box. On a â¹15 lakh CTC with uncapped PF, each side becomes â¹90,000 a year, gross salary falls to â¹13,73,925, and the monthly in-hand salary drops from â¹1,08,597 to about â¹1,00,299. Your EPF balance grows faster in exchange; ask HR which basis applies.</p>
<h3>Gratuity</h3>
<p>Gratuity is a lump sum paid when you leave after the qualifying service (five years for most permanent employees; fixed-term employees have a shorter route under the new rules). It now falls under the Code on Social Security, 2020, which consolidated the Payment of Gratuity Act, 1972; the central rules under the labour codes were notified on 8 May 2026 and gratuity is computed on "wages" as the Code defines them, according to <a href="https://www.khaitanco.com/sites/default/files/2026-05/ERGO-central-rules-under-labour-codes-notified.pdf" rel="noopener">Khaitan &amp; Co</a>. The formula is still 15 days' wages for each completed year, with the 1972 Act's convention of dividing a month's wage by 26 for the daily rate. That gives 15 ÷ 26 ÷ 12, or about 4.81% of basic a year, the common convention for the gratuity line in a CTC. You do not receive it monthly, so the in-hand salary calculator takes it out of gross salary. If your offer letter does not include gratuity in CTC, your actual gross will be slightly higher than shown.</p>
<p>The codes also matter for the basic share. Under them, allowances left out of "wages" are tested against 50% of total remuneration, Khaitan &amp; Co notes, so a basic (plus DA) of about half of pay is a reasonable starting point, and it is the calculator's default.</p>
<h3>Professional tax</h3>
<p>Professional tax is a state levy on employment, and the Constitution (Article 276) caps it at â¹2,500 a year per person. Rates and slabs vary by state, and some states do not levy it at all. The in-hand salary calculator defaults to the â¹2,500 maximum; enter 0 if your state does not charge it. It is deductible from taxable income only in the old regime.</p>
<h3>House rent allowance (HRA)</h3>
<p>HRA is part of your gross pay. In the old regime, part of it can be exempt from tax; in the new regime, all of it is taxable. The exemption is the lowest of three amounts: HRA actually received, rent paid minus 10% of basic, and 50% of basic in the listed metro cities (40% elsewhere). For tax year 2026-27, secondary reports on the Income-tax Rules, 2026, including <a href="https://www.bdo.in/en-gb/news/2026/hra-to-childrens-education-allowance-new-income-tax-rules-bring-relief-to-salaried-class" rel="noopener">BDO India</a>, say the 50% list covers eight cities: Delhi, Mumbai, Kolkata, Chennai, Bengaluru, Hyderabad, Pune and Ahmedabad. We have not seen the final rule text, so treat that list as reported, not confirmed.</p>
<p>The in-hand salary calculator assumes your HRA equals that 50% or 40% cap, which is common in Indian salary structures but not universal. If your HRA is lower, your real exemption will be lower too.</p>
<h3>80C-type deductions</h3>
<p>In the old regime, investments such as your own PF contribution, PPF and ELSS mutual funds can reduce taxable income by up to â¹1.5 lakh a year in total. The calculator takes the larger of the figure you enter and your own PF, then caps it at â¹1.5 lakh, so your PF is never counted twice.</p>
HTML
        ],
        ['id' => 'payslip', 'h2' => 'Why your payslip may not match the in-hand salary calculator', 'html' => <<<'HTML'
<p>A real payslip has items that come and go, and some parts of a CTC never appear as monthly pay at all. These are the usual reasons your net pay differs from the estimate.</p>
<h3>Variable pay and performance bonus</h3>
<p>Many CTCs include a variable or performance component paid once or twice a year, depending on ratings or company results. It is in your CTC but not in your monthly take-home pay. For a fair monthly in-hand salary, enter only the fixed part of the CTC in the calculator, then treat the bonus as a separate, uncertain sum that will be taxed at your marginal rate when paid.</p>
<h3>Joining bonus and relocation pay</h3>
<p>One-time payments are often shown inside a first-year CTC. They are taxable salary in the month they are paid, which cuts the net pay of that month and many offers ask you to repay them if you leave within a set period. Leave them out of the CTC you type in.</p>
<h3>ESOPs and stock grants</h3>
<p>Stock options are sometimes quoted next to the CTC, or inside it. They never reach your monthly in-hand pay and have their own tax rules on exercise or sale. Leave them out of the in-hand salary calculator and ask a tax adviser about your plan.</p>
<h3>Employer NPS contribution</h3>
<p>Some employers offer to put part of your CTC into the National Pension System. Budget 2024 raised the deduction for an employer's NPS contribution to 14% of salary for employees in the new regime, from 10%, according to <a href="https://www.businesstoday.in/amp/union-budget/story/union-budget-nps-taxation-changed-after-budget-2024-check-old-vs-new-tax-regime-taxation-rules-for-nps-462031-2025-01-25" rel="noopener">Business Today</a>. That can lower your tax, but the money is locked into a pension account, so it reduces take-home pay even as it saves tax. The in-hand salary calculator does not model it.</p>
<h3>Insurance, meal cards and other benefits</h3>
<p>Group health insurance premiums, meal cards and phone or fuel reimbursements are sometimes counted in CTC. Their tax treatment differs by item and regime, so remove them from the CTC you enter and look at them separately.</p>
<h3>TDS spread across the year</h3>
<p>Employers deduct tax at source monthly based on your declarations. Declare investments late and the deduction can jump in the last quarter. The tool shows an even monthly average of take-home pay; your actual monthly credit may vary even if the yearly total matches.</p>
HTML
        ],
        ['id' => 'tips', 'h2' => 'Tips and common mistakes when estimating in-hand pay', 'html' => <<<'HTML'
<h3>Tips</h3>
<ul>
<li><strong>Ask for the salary breakup before you accept.</strong> Basic share, PF basis (capped or not), gratuity inclusion and variable pay all change the monthly in-hand pay. Then run the in-hand salary calculator with real inputs.</li>
<li><strong>Compare offers on take-home pay, not CTC.</strong> Two offers at the same CTC can differ by thousands a month. Run each offer through the in-hand salary calculator and compare the monthly figures.</li>
<li><strong>Check both regimes every year.</strong> The default is the new regime. If you pay high rent and max out 80C, flip the toggle and look at the difference line the calculator shows.</li>
<li><strong>Use the basic share field.</strong> Some companies set basic at 40% of CTC, others at 50% or more. At â¹15 lakh CTC, moving basic from 50% to 40% raises the yearly in-hand salary slightly, from â¹13,03,169 to â¹13,09,258, because gratuity falls while PF stays at the cap.</li>
<li><strong>Plan around fixed pay.</strong> Budget your rent and EMIs on the monthly in-hand salary from fixed pay only. Treat bonuses as extra.</li>
</ul>
<p>If you are job hunting, our <a href="/jobs/">jobs board</a> lists openings from official company career pages, including <a href="/jobs/ai-ml-jobs/">AI and ML roles</a> and <a href="/jobs/engineering-jobs-in-bengaluru/">engineering jobs in Bengaluru</a>. Our <a href="/guides/">guides</a> explain how to apply at specific companies.</p>
<h3>Common mistakes</h3>
<ul>
<li><strong>Dividing CTC by 12 to get take-home pay.</strong> On a â¹15 lakh CTC that gives â¹1,25,000 a month, about â¹16,400 more than the calculator's estimate of what actually arrives.</li>
<li><strong>Forgetting the employer's PF.</strong> It is part of CTC but goes into your EPF account, never into your take-home salary.</li>
<li><strong>Counting PF twice under 80C.</strong> Your own PF already counts towards the â¹1.5 lakh limit; adding a full â¹1.5 lakh of other investments on top does not give extra deduction.</li>
<li><strong>Claiming HRA in the new regime.</strong> HRA exemption is only available in the old regime, so it cannot raise your new-regime net pay.</li>
<li><strong>Assuming the rebate means zero tax on any income near â¹12 lakh.</strong> The rebate applies to taxable income, after the standard deduction. A gross salary above â¹12.75 lakh pays some tax, although marginal relief keeps the amount small just past the limit.</li>
<li><strong>Treating the estimate as final.</strong> Your employer's payroll, your declarations and your state's professional tax decide your final salary after tax.</li>
</ul>
<p>This page is general information, not tax advice. Confirm your own position with a qualified tax professional or on incometax.gov.in.</p>
HTML
        ],
    ],
    'howto' => [
        'h2' => 'How to use the in-hand salary calculator',
        'intro' => 'You need only your CTC to get a first estimate. Add the details below for a closer figure.',
        'steps' => [
            ['name' => 'Enter your annual CTC', 'text' => 'Type the yearly CTC from your offer letter, or tap a preset such as 10 LPA or 15 LPA. Use only the fixed part if your CTC includes variable pay or a joining bonus.'],
            ['name' => 'Pick your tax regime', 'text' => 'The new regime is selected by default because it is the default under the Income-tax Act, 2025. Choose Old if you have opted out or want to compare.'],
            ['name' => 'Add old-regime details', 'text' => 'For the old regime, choose whether you live in a 50% HRA city, then enter your monthly rent and your 80C investments. These fields only appear when Old is selected.'],
            ['name' => 'Check the assumptions', 'text' => 'Set the basic share of CTC (50% by default), your yearly professional tax (â¹2,500 by default) and whether your PF is capped at the â¹25,000 wage ceiling.'],
            ['name' => 'Read your take-home pay', 'text' => 'The result shows monthly and yearly in-hand salary, tax as a share of CTC, a split bar, a line-by-line table and how much more or less the other regime would give you.'],
        ],
    ],
    'faq' => [
        ['q' => 'What is the in-hand salary for 15 LPA?', 'a' => 'With basic at 50% of CTC, capped PF and â¹2,500 professional tax, a â¹15 lakh CTC gives about â¹1,08,597 a month (â¹13,03,169 a year) in the new regime for tax year 2026-27. In the old regime with â¹1.5 lakh of 80C and no rent, it is about â¹1,00,174 a month.'],
        ['q' => 'How do I calculate in-hand salary from CTC?', 'a' => 'Subtract the employer PF and gratuity from CTC to get gross salary, then subtract your own PF, professional tax and income tax with cess. Divide the result by 12 for the monthly figure. The in-hand salary calculator on this page does each step and shows the breakdown.'],
        ['q' => 'Is salary up to â¹12 lakh tax-free in the new regime?', 'a' => 'Taxable income up to â¹12 lakh pays no tax because of the rebate of up to â¹60,000. For salaried people, the â¹75,000 standard deduction means gross salary up to â¹12.75 lakh pays no income tax. Professional tax and PF still apply.'],
        ['q' => 'Which tax regime gives higher take-home pay?', 'a' => 'For most salaried people the new regime gives more in hand. The old regime can come out ahead only with large deductions, typically high rent with HRA plus full 80C plus items like home-loan interest. Use the in-hand salary calculator to compare both with your own figures.'],
        ['q' => 'Why is my in-hand salary lower than CTC divided by 12?', 'a' => 'CTC includes the employer PF contribution and gratuity, which never reach your bank account monthly, and often variable pay that is paid later. Your own PF, professional tax and income tax are then deducted from what remains.'],
        ['q' => 'Does the in-hand salary calculator include the new EPF wage ceiling?', 'a' => 'Yes. With the PF cap ticked, each side contributes 12% of basic up to â¹3,000 a month, matching the â¹25,000 wage ceiling notified on 17 September 2026. Untick it if your employer contributes on full basic.'],
        ['q' => 'Is this salary calculator only for India?', 'a' => 'Yes. It is a salary calculator built for Indian pay: CTC, EPF, gratuity, professional tax and the Indian income tax slabs for tax year 2026-27. If you are comparing an Indian offer with one abroad, use it for the Indian side and convert the in-hand figure, not the CTC, because CTC includes items that never reach your account.'],
        ['q' => 'How much salary will I get in hand from my CTC?', 'a' => 'Enter your annual CTC above and the tool shows the monthly and yearly take-home pay straight away. As a rough guide, with basic at 50% and the PF cap on, a â¹10 lakh CTC gives about â¹75,121 a month and a â¹25 lakh CTC about â¹1,72,656 a month in the new regime.'],
        ['q' => 'Is the in-hand salary calculator accurate for my payslip?', 'a' => 'It follows the same rules as payroll for the parts it models, but your payslip can differ because of variable pay, reimbursements, employer NPS, the exact HRA in your structure and how TDS is spread over the year. Treat it as a close estimate, not a final figure.'],
    ],
    'sources' => [
        ['publisher' => 'Income Tax Department, Government of India', 'title' => 'Memorandum explaining the provisions in the Finance Bill, 2026', 'url' => 'https://www.incometaxindia.gov.in/documents/81799/11848482/memo-2026.pdf', 'date' => '2026'],
        ['publisher' => 'Income Tax Department e-filing portal', 'title' => 'Individual: return applicable, tax slabs, rebate, surcharge and cess', 'url' => 'https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1', 'date' => '2026'],
        ['publisher' => 'BDO India', 'title' => 'Alert: New EPF wage ceiling hiked to â¹25,000 (S.O. 5109(E))', 'url' => 'https://www.bdo.in/en-gb/insights/alerts-updates/alert-new-epf-ceiling-hiked', 'date' => '2026-09'],
        ['publisher' => 'BDO India', 'title' => 'HRA to children\'s education allowance: new income tax rules bring relief to salaried class', 'url' => 'https://www.bdo.in/en-gb/news/2026/hra-to-childrens-education-allowance-new-income-tax-rules-bring-relief-to-salaried-class', 'date' => '2026'],
        ['publisher' => 'Khaitan & Co (ERGO)', 'title' => 'Central rules under the labour codes notified', 'url' => 'https://www.khaitanco.com/sites/default/files/2026-05/ERGO-central-rules-under-labour-codes-notified.pdf', 'date' => '2026-05'],
        ['publisher' => 'V.V. Giri National Labour Institute', 'title' => 'The Payment of Gratuity Act, 1972 (text, now consolidated into the Code on Social Security, 2020)', 'url' => 'https://vvgnli.gov.in/sites/default/files/Payment%20of%20Gratuity%20Act,%201972.pdf', 'date' => '1972'],
        ['publisher' => 'Constitution of India', 'title' => 'Article 276: Taxes on professions, trades, callings and employments', 'url' => 'https://www.constitutionofindia.net/articles/article-276-taxes-on-professions-trades-callings-and-employments/', 'date' => '1950'],
        ['publisher' => 'Business Today', 'title' => 'NPS taxation changed after Budget 2024: old vs new tax regime rules', 'url' => 'https://www.businesstoday.in/amp/union-budget/story/union-budget-nps-taxation-changed-after-budget-2024-check-old-vs-new-tax-regime-taxation-rules-for-nps-462031-2025-01-25', 'date' => '2025-01-25'],
    ],
];
