<?php
get_header(); ?>
<section class="wrap" style="padding-top:96px;padding-bottom:40px">
    <div class="k">404</div>
    <h1 class="display">This page took a pivot.</h1>
    <p class="muted" style="font-size:18px;max-width:560px;margin-top:20px">The link may be old or mistyped. Try the newsroom or search.</p>
    <form role="search" method="get" action="<?php echo esc_url(home_url('/')); ?>" style="display:flex;gap:10px;max-width:520px;margin-top:28px">
        <label class="screen-reader-text" for="s404">Search</label>
        <input id="s404" type="search" name="s" placeholder="Search stories" style="flex:1;height:46px;padding:0 14px;border-radius:10px;border:1px solid var(--ln2);background:var(--bg2);outline:0">
        <button class="btn btn-w" style="height:46px">Search</button>
    </form>
    <p style="margin-top:24px"><a class="btn" href="<?php echo esc_url(xft_page_url('news', 'news')); ?>">Go to the newsroom</a></p>
</section>
<?php get_footer();
