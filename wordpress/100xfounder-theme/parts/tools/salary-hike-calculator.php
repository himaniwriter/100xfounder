<?php
/** SEO content for /tools/salary-hike-calculator/ (rendered by page-tools.php). Main keyword: "salary hike calculator" (high difficulty). */
if (!defined('ABSPATH')) {
    exit;
}
return [
    'h1' => 'Salary Hike Calculator',
    'lede' => 'See what a raise really adds to your monthly in-hand pay after tax and PF, not just the new CTC. Free, for tax year 2026-27.',
    'features' => [
        'Works from a hike percentage or from the new CTC you have been offered',
        'Monthly in-hand pay before and after the raise, under the new or old tax regime',
        'Extra take-home pay per month, and the share of the raise you actually keep',
        'Tax year 2026-27 slabs, rebate, surcharge and 4% cess',
        'EPF at the â¹25,000 wage ceiling and gratuity in CTC',
        'Runs in your browser; nothing is stored',
    ],
    'sections' => [
        ['id' => 'what', 'h2' => 'What this salary hike calculator shows', 'html' => <<<'HTML'
<p>Most pay raises in India are quoted as a percentage of CTC (cost to company: everything the employer spends on you in a year, including its own PF share and gratuity). A 30% salary hike on a â¹12 LPA package sounds like â¹30,000 more a month. It isn't. Part of the salary increase goes to income tax, part to gratuity that you only collect when you leave, and sometimes part to the employer's PF. What lands in your bank account each month is smaller, and how much smaller depends on where your salary sits in the tax slabs.</p>
<p>This salary hike calculator does both halves of the sum. First it works out the new CTC, or the hike percentage if you already have an offer in rupees. Then the hike calculator runs the old and new packages through the same in-hand maths as our <a href="/tools/in-hand-salary-calculator/">in-hand salary calculator</a> and shows four numbers:</p>
<ul>
<li><strong>New CTC and hike percentage</strong>: the headline figures your manager or recruiter will quote.</li>
<li><strong>Monthly in-hand before and after</strong>: take-home pay after employee PF, professional tax and income tax with cess.</li>
<li><strong>Extra in-hand per month</strong>: the real size of the pay raise. It goes negative for a pay cut.</li>
<li><strong>Share of the raise you keep</strong>: extra in-hand divided by extra CTC. This is the number that tells you whether a salary increase is as good as it looks.</li>
</ul>
<p>People reach this page with different questions: "how much hike did I get?", "what will a 20% increment do to my monthly pay?", "is this offer a good pay raise?". The same two inputs answer all of them. Whether you call it an increment calculator, a percentage hike tool or a pay raise calculator, the useful output is the last line: how much of the salary increase actually lands in your account.</p>
<p>A quick note on terms for readers outside India: LPA means lakh per annum, and one lakh is 1,00,000 rupees, so 12 LPA is â¹12,00,000 a year. A crore is 100 lakh. The salary hike calculator is built for salaried employees in India and uses the rates for tax year 2026-27 (1 April 2026 to 31 March 2027), the first year under the Income-tax Act, 2025.</p>
<p>Use the salary hike calculator as a planning estimate. This page is general information, not tax or legal advice. Confirm your own figures with a qualified professional or at incometax.gov.in.</p>
HTML
        ],
        ['id' => 'formula', 'h2' => 'How the hike is calculated: the hike percentage calculator formula', 'html' => <<<'HTML'
<h3>The hike percentage formula</h3>
<p>The arithmetic of a salary hike is simple. If you know your old and new CTC:</p>
<p><strong>Hike percentage = (new CTC &minus; old CTC) &divide; old CTC &times; 100</strong></p>
<p>If you know the percentage and want the new figure:</p>
<p><strong>New CTC = old CTC &times; (1 + hike % &divide; 100)</strong></p>
<p>So â¹12 lakh with a 30% hike becomes 12,00,000 &times; 1.30 = â¹15,60,000. And an offer of â¹15 lakh against a current â¹12 lakh is (15 &minus; 12) &divide; 12 &times; 100 = a 25% hike. The tool accepts either input: pick <em>Hike %</em> to type a percentage, or <em>New CTC</em> to type the offer and let it work out the percentage hike for you.</p>
<h3>From CTC to in-hand pay</h3>
<p>For each CTC, the salary hike calculator then applies the same steps, with fixed assumptions so that the before and after figures are comparable:</p>
<ol>
<li>Basic pay is taken as 50% of CTC.</li>
<li>EPF is 12% of basic from you and 12% from the employer, capped at the statutory wage ceiling of â¹25,000 a month, so at most â¹3,000 a month (â¹36,000 a year) on each side. The ceiling was raised from â¹15,000 by a notification dated 17 September 2026, as reported by <a href="https://www.bdo.in/en-gb/insights/alerts-updates/alert-new-epf-ceiling-hiked">BDO India</a>.</li>
<li>Gratuity is provisioned at 4.81% of basic (15 days' wages per year, counting a month as 26 days), which many employers include in CTC.</li>
<li>Gross salary = CTC &minus; employer PF &minus; gratuity.</li>
<li>Taxable income in the new regime = gross &minus; â¹75,000 standard deduction. In the old regime it is gross &minus; â¹50,000 standard deduction &minus; â¹1.5 lakh of 80C-type deductions (employee PF counts towards this) &minus; â¹2,500 professional tax. The calculator assumes you pay no rent, so it applies no HRA exemption.</li>
<li>Tax follows the slabs for the chosen regime, then the rebate, surcharge with marginal relief, and 4% health and education cess.</li>
<li>In-hand = gross &minus; employee PF &minus; professional tax &minus; income tax.</li>
</ol>
<p>The new regime slabs for tax year 2026-27 are nil up to â¹4 lakh, then 5%, 10%, 15%, 20% and 25% in â¹4 lakh steps, and 30% above â¹24 lakh, with a rebate of up to â¹60,000 that wipes out the tax when taxable income is â¹12 lakh or less. The Finance Bill 2026 memorandum states that rates are unchanged for this tax year. Old regime slabs (under age 60) are nil to â¹2.5 lakh, 5% to â¹5 lakh, 20% to â¹10 lakh and 30% above, with a rebate of up to â¹12,500 up to â¹5 lakh taxable, according to the <a href="https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1">Income Tax Department</a>.</p>
<h3>Worked example: â¹12 lakh to â¹15.6 lakh</h3>
<p>Here is what the salary hike calculator shows for a 30% salary hike on â¹12 LPA in the new regime:</p>
<table>
<thead><tr><th>Line (yearly, Rs)</th><th>Before: 12 lakh CTC</th><th>After: 15.6 lakh CTC</th><th>Change</th></tr></thead>
<tbody>
<tr><td>Basic (50% of CTC)</td><td>6,00,000</td><td>7,80,000</td><td>+1,80,000</td></tr>
<tr><td>Employer PF (capped)</td><td>36,000</td><td>36,000</td><td>0</td></tr>
<tr><td>Gratuity (4.81% of basic)</td><td>28,860</td><td>37,518</td><td>+8,658</td></tr>
<tr><td>Gross salary</td><td>11,35,140</td><td>14,86,482</td><td>+3,51,342</td></tr>
<tr><td>Taxable income (new regime)</td><td>10,60,140</td><td>14,11,482</td><td>+3,51,342</td></tr>
<tr><td>Income tax + cess</td><td>0</td><td>95,391</td><td>+95,391</td></tr>
<tr><td>Employee PF + professional tax</td><td>38,500</td><td>38,500</td><td>0</td></tr>
<tr><td><strong>In-hand per year</strong></td><td>10,96,640</td><td>13,52,591</td><td>+2,55,951</td></tr>
<tr><td><strong>In-hand per month</strong></td><td>91,387</td><td>1,12,716</td><td>+21,329</td></tr>
</tbody>
</table>
<p>The CTC went up by â¹3,60,000 a year, or â¹30,000 a month. In-hand pay went up by â¹21,329 a month, so you keep about 71% of the pay rise. Of the rest, â¹95,391 a year is income tax (before the hike, taxable income was under â¹12 lakh and the rebate made the tax zero; after it, the whole income is taxed) and â¹8,658 is extra gratuity you receive only when you leave after the qualifying service.</p>
<p>In the old regime, with no rent and â¹1.5 lakh of 80C deductions, the same salary increase takes monthly in-hand from â¹82,804 to â¹1,03,532, which is â¹20,727 more a month, or about 69% of the raise.</p>
<figure class="xf-figure"><img src="{{brand}}tool-hike-example.png" alt="Worked example card: â¹12 lakh CTC with a 30% hike to â¹15.6 lakh, new tax regime, monthly in-hand rising from â¹91,387 to â¹1,12,716, â¹21,329 more a month, about 71% of the raise kept" width="1600" height="900" loading="lazy" decoding="async"><figcaption>A 30% hike on â¹12 lakh adds â¹21,329 a month in hand, not â¹30,000. Graphic: 100xFounder.</figcaption></figure>
HTML
        ],
        ['id' => 'examples', 'h2' => 'Salary increment calculator examples at different salaries', 'html' => <<<'HTML'
<p>The share of a salary hike you keep is not fixed. It depends on the tax slab your income moves through. The table below runs the same 30% hike through the salary hike calculator at five CTC levels in the new regime, with the default assumptions above.</p>
<table>
<thead><tr><th>Current CTC</th><th>New CTC (+30%)</th><th>Monthly in-hand before</th><th>Monthly in-hand after</th><th>Extra per month</th><th>Share kept</th></tr></thead>
<tbody>
<tr><td>6 lakh</td><td>7.8 lakh</td><td>42,589</td><td>57,228</td><td>+14,639</td><td>97.6%</td></tr>
<tr><td>10 lakh</td><td>13 lakh</td><td>75,121</td><td>99,520</td><td>+24,399</td><td>97.6%</td></tr>
<tr><td>15 lakh</td><td>19.5 lakh</td><td>1,08,597</td><td>1,38,654</td><td>+30,056</td><td>80.2%</td></tr>
<tr><td>25 lakh</td><td>32.5 lakh</td><td>1,72,656</td><td>2,14,930</td><td>+42,274</td><td>67.6%</td></tr>
<tr><td>40 lakh</td><td>52 lakh</td><td>2,56,896</td><td>3,24,041</td><td>+67,145</td><td>67.1%</td></tr>
</tbody>
</table>
<p>Three patterns stand out:</p>
<ul>
<li><strong>Below the rebate line you keep almost everything.</strong> At â¹6 lakh and â¹10 lakh, taxable income stays at or under â¹12 lakh even after the salary increase, so there is no income tax. The only leak is the extra gratuity (4.81% of the half of CTC that is basic, or about 2.4% of the raise), which is why the share kept is 97.6%.</li>
<li><strong>Crossing â¹12 lakh taxable costs the most at once.</strong> The â¹12 lakh example above keeps about 71% because the pay hike pushes taxable income past the rebate limit and the whole income becomes taxable. Marginal relief softens this for incomes just above the line, but not by much once you are clearly past it.</li>
<li><strong>At higher salaries the share settles near two-thirds.</strong> Above â¹24 lakh taxable, every extra rupee falls in the 30% slab, plus 4% cess, plus the gratuity slice. From â¹25 lakh up, the share kept is around 67&ndash;68%, and it falls further once surcharge applies above â¹50 lakh of income.</li>
</ul>
<figure class="xf-figure"><img src="{{brand}}tool-hike-kept.png" alt="Bar chart of the share of a 30% salary hike taken home under the new tax regime: 97.6% at â¹6 lakh CTC, 97.6% at â¹10 lakh, 80.2% at â¹15 lakh, 67.6% at â¹25 lakh and 67.1% at â¹40 lakh" width="1600" height="900" loading="lazy" decoding="async"><figcaption>How much of a 30% raise reaches your bank account, by current CTC (new regime). Graphic: 100xFounder.</figcaption></figure>
<h3>A typical appraisal hike</h3>
<p>A 10% appraisal hike behaves differently from a 30% one. At â¹12 lakh, 10% takes CTC to â¹13.2 lakh but taxable income only to about â¹11.7 lakh, still under the rebate limit, so monthly in-hand rises from â¹91,387 to â¹1,01,146 and you keep 97.6%. At â¹15 lakh, the same 10% adds â¹10,296 a month (about 82% kept), and at â¹25 lakh it adds â¹14,297 (about 69%).</p>
<h3>An offer quoted in rupees</h3>
<p>Recruiters often quote a new CTC rather than a percentage. Switch the calculator to <em>New CTC</em>: â¹12 lakh to â¹15 lakh is a 25% salary hike, and it adds â¹17,211 a month in hand in the new regime (about 69% kept). A lower offer, say â¹11 lakh, is an 8.3% cut and costs you â¹8,133 a month in hand.</p>
HTML
        ],
        ['id' => 'why-less', 'h2' => 'Why you take home less than the headline hike', 'html' => <<<'HTML'
<p>If your new payslip looks smaller than the hike percentage suggested, one or more of these is usually the reason. The salary hike calculator models the first three; the rest depend on how your offer is written, so read it line by line.</p>
<h3>Income tax slabs and the rebate</h3>
<p>Tax is charged on each slice of income at that slice's rate, so a salary increment is taxed at your top (marginal) rate, not your average rate. In the new regime the jump from zero tax to full tax at â¹12 lakh taxable is the biggest single cliff, which is why mid-level salary hikes around â¹12&ndash;15 lakh CTC feel the smallest in hand. Above â¹50 lakh of income a surcharge of 10% of the tax applies, rising at â¹1 crore and â¹2 crore, with marginal relief at each threshold.</p>
<h3>Provident fund</h3>
<p>Below the wage ceiling, PF grows with your basic pay: a bigger basic means a bigger deduction from you and a bigger employer contribution counted inside CTC. That money is still yours, in your EPF account, but it isn't in-hand. With the â¹25,000 ceiling, PF stops growing once basic passes â¹25,000 a month, if your employer contributes only on the capped wage. Some employers contribute 12% of the full basic; the in-hand calculator lets you untick the cap to see that case.</p>
<h3>Gratuity</h3>
<p>If your CTC includes gratuity, part of every salary increment goes into it. You receive it only on leaving after the qualifying service (or in the other cases the law sets out), so it doesn't show up monthly. Gratuity rules have been changing with India's labour code reforms; check your employer's policy for how and when it is paid.</p>
<h3>Fixed versus variable pay</h3>
<p>Many offers split CTC into fixed pay and a performance bonus or variable pay. A hike on the CTC line can hide a smaller increase in fixed pay. Variable pay is paid only if targets are met, and often once a year, so it doesn't lift your monthly in-hand at all. Before comparing, run the calculator on the fixed component alone as well as on the full CTC.</p>
<h3>Joining bonus and one-time items</h3>
<p>A joining bonus, relocation allowance or retention bonus can be large, but it is paid once and is taxed as salary in the year you receive it. Some offers add it to the first-year CTC, which inflates the hike percentage for that year only. Many joining bonuses also have a clawback if you leave within a year. Leave one-time payments out when you compare year-two pay.</p>
<h3>ESOPs and stock</h3>
<p>Stock options or RSUs may be shown at a notional value inside total compensation. Options at a private startup cannot be sold until there is a buyback, secondary sale or listing, and they are taxed as a perquisite when exercised. Treat them as a possible upside, not as salary, and keep them out of your in-hand comparison.</p>
HTML
        ],
        ['id' => 'appraisal-vs-switch', 'h2' => 'Appraisal hike calculator: annual increment vs job-switch hike', 'html' => <<<'HTML'
<p>How much hike is normal in India? The best public guide is the annual salary increase surveys that consultancies run with employers. They report average salary increase figures across many companies, so your own number can be well above or below them.</p>
<ul>
<li><strong>Aon</strong> said in February 2026 that companies in India were projecting an average salary increase of 9.1% for 2026, up from an actual 8.9% in 2025, from a survey of more than 1,400 organisations across 45 industries. Projections ranged from 10.2% in real estate and infrastructure to 6.6% in technology consulting and services, and attrition fell to 16.2% in 2025, according to the <a href="https://www.aon.com/apac/in-the-press/asia-newsroom/2026/aon-survey-projects-slight-uptick-in-salaries-in-india-2026">Aon release</a>.</li>
<li>Aon's next edition, covering more than 1,200 organisations, puts the 2026 increase at 9% and projects 9.1% for 2027, with attrition up to 18% in 2026, as reported by People Matters on 15 October 2026.</li>
<li><strong>Mercer</strong>'s Total Remuneration Survey 2026, covering more than 1,500 companies, projected an average 9% increase for 2026, with high tech at 9.3% and automotive at 9.5%, as reported by Outlook Business (PTI) on 17 December 2025.</li>
</ul>
<p>So an appraisal hike of around 9% is roughly the market average at the moment. Top performers and people in short supply generally get more; people in sectors with low projections often get less.</p>
<p>Switching jobs is where a bigger salary hike usually happens, but there is no equally solid survey of what employers actually pay movers. What we do have is what employees expect. In foundit's Appraisal Survey 2026 of more than 2,500 professionals, 70% said they would want at least 21% more to move, one in five wanted more than 40%, and only 7% would move for under 10%, according to Business Today (23 July 2026). Those are asks, not outcomes, so use them as context, not as a promise of what you will get.</p>
<p>Whatever the percentage hike on offer, compare the in-hand difference, not the headline. Put both offers through the salary hike calculator: a 30% offer that crosses the â¹12 lakh rebate line can add less per month than you expect, while a 20% appraisal hike at a lower salary can add almost all of it. If you are weighing an offer, the <a href="/tools/notice-period-buyout-calculator/">notice period buyout calculator</a> shows what it would cost to leave early, and our <a href="/jobs/">jobs board</a> lists roles from companies' own careers pages.</p>
HTML
        ],
        ['id' => 'negotiate', 'h2' => 'How to negotiate using in-hand numbers', 'html' => <<<'HTML'
<p>Talking in monthly take-home pay keeps a salary hike negotiation honest on both sides. A few ways to use the numbers:</p>
<ol>
<li><strong>Know your current in-hand to the rupee.</strong> Check your last payslip against the <a href="/tools/in-hand-salary-calculator/">in-hand salary calculator</a> so you know which assumptions match your employer's salary structure (basic share, PF on capped or full basic, rent).</li>
<li><strong>Set a monthly target, then convert it to CTC.</strong> Decide what extra amount a month would make the move worthwhile, then try different new CTC figures in the hike calculator until the extra in-hand matches. That gives you a CTC ask grounded in what you need.</li>
<li><strong>Separate fixed from variable.</strong> Ask for the fixed component in writing. If a large share is variable, ask how much of it was actually paid out last year.</li>
<li><strong>Price the one-time items separately.</strong> Joining bonuses can bridge a notice buyout or a lost bonus at your current job, but they shouldn't be counted in the yearly figure.</li>
<li><strong>Look at the structure, not just the total.</strong> Two offers with the same CTC can give different in-hand pay depending on basic, PF policy and allowances. In the old regime, rent and HRA matter a lot.</li>
</ol>
<p>Be accurate about your current pay when asked. Many employers verify past salary with payslips or bank statements, and a mismatch can cost you the offer.</p>
HTML
        ],
        ['id' => 'tips', 'h2' => 'Tips and common mistakes', 'html' => <<<'HTML'
<h3>Tips</h3>
<ul>
<li>Run both regimes. The new regime is the default, but if you pay high rent and invest the full 80C amount, the old regime can still give more in hand. The in-hand calculator shows the difference.</li>
<li>Check the effect of the â¹12 lakh taxable limit. If a pay raise takes you just past it, a slightly different split (for example, more employer PF on full basic or NPS contributions where your employer offers them) may change the result. Ask your payroll team what the structure allows.</li>
<li>Use the yearly view for big decisions about a pay hike. A â¹5,000 a month difference is â¹60,000 a year in hand.</li>
<li>Re-run the salary hike calculator each year. Tax rules, the PF ceiling and your own salary structure change.</li>
</ul>
<h3>Common mistakes</h3>
<ul>
<li><strong>Dividing the CTC increase by 12.</strong> That is the gross pay raise, not what you take home. Taxes, PF and gratuity come out first.</li>
<li><strong>Comparing a hike on fixed pay with a hike on total CTC.</strong> Always compare like with like.</li>
<li><strong>Counting the joining bonus or ESOPs as salary.</strong> They are one-time or uncertain.</li>
<li><strong>Forgetting the effective date.</strong> A salary hike from 1 July is worth three months less in the current financial year than one from 1 April.</li>
<li><strong>Treating the salary hike calculator's output as a payslip.</strong> It uses standard assumptions (50% basic, capped PF, â¹2,500 professional tax, no rent). Your employer's structure, state, deductions and other income will change the exact figure.</li>
</ul>
<p>For more on pay and careers, browse our <a href="/guides/">guides</a>, and see what founders are building on the <a href="/launches/">launches</a> page.</p>
HTML
        ],
    ],
    'howto' => [
        'h2' => 'How to use the salary hike calculator',
        'intro' => 'The salary hike calculator takes under a minute. You need your current annual CTC and either the hike percentage or the new CTC you have been offered.',
        'steps' => [
            ['name' => 'Enter your current CTC', 'text' => 'Type your current annual cost to company in rupees, for example 1200000 for â¹12 lakh. Use the figure on your offer letter or latest revision letter.'],
            ['name' => 'Choose how to enter the raise', 'text' => 'Pick Hike % if you know the percentage, or New CTC if you have an offer in rupees. The tool works out the other figure.'],
            ['name' => 'Enter the hike or the new CTC', 'text' => 'Type the percentage (for example 30) or the new annual CTC. A new CTC lower than the current one shows a pay cut.'],
            ['name' => 'Pick the tax regime', 'text' => 'The new regime is the default for tax year 2026-27. Tick the old regime box if you have opted for it; the calculator then applies old-regime slabs and deductions.'],
            ['name' => 'Read the results', 'text' => 'Compare monthly in-hand before and after, the extra in-hand per month and the share of the raise you keep. For rent, a different basic share or full-basic PF, check each figure in the in-hand salary calculator.'],
        ],
    ],
    'faq' => [
        ['q' => 'How do I calculate my salary hike percentage?', 'a' => 'Subtract your old CTC from the new CTC, divide by the old CTC and multiply by 100. â¹12 lakh to â¹15 lakh is (15 &minus; 12) &divide; 12 &times; 100 = 25%. The hike calculator does this when you choose the New CTC option.'],
        ['q' => 'Can I use this as a salary increment calculator for my appraisal?', 'a' => 'Yes. For an annual appraisal, enter your current CTC and the increment percentage in your letter. The tool shows the new CTC and, more usefully, how much the increment adds to your monthly in-hand pay. For a job offer, switch to New CTC and type the offered package instead.'],
        ['q' => 'What is the formula for a hike percentage calculator?', 'a' => 'Hike % = (new CTC − old CTC) ÷ old CTC × 100, and new CTC = old CTC × (1 + hike % ÷ 100). A move from â¹12 lakh to â¹15 lakh is a 25% hike; a 30% hike on â¹12 lakh gives â¹15.6 lakh.'],
        ['q' => 'Why is my in-hand increase smaller than my hike?', 'a' => 'The hike is applied to CTC, which includes employer PF and gratuity, and the extra income is taxed at your top slab rate. In the new regime, crossing â¹12 lakh of taxable income also ends the rebate, so the whole income becomes taxable.'],
        ['q' => 'What is a good salary hike in India in 2026?', 'a' => 'Surveys put the average around 9%: Aon reported 9% for 2026 and projects 9.1% for 2027, and Mercer projected 9% for 2026. Strong performers and people changing jobs usually get more. Compare the in-hand difference, not only the percentage.'],
        ['q' => 'How much hike should I ask for when switching jobs?', 'a' => 'There is no fixed rule. In foundit\'s 2026 survey, 70% of professionals said they would want at least 21% to move. Work out the monthly in-hand amount that makes the move worthwhile, then use the salary hike calculator to find the CTC that delivers it.'],
        ['q' => 'Does the salary hike calculator include variable pay and bonuses?', 'a' => 'It treats the whole CTC you enter as salary paid through the year. If part of your package is variable or a one-time bonus, run the salary hike calculator on the fixed part as well to see the guaranteed monthly figure.'],
        ['q' => 'Is the salary hike calculator accurate for the old tax regime?', 'a' => 'It uses the old-regime slabs, â¹50,000 standard deduction, â¹1.5 lakh of 80C deductions and â¹2,500 professional tax, but assumes no rent. If you claim HRA, use the <a href="/tools/in-hand-salary-calculator/">in-hand salary calculator</a> with your rent for each CTC.'],
        ['q' => 'What happens to PF when my salary goes up?', 'a' => 'PF is 12% of basic from you and from your employer. If your employer contributes only on the â¹25,000 monthly wage ceiling, PF stays at â¹3,000 a month each side once basic passes that level, so a raise adds nothing to it. If it contributes on full basic, PF rises with your raise.'],
        ['q' => 'Is this tax advice?', 'a' => 'No. The salary hike calculator gives a planning estimate using standard assumptions for tax year 2026-27. Confirm your figures with a qualified professional or at incometax.gov.in.'],
    ],
    'sources' => [
        ['publisher' => 'Income Tax Department', 'title' => 'Tax rates, rebate, surcharge and cess for individuals', 'url' => 'https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1', 'date' => '2026'],
        ['publisher' => 'Income Tax Department', 'title' => 'Memorandum explaining the provisions in the Finance Bill, 2026', 'url' => 'https://www.incometaxindia.gov.in/documents/81799/11848482/memo-2026.pdf', 'date' => '2026-02-01'],
        ['publisher' => 'BDO India', 'title' => 'Alert: new EPF wage ceiling hiked to â¹25,000', 'url' => 'https://www.bdo.in/en-gb/insights/alerts-updates/alert-new-epf-ceiling-hiked', 'date' => '2026-09'],
        ['publisher' => 'Khaitan & Co', 'title' => 'ERGO: Central rules under labour codes notified', 'url' => 'https://www.khaitanco.com/sites/default/files/2026-05/ERGO-central-rules-under-labour-codes-notified.pdf', 'date' => '2026-05'],
        ['publisher' => 'Aon', 'title' => 'Aon survey projects slight uptick in salaries in India from 8.9 percent in 2025 to 9.1 percent in 2026', 'url' => 'https://www.aon.com/apac/in-the-press/asia-newsroom/2026/aon-survey-projects-slight-uptick-in-salaries-in-india-2026', 'date' => '2026-02-24'],
        ['publisher' => 'People Matters', 'title' => 'Indian companies project 9.1% salary hikes in 2027, up from 9% in 2026', 'url' => 'https://www.peoplematters.in/news/business/indian-companies-project-91percent-salary-hikes-in-2027-up-from-9percent-in-2026-52751', 'date' => '2026-10-15'],
        ['publisher' => 'Outlook Business (PTI)', 'title' => 'India Inc to see 9% salary growth in 2026, with focus on short-term incentives: report', 'url' => 'https://www.outlookbusiness.com/corporate/india-inc-to-see-9-salary-growth-in-2026-with-focus-on-short-term-incentives-report', 'date' => '2025-12-17'],
        ['publisher' => 'Business Today', 'title' => 'Almost everyone is looking to switch jobs, but only if employers meet this pay demand', 'url' => 'https://www.businesstoday.in/jobs/story/almost-everyone-is-looking-to-switch-jobs-but-only-if-employers-meet-this-pay-demand-544684-2026-07-23', 'date' => '2026-07-23'],
    ],
];
