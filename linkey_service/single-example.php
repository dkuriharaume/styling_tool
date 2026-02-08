<?php get_header(); ?>

<?php
if( have_posts() ) :
  while( have_posts() ) : the_post();
          $example_categories = get_the_terms( get_the_ID(), 'example_category' );

$company = SCF::get('company_name');
$plan = SCF::get('plan');
$products = SCF::get('products');
$units = SCF::get('units');
$date = SCF::get('date');
$system = SCF::get('system');
?>

<main class="main main--page">
  <!--
HERO
-->
  <!-- HERO -->
  <?php get_template_part( 'template-parts/hero', null ); ?>


  <article class="page-article">
    <div class="container">
      <div class="post-type-page post-type-page--example">
        <div class="example-head">
          <div class="example-head__ctg-wrap">
                    <?php
    if( !empty($example_categories) && !is_wp_error( $example_categories ) ) :
      foreach( $example_categories as $example_category ) :
?>
          <span class="example-head__ctg example-head__ctg--<?php echo $example_category->slug; ?>">
            <?php echo $example_category->name; ?></span>
          <?php
      endforeach;
    endif;
?>
</div>
          <h2 class="example-head__title">
            <?php the_title(); ?>
          </h2>
          <div class="example-head__box">
            <dl class="dl dl--head">
              <?php if( !empty( $products ) ) : ?>
              <dt>製品</dt>
              <dd><?php echo $products; ?></dd>
              <?php endif; // products ?>
              <?php if( !empty( $units ) ) : ?>
              <dt>台数</dt>
              <dd><?php echo $units; ?></dd>
              <?php endif; // units ?>
              <?php if( !empty( $date ) ) : ?>
              <dt>導入時期</dt>
              <dd><?php echo $date; ?></dd>
              <?php endif; // date ?>
              <?php if( !empty( $system ) ) : ?>
              <dt>利用しているシステム</dt>
              <dd><?php echo $system; ?></dd>
              <?php endif; // system ?>
            </dl>
          </div>
          <div class="example-head__img">
            <?php echo the_post_thumbnail(); ?>
          </div>
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
