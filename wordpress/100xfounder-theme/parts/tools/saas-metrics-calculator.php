<?php
/** SEO content for /tools/saas-metrics-calculator/ (rendered by page-tools.php). Main keyword: "ltv cac calculator" (mid difficulty). */
if (!defined('ABSPATH')) {
    exit;
}
return [
    'h1' => 'SaaS Metrics Calculator: LTV:CAC, CAC, MRR, Churn, NRR',
    'lede' => 'Work out LTV, CAC and the LTV:CAC ratio, CAC payback, MRR and ARR, churn, net revenue retention and the rule of 40 in one place.',
    'features' => [
        'LTV:CAC calculator from revenue per account, gross margin, churn, spend and new customers',
        'CAC payback period in months',
        'MRR and ARR from customers and average revenue per account',
        'Churn rate and net revenue retention (NRR)',
        'Rule of 40 from growth and profit margin',
        'Works in rupees or any currency; runs in your browser',
    ],
    'sections' => [
        ['id' => 'what', 'h2' => 'What this LTV:CAC calculator covers', 'html' => <<<'HTML'
<p>Subscription businesses are judged on a handful of numbers: how much a customer is worth, what it costs to win one, how fast that cost comes back, how much recurring revenue there is, how many customers leave, and whether existing customers spend more over time. This page puts the six most-used calculations in one tool, each on its own tab:</p>
<ul>
<li><strong>LTV:CAC calculator</strong>: customer lifetime value against customer acquisition cost.</li>
<li><strong>CAC payback</strong>: months of gross profit needed to earn back the cost of acquiring a customer.</li>
<li><strong>MRR and ARR</strong>: monthly and annual recurring revenue.</li>
<li><strong>Churn</strong>: the share of customers lost in a period.</li>
<li><strong>NRR</strong>: net revenue retention, recurring revenue kept from existing customers after upgrades, downgrades and cancellations.</li>
<li><strong>Rule of 40</strong>: growth rate plus profit margin.</li>
</ul>
<p>The LTV:CAC calculator is the tab most founders open first, because the ratio sums up whether growth is worth paying for. The others explain why the ratio is what it is. Amounts work in rupees or any other currency; enter rates as percentages. In Indian notation, one lakh is 1,00,000 and one crore is 100 lakh.</p>
HTML
        ],
        ['id' => 'ltv-cac', 'h2' => 'How LTV, CAC and the ratio are calculated', 'html' => <<<'HTML'
<p>The calculator uses these formulas:</p>
<ul>
<li><strong>LTV</strong> = ARPA &times; gross margin &divide; monthly churn. ARPA is average revenue per account per month. Dividing by churn gives the expected customer lifetime in months (3% monthly churn means 1 &divide; 0.03 = about 33 months), and the gross margin turns revenue into gross profit.</li>
<li><strong>CAC</strong> = sales and marketing spend &divide; new customers won in the same period.</li>
<li><strong>Ratio</strong> = LTV &divide; CAC.</li>
</ul>
<h3>Worked example</h3>
<p>A B2B tool charges an average of &#8377;5,000 a month per account, runs at an 80% gross margin and loses 3% of customers a month. Last month it spent &#8377;4,00,000 on sales and marketing and won 10 new customers.</p>
<table>
<thead><tr><th>Metric</th><th>Working</th><th>Result</th></tr></thead>
<tbody>
<tr><td>LTV</td><td>&#8377;5,000 &times; 80% &divide; 3%</td><td>&#8377;1,33,333</td></tr>
<tr><td>CAC</td><td>&#8377;4,00,000 &divide; 10</td><td>&#8377;40,000</td></tr>
<tr><td>Ratio</td><td>&#8377;1,33,333 &divide; &#8377;40,000</td><td>3.3</td></tr>
<tr><td>CAC payback</td><td>&#8377;40,000 &divide; (&#8377;5,000 &times; 80%)</td><td>10 months</td></tr>
</tbody>
</table>
<p>David Skok's widely cited guide "SaaS Metrics 2.0" says the best SaaS businesses have an LTV to CAC ratio above 3, and that this is a guideline rather than a hard rule; many healthy companies don't meet it early on. By that yardstick the example in the LTV:CAC calculator clears the bar, just.</p>
<figure class="xf-figure"><img src="{{brand}}tool-saas-ltv-cac.png" alt="Worked example card: ARPA Rs 5,000 a month, 80% gross margin and 3% monthly churn give an LTV of Rs 1,33,333; Rs 4,00,000 of spend for 10 new customers gives a CAC of Rs 40,000; LTV to CAC ratio 3.3 and CAC payback 10 months" width="1600" height="900" loading="lazy" decoding="async"><figcaption>The example's lifetime value, acquisition cost and ratio. Graphic: 100xFounder.</figcaption></figure>
<h3>CAC calculation for SaaS: what to include</h3>
<p>CAC is only useful if the spend is complete. Include salaries and commissions of the sales and marketing team, paid advertising, tools, agencies and events for the period, and divide by customers won in the same period. If your sales cycle is long, compare spend with customers won a cycle later. Andreessen Horowitz's "16 Startup Metrics" warns that blended CAC, which counts organic customers who cost nothing, can hide whether paid acquisition is working; look at paid CAC separately.</p>
HTML
        ],
        ['id' => 'payback', 'h2' => 'CAC payback period calculator', 'html' => <<<'HTML'
<p><strong>CAC payback (months) = CAC &divide; (ARPA &times; gross margin).</strong></p>
<p>It answers a cash question: how many months of a customer's gross profit it takes to recover what you spent winning them. In the example, &#8377;40,000 &divide; &#8377;4,000 of monthly gross profit = 10 months. Until then, each new customer is a net cash cost, which is why fast-growing subscription companies can burn cash even when every customer is profitable over its lifetime.</p>
<p>Skok's guide says the best SaaS businesses recover CAC in about 5 to 7 months, and that profitability becomes weak once payback goes beyond 12 months. Payback also ignores churn: a customer who leaves in month 8 never pays back a 10-month CAC. If your churn is high, check the two numbers together.</p>
HTML
        ],
        ['id' => 'mrr', 'h2' => 'MRR calculator and ARR calculation example', 'html' => <<<'HTML'
<p><strong>MRR = paying customers &times; ARPA. ARR = MRR &times; 12.</strong></p>
<p>With 200 paying customers at an average of &#8377;5,000 a month, MRR is &#8377;10,00,000 (&#8377;10 lakh) and ARR is &#8377;1,20,00,000 (&#8377;1.2 crore). Stripe's guide to MRR describes the same customer method and notes that MRR counts only recurring subscription income: one-time fees, hardware and setup charges belong in total revenue, not MRR.</p>
<p>Annual plans paid upfront count towards MRR at one-twelfth of their annual value. Discounts should be netted off, and free trials don't count until they convert. ARR here is simply MRR &times; 12, a run rate, not a forecast of what you will bill over the next year.</p>
HTML
        ],
        ['id' => 'churn', 'h2' => 'Churn rate calculator', 'html' => <<<'HTML'
<p><strong>Churn rate = customers lost in the period &divide; customers at the start of the period.</strong></p>
<p>If you start the month with 200 customers and 6 cancel, churn is 6 &divide; 200 = 3%. Count only customers who were there at the start; new customers who join and leave in the same month distort the rate. That 3% is the monthly churn the LTV tab uses.</p>
<p>Monthly churn compounds. At 3% a month, the share of a starting group still with you after a year is 0.97 to the power of 12, about 69%, so annual churn is roughly 31%, not 36%. Quote which one you mean.</p>
<p>Customer churn and revenue churn are different. a16z's metrics guide separates gross churn (revenue lost) from net churn, which subtracts upgrades and can make losses look smaller than they are. That is what the next tab measures.</p>
HTML
        ],
        ['id' => 'nrr', 'h2' => 'NRR calculator (net revenue retention)', 'html' => <<<'HTML'
<p><strong>NRR = (starting MRR + expansion &minus; contraction &minus; churned MRR) &divide; starting MRR.</strong></p>
<p>Take a cohort of customers paying &#8377;10 lakh of MRR at the start of the year. Over the year they add &#8377;1.5 lakh through upgrades and extra seats, lose &#8377;0.5 lakh through downgrades, and &#8377;0.8 lakh leaves with customers who cancel. NRR is (10 + 1.5 &minus; 0.5 &minus; 0.8) &divide; 10 = 102%.</p>
<p>Above 100% means existing customers alone grew revenue, even before any new sales. Skok calls this negative churn: expansion from existing customers outweighs what is lost to cancellations, so each cohort's revenue grows over time. Usage-based pricing and upsells are the usual routes to it. New customers won during the period are excluded from NRR by definition.</p>
<figure class="xf-figure"><img src="{{brand}}tool-saas-nrr.png" alt="Net revenue retention example: starting MRR of Rs 10 lakh, plus Rs 1.5 lakh expansion, minus Rs 0.5 lakh contraction and Rs 0.8 lakh churn, ends at Rs 10.2 lakh, an NRR of 102%" width="1600" height="900" loading="lazy" decoding="async"><figcaption>From starting MRR to 102% net revenue retention. Graphic: 100xFounder.</figcaption></figure>
HTML
        ],
        ['id' => 'rule40', 'h2' => 'Rule of 40 calculation for SaaS', 'html' => <<<'HTML'
<p><strong>Rule of 40 score = revenue growth rate % + profit margin %.</strong></p>
<p>A company growing 30% a year with a 15% profit margin scores 30 + 15 = 45, above 40. Brad Feld described the rule in 2015 as growth rate plus profit adding up to at least 40%: a company growing 20% should be making a 20% profit, while one growing 50% can afford to lose 10%. He suggested measuring growth as year-on-year growth in MRR and preferred EBITDA as the profit measure, checked against others such as free cash flow. Say which measures you used when you quote a score.</p>
<p>It is a rough balance check for companies past the early stage, not a target for a company at &#8377;10 lakh of MRR. Early on, growth is the number that matters most; Paul Graham's essay "Startup = Growth" argues it is what defines a startup in the first place.</p>
HTML
        ],
        ['id' => 'levers', 'h2' => 'Improving LTV:CAC: three levers', 'html' => <<<'HTML'
<p>Every input in the LTV:CAC calculator is a lever, and some move the ratio more than others. Take a smaller product sold to small businesses: &#8377;1,500 a month per account, a 75% gross margin, 5% monthly churn, and &#8377;3,00,000 of sales and marketing spend that wins 40 customers. LTV is &#8377;22,500, CAC is &#8377;7,500, the ratio is 3.0 and payback is about 6.7 months. Now change one thing at a time:</p>
<table>
<thead><tr><th>Change</th><th>LTV</th><th>Ratio</th><th>Payback</th></tr></thead>
<tbody>
<tr><td>Starting point</td><td>&#8377;22,500</td><td>3.0</td><td>6.7 months</td></tr>
<tr><td>Churn cut from 5% to 3% a month</td><td>&#8377;37,500</td><td>5.0</td><td>6.7 months</td></tr>
<tr><td>Price raised to &#8377;1,800, churn unchanged</td><td>&#8377;27,000</td><td>3.6</td><td>5.6 months</td></tr>
</tbody>
</table>
<p>Cutting churn raised lifetime value by two-thirds but didn't shorten payback, because payback ignores how long a customer stays. Raising the price helped both, as long as it doesn't drive churn up; run the price change through the tool with a higher churn too, to see where it stops paying off.</p>
<h3>Lever 1: retention</h3>
<p>Because churn sits in the denominator of LTV, small improvements at high churn are worth a lot. Onboarding, support response and the first weeks of use are where most early cancellations are decided; look at who leaves and when before changing anything else.</p>
<h3>Lever 2: price and packaging</h3>
<p>ARPA lifts LTV and shortens payback at once. Annual plans, usage-based tiers and add-ons are common ways to raise it, and they can feed expansion revenue in NRR too.</p>
<h3>Lever 3: acquisition efficiency</h3>
<p>CAC falls when the same spend wins more customers: better conversion on the website and in trials, sales effort focused on the segments that close, and channels that bring customers without paid media. Re-run the LTV:CAC calculator by channel to see which ones earn their budget.</p>
HTML
        ],
        ['id' => 'inputs', 'h2' => 'Where to find the inputs', 'html' => <<<'HTML'
<p>Most of the numbers come from two places: your billing system and your accounts.</p>
<ul>
<li><strong>ARPA and customer counts</strong> come from billing. Use paying accounts at the end of the month and their recurring charges, after discounts. If you bill some customers yearly, divide their annual fee by 12.</li>
<li><strong>Gross margin</strong> comes from the accounts: revenue minus the direct cost of delivering the service (hosting, third-party APIs, payment fees, customer support), divided by revenue. Agree the definition once and keep it.</li>
<li><strong>Churn</strong> comes from billing: accounts that cancelled or didn't renew during the month, against accounts at the start of the month.</li>
<li><strong>Sales and marketing spend</strong> comes from the accounts and payroll: salaries and commissions of the people who sell and market, ad spend, tools, events and agencies.</li>
<li><strong>Expansion and contraction</strong> come from billing: the change in recurring charges for customers who were already paying at the start of the period.</li>
</ul>
<p>For a young company with a handful of customers, a single month's figures swing a lot. Use a three-month average for churn and CAC, and say so when you share the numbers. Investors care more about a consistent method and an honest trend than about a flattering single month.</p>
HTML
        ],
        ['id' => 'reading', 'h2' => 'Reading the numbers together', 'html' => <<<'HTML'
<p>No single metric tells the story. A high ratio from an LTV:CAC calculator built on a churn guess you haven't measured is not real. A short payback with falling NRR may mean you are winning small customers who don't grow. Use the tabs together:</p>
<ul>
<li>If the ratio is low, check whether the problem is churn (LTV side) or spend per customer (CAC side).</li>
<li>If payback is long, look at pricing and gross margin before cutting marketing.</li>
<li>If NRR is under 100%, retention and expansion deserve attention before more acquisition spend.</li>
</ul>
<p>Track the inputs monthly and keep the definitions fixed, so changes reflect the business, not the method. If you are preparing for a raise, see what comparable companies are announcing on our <a href="/funding-tracker/">funding tracker</a>, check how long your cash lasts with the <a href="/tools/runway-calculator/">runway calculator</a>, and for AI products work your API bill into gross margin with the <a href="/tools/ai-token-cost-calculator/">token cost calculator</a>.</p>
HTML
        ],
        ['id' => 'tips', 'h2' => 'Tips and common mistakes', 'html' => <<<'HTML'
<h3>Tips</h3>
<ul>
<li>Use gross margin, not revenue, in LTV and payback. a16z's "16 More Startup Metrics" says software businesses typically reach gross margins of about 80&ndash;90%; for AI products, model and hosting costs come out of gross margin and can pull it lower.</li>
<li>Measure churn by cohort as well as overall, so new and old customers don't hide each other.</li>
<li>Recalculate CAC by channel; a blended number hides the channel that loses money.</li>
<li>Use a cautious churn figure for young companies; a few months of data can mislead in either direction.</li>
</ul>
<h3>Common mistakes</h3>
<ul>
<li><strong>Leaving salaries out of CAC.</strong> Ad spend alone understates it.</li>
<li><strong>Counting one-time fees in MRR.</strong></li>
<li><strong>Mixing monthly and annual churn</strong> in the same LTV formula.</li>
<li><strong>Including new customers in NRR.</strong> It measures the existing base only.</li>
<li><strong>Treating 3:1 or 40 as laws.</strong> Use the LTV:CAC calculator to compare yourself with your own past months first. They are guidelines from investors and operators, useful for comparison, not pass marks.</li>
</ul>
HTML
        ],
    ],
    'howto' => [
        'h2' => 'How to use the SaaS metrics calculator',
        'intro' => 'Pick the tab for the metric you need; the LTV:CAC calculator tab opens first. Each one needs only a few numbers from your billing and accounts.',
        'steps' => [
            ['name' => 'Choose a tab', 'text' => 'Pick the LTV:CAC calculator, CAC payback, MRR/ARR, churn, NRR or the growth-plus-margin tab.'],
            ['name' => 'Enter revenue inputs', 'text' => 'For LTV and payback, enter average revenue per account per month, gross margin % and monthly churn %.'],
            ['name' => 'Enter acquisition inputs', 'text' => 'For CAC, enter total sales and marketing spend for a period and the new customers won in it.'],
            ['name' => 'Enter retention inputs', 'text' => 'For churn and NRR, enter the starting customers or MRR, then customers lost or the expansion, contraction and churned MRR.'],
            ['name' => 'Read and compare', 'text' => 'Results update as you type. Compare them month by month with the same definitions.'],
        ],
    ],
    'faq' => [
        ['q' => 'How do you calculate the LTV to CAC ratio?', 'a' => 'Divide customer lifetime value by customer acquisition cost. LTV is average monthly revenue per account times gross margin divided by monthly churn; CAC is sales and marketing spend divided by new customers. This LTV:CAC calculator does both steps and shows the ratio.'],
        ['q' => 'What is a good ratio in an LTV:CAC calculator?', 'a' => 'David Skok\'s "SaaS Metrics 2.0" says the best SaaS businesses are above 3, and calls it a guideline rather than a hard rule.'],
        ['q' => 'How is CAC calculated for SaaS?', 'a' => 'Total sales and marketing cost for a period, including salaries, commissions, ads and tools, divided by the new customers won in that period.'],
        ['q' => 'What is a good CAC payback period?', 'a' => 'Skok\'s guide says the best SaaS companies recover CAC in about 5 to 7 months, and that beyond 12 months profitability gets weak. Read it together with churn.'],
        ['q' => 'How do I calculate ARR from MRR?', 'a' => 'Multiply MRR by 12. For example, &#8377;10 lakh of MRR is &#8377;1.2 crore of ARR. Leave one-time fees out of both.'],
        ['q' => 'What does NRR above 100% mean?', 'a' => 'Existing customers grew revenue on their own: upgrades and expansion outweighed downgrades and cancellations. New customers are not included.'],
        ['q' => 'Should I use customer churn or revenue churn for LTV?', 'a' => 'The formula here uses customer churn with average revenue per account, which is simplest. If large and small customers leave at very different rates, revenue churn gives a truer picture; track both and say which one you used.'],
        ['q' => 'How do you calculate the rule of 40?', 'a' => 'Add the revenue growth rate and the profit margin, both as percentages. Growth of 30% and a 15% margin give 45. Brad Feld suggested EBITDA as the profit measure.'],
    ],
    'sources' => [
        ['publisher' => 'For Entrepreneurs (David Skok)', 'title' => 'SaaS Metrics 2.0: A Guide to Measuring and Improving What Matters', 'url' => 'https://www.forentrepreneurs.com/saas-metrics-2/', 'date' => '2016'],
        ['publisher' => 'Andreessen Horowitz (a16z)', 'title' => '16 Startup Metrics', 'url' => 'https://a16z.com/16-startup-metrics/', 'date' => '2015-08-21'],
        ['publisher' => 'Feld Thoughts (Brad Feld)', 'title' => 'The Rule of 40% For a Healthy SaaS Company', 'url' => 'https://feld.com/archives/2015/02/rule-40-healthy-saas-company/', 'date' => '2015-02-03'],
        ['publisher' => 'Stripe', 'title' => 'What is MRR, or monthly recurring revenue?', 'url' => 'https://stripe.com/resources/more/what-is-monthly-recurring-revenue', 'date' => '2026-05-11'],
        ['publisher' => 'Andreessen Horowitz (a16z)', 'title' => '16 More Startup Metrics', 'url' => 'https://a16z.com/16-more-startup-metrics/', 'date' => '2015-09-23'],
        ['publisher' => 'Paul Graham', 'title' => 'Startup = Growth', 'url' => 'https://paulgraham.com/growth.html', 'date' => '2012-09'],
    ],
];
