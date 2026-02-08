<?php get_header(); ?>
<?php $term = get_queried_object();  ?>

<main class="main">
  <!-- HERO -->
  <?php get_template_part( 'template-parts/hero', null ); ?>

  <article class="page-article">
    <div class="container">

<!-- カテゴリタグここから -->
<div class="shadow-box">
  <h2 class="search-title">カテゴリで絞り込む</h2>
<?php echo aw_get_category_list( array(
  'post_type' => 'example',
  'taxonomy' => 'example_category',
  'wrapper_class' => 'refine'
)); ?>
</div>
<!-- カテゴリタグここまで -->
      <?php
if( have_posts() ) :
?>

<h1 class="h1">
<?php
if (is_tax() ){
  echo $term->name . "のサービス一覧";
} else {
  echo "すべてのサービス一覧";
}
?>
</h1>

      <div class="archive-list">
        <?php
  while( have_posts() ) : the_post();
    get_template_part( 'template-parts/pickup-card', null );
  endwhile;
  wp_reset_postdata();
?>

      </div>
      <?php
endif;
?>
    </div>
    <?php
echo get_custom_pager();
?>
  </article>
</main>

<?php get_footer(); ?>
