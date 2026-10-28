<?php
/** SEO content for /tools/gpu-cost-calculator/ (rendered by page-tools.php). Main keyword: "gpu cost calculator" (mid difficulty). */
if (!defined('ABSPATH')) {
    exit;
}
return [
    'h1' => 'GPU Cost Calculator for AWS and Azure (H100, B200, A100)',
    'lede' => 'Estimate the cloud bill for GPU instances on AWS and Azure: total cost, GPU hours and the price per GPU per hour, at on-demand list prices.',
    'features' => [
        'On-demand list prices for AWS and Azure GPU instances (H100, B200, A100, L40S, A10G)',
        'Custom price per hour and GPU count for any other provider',
        'Total cost for your hours a day and number of days',
        'Instance-hours, GPU hours and price per GPU per hour',
        'Cost of a 30-day month at the same daily use',
    ],
    'sections' => [
        ['id' => 'what', 'h2' => 'What this GPU cost calculator does', 'html' => <<<'HTML'
<p>Renting GPUs in the cloud is billed by the hour per instance, and an instance can hold one GPU or eight. That makes it hard to compare offers or to turn a training plan into a budget. This GPU cost calculator does the arithmetic. Pick an instance from the list (or enter your own hourly price and GPU count), say how many instances you need, for how many hours a day and for how many days, and it shows:</p>
<ul>
<li><strong>Total cost</strong> for the period, in US dollars.</li>
<li><strong>Instance-hours</strong>: instances &times; hours a day &times; days.</li>
<li><strong>GPU hours</strong>: instance-hours &times; GPUs per instance.</li>
<li><strong>Price per GPU per hour</strong>: the instance price divided by its GPU count, the fairest way to compare an 8-GPU machine with a 1-GPU one.</li>
<li><strong>Cost of a 30-day month</strong> at the same number of instances and hours a day.</li>
</ul>
<p>Prices are on-demand list prices for Linux instances in US East regions, as published by AWS and Microsoft Azure. They are the starting point before any discount, and they exclude storage, data transfer, networking and taxes.</p>
HTML
        ],
        ['id' => 'formula', 'h2' => 'How the cost is calculated', 'html' => <<<'HTML'
<p>The maths is the same for every cloud:</p>
<ul>
<li>Instance-hours = instances &times; hours a day &times; days</li>
<li>Total cost = price per instance-hour &times; instance-hours</li>
<li>GPU hours = instance-hours &times; GPUs per instance</li>
<li>Price per GPU per hour = price per instance-hour &divide; GPUs per instance</li>
<li>Monthly cost = price per instance-hour &times; instances &times; hours a day &times; 30</li>
</ul>
<h3>Worked example: one AWS p5.48xlarge for a month</h3>
<p>An AWS p5.48xlarge has 8 NVIDIA H100 GPUs with 80 GiB of memory each, according to AWS's instance specifications. At the on-demand list price of $55.04 an hour, running one instance around the clock for 30 days:</p>
<table>
<thead><tr><th>Line</th><th>Working</th><th>Result</th></tr></thead>
<tbody>
<tr><td>Instance-hours</td><td>1 &times; 24 &times; 30</td><td>720</td></tr>
<tr><td>Total cost</td><td>$55.04 &times; 720</td><td>$39,628.80</td></tr>
<tr><td>GPU hours</td><td>720 &times; 8</td><td>5,760</td></tr>
<tr><td>Price per GPU per hour</td><td>$55.04 &divide; 8</td><td>$6.88</td></tr>
</tbody>
</table>
<p>The single-GPU p5.4xlarge (1 H100, 80 GiB) lists at $6.88 an hour, the same per-GPU rate. Used for 8 hours a day on 22 working days it comes to $1,210.88 for 176 GPU hours; a full 30 days at 8 hours a day would be $1,651.20.</p>
<figure class="xf-figure"><img src="{{brand}}tool-gpu-example.png" alt="Worked example card: one AWS p5.48xlarge with 8 NVIDIA H100 GPUs at $55.04 an hour, 24 hours a day for 30 days, costs $39,628.80 for 720 instance-hours and 5,760 GPU hours, $6.88 per GPU per hour" width="1600" height="900" loading="lazy" decoding="async"><figcaption>A month of one 8-GPU H100 instance at on-demand list price. Graphic: 100xFounder.</figcaption></figure>
HTML
        ],
        ['id' => 'prices', 'h2' => 'GPU pricing by instance: AWS and Azure', 'html' => <<<'HTML'
<p>These are the instances the calculator lists, with prices as of 20 October 2026 from the AWS EC2 on-demand pricing page and the Azure Linux virtual machine pricing page. Prices change and differ by region, so check the provider's page before you commit.</p>
{{gpu_prices}}
<p>GPU counts and memory come from each provider's instance documentation:</p>
<ul>
<li><strong>AWS:</strong> p6-b200.48xlarge has 8 NVIDIA B200 GPUs (179 GiB each); p5.48xlarge has 8 H100 (80 GiB each); p5.4xlarge has 1 H100; p4d.24xlarge has 8 A100 with 40 GiB each; g6e.xlarge has 1 L40S (44 GiB); g5.xlarge has 1 A10G (22 GiB).</li>
<li><strong>Azure:</strong> Standard_ND96isr_H100_v5 has 8 H100 GPUs (80 GB each, 640 GB in total); Standard_NC40ads_H100_v5 has 1 H100 NVL with 94 GB; Standard_NC24ads_A100_v4 has 1 A100 with 80 GB.</li>
</ul>
<p>Google Cloud isn't in the list yet because we haven't checked a Google Cloud list price for these GPUs against its official page. You can still use the tool for Google Cloud, or any GPU cloud, by entering a custom price per hour and GPU count.</p>
HTML
        ],
        ['id' => 'h100', 'h2' => 'H100 price per hour on AWS and Azure', 'html' => <<<'HTML'
<p>The most searched question is what one H100 costs per hour. Dividing each instance's list price by its GPU count, at on-demand prices as of 20 October 2026:</p>
<table>
<thead><tr><th>Instance</th><th>GPUs</th><th>Per instance-hour</th><th>Per GPU per hour</th></tr></thead>
<tbody>
<tr><td>AWS p5.48xlarge</td><td>8 &times; H100</td><td>$55.04</td><td>$6.88</td></tr>
<tr><td>AWS p5.4xlarge</td><td>1 &times; H100</td><td>$6.88</td><td>$6.88</td></tr>
<tr><td>Azure NC40ads H100 v5</td><td>1 &times; H100 NVL</td><td>$6.98</td><td>$6.98</td></tr>
<tr><td>Azure ND96isr H100 v5</td><td>8 &times; H100</td><td>$98.32</td><td>$12.29</td></tr>
</tbody>
</table>
<p>The 8-GPU machines are not just eight single GPUs in a box. They add fast GPU-to-GPU links and high-bandwidth networking for training across many machines: Microsoft's documentation describes a dedicated 400 Gbps InfiniBand connection per GPU on ND H100 v5. If your job fits on one GPU, the single-GPU instance is usually the cheaper way in; if it needs eight working together, compare the 8-GPU instances.</p>
<figure class="xf-figure"><img src="{{brand}}tool-gpu-hourly.png" alt="Bar chart of on-demand price per GPU per hour by instance: AWS p6-b200.48xlarge $14.24, Azure ND96isr H100 v5 $12.29, Azure NC40ads H100 v5 $6.98, AWS p5.48xlarge and p5.4xlarge $6.88, Azure NC24ads A100 v4 $3.67, AWS p4d.24xlarge $2.75, AWS g6e.xlarge $1.86, AWS g5.xlarge $1.01" width="1600" height="900" loading="lazy" decoding="async"><figcaption>List price per GPU per hour, on demand, US East, as of 20 October 2026. Graphic: 100xFounder.</figcaption></figure>
HTML
        ],
        ['id' => 'compare', 'h2' => 'GPU cloud cost comparison: AWS vs Azure', 'html' => <<<'HTML'
<h3>Using it as an AWS GPU cost calculator</h3>
<p>For AWS, the list covers the B200, H100, A100, L40S and A10G families. Two AWS instances at the small end, g5.xlarge at $1.006 an hour and g6e.xlarge at $1.861 are the low-cost end of the list, each with a single GPU. Running two g5.xlarge around the clock for 30 days comes to $1,448.64.</p>
<h3>Using it as an Azure GPU cost calculator</h3>
<p>For Azure, the list covers the ND H100 v5, NCads H100 v5 and NC A100 v4 series. One ND96isr H100 v5 for a 30-day month at 24 hours a day lists at $70,790.40, compared with $39,628.80 for AWS's 8-GPU p5.48xlarge. A single NC40ads H100 v5 for the same month is $5,025.60.</p>
<p>A list-price comparison is only a first filter. Before you choose a cloud, check which regions have capacity for the GPU you want, what quota you can get, the cost of storage and data transfer for your datasets, and the discounts you qualify for. Credits from startup programmes can also change the answer for an early company; our <a href="/funding-tracker/">funding tracker</a> and <a href="/news/">news</a> cover the AI startups raising money to pay for exactly this.</p>
HTML
        ],
        ['id' => 'training', 'h2' => 'Estimating a training or fine-tuning run', 'html' => <<<'HTML'
<p>For a one-off job, the question is how many GPU hours it needs, not how many days the calendar says. A practical way to get that number:</p>
<ol>
<li>Run a short slice of the job, for example a few hundred steps, on the GPU you plan to use.</li>
<li>Time it and scale up to the full job: if 2% of the steps took 48 minutes, the whole run needs about 40 hours on that GPU.</li>
<li>Add a margin for evaluation runs, restarts and the experiments that don't work.</li>
<li>Enter the result in the GPU cost calculator as hours a day and days.</li>
</ol>
<p>Take that 40-hour job on one H100. On a p5.4xlarge at $6.88 an hour it costs $275.20. If the same job split perfectly across the eight H100s of a p5.48xlarge, it would finish in 5 hours for the same $275.20: the same 40 GPU hours, delivered faster. In practice jobs don't always split perfectly across eight GPUs, so measure the multi-GPU run too before you budget on it. That is also why the price per GPU per hour matters more than the instance price: it tells you what each unit of work costs.</p>
<p>A slower, cheaper GPU is not automatically cheaper per job. An A100 on the p4d.24xlarge lists at about $2.74 per GPU per hour against $6.88 for an H100, but if your job runs several times faster on the H100, the H100 can still cost less in total. Time the job on both before choosing; the GPU cost calculator then gives the bill for each.</p>
HTML
        ],
        ['id' => 'inference', 'h2' => 'Always-on inference: monthly GPU cost', 'html' => <<<'HTML'
<p>Serving a model to users is different from training. The GPU runs whether or not anyone is asking questions, so the monthly bill is set by hours, not by work done. One instance, 24 hours a day for 30 days, at on-demand list prices:</p>
<table>
<thead><tr><th>Instance</th><th>GPU</th><th>30 days, 24/7</th></tr></thead>
<tbody>
<tr><td>AWS g5.xlarge</td><td>1 &times; A10G (22 GiB)</td><td>$724.32</td></tr>
<tr><td>AWS g6e.xlarge</td><td>1 &times; L40S (44 GiB)</td><td>$1,339.92</td></tr>
<tr><td>Azure NC24ads A100 v4</td><td>1 &times; A100 (80 GB)</td><td>$2,644.56</td></tr>
<tr><td>AWS p5.4xlarge</td><td>1 &times; H100 (80 GiB)</td><td>$4,953.60</td></tr>
</tbody>
</table>
<p>The model has to fit in GPU memory, so memory, not price, usually decides the smallest instance you can use. If traffic is low or comes in bursts, a pay-per-token API may cost less than a GPU that sits idle most of the day. Budgeting in rupees? The prices here are in US dollars; convert at the rate your card or bank actually charges.</p>
HTML
        ],
        ['id' => 'budget', 'h2' => 'Building a GPU budget for a startup', 'html' => <<<'HTML'
<p>For an early AI company, compute is often the biggest bill after salaries, and it is easy to underestimate. A GPU budget is more reliable when it is built from separate lines rather than one guess:</p>
<ul>
<li><strong>Experiments.</strong> Short runs to test ideas. Usually single GPUs, often interrupted, a good fit for spot capacity.</li>
<li><strong>Main training or fine-tuning runs.</strong> Estimate each from a timed slice, as above, and add a margin for reruns.</li>
<li><strong>Evaluation.</strong> Running test sets after every change adds up, especially for large models.</li>
<li><strong>Serving.</strong> The always-on instances that answer users, plus spare capacity for peaks.</li>
<li><strong>Everything around the GPUs.</strong> Storage for datasets and checkpoints, data transfer, monitoring and the engineers' own development machines.</li>
</ul>
<p>Run each line through the GPU cost calculator separately, add them up, and then compare the total with what a hosted model API would cost for the same product. Many teams start on APIs and move to their own GPUs only when volume makes it cheaper; the <a href="/tools/ai-token-cost-calculator/">token cost calculator</a> gives the other side of that comparison. Revisit the budget each month, because both GPU and API prices move.</p>
<p>Keep the assumptions written next to the numbers: the instance, region, price date and hours. When the bill arrives, you can see which assumption was wrong instead of arguing about the total.</p>
HTML
        ],
        ['id' => 'discounts', 'h2' => 'Paying less than list price', 'html' => <<<'HTML'
<p>On-demand prices are the most flexible and the most expensive. The main alternatives, as the providers describe them:</p>
<ul>
<li><strong>Spot capacity.</strong> AWS says Spot Instances can save up to 90% on on-demand prices, and Azure says the same of its Spot VMs, but the provider can reclaim the machine when it needs capacity (Azure gives a 30-second warning to subscribers of its scheduled events). Good for jobs that checkpoint and restart.</li>
<li><strong>Commitments.</strong> AWS lists savings of up to 72% with EC2 Instance Savings Plans and up to 66% with Compute Savings Plans, in return for a one- or three-year spending commitment.</li>
<li><strong>Reserved blocks for training.</strong> AWS's EC2 Capacity Blocks for ML let you book GPU instances such as P5 and P6-B200 up to eight weeks ahead, for up to six months, in clusters of 1 to 64 instances.</li>
</ul>
<p>To estimate a discounted plan, enter the discounted hourly price as a custom price. The GPU cost calculator then works the same way.</p>
HTML
        ],
        ['id' => 'tips', 'h2' => 'Tips and common mistakes', 'html' => <<<'HTML'
<h3>Tips</h3>
<ul>
<li>Compare on price per GPU per hour, then check memory: an 80 GB H100 and a 40 GB A100 are not interchangeable for large models.</li>
<li>Measure how long a job really takes on one GPU before you multiply it out; the newer GPU can be cheaper per job even at a higher hourly price.</li>
<li>Switch instances off when idle. Hours a day is the input that saves the most money.</li>
<li>Re-run the GPU cost calculator when list prices change or a new instance type appears, and note the price date next to every estimate you share with your team or investors.</li>
<li>If you call a hosted model instead of running your own, compare with the <a href="/tools/ai-token-cost-calculator/">token cost calculator</a>; for many workloads an API is cheaper than an idle GPU.</li>
</ul>
<h3>Common mistakes</h3>
<ul>
<li><strong>Comparing per-instance prices</strong> between machines with different GPU counts.</li>
<li><strong>Forgetting storage and data transfer</strong>, which are billed separately.</li>
<li><strong>Using another region's price.</strong> The list here is US East; other regions differ.</li>
<li><strong>Assuming capacity is available.</strong> High-end GPUs often need quota approval or reservations.</li>
<li><strong>Leaving out taxes</strong> that apply where you are billed.</li>
</ul>
HTML
        ],
    ],
    'howto' => [
        'h2' => 'How to use the GPU cost calculator',
        'intro' => 'You need the instance you plan to use, or its hourly price and GPU count, and a rough schedule.',
        'steps' => [
            ['name' => 'Pick an instance', 'text' => 'Choose an AWS or Azure GPU instance from the list, or choose custom and enter a price per hour and the number of GPUs.'],
            ['name' => 'Enter the number of instances', 'text' => 'Type how many instances run at the same time.'],
            ['name' => 'Enter hours a day and days', 'text' => 'Enter how many hours a day they run and for how many days. Use 24 for always-on servers.'],
            ['name' => 'Read the results', 'text' => 'The tool shows total cost, instance-hours, GPU hours, price per GPU per hour and the cost of a 30-day month at the same daily use.'],
            ['name' => 'Check the real price', 'text' => 'Prices are on-demand list prices for Linux in US East. Add storage, data transfer and taxes, and enter a custom price for spot or committed rates.'],
        ],
    ],
    'faq' => [
        ['q' => 'What is the H100 price per hour on AWS?', 'a' => 'At on-demand list prices as of 20 October 2026 in US East, both the 8-GPU p5.48xlarge ($55.04 an hour) and the single-GPU p5.4xlarge ($6.88 an hour) work out to $6.88 per H100 per hour. Spot and committed prices are lower.'],
        ['q' => 'Is there an AWS GPU cost calculator for spot prices?', 'a' => 'Spot prices change with demand, so the list uses on-demand prices. Enter the current spot price from the AWS console as a custom price to get a spot estimate.'],
        ['q' => 'Can I use it as an Azure GPU cost calculator?', 'a' => 'Yes. It lists the ND96isr H100 v5, NC40ads H100 v5 and NC24ads A100 v4 at Azure\'s Linux pay-as-you-go prices for US East. For other sizes or regions, enter a custom price.'],
        ['q' => 'Why isn\'t Google Cloud listed?', 'a' => 'We only list prices we have checked on the provider\'s official page, and we haven\'t done that for Google Cloud yet. You can enter a Google Cloud price per hour and GPU count as a custom instance.'],
        ['q' => 'What is a GPU hour?', 'a' => 'One GPU running for one hour. An 8-GPU instance running for one hour uses eight GPU hours, which is why price per GPU per hour is the fair comparison.'],
        ['q' => 'How do I estimate GPU hours for a training job?', 'a' => 'Time a short slice of the job on the GPU you plan to use, scale it to the full run and add a margin for restarts and experiments. Multiply by the number of GPUs if the job runs on several at once.'],
        ['q' => 'Does the price include storage and data transfer?', 'a' => 'No. The list prices cover the instance only. Disks, snapshots, data transfer and taxes are billed separately.'],
        ['q' => 'Is renting cheaper than buying GPUs?', 'a' => 'It depends on how many hours a year you would use them, power and hosting costs, and how quickly the hardware is replaced. The calculator shows the rental side; compare it with a quote for owned hardware over the same period.'],
    ],
    'sources' => [
        ['publisher' => 'Amazon Web Services', 'title' => 'Amazon EC2 On-Demand Pricing', 'url' => 'https://aws.amazon.com/ec2/pricing/on-demand/', 'date' => '2026-10-20'],
        ['publisher' => 'Microsoft Azure', 'title' => 'Linux Virtual Machines Pricing', 'url' => 'https://azure.microsoft.com/en-us/pricing/details/virtual-machines/linux/', 'date' => '2026-10-20'],
        ['publisher' => 'Amazon Web Services', 'title' => 'Specifications for Amazon EC2 accelerated computing instances', 'url' => 'https://docs.aws.amazon.com/ec2/latest/instancetypes/ac.html', 'date' => '2026'],
        ['publisher' => 'Microsoft Learn', 'title' => 'ND-H100-v5 size series', 'url' => 'https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/gpu-accelerated/ndh100v5-series', 'date' => '2026-09-25'],
        ['publisher' => 'Microsoft Learn', 'title' => 'NCads_H100_v5 size series', 'url' => 'https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/gpu-accelerated/ncadsh100v5-series', 'date' => '2026'],
        ['publisher' => 'Microsoft Learn', 'title' => 'NC_A100_v4 size series', 'url' => 'https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/gpu-accelerated/nca100v4-series', 'date' => '2026'],
        ['publisher' => 'Amazon Web Services', 'title' => 'Amazon EC2 Spot Instances', 'url' => 'https://aws.amazon.com/ec2/spot/', 'date' => '2026'],
        ['publisher' => 'Microsoft Azure', 'title' => 'Azure Spot Virtual Machines', 'url' => 'https://azure.microsoft.com/en-us/products/virtual-machines/spot', 'date' => '2026'],
        ['publisher' => 'Amazon Web Services', 'title' => 'Savings Plans pricing', 'url' => 'https://aws.amazon.com/savingsplans/compute-pricing/', 'date' => '2026'],
        ['publisher' => 'Amazon Web Services', 'title' => 'Amazon EC2 Capacity Blocks for ML', 'url' => 'https://aws.amazon.com/ec2/capacityblocks/', 'date' => '2026'],
    ],
];
