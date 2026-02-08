<?php get_header(); ?>

<?php
$hero = get_hero();

if( have_posts() ) :
  while( have_posts() ) : the_post();
          $news_categories = get_the_terms( get_the_ID(), 'news_category' );

  $thumbnail_id = get_post_thumbnail_id();
  $thumbnail_img = wp_get_attachment_image_src( $thumbnail_id , 'full' );
?>

<main class="main main--page">
  <article class="page-article">
    <!-- HERO -->
    <?php get_template_part( 'template-parts/hero', null ); ?>

    <div class="container">
      <div class="post-type-page post-type-page--news">
        <div class="news-head">
          <time class="news-head__time">
            <?php echo get_post_time( 'Y/m/d' ); ?></time>
          <h2 class="news-title">
            <?php the_title(); ?>
          </h2>
          <div class="witer-name">Written by<span><?php the_author(); ?></span></div>
        </div>


        <?php the_content(); ?>
      </div>

      <?php
  echo get_custom_single_pager();
?>
    </div>
  </article>

</main>
<?php
endwhile;
endif;
?>

<?php get_footer(); ?>
