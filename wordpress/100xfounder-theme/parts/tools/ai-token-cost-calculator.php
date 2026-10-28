<?php
/** SEO content for /tools/ai-token-cost-calculator/ (rendered by page-tools.php). Main keyword: "token cost calculator" (mid difficulty). */
if (!defined('ABSPATH')) {
    exit;
}
return [
    'h1' => 'AI Token Cost Calculator for Claude, OpenAI and Gemini',
    'lede' => 'Estimate what an LLM API costs per call, per day, per month and per year, with prompt caching and batch discounts, at official list prices.',
    'features' => [
        'Official list prices for Anthropic Claude, OpenAI and Google Gemini models',
        'Cost per call, per day, per 30-day month and per year in US dollars',
        'Prompt caching: set the share of input tokens read from cache',
        'Batch API toggle that halves every rate',
        'Runs in your browser; nothing you type is stored',
    ],
    'sections' => [
        ['id' => 'what', 'h2' => 'What this token cost calculator does', 'html' => <<<'HTML'
<p>Large language model (LLM) APIs don't charge per request. They charge per token: small chunks of text the model reads (input) and writes (output), priced per million tokens, with output usually several times dearer than input. That makes LLM pricing hard to turn into a bill from the pricing page alone. This token cost calculator turns the list prices into the numbers you actually budget with: cost per call, per day, per 30-day month and per year, in US dollars.</p>
<p>You choose a model, say how many tokens a typical call reads and writes, and how many calls you make a day. Two switches cover the biggest discounts the providers offer: the share of input served from a prompt cache, and the Batch API, which processes requests asynchronously at half price.</p>
<h3>What is a token?</h3>
<p>A token is a piece of a word. OpenAI's documentation gives a rough rule for English: one token is about 4 characters, or 0.75 words. Google's Gemini docs say 100 tokens is about 60&ndash;80 English words. Other languages, code and numbers split differently, so treat these as rough guides and count real prompts when the numbers matter.</p>
<p>Tokenizers also differ between providers and between model generations. Anthropic's pricing page notes that Claude 4.7 and later models use a newer tokenizer that produces about 30% more tokens for the same text. So the same prompt can cost a different number of tokens on Claude, GPT and Gemini, and a straight price-per-million comparison can mislead you. The fix is simple: take token counts from the usage figures each API returns for your own prompts.</p>
HTML
        ],
        ['id' => 'formula', 'h2' => 'How the cost is calculated', 'html' => <<<'HTML'
<p>The token cost calculator uses each provider's list price per million tokens (MTok) for three things: normal input, input read from cache, and output. For one call:</p>
<p><strong>Cost per call = (uncached input &times; input price + cached input &times; cache price + output &times; output price) &divide; 1,000,000</strong></p>
<p>Here uncached input is input tokens &times; (1 &minus; cached share) and cached input is input tokens &times; cached share. If you switch on batch, the whole cost per call is halved, because all three providers list batch rates at 50% of standard. Then:</p>
<ul>
<li>Per day = cost per call &times; calls per day</li>
<li>Per month = per day &times; 30</li>
<li>Per year = per day &times; 365</li>
</ul>
<p><strong>What it leaves out.</strong> Cache writes are not modelled: Anthropic charges 1.25 times the input price to write to a 5-minute cache and 2 times for a 1-hour cache, and Gemini charges an hourly storage fee for explicit caching on some models. Long-context surcharges, data-residency multipliers (Anthropic lists 1.1x for US-only inference), fast or priority tiers, tool fees such as web search, and taxes are not included either. The tool uses short-context rates. Treat the result as a floor and add a margin.</p>
<h3>Worked example: Claude Sonnet 5.5</h3>
<p>A support assistant sends 2,000 input tokens and gets 500 output tokens back, 1,000 times a day. Claude Sonnet 5.5 lists at $2 per MTok input, $0.10 cached input and $10 output.</p>
<table>
<thead><tr><th>Setting</th><th>Per call</th><th>Per day</th><th>Per month (30 days)</th></tr></thead>
<tbody>
<tr><td>Standard</td><td>$0.009</td><td>$9.00</td><td>$270</td></tr>
<tr><td>50% of input from cache</td><td>$0.0071</td><td>$7.10</td><td>$213</td></tr>
<tr><td>Batch</td><td>$0.0045</td><td>$4.50</td><td>$135</td></tr>
<tr><td>50% cached + batch</td><td>$0.00355</td><td>$3.55</td><td>$106.50</td></tr>
</tbody>
</table>
<p>The standard call breaks down as 2,000 &times; $2 &divide; 1,000,000 = $0.004 for input plus 500 &times; $10 &divide; 1,000,000 = $0.005 for output. Output is only a fifth of the tokens but more than half the cost, which is typical.</p>
<figure class="xf-figure"><img src="{{brand}}tool-token-example.png" alt="Worked example card: Claude Sonnet 5.5, 2,000 input and 500 output tokens, 1,000 calls a day, costs $0.009 a call, $9 a day and $270 a month; with half the input cached, $7.10 a day and $213 a month" width="1600" height="900" loading="lazy" decoding="async"><figcaption>One model, one workload, four ways to pay. Graphic: 100xFounder.</figcaption></figure>
HTML
        ],
        ['id' => 'prices', 'h2' => 'LLM API prices per million tokens', 'html' => <<<'HTML'
<p>These are the list prices the token cost calculator uses, prices as of 20 October 2026, taken from each provider's official pricing page. Prices change often, and some are already scheduled to change: Google lists Gemini 4 Argon's rates doubling from 1 December 2026 and Gemini 3.8 Flash's from 1 January 2027. Check the provider's API pricing page before you commit to a budget.</p>
{{llm_prices}}
<p>Cached input is far cheaper than normal input on every model listed: Anthropic prices cache reads at 0.05x base input on Opus 5.5 and Sonnet 5.5, and 0.1x on most other models. OpenAI's gpt-6 models have a long-context rate above 272K tokens, and Claude Haiku 5.5 has a higher rate for prompts over 100,000 tokens; the table shows the shorter-prompt rates.</p>
HTML
        ],
        ['id' => 'compare', 'h2' => 'Example: the same workload on ten models', 'html' => <<<'HTML'
<p>Run the Sonnet example (2,000 in, 500 out, 1,000 calls a day, no cache, no batch) across the list and the daily cost spreads by a factor of 100:</p>
<table>
<thead><tr><th>Model</th><th>Cost per day</th><th>Cost per month</th></tr></thead>
<tbody>
<tr><td>Claude Fable 5.1</td><td>$45.00</td><td>$1,350</td></tr>
<tr><td>gpt-6-astra</td><td>$45.00</td><td>$1,350</td></tr>
<tr><td>Claude Opus 5.5</td><td>$18.00</td><td>$540</td></tr>
<tr><td>Claude Sonnet 5.5</td><td>$9.00</td><td>$270</td></tr>
<tr><td>gpt-6.1-sol</td><td>$9.00</td><td>$270</td></tr>
<tr><td>Gemini 4 Argon</td><td>$9.00</td><td>$270</td></tr>
<tr><td>Gemini 3.8 Flash</td><td>$3.38</td><td>$101.25</td></tr>
<tr><td>Gemini 3.5 Flash-Lite</td><td>$1.85</td><td>$55.50</td></tr>
<tr><td>Claude Haiku 5.5</td><td>$0.45</td><td>$13.50</td></tr>
<tr><td>gpt-6-luna</td><td>$0.45</td><td>$13.50</td></tr>
</tbody>
</table>
<p>Price is only half the decision. A cheaper model that needs two attempts, or longer prompts to behave, can cost more per finished task. Test two or three models on your real prompts, compare quality, then use the cost figures to pick.</p>
<figure class="xf-figure"><img src="{{brand}}tool-token-models.png" alt="Bar chart of daily cost for 1,000 calls of 2,000 input and 500 output tokens: Claude Fable 5.1 and gpt-6-astra $45, Claude Opus 5.5 $18, Claude Sonnet 5.5, gpt-6.1-sol and Gemini 4 Argon $9, Gemini 3.8 Flash $3.38, Gemini 3.5 Flash-Lite $1.85, Claude Haiku 5.5 and gpt-6-luna $0.45" width="1600" height="900" loading="lazy" decoding="async"><figcaption>Daily cost of one workload by model, list prices as of 20 October 2026. Graphic: 100xFounder.</figcaption></figure>
<h3>A long-prompt example with caching</h3>
<p>Retrieval-augmented apps send long prompts: say 20,000 input tokens and 1,000 output, 200 times a day, on Sonnet 5.5. Without caching that is $0.05 a call, $10 a day and $300 a month. If 90% of the input is a fixed system prompt and documents read from cache, it drops to $0.0158 a call, $3.16 a day and $94.80 a month, before the cost of writing the cache.</p>
HTML
        ],
        ['id' => 'anthropic', 'h2' => 'Claude API token cost calculator (Anthropic)', 'html' => <<<'HTML'
<p>To estimate Claude API cost, pick Fable 5.1, Opus 5.5, Sonnet 5.5, Haiku 5.5 or Haiku 4.5. The rates come from Anthropic's pricing page. A few Claude-specific points: the Batch API gives 50% off input and output; caching discounts stack with batch; and requesting US-only inference adds a 1.1x multiplier on Claude 4.6 and later models. Claude 4.6 and later models other than Haiku 5.5 bill the full 1M-token context window at the standard rate.</p>
<h3>Claude Code API cost</h3>
<p>Claude Code is billed by token when you use it with an API key, so you can estimate it with the token cost calculator, but a coding session sends whole files, tool results and conversation history with each request, much of it from cache. Anthropic's Claude Code documentation says enterprise deployments average around $13 per developer per active day and $150&ndash;250 per developer per month, with 90% of users under $30 per active day. For your own number, run the /usage command in a session or check the Claude Console usage page; Pro and Max subscribers have usage included in their plan instead.</p>
HTML
        ],
        ['id' => 'openai-azure', 'h2' => 'OpenAI API call cost calculator and Azure OpenAI', 'html' => <<<'HTML'
<p>To estimate OpenAI API cost, the calculator lists gpt-6-astra, gpt-6.1-sol and gpt-6-luna at OpenAI's own short-context API prices. OpenAI's pricing page also lists Flex processing at batch rates and a Fast tier at twice standard, which the tool doesn't model.</p>
<p><strong>Azure OpenAI is priced separately.</strong> Microsoft sells OpenAI models through Azure with its own price list: pay-as-you-go by token, provisioned throughput units reserved monthly or yearly, and batch, across global, data zone and regional deployments. Those prices can differ from OpenAI's, so use Microsoft's Azure OpenAI API pricing page for an Azure budget. The same applies to Claude and Gemini models bought through AWS Bedrock or Google Cloud, which set their own regional prices.</p>
<p>A <strong>Databricks LLM cost calculator</strong> is a different problem from a plain token calculator: Databricks bills model serving in its own units on top of your cloud, so this tool doesn't cover it. Use Databricks' own pricing pages.</p>
HTML
        ],
        ['id' => 'per-user', 'h2' => 'Token cost calculator for AI products: cost per user', 'html' => <<<'HTML'
<p>If you are building an AI product, the useful figure is often token cost per active user, because that is what your price has to cover. Set calls per day to the number one user makes, and the monthly result becomes cost per user per month.</p>
<p>Take the same 2,000-in, 500-out call. A user who makes 20 calls a day on Claude Sonnet 5.5 costs about $0.18 a day, or $5.40 a month at list price. With half the input cached it is $4.26 a month. Move that user to Claude Haiku 5.5 and the same traffic costs $0.27 a month. Those gaps decide whether a free tier is affordable, whether a plan priced in rupees still has a margin after the dollar bill, and which features need a bigger model.</p>
<p>Two habits help here. First, measure the heaviest users, not the average: a few power users often make many times the median number of calls. Second, re-run the numbers when you change prompts, because a longer system prompt raises the cost of every call. The API usage figures each provider returns per request are the honest input; the token cost calculator turns them into a plan.</p>
<p>For the wider business case, the <a href="/tools/saas-metrics-calculator/">SaaS metrics calculator</a> works out gross margin effects on LTV and CAC payback once you know your API cost per customer.</p>
HTML
        ],
        ['id' => 'fair-compare', 'h2' => 'LLM API cost calculator: comparing providers fairly', 'html' => <<<'HTML'
<p>Every LLM API cost starts from a price per million tokens, but the rules around that price differ. Before you choose a provider on token pricing alone, check four things:</p>
<ol>
<li><strong>Token counts.</strong> The same text produces different counts on different tokenizers. Anthropic says its newer tokenizer produces about 30% more tokens for the same text than the previous one, so compare on real prompts.</li>
<li><strong>Long-prompt thresholds.</strong> OpenAI's gpt-6 models charge more above 272K input tokens and Claude Haiku 5.5 charges more above 100,000, while Anthropic bills the full 1M-token window at the standard rate on its other 4.6-and-later models.</li>
<li><strong>Caching rules.</strong> Cache reads are cheap everywhere, but write charges and storage fees differ: Google lists an hourly storage charge for cached tokens on Gemini 3.8 Flash and 3.5 Flash-Lite.</li>
<li><strong>Discount tiers.</strong> All three list batch at half price. OpenAI also lists Flex at batch rates and a Fast tier at double; Anthropic lists a fast mode for Opus 5.5 at premium rates.</li>
</ol>
<p>Run the same workload through the calculator for each candidate, then add what it can't see. The lowest cost per token isn't always the lowest cost per correct answer, and a good LLM API cost calculator can only show the first.</p>
HTML
        ],
        ['id' => 'tips', 'h2' => 'Tips and common mistakes', 'html' => <<<'HTML'
<h3>Ways to cut the bill</h3>
<ul>
<li><strong>Cache the stable part of the prompt.</strong> Put system instructions, examples and reference documents first and keep them identical between calls.</li>
<li><strong>Batch anything that can wait.</strong> Overnight classification, evaluation runs and back-fills rarely need an instant answer.</li>
<li><strong>Cap output length.</strong> Output is the expensive side; ask for short, structured answers.</li>
<li><strong>Route by difficulty.</strong> Send easy calls to a small model and only hard ones to a large model.</li>
<li><strong>Trim context.</strong> Long chat histories and whole documents in every call add up fast.</li>
</ul>
<h3>Common mistakes</h3>
<ul>
<li><strong>Counting words, not tokens.</strong> Measure real prompts with the API's usage figures.</li>
<li><strong>Forgetting reasoning tokens.</strong> Models that think before answering bill that thinking as output tokens, so output can be far longer than the visible reply.</li>
<li><strong>Ignoring retries and failures.</strong> Every retry costs a full call.</li>
<li><strong>Using last quarter's prices.</strong> Rates change, and some are scheduled to change; recheck before you sign a budget.</li>
<li><strong>Comparing models on price alone.</strong> Cost per successful task is what matters.</li>
</ul>
<p>Building an AI product? See what returns it needs to earn with the <a href="/tools/ai-roi-calculator/">AI ROI calculator</a>, price your own hardware with the <a href="/tools/gpu-cost-calculator/">GPU cost calculator</a>, and browse new AI products on our <a href="/launches/">launches</a> page.</p>
HTML
        ],
    ],
    'howto' => [
        'h2' => 'How to use the token cost calculator',
        'intro' => 'You need a rough token count for a typical call and how many calls you expect a day. Take both from real usage if you can.',
        'steps' => [
            ['name' => 'Pick a model', 'text' => 'Choose a Claude, OpenAI or Gemini model. The list prices load automatically.'],
            ['name' => 'Enter tokens per call', 'text' => 'Type the input tokens (prompt, system instructions, documents, history) and output tokens (the reply) for a typical call.'],
            ['name' => 'Enter calls per day', 'text' => 'Use your expected daily volume. For a product, multiply users by calls per user.'],
            ['name' => 'Set caching and batch', 'text' => 'Enter the share of input tokens read from cache, and switch on batch if the work can wait for an asynchronous result.'],
            ['name' => 'Read the costs', 'text' => 'The tool shows cost per call, per day, per 30-day month and per year in US dollars. Add a margin for cache writes, retries and taxes.'],
        ],
    ],
    'faq' => [
        ['q' => 'How do I calculate LLM API cost per call?', 'a' => 'Multiply input tokens by the input price and output tokens by the output price, both per million tokens, add them and divide by 1,000,000. Cached input uses the cheaper cache price. This token cost calculator does that and scales it to a day, month and year.'],
        ['q' => 'How many words is 1,000 tokens?', 'a' => 'For English, OpenAI\'s rule of thumb is about 750 words, and Google says 100 tokens is about 60&ndash;80 words. Other languages and code use more tokens per word.'],
        ['q' => 'Is there a token cost calculator for Anthropic Claude models?', 'a' => 'Yes, this one. Pick Claude Fable 5.1, Opus 5.5, Sonnet 5.5, Haiku 5.5 or Haiku 4.5; rates come from Anthropic\'s pricing page and include the cached-input price and the 50% batch discount.'],
        ['q' => 'Can I use it as a Claude Code API cost calculator?', 'a' => 'Roughly. Claude Code sends large, mostly cached prompts, so per-request token counts vary a lot. Anthropic says enterprise users average about $13 per developer per active day; run /usage in Claude Code for your own figure.'],
        ['q' => 'Does it work as an Azure OpenAI API cost calculator?', 'a' => 'Not directly. It uses OpenAI\'s own API prices. Azure sells OpenAI models under its own price list and deployment types, so check Microsoft\'s Azure OpenAI pricing page.'],
        ['q' => 'Why are output tokens more expensive?', 'a' => 'Every provider in the table prices output at five times or more the input rate, so the reply often costs more than a much longer prompt. Keep replies short and structured to save money.'],
        ['q' => 'What is the cheapest LLM API in this list?', 'a' => 'At list prices as of 20 October 2026, Claude Haiku 5.5 and gpt-6-luna are the cheapest here at $0.10 per million input tokens and $0.50 per million output tokens (Haiku 5.5 at that rate for prompts up to 100,000 tokens). Cheapest per token isn\'t always cheapest per finished task.'],
        ['q' => 'Is this token cost calculator for AI apps free?', 'a' => 'Yes. The token cost calculator runs in your browser, needs no sign-up and stores nothing you type. Prices update when we recheck the providers\' pages.'],
        ['q' => 'Does the calculator include cache write costs?', 'a' => 'No. It counts cache reads at the cached price but not the first write, which Anthropic bills at 1.25x or 2x input depending on cache duration. Add that for low-volume workloads where the cache is rewritten often.'],
    ],
    'sources' => [
        ['publisher' => 'Anthropic', 'title' => 'Pricing (Claude API documentation)', 'url' => 'https://platform.claude.com/docs/en/about-claude/pricing', 'date' => '2026-10-20'],
        ['publisher' => 'OpenAI', 'title' => 'API pricing', 'url' => 'https://developers.openai.com/api/docs/pricing', 'date' => '2026-10-20'],
        ['publisher' => 'Google', 'title' => 'Gemini Developer API pricing', 'url' => 'https://ai.google.dev/gemini-api/docs/pricing', 'date' => '2026-10-20'],
        ['publisher' => 'OpenAI', 'title' => 'Key concepts: tokens', 'url' => 'https://developers.openai.com/api/docs/concepts', 'date' => '2026'],
        ['publisher' => 'Google', 'title' => 'Understand and count tokens', 'url' => 'https://ai.google.dev/gemini-api/docs/tokens', 'date' => '2026'],
        ['publisher' => 'Anthropic', 'title' => 'Manage costs effectively (Claude Code docs)', 'url' => 'https://code.claude.com/docs/en/costs', 'date' => '2026'],
        ['publisher' => 'Microsoft', 'title' => 'Azure OpenAI Service pricing', 'url' => 'https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/', 'date' => '2026'],
    ],
];
