<?php
/** SEO content for /tools/cap-table-calculator/ (rendered by page-tools.php). Main keyword: "cap table calculator" (mid difficulty). */
if (!defined('ABSPATH')) {
    exit;
}
return [
    'h1' => 'Cap Table Calculator: SAFEs, Option Pool and Priced Round',
    'lede' => 'Model a priced round with up to two SAFEs and an option pool top-up, and see the share price and everyone\'s stake before and after.',
    'features' => [
        'Founders, existing option pool and up to two post-money SAFEs',
        'SAFE valuation cap and discount, whichever gives the investor more shares',
        'Priced round from pre-money valuation and investment',
        'Option pool top-up to a target share of post-money',
        'Price per share, post-money valuation and a before/after table',
        'Runs in your browser; nothing is stored or sent',
    ],
    'sections' => [
        ['id' => 'what', 'h2' => 'What a cap table calculator shows', 'html' => <<<'HTML'
<p>A capitalisation table, or cap table, lists who owns a company: founders, employees with options, angel investors, funds. It looks simple until you raise money. Then three things happen at once: SAFEs signed earlier convert into shares, the option pool is often enlarged, and new investors buy in at a price per share. Each of these shrinks the founders' slice, and the order in which they are calculated changes the result.</p>
<p>This cap table calculator does that arithmetic for one priced round. You enter the shares that exist today, any SAFEs you have signed, and the round terms. It returns:</p>
<ul>
<li><strong>Price per share</strong> for the new round.</li>
<li><strong>Post-money valuation</strong>: pre-money plus the new investment.</li>
<li><strong>Option pool top-up</strong>: how many new shares are added to the pool to hit your target.</li>
<li><strong>A before and after table</strong> with each holder's shares and percentage.</li>
</ul>
<p>It is built for founders preparing for a seed or Series A, angels checking what their SAFE will turn into, and early employees who want to understand what a round does to the pool. The amounts can be in any currency; the examples below use US dollars because the SAFE is a US instrument, and the notes further down explain how Indian startups usually do the same thing.</p>
HTML
        ],
        ['id' => 'calculation', 'h2' => 'How the calculator works', 'html' => <<<'HTML'
<p>Each step below is what the cap table calculator does. Because the SAFE shares, the pool top-up and the price all depend on each other, it solves them together by repeating the calculation until the numbers settle.</p>
<h3>The steps</h3>
<ol>
<li><strong>Starting shares</strong> = founder shares + existing option pool.</li>
<li><strong>SAFE shares at the cap</strong> = SAFE amount ÷ post-money cap × (starting shares + all SAFE shares). This is the post-money SAFE rule: the investor's percentage is fixed at amount ÷ cap, measured before the new money and before the pool top-up.</li>
<li><strong>SAFE shares at the discount</strong> = SAFE amount ÷ (round price × (1 − discount)). If a SAFE has both a cap and a discount, it gets whichever gives more shares. If it has only a cap, the cap applies.</li>
<li><strong>Pre-money shares</strong> = starting shares + SAFE shares + pool top-up.</li>
<li><strong>Price per share</strong> = pre-money valuation ÷ pre-money shares.</li>
<li><strong>New investor shares</strong> = investment ÷ price.</li>
<li><strong>Pool top-up</strong> = target pool % × total post-round shares − existing pool (never below zero). The top-up counts in the pre-money, so it dilutes existing holders, not the new investors.</li>
</ol>
<h3>Worked example: $5M on a $20M pre-money with one SAFE</h3>
<p>Founders hold 9,000,000 shares and the option pool 1,000,000. One angel invested $1M on a post-money SAFE with a $10M cap and no discount. A fund now offers $5M at a $20M pre-money valuation and asks for a 10% option pool after the round.</p>
<table>
<thead><tr><th>Holder</th><th>Shares before</th><th>% before</th><th>Shares after</th><th>% after</th></tr></thead>
<tbody>
<tr><td>Founders</td><td>9,000,000</td><td>90.00%</td><td>9,000,000</td><td>62.31%</td></tr>
<tr><td>Option pool</td><td>1,000,000</td><td>10.00%</td><td>1,444,444</td><td>10.00%</td></tr>
<tr><td>SAFE ($1M, $10M cap)</td><td>0</td><td>0%</td><td>1,111,111</td><td>7.69%</td></tr>
<tr><td>New investors ($5M)</td><td>0</td><td>0%</td><td>2,888,889</td><td>20.00%</td></tr>
<tr><td><strong>Total</strong></td><td>10,000,000</td><td>100%</td><td>14,444,444</td><td>100%</td></tr>
</tbody>
</table>
<p>The price per share is $1.7308 and the post-money valuation is $25M. The SAFE holder owned 10% of the company just before the round (1M ÷ 10M cap), and the new money and pool top-up then take that to 7.69%. The fund gets exactly 20% because $5M is a fifth of $25M. The pool top-up of 444,444 shares sits in the pre-money, which is why the founders end at 62.31% and not higher.</p>
<figure class="xf-figure"><img src="{{brand}}tool-captable-before-after.png" alt="Two stacked bars comparing ownership before and after the round: before, founders 90% and pool 10%; after, founders 62.31%, option pool 10%, SAFE 7.69% and new investors 20%" width="1600" height="900" loading="lazy" decoding="async"><figcaption>Founders go from 90% to 62.31% after one SAFE, a $5M round and a 10% pool. Graphic: 100xFounder.</figcaption></figure>
HTML
        ],
        ['id' => 'examples', 'h2' => 'Examples: what moves the founders\' stake', 'html' => <<<'HTML'
<p>Keep the same company and round, change one thing at a time, and the cap table calculator shows how sensitive the founders' ownership after the round is.</p>
<table>
<thead><tr><th>Scenario</th><th>Price per share</th><th>Founders after</th><th>SAFE after</th></tr></thead>
<tbody>
<tr><td>No SAFE at all</td><td>$1.9444</td><td>70.00%</td><td>n/a</td></tr>
<tr><td>$1M SAFE, $10M cap</td><td>$1.7308</td><td>62.31%</td><td>7.69%</td></tr>
<tr><td>$1M SAFE, $30M cap, 20% discount</td><td>$1.8056</td><td>65.00%</td><td>5.00%</td></tr>
<tr><td>$1M SAFE, $10M cap, pool target 15%</td><td>$1.6071</td><td>57.86%</td><td>7.14%</td></tr>
</tbody>
</table>
<ul>
<li><strong>The SAFE costs the founders about 7.7 points</strong> in this round: 70% without it, 62.31% with it.</li>
<li><strong>A high cap with a discount converts on the discount.</strong> At a $30M cap the round price ($1.8056) is far below the cap price, so the 20% discount gives the investor more shares: $1M buys shares at $1.4444, ending at 5%.</li>
<li><strong>A bigger pool hurts founders, not the new fund.</strong> Raising the pool target from 10% to 15% cuts the founders from 62.31% to 57.86%, while the new investors still own exactly 20%.</li>
</ul>
HTML
        ],
        ['id' => 'rounds', 'h2' => 'How dilution adds up over several rounds', 'html' => <<<'HTML'
<p>Each round takes a percentage of whatever you own at that moment, so the effects multiply rather than add. If you sell 20% of the company in a seed round and another 20% in a Series A, you do not end with 60% of your original stake; you end with 80% × 80% = 64% of it. A pool top-up in each round takes another slice in the same way.</p>
<p>Take the founders in the worked example, at 62.31% after the seed. Suppose a later round sells another 20% to new investors with no further pool top-up and no other changes. The founders would then hold 62.31% × 0.8 = 49.85%. That is simple arithmetic, not a forecast: real rounds come with their own pool requests, SAFEs and terms, so run each one through the tool when it arrives.</p>
<h3>What dilution does not tell you</h3>
<p>A smaller percentage is not automatically a bad outcome. If the round raises the value of the whole company, a smaller slice can be worth more than a larger one was. In the example, the founders' 9,000,000 shares had no agreed price before the round; at the new price of $1.7308 they are valued at about $15.6M on paper. Paper value is not cash, and later terms such as liquidation preferences decide who gets paid first in a sale, but it is the right comparison to make.</p>
<p>The useful questions are: how much money does this round buy, how far does it get the company, and what will the next round need to look like? Our <a href="/tools/startup-cost-calculator/">startup cost calculator</a> and the runway tool below help answer the first two.</p>
HTML
        ],
        ['id' => 'safe', 'h2' => 'SAFE and convertible note calculator: how SAFEs convert', 'html' => <<<'HTML'
<p>A SAFE (simple agreement for future equity) is a contract in which an investor pays now and receives shares later, usually at the next priced round. Y Combinator published it, and according to <a href="https://www.ycombinator.com/documents" rel="noopener">Y Combinator</a> it moved to the post-money version in 2018. Under that version, the stake sold is the investment divided by the post-money valuation cap: $1M on a $10M cap is 10%.</p>
<p>YC also explains what the post-money cap covers. It includes all money raised on SAFEs and the options and pool that exist before the priced round. It excludes the new money in the priced round and any new or larger pool created as part of that round. The cap table calculator follows the same rule, which is why the SAFE in the example owns 10% of the company immediately before the round and less afterwards.</p>
<figure class="xf-figure"><img src="{{brand}}tool-captable-safe.png" alt="Diagram of a post-money SAFE converting: $1M on a $10M post-money cap fixes 10% of founders plus pool plus SAFEs, then the priced round and pool top-up dilute it to 7.69%" width="1600" height="900" loading="lazy" decoding="async"><figcaption>A post-money SAFE fixes its share before the round; the round then dilutes it like everyone else. Graphic: 100xFounder.</figcaption></figure>
<h3>Pre-money vs post-money SAFEs</h3>
<p>Older pre-money SAFEs left out other SAFEs from the share count, so each new SAFE diluted earlier ones and nobody could be sure of their final stake. A <a href="https://www.torys.com/our-latest-thinking/publications/2021/02/pre-money-versus-post-money-safe" rel="noopener">Torys LLP</a> analysis explains that in the post-money form, SAFE conversions are counted in the company's capitalisation, so the dilution from additional SAFEs falls on founders and employees instead of on other SAFE holders. If you signed pre-money SAFEs, this tool will understate their shares; ask your lawyer to model them.</p>
<h3>Cap vs discount</h3>
<p>A cap sets the highest valuation at which the SAFE converts; a discount gives the investor a lower price than the new investors pay. When a SAFE has both, the investor gets whichever is better for them. The cap usually wins when the round is priced well above the cap; the discount wins when the round comes in close to or below it.</p>
<h3>Convertible notes</h3>
<p>A convertible note is a loan that converts into equity, often with a cap and a discount like a SAFE, plus interest. The tool does not add interest, so treat it as an approximate convertible debt calculator: enter the principal plus accrued interest as the SAFE amount for a rough figure.</p>
HTML
        ],
        ['id' => 'pool', 'h2' => 'Option pool calculator: the top-up and who pays for it', 'html' => <<<'HTML'
<p>New investors often ask for an option pool of a certain size after the round, so the company can hire without issuing more shares soon after. The question that matters is whether the extra pool shares come before or after the new money. When the target is set on the post-money but the new shares count in the pre-money, the existing holders bear all of it. This is often called the option pool shuffle, and it is how this tool works because it is how many term sheets are written.</p>
<p>In the worked example, topping the pool up to 10% needs 444,444 new shares. Those shares lower the price per share from what it would otherwise be, so the founders' effective valuation is lower than the headline $20M pre-money suggests.</p>
<p>You can negotiate the size. Bring a hiring plan that shows how many options you need until the next round, and ask for a pool that covers it, not a round number. Run the cap table calculator with each proposal to see the dilution each one causes.</p>
HTML
        ],
        ['id' => 'india', 'h2' => 'Equity dilution calculator for India: iSAFE, CCPS and notes', 'html' => <<<'HTML'
<p>The maths in this tool works for any company, but the instruments differ in India. A <a href="https://www.barandbench.com/law-firms/view-point/convertible-notes-and-safe-notes-in-india-the-dilemma" rel="noopener">Bar &amp; Bench</a> viewpoint by Emerald Law Offices (June 2026) explains the main points:</p>
<ul>
<li><strong>A US-form SAFE is not recognised in Indian law</strong> and risks being treated as a deposit, with FEMA and Companies Act consequences.</li>
<li><strong>The Indian version, the iSAFE, is usually issued as compulsorily convertible preference shares (CCPS)</strong>, a recognised instrument, which converts to equity at a set valuation on a priced round or other trigger.</li>
<li><strong>Convertible notes are allowed only for DPIIT-recognised startups</strong>, with a minimum of Rs 25 lakh per investor in a single tranche, and must convert or be repaid within 10 years.</li>
</ul>
<p>Because an iSAFE or CCPS converts on agreed terms, you can usually model it here as a SAFE with the same cap and discount. Check the actual conversion terms in your documents and have an Indian corporate lawyer confirm the final numbers. This page is not legal or tax advice.</p>
<p>For context on what rounds Indian startups are raising, see our <a href="/funding-tracker/">funding tracker</a>, and check how long your money lasts after the round with the <a href="/tools/runway-calculator/">runway calculator</a>.</p>
HTML
        ],
        ['id' => 'excel', 'h2' => 'Cap table calculator in Excel vs this tool', 'html' => <<<'HTML'
<p>Many founders keep their cap table in a spreadsheet, and you should: it is the record you update after every grant and round. A spreadsheet is also where you would model several rounds in a row, vesting, or liquidation preferences, which this tool does not cover.</p>
<p>Where a spreadsheet trips people up is the circular logic in one round: the pool top-up depends on post-round shares, the price depends on the top-up, and SAFE conversion depends on the price. Spreadsheets need iterative calculation switched on to handle that. Use the cap table calculator to get the round right, then copy the share counts into your sheet.</p>
HTML
        ],
        ['id' => 'tips', 'h2' => 'Tips and common mistakes', 'html' => <<<'HTML'
<h3>Tips</h3>
<ul>
<li><strong>Model before you sign a SAFE.</strong> Enter the SAFE with a realistic future round to see what it really costs.</li>
<li><strong>Ask whether the pool target is pre- or post-money.</strong> It changes who pays.</li>
<li><strong>Compare term sheets on founder ownership after the round, not headline valuation.</strong> A higher pre-money with a bigger pool can be worse.</li>
<li><strong>Keep your fully diluted share count current.</strong> Include all granted options and the unallocated pool.</li>
</ul>
<h3>Common mistakes</h3>
<ul>
<li><strong>Treating a post-money SAFE as a pre-money one</strong> or the reverse. Read the document.</li>
<li><strong>Forgetting SAFEs in the pre-round table.</strong> They are not shares until conversion, but they will be.</li>
<li><strong>Ignoring the pool top-up.</strong> It can cost founders several points.</li>
<li><strong>Using a US SAFE for an Indian company.</strong> Use an instrument Indian law recognises, with legal advice.</li>
</ul>
HTML
        ],
    ],
    'howto' => [
        'h2' => 'How to use the cap table calculator',
        'intro' => 'You need your current share counts, the terms of any SAFEs, and the round terms you are being offered.',
        'steps' => [
            ['name' => 'Enter founder shares', 'text' => 'Type the total shares held by all founders together.'],
            ['name' => 'Enter the existing option pool', 'text' => 'Type the shares in the pool today, granted and ungranted.'],
            ['name' => 'Add up to two SAFEs', 'text' => 'For each SAFE, enter the amount invested, the post-money valuation cap and any discount percentage.'],
            ['name' => 'Enter the round terms', 'text' => 'Type the pre-money valuation, the new investment and the option pool percentage the investors want after the round.'],
            ['name' => 'Read the result', 'text' => 'The result shows price per share, post-money valuation, the pool top-up, and each holder\'s shares and percentage before and after.'],
        ],
    ],
    'faq' => [
        ['q' => 'How do you calculate dilution in a funding round?', 'a' => 'Divide the pre-money valuation by the pre-money share count (including converted SAFEs and any pool top-up) to get the price per share, then divide the investment by that price to get new shares. Your new percentage is your shares divided by the new total. The cap table calculator does this for you.'],
        ['q' => 'How does a post-money SAFE convert?', 'a' => 'The investor\'s stake just before the priced round equals the SAFE amount divided by the post-money cap, for example $1M on a $10M cap is 10%. The priced round and any new pool then dilute that stake.'],
        ['q' => 'Is this a SAFE and convertible note calculator?', 'a' => 'It handles post-money SAFEs with a cap, a discount or both. For a convertible note, enter principal plus accrued interest as the SAFE amount for an approximate result; interest is not calculated separately.'],
        ['q' => 'Does the option pool calculator top-up dilute new investors?', 'a' => 'Not in this model. The top-up counts in the pre-money, so founders, the existing pool and SAFE holders bear it, and new investors still get investment divided by post-money.'],
        ['q' => 'Can I use it as an equity dilution calculator for India?', 'a' => 'Yes for the maths. Indian startups usually use an iSAFE issued as CCPS, or convertible notes if DPIIT-recognised, instead of a US SAFE. Model an iSAFE as a SAFE with its cap and discount and confirm the terms with a lawyer.'],
        ['q' => 'What is ownership after two rounds of 20% each?', 'a' => 'Each round multiplies: 80% of 80% leaves you 64% of your original stake, before any pool top-ups. A founder starting at 62.31% would hold about 49.85% after a further 20% round with no other changes.'],
        ['q' => 'Is there a cap table calculator Excel template?', 'a' => 'We do not provide a template. Use this tool to get one round right, then copy the share counts into your own spreadsheet, which should remain your record of grants and rounds.'],
    ],
    'sources' => [
        ['publisher' => 'Y Combinator', 'title' => 'SAFE financing documents (post-money SAFE)', 'url' => 'https://www.ycombinator.com/documents', 'date' => '2018'],
        ['publisher' => 'Torys LLP', 'title' => 'Pre-money versus post-money SAFE: what\'s the difference (and does it matter)?', 'url' => 'https://www.torys.com/our-latest-thinking/publications/2021/02/pre-money-versus-post-money-safe', 'date' => '2021-02-25'],
        ['publisher' => 'Bar & Bench (Emerald Law Offices)', 'title' => 'Convertible notes and SAFE notes in India: the dilemma', 'url' => 'https://www.barandbench.com/law-firms/view-point/convertible-notes-and-safe-notes-in-india-the-dilemma', 'date' => '2026-06-09'],
    ],
];
