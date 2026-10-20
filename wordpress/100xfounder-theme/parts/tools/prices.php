<?php
/**
 * Official list prices used by the AI token cost and GPU cost calculators. The one place to update them:
 * check each source page, change the numbers and the 'checked' date. Prices are USD.
 *
 * LLM: per million tokens (input, cached input read, output); batch is 50% of every rate at all three providers.
 * GPU: on-demand Linux price per instance-hour, US East region.
 */
if (!defined('ABSPATH')) {
    exit;
}
return [
    'checked' => '2026-10-20',
    'llm' => [
        // provider, model, input, cached input, output, note
        ['Anthropic', 'Claude Fable 5.1', 10.00, 0.25, 50.00, ''],
        ['Anthropic', 'Claude Opus 5.5', 4.00, 0.20, 20.00, ''],
        ['Anthropic', 'Claude Sonnet 5.5', 2.00, 0.10, 10.00, ''],
        ['Anthropic', 'Claude Haiku 5.5', 0.10, 0.01, 0.50, 'prompts up to 100,000 tokens'],
        ['Anthropic', 'Claude Haiku 4.5', 1.00, 0.10, 5.00, ''],
        ['OpenAI', 'gpt-6-astra', 10.00, 1.00, 50.00, 'short-context rate'],
        ['OpenAI', 'gpt-6.1-sol', 2.00, 0.10, 10.00, 'short-context rate'],
        ['OpenAI', 'gpt-6-luna', 0.10, 0.01, 0.50, 'short-context rate'],
        ['Google', 'Gemini 4 Argon', 2.00, 0.10, 10.00, 'paid tier; listed until 30 Nov 2026, doubling from 1 Dec 2026'],
        ['Google', 'Gemini 3.8 Flash', 0.75, 0.075, 3.75, 'paid tier; listed until 31 Dec 2026, doubling from 1 Jan 2027'],
        ['Google', 'Gemini 3.5 Flash-Lite', 0.30, 0.03, 2.50, 'paid tier'],
    ],
    'llm_sources' => [
        'Anthropic' => 'https://platform.claude.com/docs/en/about-claude/pricing',
        'OpenAI' => 'https://developers.openai.com/api/docs/pricing',
        'Google' => 'https://ai.google.dev/gemini-api/docs/pricing',
    ],
    'gpu' => [
        // cloud, instance, GPUs, GPU model, USD per instance-hour
        ['AWS', 'p6-b200.48xlarge', 8, 'NVIDIA B200', 113.9328],
        ['AWS', 'p5.48xlarge', 8, 'NVIDIA H100', 55.04],
        ['AWS', 'p5.4xlarge', 1, 'NVIDIA H100', 6.88],
        ['AWS', 'p4d.24xlarge', 8, 'NVIDIA A100 40GB', 21.957642],
        ['AWS', 'g6e.xlarge', 1, 'NVIDIA L40S', 1.861],
        ['AWS', 'g5.xlarge', 1, 'NVIDIA A10G', 1.006],
        ['Azure', 'ND96isr H100 v5', 8, 'NVIDIA H100', 98.32],
        ['Azure', 'NC40ads H100 v5', 1, 'NVIDIA H100', 6.98],
        ['Azure', 'NC24ads A100 v4', 1, 'NVIDIA A100 80GB', 3.673],
    ],
    'gpu_sources' => [
        'AWS' => 'https://aws.amazon.com/ec2/pricing/on-demand/',
        'Azure' => 'https://azure.microsoft.com/en-us/pricing/details/virtual-machines/linux/',
    ],
];
