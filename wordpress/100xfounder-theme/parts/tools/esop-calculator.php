<?php
/** SEO content for /tools/esop-calculator/ (rendered by page-tools.php). Main keyword: "esop calculator" (mid difficulty). */
if (!defined('ABSPATH')) {
    exit;
}
return [
    'h1' => 'ESOP Calculator (India): Vesting, Tax and Value',
    'lede' => 'See how many of your stock options have vested, what exercising costs, the Indian tax at exercise and sale, and what you could keep at an exit price.',
    'features' => [
        'Vested options after a cliff with monthly vesting',
        'Exercise cost from the strike price',
        'Perquisite tax at exercise at your slab rate plus 4% cess',
        'Capital gains tax at sale: 12.5% if held over 24 months, else slab rate',
        'Gross and net value at an illustrative exit price',
        'Runs in your browser; nothing is stored or sent',
    ],
    'sections' => [
        ['id' => 'what', 'h2' => 'What the ESOP calculator shows', 'html' => <<<'HTML'
<p>Employee stock options are a promise, not cash. A grant letter tells you how many options you have and the price you will pay to turn each into a share, but it rarely tells you what that is worth to you after vesting, the cost of exercising and two rounds of tax. This ESOP calculator fills that gap for employees of Indian companies.</p>
<p>You enter the details from your grant letter and a few assumptions, and it shows:</p>
<ul>
<li><strong>Vested options</strong> and the share of your grant they represent, after the cliff.</li>
<li><strong>Exercise cost</strong>: what you pay the company to buy the shares.</li>
<li><strong>Perquisite value and tax</strong>: the gain at exercise, taxed as salary.</li>
<li><strong>Capital gain and tax</strong>: the further gain when you sell, taxed as capital gains.</li>
<li><strong>Gross and net value</strong>: what the shares would fetch at your illustrative exit price, and what is left after exercise cost and both taxes.</li>
</ul>
<p>The exit price is your assumption, not a forecast. Most private-company options are only worth something if the company is sold, lists on a stock exchange or runs a buyback, and many never reach that point. Use the ESOP calculator to understand the mechanics and to compare offers, not to count on a number.</p>
<p>For readers outside India: one lakh is Rs 1,00,000. The tax rules on this page are Indian and apply to residents; other countries tax options differently.</p>
HTML
        ],
        ['id' => 'calculation', 'h2' => 'ESOP calculation formula: how the tool works', 'html' => <<<'HTML'
<p>Each step below is exactly what the ESOP calculator does.</p>
<h3>The formula</h3>
<ol>
<li><strong>Vesting</strong>: total vesting months = vesting years × 12. If months served is less than the cliff, nothing has vested. Otherwise, vested options = options granted × months served ÷ total months (capped at the full grant), rounded down to a whole option.</li>
<li><strong>Exercise cost</strong> = vested options × exercise (strike) price.</li>
<li><strong>Perquisite value</strong> = vested options × (fair market value at exercise − strike price).</li>
<li><strong>Perquisite tax</strong> = perquisite value × your slab rate × 1.04 (4% cess).</li>
<li><strong>Capital gain</strong> = vested options × (exit price − fair market value at exercise).</li>
<li><strong>Capital gains tax</strong> = gain × 12.5% × 1.04 if you held the shares over 24 months; otherwise gain × your slab rate × 1.04. A loss is shown, but no tax saving is counted for it.</li>
<li><strong>Gross value</strong> = vested options × exit price.</li>
<li><strong>Net value</strong> = gross value − exercise cost − perquisite tax − capital gains tax.</li>
</ol>
<p>Surcharge, which applies on higher incomes, is not included, so the tax shown can be lower than your actual bill if your income is high.</p>
<h3>Worked example: 4,800 options after 18 months</h3>
<p>You were granted 4,800 options at a strike price of Rs 10, vesting over 4 years with a 12-month cliff. You have served 18 months. When you exercise, the fair market value (FMV) is Rs 200 a share. You assume an exit at Rs 500 a share more than 24 months after exercise, and you pay tax at the 30% slab.</p>
<table>
<thead><tr><th>Line</th><th>How it is worked out</th><th>Amount</th></tr></thead>
<tbody>
<tr><td>Vested options</td><td>4,800 × 18 ÷ 48</td><td>1,800 (37.5%)</td></tr>
<tr><td>Exercise cost</td><td>1,800 × Rs 10</td><td>Rs 18,000</td></tr>
<tr><td>Perquisite value</td><td>1,800 × (Rs 200 − Rs 10)</td><td>Rs 3,42,000</td></tr>
<tr><td>Perquisite tax</td><td>3,42,000 × 30% × 1.04</td><td>Rs 1,06,704</td></tr>
<tr><td>Capital gain</td><td>1,800 × (Rs 500 − Rs 200)</td><td>Rs 5,40,000</td></tr>
<tr><td>Capital gains tax (long-term)</td><td>5,40,000 × 12.5% × 1.04</td><td>Rs 70,200</td></tr>
<tr><td>Gross value at exit</td><td>1,800 × Rs 500</td><td>Rs 9,00,000</td></tr>
<tr><td><strong>Net value</strong></td><td>9,00,000 − 18,000 − 1,06,704 − 70,200</td><td><strong>Rs 7,05,096</strong></td></tr>
</tbody>
</table>
<p>Of Rs 9 lakh in gross value, about 78% is left after exercise and tax. Notice that the bigger tax bill comes at exercise, when you may not yet have sold anything.</p>
HTML
        ],
        ['id' => 'vesting', 'h2' => 'ESOP vesting calculator: cliffs and monthly vesting', 'html' => <<<'HTML'
<p>Vesting is how you earn your options over time. Your grant letter sets the vesting schedule. A common structure is four years with a one-year cliff: nothing vests in the first 12 months, a quarter vests at the cliff, and the rest vests monthly. <a href="https://stripe.com/au/resources/more/founder-vesting" rel="noopener">Stripe Atlas</a> describes the same four-year, one-year-cliff pattern for founders. Some companies use different lengths, yearly instead of monthly steps, or back-loaded schedules; enter your own terms.</p>
<figure class="xf-figure"><img src="{{brand}}tool-esop-vesting.png" alt="Step chart of 4,800 options on a 4-year schedule with a 1-year cliff: zero vested for 11 months, 1,200 vested at month 12, then 100 more each month until all 4,800 vest at month 48" width="1600" height="900" loading="lazy" decoding="async"><figcaption>4,800 options, one-year cliff, then 100 a month until month 48. Graphic: 100xFounder.</figcaption></figure>
<p>For the 4,800-option grant:</p>
<ul>
<li>At 11 months, nothing has vested. If you leave now, you leave with no options.</li>
<li>At 12 months, 1,200 options (25%) vest at once.</li>
<li>From then on, 100 more vest each month: 1,800 at 18 months, 2,400 at 24 months.</li>
<li>At 48 months, all 4,800 have vested.</li>
</ul>
<p>Two things to check in your plan document: how long you have to exercise vested options after you leave (the exercise window), and what happens to unvested options if the company is acquired. Both vary by company.</p>
HTML
        ],
        ['id' => 'tax', 'h2' => 'How is ESOP taxed in India?', 'html' => <<<'HTML'
<p>ESOP taxation in India happens at two points. This is a summary, and section numbers changed when the Income-tax Act, 2025 replaced the 1961 Act from 1 April 2026; according to law firm <a href="https://ksandk.com/labour-employment/esop-taxation-in-india-understanding-the-two-stage-taxation-and-startup-tax-deferral/" rel="noopener">King Stubb &amp; Kasiva</a>, the provisions were renumbered but the two-stage model is unchanged.</p>
<figure class="xf-figure"><img src="{{brand}}tool-esop-tax.png" alt="Timeline of an employee stock option: grant (no tax), vest (no tax), exercise (perquisite taxed as salary on FMV minus strike), sale (capital gain on sale price minus FMV at exercise)" width="1600" height="900" loading="lazy" decoding="async"><figcaption>No tax at grant or vesting; salary tax at exercise; capital gains tax at sale. Graphic: 100xFounder.</figcaption></figure>
<h3>1. At exercise: taxed as salary (perquisite)</h3>
<p>When you exercise, the difference between the share's fair market value on the exercise date and the price you pay is a perquisite, taxed as part of your salary at your slab rate. <a href="https://taxsummaries.pwc.com/india/individual/income-determination" rel="noopener">PwC's tax summary for India</a> notes that for unlisted shares, the FMV is set by a SEBI-registered Category I merchant banker, as of the exercise date or a date up to 180 days earlier. Your employer deducts tax at source through payroll, which can make the month you exercise a thin payday.</p>
<h3>2. At sale: capital gains</h3>
<p>When you sell, the gain is the sale price minus the FMV used for the perquisite, which becomes your cost. King Stubb &amp; Kasiva explains this link between the two stages. For unlisted shares, a holding of more than 24 months makes the gain long-term, according to PwC. The Union Budget speech of July 2024 set long-term gains on all financial and non-financial assets at 12.5%, and PwC's summary dates the change to transfers from 23 July 2024. Short-term gains on unlisted shares are added to your income and taxed at your slab rate. Cess at 4% applies in both cases; surcharge may apply on higher incomes.</p>
<p>Listed shares follow different holding periods and rates. If your company has listed, check the rules for listed equity before using this ESOP calculator's tax lines.</p>
<h3>Deferral for employees of eligible startups</h3>
<p>Employees of eligible startups can defer the tax at exercise. According to PwC, the tax is then due within 14 days of the earliest of: five years from the end of the tax year of allotment, the date you sell the shares, or the date you leave the company. King Stubb &amp; Kasiva stresses that DPIIT recognition alone does not make a startup eligible, so ask your employer whether it qualifies. The ESOP calculator does not model deferral; it shows the tax as if paid at exercise.</p>
<p>This page is general information, not tax advice. Confirm your position with a chartered accountant or on incometax.gov.in.</p>
HTML
        ],
        ['id' => 'examples', 'h2' => 'ESOP calculation examples for employees', 'html' => <<<'HTML'
<p>Same grant (4,800 options at Rs 10, four years, one-year cliff, FMV Rs 200 at exercise, 30% slab), different situations:</p>
<table>
<thead><tr><th>Scenario</th><th>Vested</th><th>Total tax</th><th>Net value</th></tr></thead>
<tbody>
<tr><td>Leave at 11 months</td><td>0</td><td>Rs 0</td><td>Rs 0</td></tr>
<tr><td>18 months, exit Rs 500, held over 24 months</td><td>1,800</td><td>Rs 1,76,904</td><td>Rs 7,05,096</td></tr>
<tr><td>18 months, exit Rs 500, held under 24 months</td><td>1,800</td><td>Rs 2,75,184</td><td>Rs 6,06,816</td></tr>
<tr><td>Full 48 months, exit Rs 500, held over 24 months</td><td>4,800</td><td>Rs 4,71,744</td><td>Rs 18,80,256</td></tr>
<tr><td>18 months, exit Rs 150 (below FMV)</td><td>1,800</td><td>Rs 1,06,704</td><td>Rs 1,45,296</td></tr>
</tbody>
</table>
<ul>
<li><strong>Selling sooner costs more.</strong> Selling within 24 months moves the gain to the 30% slab: about Rs 98,000 more tax in this case.</li>
<li><strong>Staying to full vesting multiplies the value</strong>, but only if the company does well.</li>
<li><strong>A falling price can leave you worse off than it looks.</strong> If the exit price is below the FMV at exercise, you already paid salary tax on a gain that disappeared. In the last row, Rs 1,06,704 of tax was paid on a perquisite of Rs 3,42,000, and the shares are later sold for Rs 2,70,000. The tool does not count any tax benefit from the capital loss; ask a CA how a loss can be used.</li>
</ul>
HTML
        ],
        ['id' => 'decide', 'h2' => 'Using the numbers to make decisions', 'html' => <<<'HTML'
<h3>Comparing job offers</h3>
<p>When an offer combines a lower salary with options, compare the salary difference in cash with a cautious net ESOP value. Run the ESOP calculator at a conservative exit price, and remember that options are illiquid and uncertain while salary is paid every month. Our <a href="/tools/in-hand-salary-calculator/">in-hand salary calculator</a> gives the monthly take-home for the cash part.</p>
<h3>Deciding when to exercise</h3>
<p>Exercising early starts the 24-month clock for long-term capital gains, but it means paying the exercise price and the perquisite tax before you can sell. Exercising late, or at a sale, avoids paying for shares that may become worthless but can mean a large tax bill at once. There is no universal answer; it depends on the company's prospects, your cash and your plan's rules.</p>
<h3>If you are a founder setting up a pool</h3>
<p>The <a href="/tools/cap-table-calculator/">cap table calculator</a> shows how an option pool affects ownership when you raise money, and our <a href="/jobs/">jobs board</a> lists startups that are hiring.</p>
HTML
        ],
        ['id' => 'questions', 'h2' => 'Questions to ask before you accept ESOPs', 'html' => <<<'HTML'
<p>The numbers in an ESOP calculator are only as good as the inputs, and most of the inputs come from documents you may not have seen yet. Before you accept an offer with options, or decide whether to stay for the next vesting date, ask the company these questions. Reasonable employers answer them.</p>
<ul>
<li><strong>How many options, at what strike price, and on what schedule?</strong> Get the grant letter, not a summary in an email.</li>
<li><strong>What percentage of the company is my grant?</strong> A number of options means little without the total share count. Ask for your grant as a percentage of fully diluted shares.</li>
<li><strong>What is the latest fair market value, and when was it set?</strong> It tells you the perquisite you would be taxed on if you exercised today.</li>
<li><strong>How long can I exercise after I leave?</strong> A short window can force you to find cash for the exercise price and tax quickly, or lose the options.</li>
<li><strong>Is the company an eligible startup for tax deferral?</strong> It changes when you pay tax at exercise.</li>
<li><strong>Has the company ever run a buyback or secondary sale for employees?</strong> That is the main way employees of private companies turn shares into cash before an exit.</li>
<li><strong>What happens to unvested options if the company is acquired?</strong> Some plans accelerate vesting; others do not.</li>
</ul>
<p>Write the answers next to your inputs. When you revisit the ESOP calculator a year later, you will know which assumptions have changed.</p>
HTML
        ],
        ['id' => 'tips', 'h2' => 'Tips and common mistakes', 'html' => <<<'HTML'
<h3>Tips</h3>
<ul>
<li><strong>Read your grant letter and plan document.</strong> The vesting schedule, exercise window and what happens on acquisition are all there.</li>
<li><strong>Ask for the latest FMV.</strong> It drives both the perquisite tax and your capital gains cost.</li>
<li><strong>Plan cash for exercise.</strong> You need the exercise price and possibly the ESOP tax before you can sell.</li>
<li><strong>Ask whether your employer is an eligible startup</strong> for the tax deferral.</li>
</ul>
<h3>Common mistakes</h3>
<ul>
<li><strong>Valuing options at the latest funding round price.</strong> The price investors paid was for their class of shares and can differ from the FMV used for yours; ask HR for the current FMV.</li>
<li><strong>Forgetting the cliff.</strong> Leaving a month before it means leaving with nothing.</li>
<li><strong>Ignoring tax at exercise.</strong> It is due even though you have not sold.</li>
<li><strong>Missing the exercise window after leaving.</strong> Unexercised vested options can lapse.</li>
<li><strong>Treating the exit price as certain.</strong> It is an assumption; test a low one too.</li>
</ul>
HTML
        ],
    ],
    'howto' => [
        'h2' => 'How to use the ESOP calculator',
        'intro' => 'Keep your grant letter handy. The exit price is your own assumption.',
        'steps' => [
            ['name' => 'Enter your grant', 'text' => 'Type the number of options granted and the exercise (strike) price per option.'],
            ['name' => 'Enter the vesting terms', 'text' => 'Type the vesting period in years, the cliff in months, and how many months you have served.'],
            ['name' => 'Enter prices', 'text' => 'Type the fair market value per share at exercise and an illustrative exit price per share.'],
            ['name' => 'Enter your tax details', 'text' => 'Choose your income tax slab rate and whether you will hold the shares for more than 24 months before selling.'],
            ['name' => 'Read the result', 'text' => 'The result shows vested options, exercise cost, perquisite and capital gains with their tax, and gross and net value.'],
        ],
    ],
    'faq' => [
        ['q' => 'How is ESOP taxed in India?', 'a' => 'Twice: at exercise, the gap between fair market value and the strike price is taxed as salary at your slab rate; at sale, the gain over that fair market value is a capital gain, taxed at 12.5% if unlisted shares were held over 24 months, or at your slab rate if not. Cess applies to both.'],
        ['q' => 'What is the ESOP calculation formula?', 'a' => 'Vested options = granted × months served ÷ total vesting months (zero before the cliff). Net value = vested × exit price − exercise cost − perquisite tax − capital gains tax. The ESOP calculator above shows each line.'],
        ['q' => 'Can I see an ESOP calculation example for employees?', 'a' => 'With 4,800 options at Rs 10, a one-year cliff over four years and 18 months served, 1,800 options have vested. At an FMV of Rs 200 and an exit at Rs 500 held over 24 months, the net value at the 30% slab is Rs 7,05,096.'],
        ['q' => 'Is this an ESOP vesting calculator too?', 'a' => 'Yes. Enter vesting years, cliff months and months served to see how many options have vested and what share of the grant that is.'],
        ['q' => 'Can startup employees defer the tax at exercise?', 'a' => 'Employees of eligible startups can defer it until the earliest of five years from the end of the tax year of allotment, sale of the shares, or leaving the company. DPIIT recognition alone does not make a startup eligible; ask your employer.'],
        ['q' => 'Is there a stock options calculator for non-Indian tax rules?', 'a' => 'This one applies Indian tax rules for residents. You can still use it for vesting, exercise cost and gross value anywhere; set the tax inputs to zero and work out tax under your own country\'s rules.'],
        ['q' => 'Does the ESOP calculator include surcharge?', 'a' => 'No. It applies your slab rate or 12.5%, plus 4% cess. If your income is high enough for surcharge, your actual tax will be higher.'],
    ],
    'sources' => [
        ['publisher' => 'Ministry of Finance, Government of India', 'title' => 'Budget 2024-2025: speech of the Minister of Finance (paras 143-144, capital gains)', 'url' => 'https://www.indiabudget.gov.in/budget2024-25/doc/Budget_Speech.pdf', 'date' => '2024-07-23'],
        ['publisher' => 'PwC Worldwide Tax Summaries', 'title' => 'India: individual income determination (stock options, startup deferral)', 'url' => 'https://taxsummaries.pwc.com/india/individual/income-determination', 'date' => '2026-05-12'],
        ['publisher' => 'PwC Worldwide Tax Summaries', 'title' => 'India: individual other taxes (capital gains holding periods and rates)', 'url' => 'https://taxsummaries.pwc.com/india/individual/other-taxes', 'date' => '2026-05-12'],
        ['publisher' => 'King Stubb & Kasiva', 'title' => 'ESOP taxation in India: understanding the two-stage taxation and startup tax deferral', 'url' => 'https://ksandk.com/labour-employment/esop-taxation-in-india-understanding-the-two-stage-taxation-and-startup-tax-deferral/', 'date' => '2026-10-14'],
        ['publisher' => 'Stripe Atlas', 'title' => 'Founder vesting: schedules, cliffs, and what it protects', 'url' => 'https://stripe.com/au/resources/more/founder-vesting', 'date' => '2026-10-01'],
    ],
];
