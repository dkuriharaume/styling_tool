<?php
/**
 * ヒーローヘッダー
 */
$hero = get_hero();
?>
<section class="hero">
  <div class="container container--wide">
    <h1 class="hero__title">
      <span class="hero__title-en"><?php echo ucfirst( str_replace( '-', ' ', $hero['en'] ) ); ?></span>
      <span class="hero__title-ja"><?php echo $hero['ja']; ?></span>
    </h1>
  </div>

  <!-- パンくず -->
  <?php get_template_part( 'template-parts/breadcrumb', null ); ?>
  <!-- パンくずここまで -->
</section>