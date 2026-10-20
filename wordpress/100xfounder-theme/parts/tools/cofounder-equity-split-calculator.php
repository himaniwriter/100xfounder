<?php
/** SEO content for /tools/cofounder-equity-split-calculator/ (rendered by page-tools.php). Main keyword: "co founder equity split calculator" (mid difficulty). */
if (!defined('ABSPATH')) {
    exit;
}
return [
    'h1' => 'Co-Founder Equity Split Calculator',
    'lede' => 'Score each founder on seven weighted factors and get a suggested ownership split you can use to start an honest conversation.',
    'features' => [
        'Two to four founders',
        'Seven factors with weights you can change',
        'Each founder scored 0 to 10 on each factor',
        'Percentage split from weighted points',
        'Runs in your browser; nothing is stored or sent',
    ],
    'sections' => [
        ['id' => 'what', 'h2' => 'What the co-founder equity split calculator does', 'html' => <<<'HTML'
<p>Deciding who owns how much of a new company is one of the first hard conversations founders have, and one of the easiest to get wrong. It usually happens early, when nobody knows how the next five years will go, and it is awkward to discuss openly. The result is often a number picked in a hurry, or a split that one founder quietly resents later.</p>
<p>This co-founder equity split calculator gives the conversation a structure. You list two to four founders, agree how much each of seven factors matters, and score each founder on each factor. The tool turns those scores into a percentage for each person. It does not tell you the "right" answer, because there is no formula with that kind of authority. What it does is make each founder's assumptions visible, so you argue about specific things ("is the idea worth 10% of the weight or 5%?") instead of a single big number.</p>
<p>Use the co-founder equity split calculator with all founders in the room. Fill it in separately first, then compare. Where your scores differ, you have found the conversation you need to have.</p>
<p>Two points matter more than the exact split, and we cover both below: vesting, which protects the company if a founder leaves early, and the case for keeping the split equal or close to it. Read those before you settle on a number.</p>
HTML
        ],
        ['id' => 'calculation', 'h2' => 'How the co-founder equity split calculator works', 'html' => <<<'HTML'
<p>The maths is a weighted score. Each step below is what the co-founder equity split calculator does.</p>
<h3>The formula</h3>
<ol>
<li>Each factor has a weight. The defaults add up to 100, but any numbers work; only their relative size matters.</li>
<li>Each founder gets a score from 0 to 10 on each factor.</li>
<li><strong>A founder's points</strong> = the sum of (score × weight) across all seven factors.</li>
<li><strong>A founder's share</strong> = their points ÷ the total points of all founders × 100.</li>
</ol>
<p>If every score is zero, the tool splits equally.</p>
<h3>The seven factors and default weights</h3>
<table>
<thead><tr><th>Factor</th><th>Default weight</th><th>What to score</th></tr></thead>
<tbody>
<tr><td>Full-time commitment</td><td>25</td><td>Full-time now scores 10; part-time or "joining later" scores lower.</td></tr>
<tr><td>Role and responsibility</td><td>20</td><td>Who will carry the company's key outcomes, such as product, sales or fundraising.</td></tr>
<tr><td>Skills and domain expertise</td><td>15</td><td>How hard the person's skills would be to hire, and how central they are to the plan.</td></tr>
<tr><td>Idea and early work</td><td>10</td><td>Work done before today: research, prototype, first customers.</td></tr>
<tr><td>Capital put in</td><td>10</td><td>Money each founder puts in as founders, not as investors on separate terms.</td></tr>
<tr><td>Network and customers</td><td>10</td><td>Relationships that bring revenue, hires or investors.</td></tr>
<tr><td>Risk taken / salary forgone</td><td>10</td><td>Salary given up and personal risk taken to do this.</td></tr>
</tbody>
</table>
<figure class="xf-figure"><img src="{{brand}}tool-equity-factors.png" alt="Bar chart of the seven default factor weights: full-time commitment 25, role and responsibility 20, skills and domain expertise 15, and idea and early work, capital put in, network and customers, and risk taken or salary forgone at 10 each" width="1600" height="900" loading="lazy" decoding="async"><figcaption>The default weights put future commitment and role ahead of the idea. Graphic: 100xFounder.</figcaption></figure>
<p>The defaults deliberately weight what founders will do from here (commitment, role, skills: 60 of 100) above what has already happened (idea and early work: 10). That reflects the view, set out below, that most of a company's value is created in the years ahead. Change the weights if your situation is different, for example if one founder is putting in most of the starting capital.</p>
<h3>Worked example: two founders</h3>
<p>Asha had the idea, built the prototype and will be CEO. Bilal joins full-time as CTO, brings deeper technical skills and a stronger network. Both put in the same small amount of money and both give up similar salaries.</p>
<table>
<thead><tr><th>Factor (weight)</th><th>Asha</th><th>Bilal</th></tr></thead>
<tbody>
<tr><td>Full-time commitment (25)</td><td>10</td><td>10</td></tr>
<tr><td>Role and responsibility (20)</td><td>9</td><td>8</td></tr>
<tr><td>Skills and domain expertise (15)</td><td>8</td><td>9</td></tr>
<tr><td>Idea and early work (10)</td><td>10</td><td>4</td></tr>
<tr><td>Capital put in (10)</td><td>5</td><td>5</td></tr>
<tr><td>Network and customers (10)</td><td>6</td><td>8</td></tr>
<tr><td>Risk taken / salary forgone (10)</td><td>8</td><td>8</td></tr>
<tr><td><strong>Weighted points</strong></td><td><strong>840</strong></td><td><strong>795</strong></td></tr>
<tr><td><strong>Suggested split</strong></td><td><strong>51.4%</strong></td><td><strong>48.6%</strong></td></tr>
</tbody>
</table>
<figure class="xf-figure"><img src="{{brand}}tool-equity-example.png" alt="Two founders scored on seven factors: Asha 840 weighted points and Bilal 795, giving a suggested split of 51.4% and 48.6%" width="1600" height="900" loading="lazy" decoding="async"><figcaption>Asha's idea and early work give her a small edge; the result is close to equal. Graphic: 100xFounder.</figcaption></figure>
<p>Asha's head start on the idea earns her 60 more points than Bilal on that factor, but because the idea carries only 10% of the weight, the final split is close to even. Many teams in this position would round to 50/50, and that is a reasonable choice.</p>
HTML
        ],
        ['id' => 'examples', 'h2' => 'More examples of an equity split between founders', 'html' => <<<'HTML'
<h3>One founder part-time</h3>
<p>Same two founders, but Bilal keeps his job for now and joins part-time: he scores 5 on commitment instead of 10 and 4 on risk instead of 8. His points fall to 630 against Asha's 840, and the split moves to 57.1% / 42.9%. Commitment is the factor with the largest weight, so it moves the result most.</p>
<p>If the plan is for him to go full-time later, a better approach than a permanently lower stake is often to agree the full-time split now and make it conditional: his shares vest only once he joins full-time, or the split is revisited at an agreed date. Write any such condition down.</p>
<h3>Three founders</h3>
<p>Add a third founder, Chen, who joins as a part-time adviser-style founder with scores of 4, 6, 7, 2, 0, 5 and 3. With Asha and Bilal as in the worked example, the split becomes 40.8% / 38.6% / 20.6%. If Chen's role is mainly advice, consider whether an adviser agreement with a small grant fits better than a founder stake.</p>
<p>In every case, the co-founder equity split calculator gives a starting point. Round it, discuss it, and agree the final number explicitly.</p>
HTML
        ],
        ['id' => 'methods', 'h2' => 'Ways to split equity: equal, weighted or staged', 'html' => <<<'HTML'
<p>There are three broad ways founders split equity. None is right for everyone, and the co-founder equity split calculator supports the second while helping you test the first and third.</p>
<h3>1. Equal split</h3>
<p>Every founder gets the same share. It is quick, it avoids a hard negotiation, and it signals that everyone is equally committed. It works best when founders start at the same time, work full-time, and have comparable roles. The risk is that it hides real differences that resurface later, for example if one founder stays part-time for a year.</p>
<h3>2. Weighted factors</h3>
<p>This is what the tool does. You decide what matters, score each person, and let the weights do the arithmetic. It takes longer, but it forces you to discuss commitment, roles and money openly. The danger is false precision: a score of 7 versus 8 on "network" is a judgement, not a measurement. Round the output and use it to inform the decision, not to make it.</p>
<h3>3. Staged or conditional split</h3>
<p>Founders agree a target split, and parts of it depend on milestones: joining full-time, putting in agreed capital, or staying a set time. Vesting is the simplest form of this, and the one investors expect. More complex arrangements, where equity is recalculated as contributions accumulate, exist too, but they need careful legal drafting and can be confusing for later investors.</p>
<p>Whatever route you choose, the test of a good founder equity split is simple: would each founder still think it fair if they were doing most of the work in two years? If the answer for anyone is no, talk now.</p>
HTML
        ],
        ['id' => 'later', 'h2' => 'Equity split when a co-founder joins later', 'html' => <<<'HTML'
<p>Teams often form in stages. One founder starts alone, a second joins months later, a third after the first customers. The later a founder joins, the more of the early risk the others have already carried, and the weights should reflect that through the "idea and early work" and "risk taken" factors.</p>
<p>How much should it count? Seibel's point is useful here: if the company will take many years to build, a few months' head start is a small part of the total effort. A founder who joins in month four of a ten-year company has missed only a few per cent of the work. Scoring the late joiner a little lower on early work, rather than cutting their share sharply, usually reflects that.</p>
<p>Someone who joins after a priced round is usually treated as an early employee with a large option grant, not a founder with common shares, because the company now has a price per share and investors to answer to. The <a href="/tools/esop-calculator/">ESOP calculator</a> helps such a person see what a grant could be worth.</p>
HTML
        ],
        ['id' => 'equal', 'h2' => 'Should co-founders split equity equally?', 'html' => <<<'HTML'
<p>One well-known view says yes, or close to it. In a December 2015 post for <a href="https://www.ycombinator.com/blog/splitting-equity-among-founders" rel="noopener">Y Combinator</a>, group partner Michael Seibel argued that founding teams should split equity equally or nearly equally. His reasoning: the common arguments for an uneven split, such as who had the idea or who started a few months earlier, overvalue work that matters little across the many years it takes to build a company. He also pointed out that a lopsided split can signal to investors that the CEO does not value their co-founders, and that equal stakes keep everyone equally motivated.</p>
<p>That fits how the default weights in this tool are set: future commitment, role and skills dominate, so two full-time founders with comparable roles land close to 50/50 even if one had the idea.</p>
<p>Not everyone agrees in every case. If one founder is putting in most of the money, is joining much later, or will work part-time for a long period, an unequal split can be fair. The co-founder equity split calculator lets you see how large a difference those factors make, so you can decide whether it is worth an uneven founder equity split or better handled another way, such as a loan, a salary difference, or vesting tied to going full-time.</p>
HTML
        ],
        ['id' => 'vesting', 'h2' => 'Vesting matters more than the exact split', 'html' => <<<'HTML'
<p>Whatever equity split you agree, put every founder on a vesting schedule. Vesting means founders earn their shares over time, so a founder who leaves early does not walk away with a large part of the company.</p>
<p>The typical schedule is four years with a one-year cliff. According to <a href="https://stripe.com/au/resources/more/founder-vesting" rel="noopener">Stripe Atlas</a>, nothing vests in the first 12 months; at the one-year mark 25% vests at once, and the rest vests monthly, usually 1/48th of the grant each month, over the following three years. A founder who leaves keeps what has vested, and the unvested shares typically go back to the company, often at the near-zero price originally paid. Seibel's YC post describes the same four-year schedule with a one-year cliff.</p>
<p>Stripe also describes acceleration: single-trigger acceleration vests everything when the company is sold, which the article says is less common; double-trigger acceleration vests the rest only if the company is sold and the founder is then let go or their role eliminated within a set period.</p>
<p>Why does this matter more than a few points either way? Because the most damaging equity problem in an early company is not a 52/48 split that should have been 50/50. It is an equity split between founders with no vesting, so a co-founder who quits in month six still holds half the company. Vesting fixes that; a careful split does not.</p>
<p>How vesting is set up differs by country and company structure. In India, ask a corporate lawyer how to put founder vesting into your shareholders' agreement and articles. This page is not legal or tax advice.</p>
HTML
        ],
        ['id' => 'next', 'h2' => 'After you agree the split', 'html' => <<<'HTML'
<ul>
<li><strong>Write it down.</strong> Record the split, the vesting terms, what happens if someone leaves, and how decisions are made, in a founders' agreement prepared with a lawyer.</li>
<li><strong>Plan for an option pool.</strong> Early hires usually expect stock options. When you raise money, investors may ask for a pool that dilutes all founders. Our <a href="/tools/cap-table-calculator/">cap table calculator</a> shows how a round and a pool change everyone's stake, and the <a href="/tools/esop-calculator/">ESOP calculator</a> shows what options are worth to an employee.</li>
<li><strong>Revisit roles, not equity.</strong> Roles change as a company grows. Agree how you will handle that without reopening the cap table every few months.</li>
<li><strong>Check how ready you are.</strong> Our free <a href="/tools/startup-100x-score/">startup 100X score</a> asks ten questions about stage, traction and team.</li>
</ul>
HTML
        ],
        ['id' => 'tips', 'h2' => 'Tips and common mistakes', 'html' => <<<'HTML'
<h3>Tips</h3>
<ul>
<li><strong>Score separately, then compare.</strong> The disagreements are the useful part.</li>
<li><strong>Agree the weights before the scores.</strong> Arguing about weights is less personal than arguing about each other.</li>
<li><strong>Be specific about commitment.</strong> "Full-time from 1 March" is clearer than "soon".</li>
<li><strong>Round the result.</strong> The co-founder equity split calculator gives decimals; your agreement does not need them.</li>
</ul>
<h3>Common mistakes</h3>
<ul>
<li><strong>Splitting before discussing roles.</strong> Decide who does what before any equity split.</li>
<li><strong>Overpaying for the idea.</strong> An idea without execution is worth little; the defaults reflect that.</li>
<li><strong>Treating cash as equity by default.</strong> A founder who funds the company could instead lend the money or invest on investor terms.</li>
<li><strong>Skipping vesting because you trust each other.</strong> Vesting protects the founders who stay, whoever they turn out to be.</li>
<li><strong>Leaving it unwritten.</strong> A verbal agreement is hard to enforce and easy to remember differently.</li>
</ul>
HTML
        ],
    ],
    'howto' => [
        'h2' => 'How to use the co-founder equity split calculator',
        'intro' => 'Do this together with all founders. It takes about ten minutes once you have discussed roles.',
        'steps' => [
            ['name' => 'Add the founders', 'text' => 'Enter two to four founder names.'],
            ['name' => 'Agree the weights', 'text' => 'Start from the default weights for the seven factors and change any that do not fit your company. Only their relative size matters.'],
            ['name' => 'Score each founder', 'text' => 'Give each founder a score from 0 to 10 on each factor. Try scoring separately first, then compare and agree.'],
            ['name' => 'Read the split', 'text' => 'The result shows each founder\'s weighted points and percentage of the company.'],
            ['name' => 'Agree and record it', 'text' => 'Round the result, add vesting, and record the final split in a founders\' agreement with a lawyer.'],
        ],
    ],
    'faq' => [
        ['q' => 'How do you calculate an equity split between founders?', 'a' => 'One structured way is to weight factors such as commitment, role, skills, early work, capital, network and risk, score each founder on each, and divide each founder\'s weighted points by the total. The co-founder equity split calculator on this page does that.'],
        ['q' => 'Should co-founders split equity equally?', 'a' => 'Y Combinator\'s Michael Seibel has argued that equal or nearly equal splits should be the norm, because the company\'s value is built over many years after the idea. An unequal split can be fair when commitment or capital differ a lot.'],
        ['q' => 'Is this a cofounder equity calculator for two or more founders?', 'a' => 'Yes. It handles two to four founders with the same seven factors and weights.'],
        ['q' => 'What vesting schedule should founders use?', 'a' => 'The common schedule is four years with a one-year cliff: nothing vests for 12 months, then 25% vests, then the rest monthly over three years.'],
        ['q' => 'Does a founders equity calculator give a legally binding split?', 'a' => 'No. It is a structured way to discuss the split. The binding version is the shareholding and founders\' agreement you sign, ideally with a lawyer.'],
        ['q' => 'How do you handle an equity split between co-founders who join at different times?', 'a' => 'Score the later founder lower on idea and early work and on risk taken, rather than cutting their share sharply. A few months\' head start is a small part of the years it takes to build a company.'],
        ['q' => 'How should the founder who puts in money be treated?', 'a' => 'You can give the capital factor more weight, or keep the founder split based on work and treat the money separately as a loan or an investment on its own terms.'],
    ],
    'sources' => [
        ['publisher' => 'Y Combinator (Michael Seibel)', 'title' => 'How to split equity among co-founders', 'url' => 'https://www.ycombinator.com/blog/splitting-equity-among-founders', 'date' => '2015-12-02'],
        ['publisher' => 'Stripe Atlas', 'title' => 'Founder vesting: schedules, cliffs, and what it protects', 'url' => 'https://stripe.com/au/resources/more/founder-vesting', 'date' => '2026-10-01'],
    ],
];
