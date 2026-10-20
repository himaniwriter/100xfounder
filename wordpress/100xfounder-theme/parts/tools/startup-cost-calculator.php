<?php
/** SEO content for /tools/startup-cost-calculator/ (rendered by page-tools.php). Main keyword: "startup cost calculator" (mid difficulty). */
if (!defined('ABSPATH')) {
    exit;
}
return [
    'h1' => 'Startup Cost Calculator (India)',
    'lede' => 'Add up one-time setup costs and monthly running costs until revenue, plus a safety buffer, to see the total cash you need to start.',
    'features' => [
        'One-time costs: incorporation, trademark, registrations, equipment, office, website, legal',
        'Monthly costs: salaries, rent, software, cloud, marketing, accounting',
        'Months until revenue to size your running costs',
        'Contingency buffer as a percentage',
        'Total cash needed, with every line shown',
        'Runs in your browser; nothing is stored or sent',
    ],
    'sections' => [
        ['id' => 'what', 'h2' => 'What the startup cost calculator works out', 'html' => <<<'HTML'
<p>Before you quit a job, raise money or sign an office lease, you need one number: how much cash does it take to get this business to the point where customers start paying? A startup cost calculator answers that by adding three things together.</p>
<ul>
<li><strong>One-time costs</strong>: the things you pay for once to get going, such as company incorporation, a trademark, laptops, an office deposit and a website.</li>
<li><strong>Running costs until revenue</strong>: your monthly costs (salaries, rent, software, cloud, marketing, accounting) multiplied by the number of months before revenue starts.</li>
<li><strong>A contingency buffer</strong>: a percentage on top, because things cost more and take longer than planned.</li>
</ul>
<p>The total is the cash you should have available, from savings, friends and family, angels or a grant, before you start.</p>
<p>This page does not give you "typical" costs. Prices for the same item vary widely by city, supplier and how lean you choose to be, and averages found online are rarely sourced. Instead, the tool gives you a structured checklist of the items most Indian startups pay for, and you fill in your own quotes. Where a cost is a fixed government fee that we could check, we say so below with the source. Everything else should come from quotes you collect.</p>
<p>A note on units for readers outside India: one lakh is Rs 1,00,000 and one crore is Rs 1,00,00,000 (100 lakh). You can enter amounts in any currency; the result comes back in the same unit.</p>
HTML
        ],
        ['id' => 'calculation', 'h2' => 'How the startup cost calculator adds it up', 'html' => <<<'HTML'
<p>The formula is deliberately simple, so you can check it by hand. Each step is what the tool does.</p>
<ol>
<li><strong>One-time total</strong> = incorporation + trademark + GST and other registrations + laptops and equipment + office deposit and setup + website and branding + legal and agreements + other one-time costs.</li>
<li><strong>Monthly total</strong> = salaries + office rent + SaaS tools + cloud hosting + marketing + accounting and compliance + other monthly costs.</li>
<li><strong>Running cost</strong> = monthly total × months until revenue.</li>
<li><strong>Buffer</strong> = (one-time total + running cost) × buffer %.</li>
<li><strong>Total cash needed</strong> = one-time total + running cost + buffer.</li>
</ol>
<figure class="xf-figure"><img src="{{brand}}tool-startup-cost-formula.png" alt="Formula card: total cash needed equals one-time costs plus monthly costs times months until revenue, plus a contingency buffer percentage on both" width="1600" height="900" loading="lazy" decoding="async"><figcaption>One-time costs, running costs until revenue, and a buffer on both. Graphic: 100xFounder.</figcaption></figure>
<p>The tool assumes revenue is zero until the month you enter, and that monthly costs stay flat. If you expect some revenue earlier, or plan to hire midway, the <a href="/tools/runway-calculator/">runway calculator</a> handles revenue and growth month by month once you know your starting cash.</p>
<h3>Worked example with illustrative inputs</h3>
<p>The numbers below are a reader's own planning inputs for a small software startup in a metro city, used only to show the maths. They are not typical or recommended costs. The one exception is the trademark fee, which is the official e-filing fee for one class for an applicant that does not qualify as a startup or small enterprise (see below).</p>
<table>
<thead><tr><th>Item</th><th>Type</th><th>Amount (Rs)</th></tr></thead>
<tbody>
<tr><td>Company incorporation (quote from a CA)</td><td>One-time</td><td>15,000</td></tr>
<tr><td>Trademark, one class, standard fee</td><td>One-time</td><td>9,000</td></tr>
<tr><td>GST and other registrations</td><td>One-time</td><td>5,000</td></tr>
<tr><td>Laptops and equipment</td><td>One-time</td><td>2,00,000</td></tr>
<tr><td>Office deposit and setup</td><td>One-time</td><td>1,00,000</td></tr>
<tr><td>Website and branding</td><td>One-time</td><td>50,000</td></tr>
<tr><td>Legal and agreements</td><td>One-time</td><td>50,000</td></tr>
<tr><td>Other one-time</td><td>One-time</td><td>20,000</td></tr>
<tr><td><strong>One-time total</strong></td><td></td><td><strong>4,49,000</strong></td></tr>
<tr><td>Salaries</td><td>Monthly</td><td>3,00,000</td></tr>
<tr><td>Office rent</td><td>Monthly</td><td>40,000</td></tr>
<tr><td>SaaS tools</td><td>Monthly</td><td>15,000</td></tr>
<tr><td>Cloud hosting</td><td>Monthly</td><td>10,000</td></tr>
<tr><td>Marketing</td><td>Monthly</td><td>50,000</td></tr>
<tr><td>Accounting and compliance (CA)</td><td>Monthly</td><td>10,000</td></tr>
<tr><td>Other monthly</td><td>Monthly</td><td>10,000</td></tr>
<tr><td><strong>Monthly total</strong></td><td></td><td><strong>4,35,000</strong></td></tr>
<tr><td>Running cost for 6 months</td><td>4,35,000 × 6</td><td>26,10,000</td></tr>
<tr><td>Buffer at 20%</td><td>(4,49,000 + 26,10,000) × 20%</td><td>6,11,800</td></tr>
<tr><td><strong>Total cash needed</strong></td><td></td><td><strong>36,70,800</strong></td></tr>
</tbody>
</table>
<p>About Rs 36.7 lakh in all. Notice where the money goes: one-time costs are about 12% of the total, while six months of running costs are about 71%. For most startups, the months until revenue matter far more than the setup bill.</p>
HTML
        ],
        ['id' => 'examples', 'h2' => 'Examples: what changes the total most', 'html' => <<<'HTML'
<p>Change one input at a time in the example above and the startup cost calculator shows which assumptions carry the most weight.</p>
<ul>
<li><strong>Revenue takes nine months, not six.</strong> Running costs rise to Rs 39,15,000, the buffer to Rs 8,72,800, and the total to Rs 52,36,800. Three extra months add about Rs 15.7 lakh.</li>
<li><strong>A lean founder-only start.</strong> No salaries and no office: incorporation Rs 15,000, trademark Rs 9,000, registrations Rs 5,000, one laptop Rs 1,00,000, website Rs 30,000, legal Rs 30,000, other Rs 10,000; monthly SaaS Rs 10,000, cloud Rs 5,000, marketing Rs 20,000, CA Rs 5,000, other Rs 5,000; six months; 15% buffer. The total is Rs 5,39,350. These are again illustrative inputs, not typical costs.</li>
</ul>
<h3>Why time beats everything else</h3>
<p>In the first example, the eight one-time lines add up to less than the monthly bill multiplied by two. Whenever salaries start on day one, a few months of payroll quickly outweighs a one-off bill, which is why budgeting only for setup leads to surprises. The cost to start a business is mostly the cost of waiting for customers.</p>
<p>The lesson in both: the biggest lever is the monthly bill multiplied by time. Cutting one salary or reaching revenue a month earlier usually saves more than any negotiation over laptops or a logo.</p>
HTML
        ],
        ['id' => 'india', 'h2' => 'How much does it cost to start a startup in India?', 'html' => <<<'HTML'
<p>There is no honest single figure. A solo founder building software from home and a hardware company with a lab and a team of ten can both be "startups", and their startup costs differ by orders of magnitude. What we can do is separate the fixed government charges you can look up from the costs you have to get quotes for.</p>
<h3>Government fees we checked</h3>
<ul>
<li><strong>Trademark application.</strong> The official fee for filing a trademark application (Form TM-A) online is Rs 4,500 per class for an individual, a startup or a small enterprise, and Rs 9,000 per class for all other applicants, according to the IP India fee schedule and law firm <a href="https://ssrana.in/ip-laws/trademarks-in-india/tm-filing-fees-forms-india/" rel="noopener">S.S. Rana &amp; Co</a>. Fees apply per class and per mark, so a brand registered in three classes pays three times. Check whether your company qualifies for the lower fee before filing.</li>
</ul>
<h3>Costs to get quotes for</h3>
<ul>
<li><strong>Incorporation.</strong> Company registration through the Ministry of Corporate Affairs involves government filing fees that depend on authorised capital, state stamp duty that varies by state, digital signatures for directors, and professional fees if you use a CA or company secretary. Ask two or three firms for an all-in quote.</li>
<li><strong>GST and other registrations.</strong> Whether you need GST, a shops and establishments licence or professional tax registration depends on your state, turnover and type of business. A CA can tell you which apply.</li>
<li><strong>Salaries.</strong> The cost to the company is more than the pay you agree. Employer PF contributions are 12% of basic pay up to the Rs 25,000 monthly wage ceiling that applied from 17 September 2026, according to <a href="https://www.bdo.in/en-gb/insights/alerts-updates/alert-new-epf-ceiling-hiked" rel="noopener">BDO India</a>. Our <a href="/tools/in-hand-salary-calculator/">in-hand salary calculator</a> shows how a CTC splits into its parts.</li>
<li><strong>Office, software, cloud, marketing.</strong> Collect real quotes or use your current bills. Many software tools and cloud providers publish their prices; use the plan you will actually need.</li>
</ul>
<p>Fees and rules change. Confirm every government charge on the official portal before you rely on it. This page is not legal, tax or accounting advice.</p>
HTML
        ],
        ['id' => 'checklist', 'h2' => 'Startup budget template: the checklist', 'html' => <<<'HTML'
<p>The startup cost calculator's fields double as a startup budget template. Go through each line and either enter a number or decide deliberately that it is zero for you.</p>
<figure class="xf-figure"><img src="{{brand}}tool-startup-cost-checklist.png" alt="Checklist of cost categories in two columns: one-time (incorporation, trademark, GST and registrations, laptops and equipment, office deposit and setup, website and branding, legal and agreements, other) and monthly (salaries, office rent, SaaS tools, cloud hosting, marketing, accounting and compliance, other)" width="1600" height="900" loading="lazy" decoding="async"><figcaption>The one-time and monthly categories the calculator asks for. Graphic: 100xFounder.</figcaption></figure>
<h3>One-time</h3>
<ul>
<li>Company incorporation (government fees, stamp duty, professional fees)</li>
<li>Trademark (per class)</li>
<li>GST and other registrations</li>
<li>Laptops, phones and equipment</li>
<li>Office deposit, furniture and setup</li>
<li>Website, domain, logo and branding</li>
<li>Legal: founders' agreement, employment contracts, terms of service, privacy policy</li>
<li>Other: anything specific to your business, such as licences or inventory</li>
</ul>
<h3>Monthly</h3>
<ul>
<li>Salaries, including employer contributions</li>
<li>Office rent and utilities (or co-working)</li>
<li>SaaS tools: email, collaboration, design, CRM</li>
<li>Cloud hosting and APIs</li>
<li>Marketing and sales</li>
<li>Accounting, tax filing and compliance (CA)</li>
<li>Other recurring costs</li>
</ul>
HTML
        ],
        ['id' => 'reduce', 'h2' => 'Ways to lower your startup costs', 'html' => <<<'HTML'
<p>Once you see the total, the natural next question is how to bring it down without hurting the business. The startup cost calculator makes each option easy to test: change one field and watch the total move.</p>
<h3>Shorten the time to revenue</h3>
<p>Because running costs are usually the largest part, the fastest saving is reaching paying customers sooner. Sell before you build where you can: pre-orders, paid pilots, letters of intent or a paid waitlist. Launch a narrow first version instead of the full product. Every month you remove from "months until revenue" removes a full month of salaries, rent and tools from your startup budget.</p>
<h3>Delay fixed commitments</h3>
<ul>
<li><strong>Office.</strong> Work from home or a co-working space until the team needs a room. That removes the deposit and setup from one-time costs and rent from monthly costs.</li>
<li><strong>Hiring.</strong> Hire for the roles that create revenue or product first. Use freelancers or contractors for short, defined work.</li>
<li><strong>Branding.</strong> A simple logo and website are enough to start selling. A full brand can follow once you know who your customers are.</li>
</ul>
<h3>Use free and startup tiers</h3>
<p>Many software and cloud providers offer free plans or startup credits. Check each provider's own pricing page for what applies to you and when the free period ends, so a surprise bill does not land in month seven.</p>
<h3>Keep compliance tidy</h3>
<p>Late filings and penalties are an avoidable cost of starting. Budget for a CA from day one and keep records monthly; it is cheaper than fixing a year of missed filings.</p>
HTML
        ],
        ['id' => 'funding', 'h2' => 'Paying for it: where the money comes from', 'html' => <<<'HTML'
<p>Once you know the total cost to start a startup like yours, you can decide how to fund it. The usual sources, roughly in the order founders use them, are personal savings, friends and family, angel investors, grants and seed funds. Each comes with trade-offs: your own money carries personal risk, friends and family can strain relationships, and investors take a share of the company. Our <a href="/tools/cap-table-calculator/">cap table calculator</a> shows how much of your company a round costs.</p>
<p>A useful rule is to raise enough to cover the total from this calculator, including the buffer, and then some, because raising again takes months. If you plan to raise, our <a href="/funding-tracker/">funding tracker</a> shows which Indian startups are raising and at what stage.</p>
HTML
        ],
        ['id' => 'excel', 'h2' => 'Business startup cost calculator vs an Excel sheet', 'html' => <<<'HTML'
<p>The maths here is simple enough for a spreadsheet, and many founders keep one. A business startup cost calculator like this one is faster for a first estimate and makes it harder to forget a category. A spreadsheet is better once you need month-by-month detail: hiring dates, a revenue ramp, or payment timing.</p>
<p>A practical approach: get your total here first, then copy the line items into a sheet with one column per month. Once you know your starting cash, move to the runway calculator to track how long it lasts.</p>
<p>When you have a product to show, list it on our <a href="/launches/">launches</a> page to reach early users.</p>
HTML
        ],
        ['id' => 'tips', 'h2' => 'Tips and common mistakes', 'html' => <<<'HTML'
<h3>Tips</h3>
<ul>
<li><strong>Get at least two quotes for every large item.</strong> Prices vary widely.</li>
<li><strong>Be pessimistic about time to revenue.</strong> Run the numbers at your plan and at double it.</li>
<li><strong>Use a buffer.</strong> Choose a percentage that reflects how uncertain your estimates are; the less you know, the bigger it should be.</li>
<li><strong>Separate must-haves from nice-to-haves.</strong> An office, custom branding and paid marketing can often wait until there is demand.</li>
</ul>
<h3>Common mistakes</h3>
<ul>
<li><strong>Counting only setup costs as startup costs.</strong> In most budgets, running costs until revenue are the larger part.</li>
<li><strong>Using salary instead of cost to company.</strong> Employer contributions add to the bill.</li>
<li><strong>Forgetting compliance.</strong> Accounting, tax filings and annual company filings are recurring costs.</li>
<li><strong>Relying on online averages.</strong> Use your own quotes.</li>
<li><strong>No buffer.</strong> Delays are normal; running out of cash a month early is not recoverable.</li>
</ul>
HTML
        ],
    ],
    'howto' => [
        'h2' => 'How to use the startup cost calculator',
        'intro' => 'Collect quotes first. Each field accepts zero if a cost does not apply to you.',
        'steps' => [
            ['name' => 'Enter one-time costs', 'text' => 'Fill in incorporation, trademark, registrations, equipment, office setup, website, legal and other one-time costs.'],
            ['name' => 'Enter monthly costs', 'text' => 'Fill in salaries, rent, software, cloud, marketing, accounting and other monthly costs.'],
            ['name' => 'Set months until revenue', 'text' => 'Enter how many months you expect to run before customers start paying. Be realistic.'],
            ['name' => 'Choose a buffer', 'text' => 'Enter a contingency percentage to cover overruns and delays.'],
            ['name' => 'Read the total', 'text' => 'The result shows the one-time total, monthly total, running cost, buffer and total cash needed.'],
        ],
    ],
    'faq' => [
        ['q' => 'How much does it cost to start a startup in India?', 'a' => 'It depends almost entirely on your team, location and how long it takes to earn revenue, so there is no reliable single figure. Use the startup cost calculator with your own quotes. Fixed government fees, such as the Rs 4,500 or Rs 9,000 per-class trademark filing fee, are a small part of the total.'],
        ['q' => 'What is included in startup costs?', 'a' => 'One-time costs to set up (incorporation, trademark, registrations, equipment, office, website, legal) plus monthly running costs until revenue (salaries, rent, software, cloud, marketing, accounting), plus a buffer.'],
        ['q' => 'Is there a business startup cost calculator Excel template?', 'a' => 'We do not provide one. Use this tool for the first estimate, then copy the line items into your own sheet with a column per month for detailed planning.'],
        ['q' => 'How big should the contingency buffer be?', 'a' => 'There is no standard figure. The less certain your estimates are, the bigger the buffer should be. Many founders also test what happens if revenue takes twice as long as planned.'],
        ['q' => 'What is the trademark registration fee in India?', 'a' => 'For an online TM-A application, the official fee is Rs 4,500 per class for an individual, startup or small enterprise and Rs 9,000 per class for others. Check the current schedule on the IP India website before filing.'],
        ['q' => 'What are the typical startup costs for a software company?', 'a' => 'We do not publish typical figures because the cost of starting varies so much with team size, salaries and city. In most plans, salaries and other running costs until revenue are far larger than one-time setup costs, so focus your estimate there.'],
        ['q' => 'How do I estimate months until revenue?', 'a' => 'Work backwards from your plan: time to build a first version, time to find and close the first customers, and their payment terms. Then run the startup cost calculator at that figure and at double it, and plan around the higher total if you can.'],
        ['q' => 'Can I use this as a startup budget template?', 'a' => 'Yes. The fields cover the main one-time and monthly categories. Enter a number or zero for each so nothing is forgotten.'],
    ],
    'sources' => [
        ['publisher' => 'Office of the Controller General of Patents, Designs and Trade Marks (IP India)', 'title' => 'Trade marks: forms and fees', 'url' => 'https://ipindia.gov.in/Trademarks/form_and_fees_tm', 'date' => '2026'],
        ['publisher' => 'S.S. Rana & Co', 'title' => 'Trademark filing fees and forms in India', 'url' => 'https://ssrana.in/ip-laws/trademarks-in-india/tm-filing-fees-forms-india/', 'date' => '2026'],
        ['publisher' => 'BDO India', 'title' => 'Alert: New EPF wage ceiling hiked to Rs 25,000 (S.O. 5109(E))', 'url' => 'https://www.bdo.in/en-gb/insights/alerts-updates/alert-new-epf-ceiling-hiked', 'date' => '2026-09'],
    ],
];
