<?php get_header(); ?>

<?php
$hero = get_hero();

if( have_posts() ) :
  while( have_posts() ) : the_post();
?>

<main class="main">
  <article class="page-article">
  <!-- HERO -->
  <?php get_template_part( 'template-parts/hero', null ); ?>
<?php
if( !empty( $hero['img'] ) ) :
?>
  <div class="page-article__thumb" style="background-image: url(<?php echo $hero['img']; ?>);"></div>
<?php
endif;
?>
    <div class="post-type-page">
      <div class="container">
        <?php the_content(); ?>
      </div>
    </div>
  </article>

</main>
<?php
endwhile;
endif;
?>

<?php get_footer(); ?>