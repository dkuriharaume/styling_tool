<?php get_header(); ?>

<main class="main">
  <!-- HERO -->
  <?php get_template_part( 'template-parts/hero', null ); ?>

  <!-----パンくず----->
  <?php get_template_part( 'template-parts/breadcrumb', null ); ?>
  <!-----パンくずここまで----->

  <article class="page-article">
    <div class="container">
      <div class="post-type-page">
        <p>申し訳ございません。<br>お客様がお探しのページは見つかりませんでした。</p>
        <p>該当のURLが移動または削除されているか、あるいは直接URLを入力されている場合は入力ミスの可能性があります。<br>恐れ入りますが<a href="<?php echo home_url( '/sitemap/' ); ?>">サイトマップ</a>または<a href="<?php echo home_url(); ?>">トップページ</a>からお探し下さい。</p>
      </div>
    </div>
  </article>
</main>

<?php get_footer(); ?>
