<?php
/** SEO content for /tools/runway-calculator/ (rendered by page-tools.php). Main keyword: "runway calculator" (mid difficulty). */
if (!defined('ABSPATH')) {
    exit;
}
return [
    'h1' => 'Runway Calculator for Startups',
    'lede' => 'See how many months your cash lasts, the date it runs out, and whether revenue growth gets you to profit first: default alive or default dead.',
    'features' => [
        'Net burn from gross burn and monthly revenue',
        'Simple months of cash: cash in bank divided by net burn',
        'Month-by-month projection with revenue growth',
        'Zero cash date counted from today',
        'Default alive check: does growth reach profit before the cash runs out',
        'Runs in your browser; nothing is stored or sent',
    ],
    'sections' => [
        ['id' => 'what', 'h2' => 'What a runway calculator tells you', 'html' => <<<'HTML'
<p>Every startup that is not yet profitable is spending down a pile of cash. The question that matters most is simple: how many months until that pile is gone, and does anything change before then? A runway calculator answers it from four numbers you already know: the cash in the bank, what you spend each month, what you earn each month, and how fast revenue is growing.</p>
<p>This one gives you three answers side by side:</p>
<ul>
<li><strong>Simple months of cash.</strong> Cash divided by today's net burn, assuming nothing changes. It is the number most founders quote, and the most pessimistic one if revenue is growing.</li>
<li><strong>Months of cash with growth.</strong> A month-by-month projection where revenue grows at the rate you enter, so net burn shrinks over time. This is closer to what will actually happen if your growth holds.</li>
<li><strong>Zero cash date or "default alive".</strong> The calendar date the money runs out, counted from today. If growing revenue overtakes spending before the cash is gone, the tool tells you so instead of showing a date.</li>
</ul>
<p>A note for readers outside India: the examples use lakh and crore. One lakh is Rs 1,00,000 and one crore is Rs 1,00,00,000 (100 lakh). The maths is the same in any currency, so you can enter dollars, euros or pounds and read the results in the same unit.</p>
<p>Use it before a fundraise, when planning a hire, when a big customer churns, or simply once a month as part of your board update. It takes less than a minute and removes the most common source of nasty surprises in an early-stage company: not knowing how much time is left.</p>
HTML
        ],
        ['id' => 'calculation', 'h2' => 'How the calculator works out your months of cash', 'html' => <<<'HTML'
<p>The maths is short. Each step below is exactly what the tool does.</p>
<h3>The formula</h3>
<ol>
<li><strong>Net burn</strong> = monthly gross burn − monthly revenue.</li>
<li><strong>Simple months of cash</strong> = cash in bank ÷ net burn (shown only when net burn is above zero).</li>
<li><strong>With growth</strong>: in month <em>m</em>, revenue = today's revenue × (1 + growth)<sup>m−1</sup>, and that month's net burn = gross burn − that revenue. The tool subtracts each month's net burn from cash, month after month. In the month where net burn is larger than the cash left, it counts the fraction of the month the cash covers.</li>
<li><strong>Zero cash date</strong> = today + the whole months + the leftover fraction × 30.44 days.</li>
<li><strong>Default alive</strong>: if cash never goes below zero within 600 months (50 years), growth has closed the gap and the tool says so instead of showing a date.</li>
</ol>
<p>Gross burn is assumed to stay flat. If you plan to hire, enter the higher burn you expect after the hires, or run the tool twice and compare.</p>
<figure class="xf-figure"><img src="{{brand}}tool-runway-formula.png" alt="Formula card: net burn equals gross burn minus revenue; months of cash equals cash in bank divided by net burn; Rs 50 lakh cash, Rs 10 lakh gross burn and Rs 4 lakh revenue give Rs 6 lakh net burn and 8.3 months" width="1600" height="900" loading="lazy" decoding="async"><figcaption>The core formula, with the worked example below. Graphic: 100xFounder.</figcaption></figure>
<h3>Worked example: Rs 50 lakh in the bank</h3>
<p>A startup has Rs 50 lakh of cash. It spends Rs 10 lakh a month on salaries, rent, tools and marketing, and earns Rs 4 lakh a month from customers.</p>
<table>
<thead><tr><th>Line</th><th>How it is worked out</th><th>Value</th></tr></thead>
<tbody>
<tr><td>Cash in bank</td><td>Your bank balance today</td><td>Rs 50,00,000</td></tr>
<tr><td>Gross burn</td><td>Everything you spend in a month</td><td>Rs 10,00,000</td></tr>
<tr><td>Revenue</td><td>Cash collected from customers in a month</td><td>Rs 4,00,000</td></tr>
<tr><td><strong>Net burn</strong></td><td>10,00,000 − 4,00,000</td><td><strong>Rs 6,00,000</strong></td></tr>
<tr><td><strong>Simple months of cash</strong></td><td>50,00,000 ÷ 6,00,000</td><td><strong>8.3 months</strong></td></tr>
<tr><td>With 10% monthly revenue growth</td><td>Revenue passes Rs 10 lakh in month 11, before the cash is gone</td><td><strong>Reaches profit first</strong></td></tr>
</tbody>
</table>
<p>Without growth, the money lasts a little over eight months. With revenue growing 10% a month, revenue reaches about Rs 10.4 lakh in month 11 and the company stops losing money before the bank balance hits zero. That one input changes the conversation completely.</p>
HTML
        ],
        ['id' => 'examples', 'h2' => 'Examples: how revenue growth changes the picture', 'html' => <<<'HTML'
<p>Here is the same company (Rs 50 lakh cash, Rs 10 lakh gross burn, Rs 4 lakh revenue) at different monthly growth rates, straight from the runway calculator:</p>
<table>
<thead><tr><th>Monthly revenue growth</th><th>Months of cash</th><th>Result</th></tr></thead>
<tbody>
<tr><td>0%</td><td>8.3</td><td>Cash runs out</td></tr>
<tr><td>3%</td><td>9.1</td><td>Cash runs out</td></tr>
<tr><td>5%</td><td>10.1</td><td>Cash runs out</td></tr>
<tr><td>10%</td><td>Not reached</td><td>Profitable before cash runs out</td></tr>
</tbody>
</table>
<figure class="xf-figure"><img src="{{brand}}tool-runway-curve.png" alt="Line chart of the cash balance for Rs 50 lakh cash, Rs 10 lakh gross burn and Rs 4 lakh revenue: with no growth the balance falls to zero after about 8.3 months; with 10% monthly revenue growth the curve flattens and turns up before reaching zero" width="1600" height="900" loading="lazy" decoding="async"><figcaption>Same company, two growth rates: flat revenue runs dry in 8.3 months, 10% monthly growth reaches profit first. Graphic: 100xFounder.</figcaption></figure>
<p>Two things stand out. First, modest growth buys surprisingly little time: 3% a month adds under a month, and 5% adds under two. Second, there is a tipping point. Somewhere between 5% and 10% a month, revenue catches up with spending before the cash runs out, and the answer flips from a date to profitability.</p>
<h3>More scenarios</h3>
<ul>
<li><strong>Pre-revenue.</strong> Rs 50 lakh of cash and Rs 10 lakh gross burn with no revenue: net burn is the full Rs 10 lakh, so the money lasts exactly 5 months.</li>
<li><strong>After a seed round.</strong> Rs 2 crore of cash, Rs 15 lakh gross burn, Rs 5 lakh revenue: simple months of cash is 20. With 4% monthly revenue growth, revenue overtakes spending before the cash runs out, so the company reaches profit on the cash it has.</li>
</ul>
<p>Treat the growth input honestly. Use the average of the last three to six months, not your best month. If you are not sure, run the runway calculator at your recent rate and again at half of it; the gap between the two answers is your margin for error.</p>
HTML
        ],
        ['id' => 'gross-net', 'h2' => 'Gross vs net burn: the burn rate calculator inside the tool', 'html' => <<<'HTML'
<p>Burn rate is the speed at which a company uses up cash, and there are two versions of it. Founders mix them up all the time, and the difference can be several months of life.</p>
<ul>
<li><strong>Gross burn</strong> is everything that leaves the bank in a month: salaries, rent, cloud bills, software, marketing, contractors, taxes paid. It tells you how expensive the company is to run.</li>
<li><strong>Net burn</strong> is gross burn minus the cash that comes in from customers. It tells you how fast the bank balance is actually falling.</li>
</ul>
<p>In the worked example, gross burn is Rs 10 lakh and net burn is Rs 6 lakh. Dividing cash by gross burn gives 5 months; dividing by net burn gives 8.3. Both numbers are useful. Gross burn is the floor you fall to if revenue disappears, which is the worst case to plan for if you depend on a few large customers. Net burn is the realistic base case.</p>
<p>Use cash figures, not accounting figures. Revenue you have invoiced but not collected does not pay salaries, and annual software bills paid up front distort a single month. If your spending is lumpy, take a three-month average for gross burn.</p>
<p>The tool doubles as a simple burn rate calculator: enter gross burn and revenue and read net burn on the first line of the result. Stripe's guide for founders defines both figures the same way, as does Slash, which adds that money customers owe you, unused credit lines and revenue projections should be left out of the cash figure.</p>
HTML
        ],
        ['id' => 'default-alive', 'h2' => 'Default alive or default dead?', 'html' => <<<'HTML'
<p>The phrase comes from an October 2015 essay by Y Combinator co-founder Paul Graham, <a href="https://paulgraham.com/aord.html" rel="noopener">"Default Alive or Default Dead?"</a>. His test: if expenses stay where they are and revenue keeps growing at its recent rate, does the company reach profitability on the money it already has? If yes, it is default alive; if no, default dead. Graham writes that half the founders he talks to cannot answer the question, and that it is safer to start asking it too early than too late.</p>
<p>That test is exactly what the growth projection in this tool runs. It holds gross burn flat, grows revenue at your rate each month, and checks whether revenue overtakes spending before the cash runs out. If it does, the result says so. If not, you see the zero cash date.</p>
<p>Why does it matter? A company on the losing path has to change something: raise money, cut costs or grow faster. Knowing that early gives you time to act while you still have options. A company on the winning path can raise from a position of strength, or choose not to raise at all.</p>
<p>The answer depends heavily on assumptions, so treat it as a direction, not a guarantee. Growth rates rarely stay constant, and hiring plans change burn. Revisit it every month with fresh numbers.</p>
HTML
        ],
        ['id' => 'india', 'h2' => 'Using it as a startup runway calculator in India', 'html' => <<<'HTML'
<p>The tool works in any currency, but a few practical points come up for founders in India:</p>
<ul>
<li><strong>Enter rupees in full.</strong> Type Rs 50 lakh as 5000000. The results come back in the same unit.</li>
<li><strong>Include statutory payments in gross burn.</strong> Employer PF contributions, professional tax, GST you pay out and TDS deposits all leave the bank. If you are unsure what a salary costs the company, our <a href="/tools/in-hand-salary-calculator/">in-hand salary calculator</a> shows how CTC splits into the parts an employer pays.</li>
<li><strong>Count GST correctly on revenue.</strong> If you collect GST from customers, the tax portion is not yours to spend. Enter revenue net of GST.</li>
<li><strong>Plan the next round early.</strong> Raising money takes months, so start before the cash is nearly gone. Our <a href="/funding-tracker/">funding tracker</a> shows which Indian startups are raising and at what stage, and the <a href="/tools/cap-table-calculator/">cap table calculator</a> shows what a round does to your ownership.</li>
</ul>
<p>For broader context on what is happening in the ecosystem, our <a href="/news/">startup news</a> section covers funding, layoffs and shutdowns as they happen.</p>
HTML
        ],
        ['id' => 'extend', 'h2' => 'Ways to make your cash last longer', 'html' => <<<'HTML'
<p>If the result is shorter than you would like, there are only three levers: spend less, collect more, or add cash. Each one shows up directly in the tool, so you can test a change before you make it.</p>
<h3>Spend less</h3>
<ul>
<li><strong>Review every recurring cost.</strong> Software seats, unused cloud resources and agency retainers creep up quietly. Cancel what nobody uses and renegotiate what you keep.</li>
<li><strong>Sequence hiring.</strong> Hire for roles that directly drive revenue or product first, and delay the rest. Contractors can cover short gaps without a permanent increase in gross burn.</li>
<li><strong>Cut once, not repeatedly.</strong> If you need to reduce costs, one considered cut is less damaging to a team than several small ones months apart.</li>
</ul>
<h3>Collect more, sooner</h3>
<ul>
<li><strong>Shorten payment terms.</strong> Moving customers from 60-day to 30-day terms brings cash forward without any new sales.</li>
<li><strong>Offer annual plans.</strong> Upfront annual payments, even at a discount, put cash in the bank today. Remember the cash covers a year of service you still have to deliver.</li>
<li><strong>Raise prices where you can.</strong> A price rise on new customers lifts revenue with no extra cost.</li>
</ul>
<h3>Add cash</h3>
<ul>
<li><strong>Start fundraising before you need to.</strong> Stripe's guide advises raising before it becomes urgent, because a company that is nearly out of money negotiates on worse terms.</li>
<li><strong>Consider bridge money from existing investors.</strong> A small extension can buy the months needed to hit a milestone.</li>
<li><strong>Look at non-dilutive options.</strong> Grants, customer prepayments and revenue-based financing may fit some businesses.</li>
</ul>
<p>After each change, rerun the numbers in the runway calculator. A Rs 1 lakh monthly cut in the worked example takes net burn from Rs 6 lakh to Rs 5 lakh and the simple figure from 8.3 to 10 months.</p>
HTML
        ],
        ['id' => 'tips', 'h2' => 'Tips and common mistakes', 'html' => <<<'HTML'
<h3>Tips</h3>
<ul>
<li><strong>Update it monthly.</strong> Put the result in every board or investor update. A trend of shrinking months is a signal to act.</li>
<li><strong>Run three scenarios.</strong> Your recent growth rate, half of it, and zero. Plan around the middle one.</li>
<li><strong>Model the hire before you make it.</strong> Add the full monthly cost of a planned hire to gross burn and see how much time it costs.</li>
<li><strong>Keep a buffer.</strong> Decide in advance the point at which you will cut costs or start raising, and write it down.</li>
</ul>
<h3>Common mistakes</h3>
<ul>
<li><strong>Dividing cash by gross burn and calling it net.</strong> Or the reverse. Know which number you are quoting.</li>
<li><strong>Counting invoiced revenue as cash.</strong> Late-paying customers shorten the real number of months.</li>
<li><strong>Using your best month's growth.</strong> One great month is not a trend. Use an average.</li>
<li><strong>Forgetting annual and one-off costs.</strong> Insurance, audits, annual software licences and deposits hit in single months. Average them into gross burn.</li>
<li><strong>Treating the result as a forecast.</strong> It is a projection from today's numbers. Real burn and growth will move.</li>
</ul>
HTML
        ],
    ],
    'howto' => [
        'h2' => 'How to use the runway calculator',
        'intro' => 'You need four numbers from your bank statements and accounts. All amounts are in the same currency.',
        'steps' => [
            ['name' => 'Enter cash in bank', 'text' => 'Type the cash you have available today across all company accounts, excluding money you owe to others such as GST collected.'],
            ['name' => 'Enter monthly gross burn', 'text' => 'Type the total cash that leaves the company in a typical month. Use a three-month average if spending is lumpy.'],
            ['name' => 'Enter monthly revenue', 'text' => 'Type the cash you collect from customers in a typical month, net of GST. Enter zero if you are pre-revenue.'],
            ['name' => 'Enter monthly revenue growth', 'text' => 'Type your average monthly revenue growth as a percentage, for example 5. Leave it at zero to see the flat case.'],
            ['name' => 'Read the result', 'text' => 'The result shows net burn, simple months of cash, months with growth, and the zero cash date from today, or default alive if growth closes the gap.'],
        ],
    ],
    'faq' => [
        ['q' => 'How do you calculate startup runway?', 'a' => 'Subtract monthly revenue from monthly spending to get net burn, then divide your cash in bank by net burn. Rs 50 lakh of cash with Rs 6 lakh of net burn gives about 8.3 months. The runway calculator above also projects revenue growth month by month.'],
        ['q' => 'What is the difference between gross vs net burn?', 'a' => 'Gross burn is everything you spend in a month. Net burn is gross burn minus the cash you collect from customers. Net burn tells you how fast your bank balance is falling.'],
        ['q' => 'Is this a cash runway calculator or a financial runway calculator?', 'a' => 'Both terms mean the same thing here: how long your cash lasts at your current spending and revenue. Personal-finance tools use "financial runway" for how long savings last without income; the maths is the same, with expenses in place of burn.'],
        ['q' => 'What does default alive mean?', 'a' => 'It is Paul Graham\'s term for a startup that will reach profitability on the cash it has, if expenses stay flat and revenue keeps growing at its recent rate. Default dead means the money runs out first.'],
        ['q' => 'Can I use it as a burn rate calculator?', 'a' => 'Yes. Enter monthly gross burn and monthly revenue, and the first line of the result is your net burn rate.'],
        ['q' => 'Does the startup runway calculator work for India?', 'a' => 'Yes. Enter amounts in rupees, include PF, GST and TDS payments in gross burn, and enter revenue net of GST. The result comes back in rupees.'],
        ['q' => 'How many months of cash should a startup keep?', 'a' => 'There is no single right number; it depends on how long your next fundraise or path to profit will take. Plan to start raising or cutting costs well before the cash is close to running out, because a round can take months to close.'],
    ],
    'sources' => [
        ['publisher' => 'Paul Graham', 'title' => 'Default Alive or Default Dead?', 'url' => 'https://paulgraham.com/aord.html', 'date' => '2015-10'],
        ['publisher' => 'Stripe', 'title' => 'What is burn rate? What startups need to know about this key metric', 'url' => 'https://stripe.com/gb/resources/more/what-is-burn-rate-what-startups-need-to-know-about-this-key-metric', 'date' => '2026-03-15'],
        ['publisher' => 'Slash', 'title' => 'Startup burn rate and runway: how to calculate, manage, and optimize both', 'url' => 'https://slash.com/blog/burn-rate-vs-runway', 'date' => '2026-05-28'],
    ],
];
